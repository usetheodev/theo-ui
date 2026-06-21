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
  it("is true when over-scrolled past the bottom (negative distance)", () => {
    expect(isNearBottom({ scrollTop: 120, scrollHeight: 200, clientHeight: 100 }, 32)).toBe(true);
  });
});

/* ─── helpers ────────────────────────────────────────────────────────── */

function withMetrics(el: HTMLElement, m: { scrollHeight: number; clientHeight: number }): void {
  Object.defineProperty(el, "scrollHeight", { value: m.scrollHeight, configurable: true });
  Object.defineProperty(el, "clientHeight", { value: m.clientHeight, configurable: true });
  Object.defineProperty(el, "scrollTop", { value: 0, writable: true, configurable: true });
}

function setScrollHeight(el: HTMLElement, value: number): void {
  Object.defineProperty(el, "scrollHeight", { value, configurable: true });
}

/** Flush microtasks so MutationObserver callbacks are delivered. */
const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

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

  it("auto-scrolls to the bottom when content grows WHILE pinned", async () => {
    const vp = document.createElement("div");
    withMetrics(vp, { scrollHeight: 100, clientHeight: 100 }); // scrollTop 0 → pinned
    const { result } = renderHook(() => useStickToBottom());
    act(() => result.current.scrollRef(vp));
    expect(result.current.isPinned).toBe(true);
    // content grows + a child is appended (MutationObserver trigger)
    setScrollHeight(vp, 500);
    await act(async () => {
      vp.appendChild(document.createElement("div"));
      await flush();
    });
    expect(vp.scrollTop).toBe(500); // followed the growth to the bottom
  });

  it("does NOT scroll on growth when the user is NOT pinned (no yank)", async () => {
    const vp = document.createElement("div");
    withMetrics(vp, { scrollHeight: 1000, clientHeight: 100 }); // scrollTop 0 → 900px up → not pinned
    const { result } = renderHook(() => useStickToBottom());
    act(() => result.current.scrollRef(vp));
    expect(result.current.isPinned).toBe(false);
    setScrollHeight(vp, 2000);
    await act(async () => {
      vp.appendChild(document.createElement("div"));
      await flush();
    });
    expect(vp.scrollTop).toBe(0); // stayed where the user was reading
  });

  it("honors a custom threshold", () => {
    const vp = document.createElement("div");
    withMetrics(vp, { scrollHeight: 1000, clientHeight: 100 }); // 900px from bottom
    const { result } = renderHook(() => useStickToBottom({ threshold: 1000 }));
    act(() => result.current.scrollRef(vp));
    expect(result.current.isPinned).toBe(true); // 900 <= 1000
  });

  it("tears down the previous node's listener on re-attach", () => {
    const a = document.createElement("div");
    withMetrics(a, { scrollHeight: 1000, clientHeight: 100 }); // a → not pinned
    const b = document.createElement("div");
    withMetrics(b, { scrollHeight: 100, clientHeight: 100 }); // b → pinned
    const { result } = renderHook(() => useStickToBottom());
    act(() => result.current.scrollRef(a));
    act(() => result.current.scrollRef(b));
    // a's scroll listener is gone — scrolling a must NOT change isPinned (now reflecting b)
    act(() => {
      a.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isPinned).toBe(true);
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
