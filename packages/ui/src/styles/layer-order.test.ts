/**
 * Every distributed stylesheet that OPENS a cascade layer must first declare the
 * canonical layer order.
 *
 * Regression: usetheokit/theokit-ui#20.
 *
 * CSS Cascade 5 fixes a layer's position at its FIRST appearance, statement or block. So a
 * consumer whose entrypoint reads
 *
 *     @import "@theokit/ui/tokens.css";
 *     @import "tailwindcss";
 *
 * registers `utilities` first — from the texture-utility block inside tokens.css — and
 * `theme`, `base`, `components` after it, when Tailwind's own statement finally runs. The
 * resulting order puts `base` ABOVE `utilities`, so preflight (`*, ::before, ::after {
 * padding: 0; border: 0 }`) beats every padding, margin and border utility. `.px-6` exists
 * in the CSSOM and never applies.
 *
 * The symptom is uniquely hard to place: colours keep working, because preflight does not
 * reset them, so the page renders stripped rather than obviously broken. It was found in
 * theokit-studio, where the import order above is the natural one to write.
 *
 * Declaring the order at the top of the file makes the file order-independent: whichever
 * side is imported first, the layers land in the same sequence.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const STYLES_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * Mirrors line 1 of Tailwind v4's own `index.css`.
 *
 * `properties` is deliberately absent, exactly as it is there: Tailwind emits that layer
 * from the compiler and does not pin it in the statement. Naming it here would fix it in a
 * position Tailwind did not choose.
 *
 * This is a literal rather than a value read from the installed package because two majors
 * live in this tree — `require.resolve("tailwindcss")` lands on 3.4.19, hoisted as a
 * transitive peer, whose index.css has no such statement. Deriving it would silently read
 * the wrong major, which is worse than restating it next to a test that checks it.
 */
const CANONICAL = "@layer theme, base, components, utilities;";

/** `@layer name {` — opening a block, as opposed to the statement form ending in `;`. */
const OPENS_LAYER = /^@layer\s+[a-z-]+\s*\{/m;

describe("distributed stylesheets declare the canonical layer order", () => {
  const stylesheets = readdirSync(STYLES_DIR).filter((f) => f.endsWith(".css"));

  // Fail on an empty sweep: a moved directory would otherwise make every assertion below
  // vacuous while the suite reports green.
  it("finds stylesheets to check", () => {
    expect(stylesheets.length).toBeGreaterThan(3);
  });

  for (const file of stylesheets) {
    const css = readFileSync(join(STYLES_DIR, file), "utf-8");
    const opener = css.match(OPENS_LAYER);
    if (!opener) continue;

    it(`${file} declares the order before opening a layer`, () => {
      // Given a file that opens a cascade layer,
      // When a consumer imports it before Tailwind,
      // Then the order must already be fixed, or importing it inverts the cascade.
      expect(css).toContain(CANONICAL);
      expect(css.indexOf(CANONICAL)).toBeLessThan(opener.index as number);
    });
  }
});
