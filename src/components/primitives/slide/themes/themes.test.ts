import { describe, expect, it } from "vitest";
import { isSlideTheme, slideThemes } from "./index.js";

describe("slideThemes registry", () => {
  it("includes 'default'", () => {
    expect(slideThemes).toContain("default");
  });

  it("includes 'violet-forge'", () => {
    expect(slideThemes).toContain("violet-forge");
  });

  it("isSlideTheme accepts known themes", () => {
    expect(isSlideTheme("default")).toBe(true);
    expect(isSlideTheme("violet-forge")).toBe(true);
  });

  it("isSlideTheme rejects unknown themes and non-strings", () => {
    expect(isSlideTheme("dark")).toBe(false);
    expect(isSlideTheme(42)).toBe(false);
    expect(isSlideTheme(null)).toBe(false);
    expect(isSlideTheme(undefined)).toBe(false);
  });
});
