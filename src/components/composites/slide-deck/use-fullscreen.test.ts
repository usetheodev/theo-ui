import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFullscreen } from "./use-fullscreen.js";

interface DocLike {
  fullscreenElement?: Element | null;
  exitFullscreen?: () => Promise<void>;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
}

interface ElLike {
  requestFullscreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
}

beforeEach(() => {
  // Provide a baseline supported impl on documentElement.
  const el = document.documentElement as unknown as ElLike;
  el.requestFullscreen = vi.fn(() => Promise.resolve());
  const doc = document as unknown as DocLike;
  doc.exitFullscreen = vi.fn(() => Promise.resolve());
  doc.fullscreenElement = null;
});

afterEach(() => {
  vi.restoreAllMocks();
  const el = document.documentElement as unknown as ElLike;
  el.requestFullscreen = undefined;
  el.webkitRequestFullscreen = undefined;
  const doc = document as unknown as DocLike;
  doc.exitFullscreen = undefined;
  doc.fullscreenElement = null;
});

describe("useFullscreen", () => {
  it("isSupported=true when standard API present", () => {
    const elRef = { current: document.createElement("div") };
    const { result } = renderHook(() => useFullscreen(elRef));
    expect(result.current.isSupported).toBe(true);
  });

  it("toggle calls requestFullscreen on element when not in fullscreen", async () => {
    const div = document.createElement("div");
    const req = vi.fn(() => Promise.resolve());
    (div as unknown as ElLike).requestFullscreen = req;
    const elRef = { current: div };
    const { result } = renderHook(() => useFullscreen(elRef));
    await act(async () => {
      await result.current.toggle();
    });
    expect(req).toHaveBeenCalled();
  });

  it("toggle calls exitFullscreen when already in fullscreen", async () => {
    const div = document.createElement("div");
    const elRef = { current: div };
    const doc = document as unknown as DocLike;
    const exit = vi.fn(() => Promise.resolve());
    doc.exitFullscreen = exit;
    doc.fullscreenElement = div;
    const { result } = renderHook(() => useFullscreen(elRef));
    await act(async () => {
      await result.current.toggle();
    });
    expect(exit).toHaveBeenCalled();
  });

  it("fullscreenchange listener updates state", () => {
    const elRef = { current: document.createElement("div") };
    const { result } = renderHook(() => useFullscreen(elRef));
    expect(result.current.isFullscreen).toBe(false);
    const doc = document as unknown as DocLike;
    doc.fullscreenElement = elRef.current;
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(result.current.isFullscreen).toBe(true);
  });

  it("toggle is safe (no throw) when API unavailable / rejection (EC-8)", async () => {
    const div = document.createElement("div");
    (div as unknown as ElLike).requestFullscreen = vi.fn(() =>
      Promise.reject(new Error("NotAllowedError")),
    );
    const elRef = { current: div };
    const { result } = renderHook(() => useFullscreen(elRef));
    // Should NOT throw.
    await expect(result.current.toggle()).resolves.toBeUndefined();
  });

  it("isSupported=false when API absent (EC-8 graceful fallback)", () => {
    const el = document.documentElement as unknown as ElLike;
    el.requestFullscreen = undefined;
    el.webkitRequestFullscreen = undefined;
    const doc = document as unknown as DocLike;
    doc.exitFullscreen = undefined;
    doc.webkitExitFullscreen = undefined;
    const elRef = { current: document.createElement("div") };
    const { result } = renderHook(() => useFullscreen(elRef));
    expect(result.current.isSupported).toBe(false);
    // toggle is still safe to call.
    expect(() => result.current.toggle()).not.toThrow();
  });

  it("cleanup removes listeners", () => {
    const elRef = { current: document.createElement("div") };
    const { unmount, result } = renderHook(() => useFullscreen(elRef));
    unmount();
    // After unmount, simulated fullscreenchange should not affect anything.
    const doc = document as unknown as DocLike;
    doc.fullscreenElement = elRef.current;
    document.dispatchEvent(new Event("fullscreenchange"));
    expect(result.current.isFullscreen).toBe(false);
  });
});
