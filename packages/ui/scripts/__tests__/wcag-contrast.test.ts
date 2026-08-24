/**
 * WCAG 2.x contrast unit tests — Phase 0 T0.2.
 *
 * Canonical W3C examples + post-OKLCH migration smoke for the parser
 * (HSL split, oklch(), hex must all resolve to the same luminance).
 */

import { describe, expect, it } from "vitest";

import { contrastRatio } from "../lib/wcag-contrast.js";

describe("contrastRatio — W3C canonical pairs", () => {
  it("returns 21.0 for white vs black (max contrast)", () => {
    expect(contrastRatio("0 0% 100%", "0 0% 0%")).toBeCloseTo(21, 1);
  });

  it("returns 1.0 for identical colors (zero contrast)", () => {
    expect(contrastRatio("0 0% 100%", "0 0% 100%")).toBeCloseTo(1, 2);
    expect(contrastRatio("0 0% 0%", "0 0% 0%")).toBeCloseTo(1, 2);
  });

  it("returns ~4.5:1 for mid-gray on white (canonical AA body threshold)", () => {
    // #767676 vs white = ~4.54 per WebAIM
    expect(contrastRatio("0 0% 46%", "0 0% 100%")).toBeGreaterThanOrEqual(4.4);
    expect(contrastRatio("0 0% 46%", "0 0% 100%")).toBeLessThanOrEqual(4.7);
  });

  it("returns ~5.74:1 for #777 vs black (canonical W3C example)", () => {
    expect(contrastRatio("0 0% 47%", "0 0% 0%")).toBeGreaterThan(4.5);
    expect(contrastRatio("0 0% 47%", "0 0% 0%")).toBeLessThan(7);
  });

  it("is symmetric (a vs b == b vs a)", () => {
    const ab = contrastRatio("262 83% 58%", "0 0% 100%");
    const ba = contrastRatio("0 0% 100%", "262 83% 58%");
    expect(ab).toBeCloseTo(ba, 5);
  });

  it("Theo violet (#7C3AED) vs white passes WCAG AA large text (3:1)", () => {
    // #7C3AED ~= 4.6:1 vs white per WebAIM — adequate for AA large text.
    expect(contrastRatio("262 83% 58%", "0 0% 100%")).toBeGreaterThan(3);
  });

  it("accepts OKLCH input (post-T2.4 themes)", () => {
    const ratio = contrastRatio("oklch(1 0 0)", "oklch(0 0 0)");
    expect(ratio).toBeCloseTo(21, 1);
  });

  it("accepts hex input", () => {
    const ratio = contrastRatio("#ffffff", "#000000");
    expect(ratio).toBeCloseTo(21, 1);
  });

  it("HSL split, OKLCH, and hex of the same color produce equivalent luminance", () => {
    // Pure white in three formats — luminance should match within rounding.
    const a = contrastRatio("0 0% 100%", "0 0% 0%");
    const b = contrastRatio("oklch(1 0 0)", "oklch(0 0 0)");
    const c = contrastRatio("#ffffff", "#000000");
    expect(a).toBeCloseTo(b, 1);
    expect(b).toBeCloseTo(c, 1);
  });
});
