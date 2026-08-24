import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDeckKeyboard } from "./use-deck-keyboard.js";

function fireKey(key: string, opts: { ctrl?: boolean; meta?: boolean; target?: EventTarget } = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    ctrlKey: opts.ctrl ?? false,
    metaKey: opts.meta ?? false,
    bubbles: true,
    cancelable: true,
  });
  if (opts.target) {
    Object.defineProperty(event, "target", { value: opts.target, writable: false });
  }
  document.dispatchEvent(event);
  return event;
}

describe("useDeckKeyboard", () => {
  it("ArrowRight dispatches NEXT_SLIDE", () => {
    const dispatch = vi.fn();
    renderHook(() => useDeckKeyboard(dispatch, { totalSlides: 5 }));
    fireKey("ArrowRight");
    expect(dispatch).toHaveBeenCalledWith({ type: "NEXT_SLIDE" });
  });

  it("Space dispatches NEXT_SLIDE", () => {
    const dispatch = vi.fn();
    renderHook(() => useDeckKeyboard(dispatch, { totalSlides: 5 }));
    fireKey(" ");
    expect(dispatch).toHaveBeenCalledWith({ type: "NEXT_SLIDE" });
  });

  it("PageDown dispatches NEXT_SLIDE", () => {
    const dispatch = vi.fn();
    renderHook(() => useDeckKeyboard(dispatch, { totalSlides: 5 }));
    fireKey("PageDown");
    expect(dispatch).toHaveBeenCalledWith({ type: "NEXT_SLIDE" });
  });

  it("ArrowLeft dispatches PREV_SLIDE", () => {
    const dispatch = vi.fn();
    renderHook(() => useDeckKeyboard(dispatch, { totalSlides: 5 }));
    fireKey("ArrowLeft");
    expect(dispatch).toHaveBeenCalledWith({ type: "PREV_SLIDE" });
  });

  it("Home dispatches JUMP_TO 0", () => {
    const dispatch = vi.fn();
    renderHook(() => useDeckKeyboard(dispatch, { totalSlides: 5 }));
    fireKey("Home");
    expect(dispatch).toHaveBeenCalledWith({ type: "JUMP_TO", index: 0 });
  });

  it("End dispatches JUMP_TO last", () => {
    const dispatch = vi.fn();
    renderHook(() => useDeckKeyboard(dispatch, { totalSlides: 5 }));
    fireKey("End");
    expect(dispatch).toHaveBeenCalledWith({ type: "JUMP_TO", index: 4 });
  });

  it("Escape sets fullscreen false", () => {
    const dispatch = vi.fn();
    renderHook(() => useDeckKeyboard(dispatch, { totalSlides: 5 }));
    fireKey("Escape");
    expect(dispatch).toHaveBeenCalledWith({ type: "SET_FULLSCREEN", value: false });
  });

  it("f toggles fullscreen via callback", () => {
    const dispatch = vi.fn();
    const onToggleFullscreen = vi.fn();
    renderHook(() => useDeckKeyboard(dispatch, { totalSlides: 5, onToggleFullscreen }));
    fireKey("f");
    expect(onToggleFullscreen).toHaveBeenCalled();
  });

  it("n toggles presenter", () => {
    const dispatch = vi.fn();
    renderHook(() => useDeckKeyboard(dispatch, { totalSlides: 5 }));
    fireKey("n");
    expect(dispatch).toHaveBeenCalledWith({ type: "TOGGLE_PRESENTER" });
  });

  it("ignores events from INPUT target", () => {
    const dispatch = vi.fn();
    renderHook(() => useDeckKeyboard(dispatch, { totalSlides: 5 }));
    const input = document.createElement("input");
    document.body.appendChild(input);
    fireKey("ArrowRight", { target: input });
    expect(dispatch).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("ignores events from contentEditable", () => {
    const dispatch = vi.fn();
    renderHook(() => useDeckKeyboard(dispatch, { totalSlides: 5 }));
    const div = document.createElement("div");
    div.contentEditable = "true";
    document.body.appendChild(div);
    fireKey("ArrowRight", { target: div });
    expect(dispatch).not.toHaveBeenCalled();
    document.body.removeChild(div);
  });

  it("Ctrl+P calls onPrint and prevents default", () => {
    const dispatch = vi.fn();
    const onPrint = vi.fn();
    renderHook(() => useDeckKeyboard(dispatch, { totalSlides: 5, onPrint }));
    const event = fireKey("p", { ctrl: true });
    expect(onPrint).toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it("cleanup on unmount removes listener", () => {
    const dispatch = vi.fn();
    const { unmount } = renderHook(() => useDeckKeyboard(dispatch, { totalSlides: 5 }));
    unmount();
    fireKey("ArrowRight");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("enabled=false is no-op", () => {
    const dispatch = vi.fn();
    renderHook(() => useDeckKeyboard(dispatch, { totalSlides: 5, enabled: false }));
    fireKey("ArrowRight");
    expect(dispatch).not.toHaveBeenCalled();
  });
});
