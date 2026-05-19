import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatHash,
  readHashIndex,
  readInitialHash,
  useDeckHashRouting,
} from "./use-deck-hash-routing.js";

describe("readHashIndex", () => {
  it("returns 0-based index for #/N (1-based input)", () => {
    expect(readHashIndex("#/3")).toBe(2);
    expect(readHashIndex("#/1")).toBe(0);
  });

  it("returns undefined for empty/invalid hash", () => {
    expect(readHashIndex("")).toBeUndefined();
    expect(readHashIndex("#")).toBeUndefined();
    expect(readHashIndex("#/")).toBeUndefined();
    expect(readHashIndex("#section")).toBeUndefined();
    expect(readHashIndex("#/abc")).toBeUndefined();
    expect(readHashIndex("#/0")).toBeUndefined(); // 0 is not valid 1-based
  });

  it("handles trailing slash variant", () => {
    expect(readHashIndex("#/3")).toBe(2);
  });
});

describe("formatHash", () => {
  it("converts 0-based to #/N (1-based)", () => {
    expect(formatHash(0)).toBe("#/1");
    expect(formatHash(4)).toBe("#/5");
  });
});

describe("readInitialHash (SSR-safe / D17)", () => {
  it("reads from window.location.hash when available", () => {
    window.location.hash = "#/4";
    expect(readInitialHash()).toBe(3);
    window.location.hash = "";
  });

  it("returns undefined when hash is empty", () => {
    window.location.hash = "";
    expect(readInitialHash()).toBeUndefined();
  });
});

describe("useDeckHashRouting (hook)", () => {
  beforeEach(() => {
    window.location.hash = "";
  });

  afterEach(() => {
    window.location.hash = "";
    vi.restoreAllMocks();
  });

  it("hashchange dispatches JUMP_TO with clamped 0-based index", () => {
    const dispatch = vi.fn();
    renderHook(() => useDeckHashRouting(dispatch, { totalSlides: 5, currentIndex: 0 }));
    window.location.hash = "#/3";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(dispatch).toHaveBeenCalledWith({ type: "JUMP_TO", index: 2 });
  });

  it("hashchange clamps when > totalSlides", () => {
    const dispatch = vi.fn();
    renderHook(() => useDeckHashRouting(dispatch, { totalSlides: 5, currentIndex: 0 }));
    window.location.hash = "#/100";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(dispatch).toHaveBeenCalledWith({ type: "JUMP_TO", index: 4 });
  });

  it("invalid hash does NOT dispatch (no-op)", () => {
    const dispatch = vi.fn();
    renderHook(() => useDeckHashRouting(dispatch, { totalSlides: 5, currentIndex: 0 }));
    window.location.hash = "#/abc";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("currentIndex change updates hash via replaceState (NOT pushState, NOT location.hash =)", () => {
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    const dispatch = vi.fn();
    const { rerender } = renderHook(
      (props: { currentIndex: number }) =>
        useDeckHashRouting(dispatch, { totalSlides: 5, currentIndex: props.currentIndex }),
      { initialProps: { currentIndex: 0 } },
    );
    rerender({ currentIndex: 2 });
    expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "#/3");
  });

  it("replaceState does NOT trigger hashchange (no infinite loop — EC-10)", () => {
    // happy-dom: replaceState is silent. We verify by spying — replaceState
    // does not fire 'hashchange' event in JS spec.
    const dispatch = vi.fn();
    const hashHandler = vi.fn();
    window.addEventListener("hashchange", hashHandler);
    const { rerender } = renderHook(
      (props: { currentIndex: number }) =>
        useDeckHashRouting(dispatch, { totalSlides: 5, currentIndex: props.currentIndex }),
      { initialProps: { currentIndex: 0 } },
    );
    rerender({ currentIndex: 2 });
    expect(hashHandler).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled(); // no JUMP_TO from our own write
    window.removeEventListener("hashchange", hashHandler);
  });

  it("enabled=false is no-op (no listener, no write)", () => {
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    const dispatch = vi.fn();
    renderHook(() =>
      useDeckHashRouting(dispatch, { totalSlides: 5, currentIndex: 0, enabled: false }),
    );
    window.location.hash = "#/3";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(dispatch).not.toHaveBeenCalled();
    expect(replaceStateSpy).not.toHaveBeenCalled();
  });

  it("cleanup removes hashchange listener", () => {
    const dispatch = vi.fn();
    const { unmount } = renderHook(() =>
      useDeckHashRouting(dispatch, { totalSlides: 5, currentIndex: 0 }),
    );
    unmount();
    window.location.hash = "#/3";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(dispatch).not.toHaveBeenCalled();
  });
});
