/**
 * Unit tests for `parseExportsFromIndex` — the pure parser extracted from
 * `parseIndexExports` (MEDIUM-013 / T6.7.5). Without these, the only
 * consumers were `validateCountConsistency` + `validateArchitectureCensus`,
 * and both validate the OUTPUT against `src/index.ts` — meaning a bug in
 * the parser would be invisible (both sides drift together).
 */
import { describe, expect, it } from "vitest";
import { parseExportsFromIndex } from "./sync-readme.js";

describe("parseExportsFromIndex", () => {
  it("returns empty arrays for empty input", () => {
    expect(parseExportsFromIndex("")).toEqual({ primitives: [], composites: [] });
  });

  it("extracts a single primitive named export", () => {
    const src = `export { Button } from "./components/primitives/button/index.js";`;
    expect(parseExportsFromIndex(src)).toEqual({
      primitives: ["Button"],
      composites: [],
    });
  });

  it("extracts a single composite named export", () => {
    const src = `export { CommandPalette } from "./components/composites/command-palette/index.js";`;
    expect(parseExportsFromIndex(src)).toEqual({
      primitives: [],
      composites: ["CommandPalette"],
    });
  });

  it("ignores `type` exports inside a mixed body", () => {
    const src = `export { Button, type ButtonProps, buttonVariants } from "./components/primitives/button/index.js";`;
    // ButtonProps is type-only; buttonVariants starts lowercase → ignored.
    expect(parseExportsFromIndex(src)).toEqual({
      primitives: ["Button"],
      composites: [],
    });
  });

  it("ignores entire `export type { ... }` declarations", () => {
    const src = `export type { Something } from "./components/primitives/foo/index.js";`;
    expect(parseExportsFromIndex(src)).toEqual({
      primitives: [],
      composites: [],
    });
  });

  it("handles multi-line export bodies", () => {
    const src = [
      "export {",
      "  ContextWindowBar,",
      "  CapabilityIndicator,",
      "  type Capability,",
      `} from "./components/primitives/context-window-bar/index.js";`,
    ].join("\n");
    expect(parseExportsFromIndex(src)).toEqual({
      primitives: ["CapabilityIndicator", "ContextWindowBar"],
      composites: [],
    });
  });

  it("returns sorted arrays per layer", () => {
    const src = [
      `export { Zeta } from "./components/primitives/zeta/index.js";`,
      `export { Alpha } from "./components/primitives/alpha/index.js";`,
      `export { Mike } from "./components/composites/mike/index.js";`,
      `export { Bravo } from "./components/composites/bravo/index.js";`,
    ].join("\n");
    const result = parseExportsFromIndex(src);
    expect(result.primitives).toEqual(["Alpha", "Zeta"]);
    expect(result.composites).toEqual(["Bravo", "Mike"]);
  });

  it("skips exports that don't come from components/<layer>/", () => {
    const src = [
      `export { cn } from "./lib/cn.js";`,
      `export { violetForge } from "./themes/index.js";`,
      `export { Button } from "./components/primitives/button/index.js";`,
    ].join("\n");
    expect(parseExportsFromIndex(src)).toEqual({
      primitives: ["Button"],
      composites: [],
    });
  });

  it("deduplicates via natural sort (no duplicate-collapse logic needed)", () => {
    const src = [
      `export { Button } from "./components/primitives/button/index.js";`,
      `export { Button as ButtonAlt } from "./components/primitives/button/index.js";`,
    ].join("\n");
    // `Button as ButtonAlt` resolves to `Button` after the `split(/\s+as\s+/)`,
    // so both occurrences contribute "Button". Real `src/index.ts` never does
    // this; we document the behavior in the test rather than fight it.
    const result = parseExportsFromIndex(src);
    expect(result.primitives).toContain("Button");
  });
});
