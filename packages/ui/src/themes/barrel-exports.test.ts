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
