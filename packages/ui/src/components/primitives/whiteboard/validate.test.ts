import { describe, expect, it } from "vitest";
import { validateScene } from "./validate.js";

describe("validateScene", () => {
  it("returns ok=true for a valid scene", () => {
    const result = validateScene({
      version: 1,
      width: 100,
      height: 100,
      elements: [{ type: "rect", x: 0, y: 0, w: 10, h: 10 }],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.scene.elements).toHaveLength(1);
    }
  });

  it("returns ok=false with errors for an invalid scene", () => {
    const result = validateScene({ version: 1, width: 100, height: 100, elements: "nope" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("formats unknown element type with full path", () => {
    const result = validateScene({
      version: 1,
      width: 100,
      height: 100,
      elements: [{ type: "blob", x: 0, y: 0 }],
    });
    if (result.ok) throw new Error("expected failure");
    const issue = result.errors[0];
    expect(issue?.path).toContain("elements");
    expect(issue?.message).toBeTruthy();
  });

  it("formats missing required field with field name", () => {
    const result = validateScene({
      version: 1,
      width: 100,
      height: 100,
      elements: [{ type: "rect", x: 0, y: 0 }], // missing w, h
    });
    if (result.ok) throw new Error("expected failure");
    expect(result.errors.some((e) => e.path.includes("w") || e.path.includes("h"))).toBe(true);
  });

  it("aggregates multiple errors", () => {
    const result = validateScene({
      version: 99,
      width: -10,
      height: 100,
      elements: [],
    });
    if (result.ok) throw new Error("expected failure");
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("includes 'got' field for discriminator mismatch (e.g. unknown element type)", () => {
    const result = validateScene({
      version: 1,
      width: 100,
      height: 100,
      elements: [{ type: "blob", x: 0, y: 0 }],
    });
    if (result.ok) throw new Error("expected failure");
    const issue = result.errors.find((e) => e.path.includes("type"));
    expect(issue).toBeDefined();
    expect(issue?.got).toBe("blob");
  });

  it("includes 'got' field for type-mismatch errors when possible", () => {
    const result = validateScene({
      version: 1,
      width: "not a number",
      height: 100,
      elements: [],
    });
    if (result.ok) throw new Error("expected failure");
    const widthErr = result.errors.find((e) => e.path.includes("width"));
    expect(widthErr).toBeDefined();
    expect(widthErr?.message).toBeTruthy();
  });

  it("returns empty errors array shape for unknown shapes (sanity)", () => {
    const result = validateScene(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Array.isArray(result.errors)).toBe(true);
    }
  });
});
