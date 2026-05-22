import { describe, expect, it } from "vitest";
import { hex, rgb } from "./color.js";

describe("hex", () => {
  it("converts the canonical Theo violet to HSL string-tuple", () => {
    expect(hex("#7C3AED")).toBe("262 83% 58%");
  });

  it("returns pure white as 0 0% 100%", () => {
    expect(hex("#FFFFFF")).toBe("0 0% 100%");
  });

  it("returns pure black as 0 0% 0%", () => {
    expect(hex("#000000")).toBe("0 0% 0%");
  });

  it("expands 3-char short form (e.g. #abc → #aabbcc)", () => {
    expect(hex("#abc")).toBe(hex("#aabbcc"));
  });

  it("silently drops the alpha byte from an 8-char hex (EC-5)", () => {
    // alpha bytes are discarded — ColorScale is opaque.
    expect(hex("#7C3AED80")).toBe(hex("#7C3AED"));
    expect(hex("#7C3AEDFF")).toBe(hex("#7C3AED"));
  });

  it("silently drops the alpha nibble from 4-char short form (EC-5)", () => {
    expect(hex("#abc4")).toBe(hex("#abc"));
  });

  it("is case insensitive (EC-4)", () => {
    expect(hex("#7c3aed")).toBe(hex("#7C3AED"));
    expect(hex("#7c3aed")).toBe("262 83% 58%");
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

describe("rgb", () => {
  it("converts an RGB triplet to the HSL string-tuple format", () => {
    expect(rgb(124, 58, 237)).toBe("262 83% 58%");
  });

  it("throws when any channel is out of [0, 255]", () => {
    expect(() => rgb(300, 0, 0)).toThrow(/out of range/);
    expect(() => rgb(-1, 0, 0)).toThrow(/out of range/);
  });
});
