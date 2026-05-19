import { describe, expect, it } from "vitest";
import { deriveSeed, fnv1a32 } from "./seed.js";

describe("fnv1a32", () => {
  it("is deterministic", () => {
    expect(fnv1a32("foo")).toBe(fnv1a32("foo"));
  });

  it("produces different output for different input", () => {
    expect(fnv1a32("foo")).not.toBe(fnv1a32("bar"));
  });

  it("output fits in signed int32 range", () => {
    const h = fnv1a32("the quick brown fox jumps over the lazy dog");
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(-(2 ** 31));
    expect(h).toBeLessThan(2 ** 31);
  });

  it("matches reference FNV-1a output for known string (sanity)", () => {
    // FNV-1a 32-bit of "" is the offset basis 0x811C9DC5 → -2128831035 signed.
    expect(fnv1a32("")).toBe(-2128831035);
  });
});

describe("deriveSeed", () => {
  it("returns the explicit seed when provided", () => {
    expect(deriveSeed({ type: "rect", x: 0, y: 0, w: 10, h: 10, seed: 42 })).toBe(42);
  });

  it("derives stable seed from shape props when seed absent", () => {
    const seed1 = deriveSeed({ type: "rect", x: 10, y: 20, w: 100, h: 50 });
    const seed2 = deriveSeed({ type: "rect", x: 10, y: 20, w: 100, h: 50 });
    expect(seed1).toBe(seed2);
  });

  it("differs for elements with different geometry", () => {
    const a = deriveSeed({ type: "rect", x: 10, y: 20, w: 100, h: 50 });
    const b = deriveSeed({ type: "rect", x: 11, y: 20, w: 100, h: 50 });
    expect(a).not.toBe(b);
  });

  it("differs for elements with different type but same coords", () => {
    const a = deriveSeed({ type: "rect", x: 0, y: 0, w: 10, h: 10 });
    const b = deriveSeed({ type: "ellipse", x: 0, y: 0, w: 10, h: 10 });
    expect(a).not.toBe(b);
  });
});
