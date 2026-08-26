import { describe, expect, it } from "vitest";

import * as publicApi from "../index.js";
import { builtinThemes } from "./index.js";

/**
 * Every bundled theme must also be importable by name.
 *
 * `src/index.ts` lists its theme exports one by one, so adding a theme to `builtinThemes` without
 * touching that list produces a theme that ships, renders through the provider, and cannot be
 * imported: `import { falconRed } from "@theokit/ui"` is a type error. That shipped in 1.4.0 — the
 * theme was in the bundle and missing from the public surface, and it took a consumer's typecheck
 * to notice.
 *
 * Derived from `builtinThemes` rather than a hand-written list, so a future theme is covered the
 * moment it is bundled.
 */

/** `violet-forge` → `violetForge`, matching the export naming convention. */
function exportNameFor(themeName: string): string {
  return themeName.replace(/-(.)/g, (_match, letter: string) => letter.toUpperCase());
}

describe("theme barrel exports", () => {
  it("has themes to check", () => {
    // Guards the guard: an empty list would make the assertion below vacuous.
    expect(builtinThemes.length).toBeGreaterThan(1);
  });

  it("exports every bundled theme by name from the package root", () => {
    const missing = builtinThemes
      .map((theme) => exportNameFor(theme.name))
      .filter((exportName) => !(exportName in publicApi));

    expect(
      missing,
      "add these to the export list in src/index.ts — a theme in builtinThemes that is not exported cannot be imported by name",
    ).toEqual([]);
  });

  it("exports the same object that is bundled, not a copy", () => {
    for (const theme of builtinThemes) {
      const exported = (publicApi as Record<string, unknown>)[exportNameFor(theme.name)];
      expect(exported, theme.name).toBe(theme);
    }
  });
});

/**
 * The same defect, one level up: everything the themes barrel exports must reach the package root.
 *
 * The test above covers themes by name because that is how it shipped in 1.4.0. It shipped again in
 * 1.6.0 in a different shape — `ThemeEditor`, `auditColorScale` and the rest of the contrast surface
 * were added to `themes/index.ts`, and `src/index.ts` re-exports by explicit list, so the release
 * announced an editor a consumer could not import. Every gate passed: the code was there, bundled,
 * tested, and unreachable.
 *
 * Derived from the module rather than a hand-written list, so the next addition is covered by
 * existing.
 */
describe("themes barrel reaches the package root", () => {
  /**
   * Deliberately absent from the package root.
   *
   * Both are `@deprecated` since 2026-06-03 in favour of `hex()` and `rgb()`, which return OKLCH.
   * They stay reachable from the themes module for anything still importing them directly, and out
   * of the root so a new consumer never finds them by autocomplete. Listed here rather than
   * filtered by a `Legacy` naming rule, because the next deprecation will not be named that way.
   */
  const NOT_PUBLIC = new Set(["hexToHsl", "rgbToHslLegacy"]);

  it("re-exports every runtime value the themes barrel exposes", async () => {
    const themes = (await import("./index.js")) as Record<string, unknown>;
    const root = publicApi as unknown as Record<string, unknown>;

    const missing = Object.keys(themes)
      .filter((key) => typeof themes[key] !== "undefined")
      .filter((key) => !NOT_PUBLIC.has(key))
      .filter((key) => root[key] === undefined);

    expect(missing, "add these to the export list in src/index.ts").toEqual([]);
  });

  it("the exclusions are real exports, so the list cannot rot into a typo", async () => {
    const themes = (await import("./index.js")) as Record<string, unknown>;

    for (const name of NOT_PUBLIC) {
      expect(themes[name], `${name} is excluded but not exported at all`).toBeDefined();
    }
  });

  it("has values to check, so the assertion above cannot pass vacuously", async () => {
    const themes = (await import("./index.js")) as Record<string, unknown>;

    expect(Object.keys(themes).length).toBeGreaterThan(15);
  });
});
