import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useViewport } from "./use-viewport.js";

describe("useViewport", () => {
  it("initial state matches the scene dimensions", () => {
    const { result } = renderHook(() => useViewport({ width: 800, height: 600 }));
    expect(result.current.state.x).toBe(0);
    expect(result.current.state.y).toBe(0);
    expect(result.current.state.zoom).toBe(1);
  });

  it("pan updates x and y", () => {
    const { result } = renderHook(() => useViewport({ width: 800, height: 600 }));
    act(() => {
      result.current.pan(10, -5);
    });
    expect(result.current.state.x).toBe(-10);
    expect(result.current.state.y).toBe(5);
  });

  it("zoom clamps to MIN/MAX", () => {
    const { result } = renderHook(() => useViewport({ width: 800, height: 600 }));
    act(() => {
      result.current.setZoom(100);
    });
    expect(result.current.state.zoom).toBeLessThanOrEqual(8);
    act(() => {
      result.current.setZoom(0.001);
    });
    expect(result.current.state.zoom).toBeGreaterThanOrEqual(0.1);
  });

  it("zoomAt preserves the world coordinate under the cursor", () => {
    const { result } = renderHook(() => useViewport({ width: 800, height: 600 }));
    // Cursor at scene-space (400, 300) — middle. Zoom in 2x. Same world point
    // should remain under the same screen point.
    act(() => {
      result.current.zoomAt(400, 300, 1, { width: 800, height: 600 });
    });
    // After zoom 2x at center, the world point (400,300) is still at screen
    // center (400, 300). The viewBox shrinks but stays centered on that point.
    const { x, y, zoom } = result.current.state;
    expect(zoom).toBeCloseTo(Math.E, 5);
    // World point under cursor before zoom = (400, 300).
    // After zoom, screen (400, 300) maps to world (x + (400 / zoom), y + (300 / zoom)).
    const worldX = x + 400 / zoom;
    const worldY = y + 300 / zoom;
    expect(worldX).toBeCloseTo(400, 1);
    expect(worldY).toBeCloseTo(300, 1);
  });

  it("reset returns to initial state", () => {
    const { result } = renderHook(() => useViewport({ width: 800, height: 600 }));
    act(() => {
      result.current.pan(100, 50);
      result.current.setZoom(2);
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.state).toEqual({ x: 0, y: 0, zoom: 1 });
  });

  it("fitTo centers a bounding box in the viewport", () => {
    const { result } = renderHook(() => useViewport({ width: 800, height: 600 }));
    act(() => {
      result.current.fitTo({ minX: 0, minY: 0, maxX: 400, maxY: 300 }, { width: 800, height: 600 });
    });
    // bbox is 400x300, viewport is 800x600, so zoom should be 2 (fits exactly).
    expect(result.current.state.zoom).toBeCloseTo(2, 1);
  });

  it("viewBox string reflects state", () => {
    const { result } = renderHook(() => useViewport({ width: 800, height: 600 }));
    expect(result.current.viewBox({ width: 800, height: 600 })).toBe("0 0 800 600");
    act(() => {
      result.current.setZoom(2);
    });
    expect(result.current.viewBox({ width: 800, height: 600 })).toBe("0 0 400 300");
  });
});
