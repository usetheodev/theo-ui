import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Regression: the v4 theme tokens are full `oklch(...)` colors, so the hand-written
 * theme rules in `global-v4.css` must use them directly (`var(--x)`) or via
 * `color-mix(in oklch, …)`. Wrapping an oklch() color in `hsl(var(--x) / a)` is
 * INVALID CSS → the property is dropped → the value becomes transparent.
 *
 * That is exactly what made text selection look impossible: `::selection` got a
 * transparent background + text-colored text, so the highlight was invisible even
 * though the text WAS selected/copyable. Same bug hit the scrollbar + focus ring.
 */
const CSS_PATH = join(__dirname, "..", "src", "styles", "global-v4.css");
const raw = readFileSync(CSS_PATH, "utf-8");
// strip /* ... */ comments so the assertions only see real declarations
const css = raw.replace(/\/\*[\s\S]*?\*\//g, "");

describe("global-v4.css — oklch token usage", () => {
  it("never wraps an oklch token in hsl() (would produce invalid, transparent values)", () => {
    const offenders = css.match(/hsl\(\s*var\(--[a-z-]+\)/g) ?? [];
    expect(offenders).toEqual([]);
  });

  it("gives ::selection a visible oklch background (not the broken hsl wrapper)", () => {
    const block = css.slice(css.indexOf("::selection"), css.indexOf("::selection") + 200);
    expect(block).toContain("color-mix(in oklch");
    expect(block).not.toContain("hsl(var(--primary)");
  });
});
