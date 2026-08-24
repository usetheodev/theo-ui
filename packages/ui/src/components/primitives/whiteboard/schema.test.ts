import { describe, expect, it } from "vitest";
import { type WhiteboardScene, whiteboardScene } from "./schema.js";

const validMinimalRect: WhiteboardScene = {
  version: 1,
  width: 400,
  height: 300,
  elements: [{ type: "rect", x: 10, y: 20, w: 100, h: 50 }],
};

describe("whiteboardScene schema", () => {
  // Positive cases
  it("accepts a minimal valid rect", () => {
    expect(() => whiteboardScene.parse(validMinimalRect)).not.toThrow();
  });

  it("accepts all 7 types in one scene", () => {
    const scene = {
      version: 1,
      width: 800,
      height: 600,
      elements: [
        { type: "rect", x: 10, y: 10, w: 100, h: 80 },
        { type: "ellipse", x: 120, y: 10, w: 100, h: 80 },
        { type: "diamond", x: 230, y: 10, w: 100, h: 80 },
        { type: "line", x: 0, y: 200, to: [400, 200] },
        { type: "arrow", x: 0, y: 250, to: [400, 250] },
        { type: "text", x: 10, y: 300, text: "Hello" },
        {
          type: "freedraw",
          x: 0,
          y: 0,
          points: [
            [0, 0],
            [10, 10],
          ],
        },
      ],
    };
    expect(() => whiteboardScene.parse(scene)).not.toThrow();
  });

  it("round-trips: parse(parse(json)) is idempotent", () => {
    const parsed = whiteboardScene.parse(validMinimalRect);
    expect(() => whiteboardScene.parse(parsed)).not.toThrow();
    expect(whiteboardScene.parse(parsed)).toEqual(parsed);
  });

  // Negative — type discrimination
  it("rejects unknown element type", () => {
    const scene = {
      version: 1,
      width: 100,
      height: 100,
      elements: [{ type: "blob", x: 0, y: 0 }],
    };
    const result = whiteboardScene.safeParse(scene);
    expect(result.success).toBe(false);
  });

  // Negative — version
  it("rejects version other than 1", () => {
    const scene = { ...validMinimalRect, version: 2 };
    expect(whiteboardScene.safeParse(scene).success).toBe(false);
  });

  // Negative — dimensions
  it("rejects zero width rect", () => {
    const scene = {
      version: 1,
      width: 100,
      height: 100,
      elements: [{ type: "rect", x: 0, y: 0, w: 0, h: 10 }],
    };
    expect(whiteboardScene.safeParse(scene).success).toBe(false);
  });

  // Negative — freedraw min points
  it("rejects freedraw with single point", () => {
    const scene = {
      version: 1,
      width: 100,
      height: 100,
      elements: [{ type: "freedraw", x: 0, y: 0, points: [[0, 0]] }],
    };
    expect(whiteboardScene.safeParse(scene).success).toBe(false);
  });

  // EC-3 — NaN rejection
  it("rejects NaN in element coordinates (EC-3)", () => {
    const scene = {
      version: 1,
      width: 100,
      height: 100,
      elements: [{ type: "rect", x: Number.NaN, y: 0, w: 10, h: 10 }],
    };
    expect(whiteboardScene.safeParse(scene).success).toBe(false);
  });

  // EC-3 — Infinity rejection
  it("rejects Infinity in dimensions (EC-3)", () => {
    const scene = {
      version: 1,
      width: 100,
      height: 100,
      elements: [{ type: "rect", x: 0, y: 0, w: Number.POSITIVE_INFINITY, h: 10 }],
    };
    expect(whiteboardScene.safeParse(scene).success).toBe(false);
  });

  // EC-4 — scene width clamp
  it("rejects scene width over 20000 (EC-4)", () => {
    const scene = { ...validMinimalRect, width: 30000 };
    expect(whiteboardScene.safeParse(scene).success).toBe(false);
  });

  it("accepts scene width at 19999 (within clamp, EC-4)", () => {
    const scene = { ...validMinimalRect, width: 19999 };
    expect(whiteboardScene.safeParse(scene).success).toBe(true);
  });

  // EC-4 — element label/text limits
  it("rejects label longer than 500 chars", () => {
    const scene = {
      version: 1,
      width: 100,
      height: 100,
      elements: [{ type: "rect", x: 0, y: 0, w: 10, h: 10, label: "x".repeat(501) }],
    };
    expect(whiteboardScene.safeParse(scene).success).toBe(false);
  });

  it("rejects text longer than 5000 chars", () => {
    const scene = {
      version: 1,
      width: 100,
      height: 100,
      elements: [{ type: "text", x: 0, y: 0, text: "x".repeat(5001) }],
    };
    expect(whiteboardScene.safeParse(scene).success).toBe(false);
  });

  it("rejects freedraw with more than 5000 points", () => {
    const points: Array<[number, number]> = Array.from({ length: 5001 }, (_, i) => [i, i]);
    const scene = {
      version: 1,
      width: 100,
      height: 100,
      elements: [{ type: "freedraw", x: 0, y: 0, points }],
    };
    expect(whiteboardScene.safeParse(scene).success).toBe(false);
  });

  // Optional fields
  it("accepts rect with all optional style fields", () => {
    const scene = {
      version: 1,
      width: 100,
      height: 100,
      elements: [
        {
          type: "rect",
          x: 0,
          y: 0,
          w: 10,
          h: 10,
          stroke: "#000",
          strokeWidth: 2,
          strokeStyle: "dashed" as const,
          fill: "#fff",
          fillStyle: "hachure" as const,
          opacity: 0.5,
          roughness: 1.5,
          seed: 42,
          label: "Box",
          roundness: "round" as const,
        },
      ],
    };
    expect(whiteboardScene.safeParse(scene).success).toBe(true);
  });

  it("arrow defaults headEnd to true", () => {
    const scene = {
      version: 1,
      width: 100,
      height: 100,
      elements: [{ type: "arrow", x: 0, y: 0, to: [100, 0] }],
    };
    const result = whiteboardScene.parse(scene);
    const arrow = result.elements[0] as { headEnd: boolean };
    expect(arrow.headEnd).toBe(true);
  });
});
