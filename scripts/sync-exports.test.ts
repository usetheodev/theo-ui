/**
 * Tests for `buildExports` — covers the ISOLATED_SUBPATHS extension added for
 * the Whiteboard primitive (see `.claude/knowledge-base/plans/whiteboard-view-primitive-plan.md`
 * T0.1). Engines like Whiteboard need a real isolated bundle entry, not a
 * re-export of the barrel; this test pins that behavior.
 */
import { describe, expect, it } from "vitest";
import { BASE_EXPORTS, ISOLATED_SUBPATHS, buildExports } from "./sync-exports.js";

describe("buildExports", () => {
  it("includes BASE_EXPORTS when no component subpaths are provided", () => {
    const exports = buildExports([]);
    for (const key of Object.keys(BASE_EXPORTS)) {
      expect(exports[key]).toEqual(BASE_EXPORTS[key]);
    }
  });

  it("includes ISOLATED_SUBPATHS in the output", () => {
    const exports = buildExports([]);
    expect(exports["./whiteboard"]).toBeDefined();
    expect(exports["./whiteboard"]).toEqual({
      types: "./dist/whiteboard/index.d.ts",
      import: "./dist/whiteboard/index.js",
    });
  });

  it("isolated subpath points to its own dist file (not the barrel)", () => {
    const exports = buildExports([]);
    const entry = exports["./whiteboard"] as { import: string; types: string };
    expect(entry.import).not.toBe("./dist/index.js");
    expect(entry.import).toBe("./dist/whiteboard/index.js");
  });

  it("auto-scanned component subpaths point to the barrel (current behavior)", () => {
    const exports = buildExports(["button"]);
    expect(exports["./button"]).toEqual({
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
    });
  });

  it("throws when an auto-scanned subpath collides with an ISOLATED one", () => {
    // If a developer accidentally adds `Whiteboard` to src/index.ts, the auto-scan
    // would produce a "./whiteboard" → ./dist/index.js entry that would collide
    // with the isolated bundle. We must catch this before it silently overrides.
    expect(() => buildExports(["whiteboard"])).toThrow(/collision/i);
  });

  it("ISOLATED_SUBPATHS export is non-empty (sanity)", () => {
    expect(Object.keys(ISOLATED_SUBPATHS).length).toBeGreaterThan(0);
  });
});
