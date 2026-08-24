import { describe, expect, it } from "vitest";
import { hex, hexToHsl, rgb, rgbToHslLegacy } from "./color.js";

// Post-T2.6 (ADR-0005): hex/rgb return OKLCH. hexToHsl / rgbToHslLegacy
// preserve the legacy HSL split format for one-minor backward compat.

describe("hex (returns OKLCH)", () => {
  it("converts the canonical Theo violet to oklch tuple", () => {
    // OKLCH for #7C3AED computed via Oklab matrices; allow ±0.005 jitter
    // by parsing components.
    const out = hex("#7C3AED");
    expect(out).toMatch(/^oklch\(0\.\d+ 0\.\d+ \d+(?:\.\d+)?\)$/);
    const [l, c, h] = out
      .replace(/oklch\(|\)/g, "")
      .split(/\s+/)
      .map(Number);
    expect(l).toBeCloseTo(0.542, 1);
    expect(c).toBeGreaterThan(0.2);
    expect(h).toBeGreaterThan(285);
    expect(h).toBeLessThan(305);
  });

  it("returns pure white as oklch(1 0 0)", () => {
    expect(hex("#FFFFFF")).toBe("oklch(1 0 0)");
  });

  it("returns pure black as oklch(0 0 0)", () => {
    expect(hex("#000000")).toBe("oklch(0 0 0)");
  });

  it("expands 3-char short form (e.g. #abc → #aabbcc)", () => {
    expect(hex("#abc")).toBe(hex("#aabbcc"));
  });

  it("silently drops the alpha byte from an 8-char hex (EC-5)", () => {
    expect(hex("#7C3AED80")).toBe(hex("#7C3AED"));
    expect(hex("#7C3AEDFF")).toBe(hex("#7C3AED"));
  });

  it("silently drops the alpha nibble from 4-char short form (EC-5)", () => {
    expect(hex("#abc4")).toBe(hex("#abc"));
  });

  it("is case insensitive (EC-4)", () => {
    expect(hex("#7c3aed")).toBe(hex("#7C3AED"));
  });

  it("throws when input is missing the '#' prefix", () => {
    expect(() => hex("7C3AED")).toThrow(/'#'-prefixed/);
  });

  it("throws on invalid characters in hex body", () => {
    expect(() => hex("#GGG")).toThrow(/invalid hex character/);
  });

  it("throws on invalid length (e.g. 5 chars)", () => {
    expect(() => hex("#7C3AE")).toThrow(/invalid length/);
  });
});

describe("rgb (returns OKLCH)", () => {
  it("converts an RGB triplet to oklch tuple", () => {
    const out = rgb(124, 58, 237);
    expect(out).toMatch(/^oklch\(/);
    // matches hex("#7C3AED") result
    expect(out).toBe(hex("#7C3AED"));
  });

  it("throws when any channel is out of [0, 255]", () => {
    expect(() => rgb(300, 0, 0)).toThrow(/out of range/);
    expect(() => rgb(-1, 0, 0)).toThrow(/out of range/);
  });
});

describe("hexToHsl (legacy / deprecated)", () => {
  it("preserves the pre-T2.6 HSL split format", () => {
    expect(hexToHsl("#7C3AED")).toBe("262 83% 58%");
    expect(hexToHsl("#FFFFFF")).toBe("0 0% 100%");
    expect(hexToHsl("#000000")).toBe("0 0% 0%");
  });
});

describe("rgbToHslLegacy (deprecated)", () => {
  it("preserves the pre-T2.6 HSL split format", () => {
    expect(rgbToHslLegacy(124, 58, 237)).toBe("262 83% 58%");
  });
});
