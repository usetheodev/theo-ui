"use client";

/**
 * `useStickToBottom` (M5-5) — auto-scroll a scroll container to the bottom when
 * its content grows, but ONLY while the user is pinned near the bottom (so it
 * never yanks the view away while they read history). Encapsulates the leaked
 * `[data-radix-scroll-area-viewport]` selector: attach `scrollRef` to a
 * `<ScrollArea>` (or any element) and the hook resolves the real scrollable
 * node internally.
 *
 * ResizeObserver drives the content-growth detection, with a one-shot fallback
 * for test environments that lack it (mirrors `slide/use-slide-fit.ts`).
 */
import { useCallback, useEffect, useRef, useState } from "react";

export interface StickToBottomMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

/** Pure: is the scroll position within `threshold` px of the bottom? */
export function isNearBottom(metrics: StickToBottomMetrics, threshold: number): boolean {
  return metrics.scrollHeight - metrics.clientHeight - metrics.scrollTop <= threshold;
}

export interface UseStickToBottomOptions {
  /** Px distance from the bottom under which the view is considered pinned. */
  threshold?: number;
}

export interface UseStickToBottomReturn<T extends HTMLElement = HTMLElement> {
  /** Attach to the `<ScrollArea>` root (or any element). */
  scrollRef: (node: T | null) => void;
  /** Whether the view is currently pinned near the bottom. */
  isPinned: boolean;
  /** Force-scroll to the bottom and re-pin. */
  scrollToBottom: () => void;
}

function resolveViewport(node: HTMLElement): HTMLElement {
  return node.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]") ?? node;
}

function readMetrics(el: HTMLElement): StickToBottomMetrics {
  return { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
}

const DEFAULT_THRESHOLD = 32;

export function useStickToBottom<T extends HTMLElement = HTMLElement>(
  options: UseStickToBottomOptions = {},
): UseStickToBottomReturn<T> {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const viewportRef = useRef<HTMLElement | null>(null);
  const pinnedRef = useRef(true);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [isPinned, setIsPinned] = useState(true);

  const scrollToBottom = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    pinnedRef.current = true;
    setIsPinned(true);
  }, []);

  const scrollRef = useCallback(
    (node: T | null) => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      if (node === null) {
        viewportRef.current = null;
        return;
      }
      const vp = resolveViewport(node);
      viewportRef.current = vp;

      const updatePinned = (): void => {
        const pinned = isNearBottom(readMetrics(vp), threshold);
        pinnedRef.current = pinned;
        setIsPinned(pinned);
      };
      const onScroll = (): void => updatePinned();
      const onResize = (): void => {
        if (pinnedRef.current) vp.scrollTop = vp.scrollHeight;
      };

      vp.addEventListener("scroll", onScroll, { passive: true });
      updatePinned();
      if (pinnedRef.current) vp.scrollTop = vp.scrollHeight;

      let observer: ResizeObserver | undefined;
      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(onResize);
        observer.observe(vp);
        if (vp.firstElementChild) observer.observe(vp.firstElementChild);
      }
      cleanupRef.current = (): void => {
        vp.removeEventListener("scroll", onScroll);
        observer?.disconnect();
      };
    },
    [threshold],
  );

  useEffect(() => () => cleanupRef.current?.(), []);

  return { scrollRef, isPinned, scrollToBottom };
}
