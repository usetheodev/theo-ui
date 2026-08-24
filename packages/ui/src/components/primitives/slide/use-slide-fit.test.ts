import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSlideFit } from "./use-slide-fit.js";

// Per-test ResizeObserver mock storing the latest registered callback so we
// can simulate resize events deterministically.
type ROCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;
let lastCallback: ROCallback | null = null;
let disconnectCount = 0;

class MockResizeObserver implements ResizeObserver {
  callback: ROCallback;
  constructor(cb: ROCallback) {
    this.callback = cb;
    lastCallback = cb;
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    disconnectCount++;
  }
}

beforeEach(() => {
  lastCallback = null;
  disconnectCount = 0;
  (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeRef(
  width: number,
  height: number,
): {
  current: HTMLElement | null;
} {
  const el = {
    getBoundingClientRect: () => ({
      width,
      height,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  } as unknown as HTMLElement;
  return { current: el };
}

describe("useSlideFit", () => {
  it("returns initial scale 1 before any measurement (null ref)", () => {
    const ref = { current: null };
    const { result } = renderHook(() => useSlideFit(ref, 1280, 720));
    expect(result.current).toBe(1);
  });

  it("computes scale = min(W/cw, H/ch) after first measurement", () => {
    const ref = makeRef(640, 360); // half canvas → scale 0.5
    const { result } = renderHook(() => useSlideFit(ref, 1280, 720));
    expect(result.current).toBeCloseTo(0.5, 5);
  });

  it("clamps scale to maxScale", () => {
    const ref = makeRef(12800, 7200); // 10x canvas → naive 10, clamped to 4
    const { result } = renderHook(() => useSlideFit(ref, 1280, 720, { maxScale: 4 }));
    expect(result.current).toBe(4);
  });

  it("clamps scale to minScale", () => {
    const ref = makeRef(12, 7); // tiny → 0.0097, clamped to 0.1
    const { result } = renderHook(() => useSlideFit(ref, 1280, 720, { minScale: 0.1 }));
    expect(result.current).toBe(0.1);
  });

  it("recomputes when canvasW/canvasH change", () => {
    const ref = makeRef(960, 540);
    const { result, rerender } = renderHook(({ w, h }) => useSlideFit(ref, w, h), {
      initialProps: { w: 1280, h: 720 },
    });
    expect(result.current).toBeCloseTo(0.75, 5);
    rerender({ w: 640, h: 360 });
    expect(result.current).toBeCloseTo(1.5, 5);
  });

  it("disconnects ResizeObserver on unmount", () => {
    const ref = makeRef(640, 360);
    const { unmount } = renderHook(() => useSlideFit(ref, 1280, 720));
    expect(disconnectCount).toBe(0);
    unmount();
    expect(disconnectCount).toBe(1);
  });

  it("ignores zero-size containers (no setState)", () => {
    const ref = makeRef(0, 0);
    const { result } = renderHook(() => useSlideFit(ref, 1280, 720));
    expect(result.current).toBe(1); // initial, unchanged
  });

  it("ResizeObserver callback updates scale on resize", () => {
    const dims = { width: 640, height: 360 };
    const el = {
      getBoundingClientRect() {
        return {
          width: dims.width,
          height: dims.height,
          top: 0,
          left: 0,
          right: dims.width,
          bottom: dims.height,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        };
      },
    } as unknown as HTMLElement;
    const ref = { current: el };
    const { result } = renderHook(() => useSlideFit(ref, 1280, 720));
    expect(result.current).toBeCloseTo(0.5, 5);

    // Simulate a resize.
    dims.width = 1280;
    dims.height = 720;
    act(() => {
      lastCallback?.([], {} as ResizeObserver);
    });
    expect(result.current).toBe(1);
  });
});
