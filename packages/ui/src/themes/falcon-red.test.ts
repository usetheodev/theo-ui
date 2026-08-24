/**
 * Falcon Red — brand fidelity and the accessibility trade-offs the theme documents.
 *
 * These are not generic theme tests (the schema and contrast gates already cover every built-in).
 * They pin the three decisions in `falcon-red.ts` that a well-meaning future edit would otherwise
 * undo: the exact brand colour, the dark-mode primary that cannot take white text, and the
 * destructive hue that must not collapse back onto the brand.
 */

import { describe, expect, it } from "vitest";

import { contrastRatio } from "../../scripts/lib/wcag-contrast.js";
import { falconRed } from "./falcon-red.js";
import { builtinThemes } from "./index.js";
import { validateTheme } from "./schema.js";

const BRAND = "oklch(0.579 0.218 26.4)"; // #DE2329, measured from the falcon mark

describe("falconRed — shape", () => {
  it("passes the theme schema", () => {
    expect(validateTheme(falconRed).success).toBe(true);
  });

  it("is bundled in builtinThemes", () => {
    expect(builtinThemes).toContain(falconRed);
  });

  it("does not displace violet-forge as the default", () => {
    // The default is whatever sits first. Changing that is a product decision with a
    // visual-regression blast radius across every consumer — not a side effect of adding a theme.
    expect(builtinThemes[0]?.name).toBe("violet-forge");
  });
});

describe("falconRed — brand fidelity", () => {
  it("uses the measured brand colour unmodified in light mode", () => {
    expect(falconRed.light.primary).toBe(BRAND);
  });

  it("keeps the focus ring on the brand colour", () => {
    expect(falconRed.light.ring).toBe(falconRed.light.primary);
    expect(falconRed.dark.ring).toBe(falconRed.dark.primary);
  });

  it("keeps the dark primary on the brand hue and chroma", () => {
    // Lightened for contrast, but the same colour family — not a different red.
    expect(falconRed.dark.primary).toMatch(/26\.4\)$/);
    expect(falconRed.dark.primary).toContain("0.218");
  });
});

describe("falconRed — contrast", () => {
  it("carries body text on the brand in light mode", () => {
    const ratio = contrastRatio(falconRed.light["primary-foreground"], falconRed.light.primary);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the dark primary legible as text on both dark surfaces", () => {
    // This is what forces the lightening: the primary doubles as the link colour.
    expect(contrastRatio(falconRed.dark.primary, falconRed.dark.background)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(contrastRatio(falconRed.dark.primary, falconRed.dark.card)).toBeGreaterThanOrEqual(4.5);
  });

  it("uses a dark foreground on the dark primary, because white cannot reach AA there", () => {
    // The constraints do not intersect: a red legible on the dark background is necessarily too
    // light to carry white body text. If someone "fixes" this to white, this test explains why not.
    expect(contrastRatio("oklch(1 0 0)", falconRed.dark.primary)).toBeLessThan(4.5);
    expect(
      contrastRatio(falconRed.dark["primary-foreground"], falconRed.dark.primary),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("meets the gate threshold on every foreground pair", () => {
    for (const mode of ["light", "dark"] as const) {
      for (const token of ["primary", "secondary", "accent", "destructive"] as const) {
        const scale = falconRed[mode];
        const ratio = contrastRatio(scale[`${token}-foreground`], scale[token]);
        expect(ratio, `${mode}.${token}`).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe("falconRed — destructive stays distinguishable", () => {
  it("does not reuse the brand red for destructive", () => {
    expect(falconRed.light.destructive).not.toBe(falconRed.light.primary);
    expect(falconRed.dark.destructive).not.toBe(falconRed.dark.primary);
  });

  it("separates destructive from primary by hue", () => {
    const hueOf = (value: string) => Number(value.match(/([\d.]+)\)$/)?.[1]);

    for (const mode of ["light", "dark"] as const) {
      const separation = Math.abs(
        hueOf(falconRed[mode].primary) - hueOf(falconRed[mode].destructive),
      );
      // Enough to read as a different colour; the theme documents that this is a reinforcement
      // and that destructive actions still need a verb and an icon (WCAG 1.4.1).
      expect(separation, `${mode} hue separation`).toBeGreaterThanOrEqual(15);
    }
  });
});
