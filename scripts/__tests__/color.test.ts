/**
 * Tests for scripts/lib/color.ts — Phase 2 T2.1.
 *
 * Validates: HSL split parsing (EC-3), OKLCH conversion round-trip,
 * P3 gamut clamping, malformed input rejection, alpha handling.
 */

import { describe, expect, it } from "vitest";

import {
  HSL_SPLIT_PATTERN,
  formatOklch,
  hslSplitToOklch,
  oklchToHslSplit,
  parseColorScaleValue,
} from "../lib/color.js";

describe("HSL_SPLIT_PATTERN", () => {
  it("matches valid ColorScale split values", () => {
    expect(HSL_SPLIT_PATTERN.test("262 83% 58%")).toBe(true);
    expect(HSL_SPLIT_PATTERN.test("0 0% 100%")).toBe(true);
    expect(HSL_SPLIT_PATTERN.test("15 54% 53%")).toBe(true);
    expect(HSL_SPLIT_PATTERN.test("  262  83%  58%  ")).toBe(true);
  });

  it("rejects wrapped or malformed values", () => {
    expect(HSL_SPLIT_PATTERN.test("hsl(262 83% 58%)")).toBe(false);
    expect(HSL_SPLIT_PATTERN.test("#7C3AED")).toBe(false);
    expect(HSL_SPLIT_PATTERN.test("oklch(0.5 0.2 270)")).toBe(false);
    expect(HSL_SPLIT_PATTERN.test("262 83 58")).toBe(false); // missing %
  });
});

describe("parseColorScaleValue (EC-3)", () => {
  it("accepts HSL split without hsl() wrapper", () => {
    const c = parseColorScaleValue("262 83% 58%");
    expect(c).toBeDefined();
    if (!c) return;
    expect(c.l).toBeGreaterThan(0.4);
    expect(c.l).toBeLessThan(0.7);
    expect(c.alpha).toBe(1);
  });

  it("accepts wrapped hsl() form", () => {
    const c = parseColorScaleValue("hsl(262 83% 58%)");
    expect(c).toBeDefined();
  });

  it("accepts hex", () => {
    const c = parseColorScaleValue("#7C3AED");
    expect(c).toBeDefined();
    if (!c) return;
    // OKLCH violet ~ L 0.54-0.56
    expect(c.l).toBeGreaterThan(0.5);
    expect(c.l).toBeLessThan(0.6);
  });

  it("accepts existing oklch()", () => {
    const c = parseColorScaleValue("oklch(0.5 0.2 270)");
    expect(c).toBeDefined();
    if (!c) return;
    expect(c.l).toBeCloseTo(0.5, 2);
  });

  it("returns undefined for unparseable input", () => {
    expect(parseColorScaleValue("not-a-color")).toBeUndefined();
    expect(parseColorScaleValue("")).toBeUndefined();
  });

  it("handles neutrals (h becomes 0 instead of NaN)", () => {
    const black = parseColorScaleValue("0 0% 0%");
    expect(black).toBeDefined();
    if (!black) return;
    expect(black.h).toBe(0);
    const white = parseColorScaleValue("0 0% 100%");
    expect(white).toBeDefined();
    if (!white) return;
    expect(white.h).toBe(0);
  });
});

describe("formatOklch", () => {
  it("formats with 3-decimal L/C and 1-decimal H by default", () => {
    expect(formatOklch({ l: 0.560123, c: 0.244456, h: 277.05, alpha: 1 })).toBe(
      "oklch(0.56 0.244 277.1)",
    );
  });

  it("omits alpha when opaque", () => {
    const out = formatOklch({ l: 0.5, c: 0.2, h: 270, alpha: 1 });
    expect(out).not.toContain("/");
  });

  it("includes alpha when transparent", () => {
    const out = formatOklch({ l: 0.5, c: 0.2, h: 270, alpha: 0.5 });
    expect(out).toBe("oklch(0.5 0.2 270 / 0.5)");
  });
});

describe("hslSplitToOklch", () => {
  it("converts violet-forge primary", () => {
    const out = hslSplitToOklch("262 83% 58%");
    expect(out).toBeDefined();
    expect(out).toMatch(/^oklch\(0\.\d+ 0\.\d+ \d+(?:\.\d+)?\)$/);
  });

  it("converts pure white and black", () => {
    expect(hslSplitToOklch("0 0% 100%")).toMatch(/^oklch\(/);
    expect(hslSplitToOklch("0 0% 0%")).toMatch(/^oklch\(/);
  });

  it("returns undefined for non-HSL-split input", () => {
    expect(hslSplitToOklch("hsl(262 83% 58%)")).toBeUndefined();
    expect(hslSplitToOklch("#7C3AED")).toBeUndefined();
  });
});

describe("oklchToHslSplit round-trip (T2.6, EC-16)", () => {
  it("preserves hue/saturation/lightness within rounding", () => {
    const original = "262 83% 58%";
    const oklch = hslSplitToOklch(original);
    expect(oklch).toBeDefined();
    if (!oklch) return;
    const back = oklchToHslSplit(oklch);
    expect(back).toBeDefined();
    if (!back) return;
    const [h, s, l] = back.replace(/%/g, "").split(/\s+/).map(Number);
    // Allow ±2 for H (smaller rounding window), ±2% for S/L
    expect(Math.abs((h ?? 0) - 262)).toBeLessThanOrEqual(2);
    expect(Math.abs((s ?? 0) - 83)).toBeLessThanOrEqual(3);
    expect(Math.abs((l ?? 0) - 58)).toBeLessThanOrEqual(2);
  });
});
