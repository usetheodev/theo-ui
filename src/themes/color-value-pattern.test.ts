/**
 * Tests for COLOR_VALUE_PATTERN — Phase 2 T2.5, EC-5 absorbed.
 *
 * Positive: all forms ColorScale + theme runtime values must accept.
 * Negative: CSS-injection vectors must continue to be rejected.
 */

import { describe, expect, it } from "vitest";

import { COLOR_VALUE_PATTERN } from "./color-value-pattern.js";

describe("COLOR_VALUE_PATTERN — positive", () => {
  it("accepts hex shorthand and full", () => {
    expect(COLOR_VALUE_PATTERN.test("#fff")).toBe(true);
    expect(COLOR_VALUE_PATTERN.test("#0a0a0a")).toBe(true);
    expect(COLOR_VALUE_PATTERN.test("#0a0a0aff")).toBe(true);
  });

  it("accepts plain OKLCH triples (post-T2.4 ColorScale format)", () => {
    expect(COLOR_VALUE_PATTERN.test("oklch(0.560 0.244 277.0)")).toBe(true);
    expect(COLOR_VALUE_PATTERN.test("oklch(1 0 0)")).toBe(true);
    expect(COLOR_VALUE_PATTERN.test("oklch(0.5 0.2 270 / 0.5)")).toBe(true);
  });

  it("accepts OKLCH with `none` keyword for neutrals", () => {
    expect(COLOR_VALUE_PATTERN.test("oklch(none none none)")).toBe(true);
  });

  it("accepts OKLCH relative-color syntax for tonal derivations (T3.1)", () => {
    expect(COLOR_VALUE_PATTERN.test("oklch(from var(--primary) l c h)")).toBe(true);
    expect(COLOR_VALUE_PATTERN.test("oklch(from var(--primary) calc(l - 0.16) c h)")).toBe(true);
    expect(COLOR_VALUE_PATTERN.test("oklch(from var(--accent) calc(l + 0.18) c h)")).toBe(true);
    expect(COLOR_VALUE_PATTERN.test("oklch(from var(--primary) l c h / 0.5)")).toBe(true);
  });

  it("accepts OKLCH with max()/min() clamps (T3.1 EC-7)", () => {
    expect(
      COLOR_VALUE_PATTERN.test("oklch(from var(--primary) max(0.05, calc(l - 0.16)) c h)"),
    ).toBe(true);
    expect(
      COLOR_VALUE_PATTERN.test("oklch(from var(--primary) min(0.95, calc(l + 0.18)) c h)"),
    ).toBe(true);
  });

  it("accepts oklab analogue", () => {
    expect(COLOR_VALUE_PATTERN.test("oklab(0.5 0.1 -0.05)")).toBe(true);
  });

  it("accepts other CSS color functions", () => {
    expect(COLOR_VALUE_PATTERN.test("hsl(262 83% 58%)")).toBe(true);
    expect(COLOR_VALUE_PATTERN.test("rgb(124, 58, 237)")).toBe(true);
    expect(COLOR_VALUE_PATTERN.test("rgba(124, 58, 237, 0.5)")).toBe(true);
  });

  it("accepts HSL split tuple (legacy ColorScale convention)", () => {
    expect(COLOR_VALUE_PATTERN.test("0 0% 100%")).toBe(true);
    expect(COLOR_VALUE_PATTERN.test("262 83% 58%")).toBe(true);
    expect(COLOR_VALUE_PATTERN.test("0 0% 4%")).toBe(true);
  });

  it("accepts var(--token) reference with optional safe fallback", () => {
    expect(COLOR_VALUE_PATTERN.test("var(--primary)")).toBe(true);
    expect(COLOR_VALUE_PATTERN.test("var(--primary, #fff)")).toBe(true);
  });

  it("accepts CSS keywords", () => {
    expect(COLOR_VALUE_PATTERN.test("transparent")).toBe(true);
    expect(COLOR_VALUE_PATTERN.test("currentColor")).toBe(true);
    expect(COLOR_VALUE_PATTERN.test("inherit")).toBe(true);
  });
});

describe("COLOR_VALUE_PATTERN — negative (CSS injection vectors)", () => {
  it("rejects values with declaration-terminating `;`", () => {
    expect(COLOR_VALUE_PATTERN.test("oklch(0.5 0.2 270); injection: bad")).toBe(false);
    expect(COLOR_VALUE_PATTERN.test("#fff; background: url(http://x)")).toBe(false);
  });

  it("rejects values with `url(...)`", () => {
    expect(COLOR_VALUE_PATTERN.test("oklch(from var(--x) l c h url(http://evil))")).toBe(false);
    expect(COLOR_VALUE_PATTERN.test("url(http://evil)")).toBe(false);
  });

  it("rejects values with braces", () => {
    expect(COLOR_VALUE_PATTERN.test("oklch({injected})")).toBe(false);
    expect(COLOR_VALUE_PATTERN.test("#fff }")).toBe(false);
  });

  it("rejects empty / garbage", () => {
    expect(COLOR_VALUE_PATTERN.test("")).toBe(false);
    expect(COLOR_VALUE_PATTERN.test("not a color")).toBe(false);
  });
});
