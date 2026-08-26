/**
 * The runtime contrast maths, checked against a reference implementation.
 *
 * `contrast.ts` ships, so it cannot depend on `culori` — but `culori` is a devDependency, which
 * makes it the right thing to check the maths AGAINST. A hand-rolled OKLCH conversion that is
 * subtly wrong produces plausible numbers, and a contrast gate reporting plausible numbers is
 * worse than no gate: it grants confidence it has not earned.
 */
import { converter, parse } from "culori";
import { describe, expect, it } from "vitest";

import { WCAG_AA, contrastLevel, contrastRatio, relativeLuminance } from "./contrast.js";

/** Reference luminance, via culori: parse → linear sRGB → WCAG coefficients. */
function referenceLuminance(color: string): number {
  const parsed = parse(color);
  if (!parsed) throw new Error(`culori could not parse ${color}`);
  const lrgb = converter("lrgb")(parsed);
  const clamp = (n: number): number => Math.min(1, Math.max(0, n));
  return 0.2126 * clamp(lrgb.r) + 0.7152 * clamp(lrgb.g) + 0.0722 * clamp(lrgb.b);
}

describe("relativeLuminance agrees with culori", () => {
  const colors = [
    "#000000",
    "#ffffff",
    "#8ab4f8",
    "#131314",
    "#a8c7fa",
    "rgb(154, 160, 166)",
    "oklch(0.5 0.16 296.97)",
    "oklch(1 0 0)",
    "oklch(0.627 0.194 149.2)",
    "oklch(0.72 0.19 45)",
  ];

  for (const color of colors) {
    it(`matches for ${color}`, () => {
      const ours = relativeLuminance(color);
      expect(ours).not.toBeNull();
      // Four decimals: far tighter than any threshold decision, and loose enough that the two
      // implementations' rounding does not register as disagreement.
      expect(ours ?? 0).toBeCloseTo(referenceLuminance(color), 4);
    });
  }
});

describe("contrastRatio", () => {
  it("is 21:1 for black on white — the maximum the formula produces", () => {
    expect(contrastRatio("#000000", "#ffffff") ?? 0).toBeCloseTo(21, 5);
  });

  it("is 1:1 for a colour against itself", () => {
    expect(contrastRatio("#8ab4f8", "#8ab4f8") ?? 0).toBeCloseTo(1, 5);
  });

  it("is symmetric — order of the pair does not change the ratio", () => {
    const a = contrastRatio("#131314", "#e3e3e3");
    const b = contrastRatio("#e3e3e3", "#131314");
    expect(a).toBeCloseTo(b ?? 0, 10);
  });

  it("reads OKLCH and hex against each other, since a theme mixes both", () => {
    const ratio = contrastRatio("oklch(1 0 0)", "#000000");
    expect(ratio ?? 0).toBeCloseTo(21, 3);
  });

  it("returns null rather than a guess when a colour cannot be read", () => {
    expect(contrastRatio("cornflowerblue", "#fff")).toBeNull();
    expect(contrastRatio("#fff", "var(--primary)")).toBeNull();
    expect(relativeLuminance("nonsense")).toBeNull();
  });

  it("ignores alpha instead of pretending to composite", () => {
    // What is behind a translucent colour is not knowable from the string, so both are read as
    // opaque. Documented on the function; asserted here so the behaviour is not accidental.
    expect(contrastRatio("#00000080", "#ffffff") ?? 0).toBeCloseTo(21, 5);
  });
});

describe("contrastLevel", () => {
  it("names the WCAG band a ratio falls in", () => {
    expect(contrastLevel(21)).toBe("AAA");
    expect(contrastLevel(7)).toBe("AAA");
    expect(contrastLevel(4.5)).toBe("AA");
    expect(contrastLevel(3)).toBe("AA-large");
    expect(contrastLevel(2.99)).toBe("fail");
  });

  it("fails the pair that shipped broken in a real product", () => {
    // The DevRel Desk role badge: `text-accent` over `bg-accent/15` with accent set to a surface
    // grey. Measured at 1.61:1 in Chrome, invisible on screen, and no gate saw it because nothing
    // measured contrast at runtime. This is the case the editor's gate exists for.
    const ratio = contrastRatio("#2f3134", "#2b2c2e");
    expect(ratio).not.toBeNull();
    expect(ratio ?? 0).toBeLessThan(WCAG_AA.normalText);
    expect(contrastLevel(ratio ?? 0)).toBe("fail");
  });
});
