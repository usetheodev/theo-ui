/**
 * A consumer must be able to override a design token from their own stylesheet.
 *
 * Regression: usetheokit/theokit-ui#72.
 *
 * The tokens shipped unlayered, so `:root { --card: … }` in this package outranked EVERY
 * layered rule a consumer could write — including `@layer base`, which is where an app using
 * Tailwind naturally puts its own base styles. Matching our selector exactly did not help
 * either: we ship the sheet twice (the `@import` plus the side-effect injection that comes
 * with importing a component), so document order favoured us on the tie.
 *
 * What made it expensive is that nothing failed. `var(--card)` kept resolving — to OUR value
 * — so the consumer's palette looked almost applied, and an app shipped in the wrong theme
 * for a whole build cycle before anyone measured the computed value.
 *
 * The fix is to declare the tokens inside `@layer theme`, the first layer of the canonical
 * order. Unlayered consumer CSS then wins by definition, and `@layer base` wins by order.
 *
 * These tests read the stylesheet as text rather than mounting a DOM on purpose: the bug is
 * a property of the emitted CSS, and jsdom does not implement cascade layers, so a DOM test
 * here would pass no matter what the file says.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const STYLES_DIR = dirname(fileURLToPath(import.meta.url));
const TOKENS = readFileSync(join(STYLES_DIR, "tokens.css"), "utf-8");

/** Strips comments, so prose about `:root` is never mistaken for a rule. */
function withoutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * The index where `selector` FIRST opens a rule, or -1.
 *
 * Indentation is allowed: the palette is nested inside the layer block, and the formatter
 * indents it. What the callers assert is position relative to the layer, not column zero.
 */
function firstRuleIndex(css: string, selector: string): number {
  const escaped = selector.replace(/[.[\]]/g, "\\$&");
  const match = new RegExp(`^[\\t ]*${escaped}[\\s,{]`, "m").exec(css);
  return match ? (match.index as number) : -1;
}

describe("design tokens are overridable by the consumer", () => {
  const css = withoutComments(TOKENS);

  it("declares the palette inside @layer theme", () => {
    // Given the token file,
    // When a consumer writes `:root { --card: … }` in their own (unlayered) stylesheet,
    // Then ours must sit in a layer, because unlayered always beats layered.
    const layerOpen = css.indexOf("@layer theme {");
    expect(layerOpen).toBeGreaterThan(-1);

    const rootRule = firstRuleIndex(css, ":root");
    const darkRule = firstRuleIndex(css, ".dark");
    expect(rootRule).toBeGreaterThan(layerOpen);
    expect(darkRule).toBeGreaterThan(layerOpen);
  });

  it("keeps no palette declaration outside a layer", () => {
    // The whole point: a single unlayered `--token: value` re-creates the bug for that token,
    // and it would be invisible until someone tried to override exactly that one.
    const beforeLayer = css.split("@layer theme {")[0] ?? "";
    const unlayered = (beforeLayer.match(/^\s*--[a-z-]+:/gm) ?? [])
      // `@theme` blocks are Tailwind's namespace, not a cascade root — they emit utilities.
      .filter((line) => !line.includes("--color-"));

    expect(unlayered).toEqual([]);
  });

  it("leaves the accessibility overrides unlayered, where they outrank the consumer", () => {
    // Forced colors (WCAG 1.4.1) and reduced motion (WCAG 2.3.3) must survive any palette a
    // consumer applies. Unlayered is how CSS says "this is not negotiable".
    const forced = css.indexOf("@media (forced-colors: active)");
    const motion = css.indexOf("@media (prefers-reduced-motion: reduce)");
    const layerClose = css.indexOf("@layer theme {");

    expect(forced).toBeGreaterThan(layerClose);
    expect(motion).toBeGreaterThan(layerClose);

    // And they must not have been swept into the layer by a careless edit.
    const insideLayer = css.slice(layerClose, forced);
    expect(insideLayer).not.toContain("forced-colors");
    expect(insideLayer).not.toContain("prefers-reduced-motion");
  });
});

describe("every distributed stylesheet keeps the palette layered", () => {
  const stylesheets = readdirSync(STYLES_DIR).filter((f) => f.endsWith(".css"));

  // Fail on an empty sweep, so a moved directory cannot make this suite vacuously green.
  it("finds stylesheets to check", () => {
    expect(stylesheets.length).toBeGreaterThan(3);
  });

  for (const file of stylesheets) {
    const raw = withoutComments(readFileSync(join(STYLES_DIR, file), "utf-8"));

    // Only files that actually declare palette tokens are in scope.
    if (!/--background:|--card:|--foreground:/.test(raw)) continue;

    it(`${file} declares no palette token outside a layer`, () => {
      const beforeAnyLayer = raw.split(/@layer\s+[a-z-]+\s*\{/)[0] ?? "";
      expect(beforeAnyLayer).not.toMatch(/--(background|card|foreground):/);
    });
  }
});
