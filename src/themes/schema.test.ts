/**
 * Tests for the theme valibot schema — Phase 2 T2.7 / D5.
 */

import { describe, expect, it } from "vitest";

import { formatThemeIssues, validateTheme } from "./schema.js";
import { violetForge } from "./violet-forge.js";

describe("validateTheme — positive", () => {
  it("accepts the built-in violet-forge theme", () => {
    const result = validateTheme(violetForge);
    expect(result.success).toBe(true);
  });

  it("accepts theme without description and fontUrls", () => {
    const minimal = {
      ...violetForge,
      description: undefined,
      fontUrls: undefined,
    };
    const result = validateTheme(minimal);
    expect(result.success).toBe(true);
  });
});

describe("validateTheme — negative", () => {
  it("rejects theme with invalid color value (CSS injection vector)", () => {
    const bad = {
      ...violetForge,
      light: { ...violetForge.light, primary: "oklch(0.5 0.2 270); injection: bad" },
    };
    const result = validateTheme(bad);
    expect(result.success).toBe(false);
    expect(result.issues?.length).toBeGreaterThan(0);
    expect(result.issues?.[0]?.message).toMatch(/color value/);
  });

  it("rejects theme with javascript: font URL", () => {
    const bad = {
      ...violetForge,
      fontUrls: ["javascript:alert(1)"],
    };
    const result = validateTheme(bad);
    expect(result.success).toBe(false);
  });

  it("rejects theme with missing mandatory color (e.g. light.primary)", () => {
    const { primary: _drop, ...lightWithoutPrimary } = violetForge.light;
    const bad = {
      ...violetForge,
      light: lightWithoutPrimary,
    };
    const result = validateTheme(bad);
    expect(result.success).toBe(false);
  });

  it("rejects theme with missing status keys (D4 status group mandatory)", () => {
    const { "status-online": _drop, ...lightWithoutStatus } = violetForge.light;
    const bad = {
      ...violetForge,
      light: lightWithoutStatus,
    };
    const result = validateTheme(bad);
    expect(result.success).toBe(false);
  });

  it("rejects theme name with disallowed chars", () => {
    const bad = { ...violetForge, name: "Bad Name With Spaces" };
    const result = validateTheme(bad);
    expect(result.success).toBe(false);
  });

  it("rejects non-object input gracefully", () => {
    expect(validateTheme(null).success).toBe(false);
    expect(validateTheme(undefined).success).toBe(false);
    expect(validateTheme("string").success).toBe(false);
  });
});

describe("formatThemeIssues", () => {
  it("produces actionable diagnostic with field path", () => {
    const bad = {
      ...violetForge,
      light: { ...violetForge.light, primary: "BAD; CSS" },
    };
    const result = validateTheme(bad);
    expect(result.success).toBe(false);
    if (result.success) return;
    const msg = formatThemeIssues(bad.name, result.issues ?? []);
    expect(msg).toMatch(/violet-forge/);
    expect(msg).toMatch(/primary/);
    expect(msg).toMatch(/color value/);
  });
});
