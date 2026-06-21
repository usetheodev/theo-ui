import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { isNearBottom, useStickToBottom } from "./use-stick-to-bottom.js";

/* ─── T1.1 — pure helper ─────────────────────────────────────────────── */

describe("isNearBottom (M5-5)", () => {
  it("is true at the exact bottom", () => {
    expect(isNearBottom({ scrollTop: 100, scrollHeight: 200, clientHeight: 100 }, 32)).toBe(true);
  });
  it("is true within the threshold", () => {
    expect(isNearBottom({ scrollTop: 80, scrollHeight: 200, clientHeight: 100 }, 32)).toBe(true);
  });
  it("is false beyond the threshold", () => {
    expect(isNearBottom({ scrollTop: 50, scrollHeight: 200, clientHeight: 100 }, 32)).toBe(false);
  });
  it("is true for a zero-height (empty) container", () => {
    expect(isNearBottom({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 }, 32)).toBe(true);
  });
});

/* ─── helpers ────────────────────────────────────────────────────────── */

function withMetrics(el: HTMLElement, m: { scrollHeight: number; clientHeight: number }): void {
  Object.defineProperty(el, "scrollHeight", { value: m.scrollHeight, configurable: true });
  Object.defineProperty(el, "clientHeight", { value: m.clientHeight, configurable: true });
  Object.defineProperty(el, "scrollTop", { value: 0, writable: true, configurable: true });
}

/* ─── T2.1 — the hook ────────────────────────────────────────────────── */

describe("useStickToBottom (M5-5)", () => {
  it("resolves the Radix viewport child and scrollToBottom targets it", () => {
    const root = document.createElement("div");
    const vp = document.createElement("div");
    vp.setAttribute("data-radix-scroll-area-viewport", "");
    root.appendChild(vp);
    withMetrics(vp, { scrollHeight: 500, clientHeight: 100 });

    const { result } = renderHook(() => useStickToBottom());
    act(() => result.current.scrollRef(root));
    act(() => result.current.scrollToBottom());

    expect(vp.scrollTop).toBe(500); // wrote to the viewport, not the root
    expect(result.current.isPinned).toBe(true);
  });

  it("falls back to the element itself when there is no Radix viewport child", () => {
    const plain = document.createElement("div");
    withMetrics(plain, { scrollHeight: 300, clientHeight: 100 });
    const { result } = renderHook(() => useStickToBottom());
    act(() => result.current.scrollRef(plain));
    act(() => result.current.scrollToBottom());
    expect(plain.scrollTop).toBe(300);
  });

  it("marks not-pinned after the user scrolls up beyond the threshold", () => {
    const vp = document.createElement("div");
    withMetrics(vp, { scrollHeight: 1000, clientHeight: 100 }); // scrollTop 0 → 900px from bottom
    const { result } = renderHook(() => useStickToBottom());
    act(() => result.current.scrollRef(vp));
    act(() => {
      vp.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isPinned).toBe(false);
  });

  it("does not throw when detaching (scrollRef null) or without ResizeObserver", () => {
    const vp = document.createElement("div");
    withMetrics(vp, { scrollHeight: 200, clientHeight: 100 });
    const { result } = renderHook(() => useStickToBottom());
    expect(() => {
      act(() => result.current.scrollRef(vp));
      act(() => result.current.scrollRef(null));
    }).not.toThrow();
  });
});

/* ─── T3.1 — barrel wiring ───────────────────────────────────────────── */

describe("scroll-area barrel (M5-5 wiring)", () => {
  it("exposes useStickToBottom + isNearBottom", async () => {
    const mod = await import("./index.js");
    expect(typeof mod.useStickToBottom).toBe("function");
    expect(typeof mod.isNearBottom).toBe("function");
  });
});
