import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDeckSwipe } from "./use-deck-swipe.js";

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

function firePointer(
  el: HTMLElement,
  type: "pointerdown" | "pointerup" | "pointercancel",
  opts: { x?: number; y?: number; t?: number; pointerId?: number },
): void {
  const event = new Event(type) as PointerEvent;
  Object.defineProperties(event, {
    clientX: { value: opts.x ?? 0, writable: false },
    clientY: { value: opts.y ?? 0, writable: false },
    timeStamp: { value: opts.t ?? 0, writable: false },
    pointerId: { value: opts.pointerId ?? 1, writable: false },
  });
  el.dispatchEvent(event);
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useDeckSwipe", () => {
  it("swipe left (dx<0) dispatches NEXT_SLIDE", () => {
    const dispatch = vi.fn();
    const el = makeEl();
    const ref = { current: el };
    renderHook(() => useDeckSwipe(ref, dispatch));
    firePointer(el, "pointerdown", { x: 200, y: 100, t: 0 });
    firePointer(el, "pointerup", { x: 50, y: 110, t: 100 });
    expect(dispatch).toHaveBeenCalledWith({ type: "NEXT_SLIDE" });
  });

  it("swipe right (dx>0) dispatches PREV_SLIDE", () => {
    const dispatch = vi.fn();
    const el = makeEl();
    const ref = { current: el };
    renderHook(() => useDeckSwipe(ref, dispatch));
    firePointer(el, "pointerdown", { x: 50, y: 100, t: 0 });
    firePointer(el, "pointerup", { x: 200, y: 110, t: 100 });
    expect(dispatch).toHaveBeenCalledWith({ type: "PREV_SLIDE" });
  });

  it("swipe below threshold (40px) does nothing", () => {
    const dispatch = vi.fn();
    const el = makeEl();
    const ref = { current: el };
    renderHook(() => useDeckSwipe(ref, dispatch));
    firePointer(el, "pointerdown", { x: 100, y: 100, t: 0 });
    firePointer(el, "pointerup", { x: 60, y: 100, t: 100 });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("slow swipe (velocity < 0.3) does nothing", () => {
    const dispatch = vi.fn();
    const el = makeEl();
    const ref = { current: el };
    renderHook(() => useDeckSwipe(ref, dispatch));
    firePointer(el, "pointerdown", { x: 200, y: 100, t: 0 });
    firePointer(el, "pointerup", { x: 80, y: 100, t: 1000 }); // 120px / 1000ms = 0.12 < 0.3
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("vertical swipe (|dy| > 2*|dx|) does nothing", () => {
    const dispatch = vi.fn();
    const el = makeEl();
    const ref = { current: el };
    renderHook(() => useDeckSwipe(ref, dispatch));
    firePointer(el, "pointerdown", { x: 100, y: 50, t: 0 });
    firePointer(el, "pointerup", { x: 110, y: 200, t: 100 });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("multi-touch — only tracks first pointer (EC-7)", () => {
    const dispatch = vi.fn();
    const el = makeEl();
    const ref = { current: el };
    renderHook(() => useDeckSwipe(ref, dispatch));
    firePointer(el, "pointerdown", { x: 200, y: 100, t: 0, pointerId: 1 });
    firePointer(el, "pointerdown", { x: 100, y: 100, t: 10, pointerId: 2 });
    // Second pointer is ignored. First completes swipe.
    firePointer(el, "pointerup", { x: 50, y: 100, t: 100, pointerId: 1 });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: "NEXT_SLIDE" });
  });

  it("pointercancel clears tracking (EC-6)", () => {
    const dispatch = vi.fn();
    const el = makeEl();
    const ref = { current: el };
    renderHook(() => useDeckSwipe(ref, dispatch));
    firePointer(el, "pointerdown", { x: 200, y: 100, t: 0, pointerId: 1 });
    firePointer(el, "pointercancel", { pointerId: 1, t: 50 });
    // Now another swipe should work.
    firePointer(el, "pointerdown", { x: 200, y: 100, t: 100, pointerId: 1 });
    firePointer(el, "pointerup", { x: 50, y: 110, t: 200 });
    expect(dispatch).toHaveBeenCalledWith({ type: "NEXT_SLIDE" });
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it("cleanup removes pointer listeners", () => {
    const dispatch = vi.fn();
    const el = makeEl();
    const ref = { current: el };
    const { unmount } = renderHook(() => useDeckSwipe(ref, dispatch));
    unmount();
    firePointer(el, "pointerdown", { x: 200, y: 100, t: 0 });
    firePointer(el, "pointerup", { x: 50, y: 110, t: 100 });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("enabled=false is no-op", () => {
    const dispatch = vi.fn();
    const el = makeEl();
    const ref = { current: el };
    renderHook(() => useDeckSwipe(ref, dispatch, { enabled: false }));
    firePointer(el, "pointerdown", { x: 200, y: 100, t: 0 });
    firePointer(el, "pointerup", { x: 50, y: 110, t: 100 });
    expect(dispatch).not.toHaveBeenCalled();
  });
});
