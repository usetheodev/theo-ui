"use client";

/**
 * `useStickToBottom` (M5-5) — auto-scroll a scroll container to the bottom when
 * its content grows, but ONLY while the user is pinned near the bottom (so it
 * never yanks the view away while they read history). Encapsulates the leaked
 * `[data-radix-scroll-area-viewport]` selector: attach `scrollRef` to a
 * `<ScrollArea>` (or any element) and the hook resolves the real scrollable
 * node internally.
 *
 * Content growth (streamed messages/tokens) is detected with a `MutationObserver`
 * — a scroll container's own box does not resize when content grows inside it, so
 * a ResizeObserver alone would miss it. A `ResizeObserver` is added on top (when
 * available) to also catch box-size changes such as an image finishing load.
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
      // Auto-scroll on growth ONLY while pinned — the guard that prevents yanking
      // the view away while the user reads history.
      const onGrow = (): void => {
        if (pinnedRef.current) vp.scrollTop = vp.scrollHeight;
      };

      vp.addEventListener("scroll", onScroll, { passive: true });
      updatePinned();
      onGrow(); // pin to bottom on attach when already pinned

      // A scroll container's OWN box does not resize when content grows inside
      // it, so streamed messages/tokens are detected as DOM mutations (the
      // primary signal). A ResizeObserver additionally catches box-size changes
      // (e.g. an image finishing load) when the environment provides one.
      const mutationObserver = new MutationObserver(onGrow);
      mutationObserver.observe(vp, { childList: true, subtree: true, characterData: true });
      let resizeObserver: ResizeObserver | undefined;
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(onGrow);
        resizeObserver.observe(vp);
      }
      cleanupRef.current = (): void => {
        vp.removeEventListener("scroll", onScroll);
        mutationObserver.disconnect();
        resizeObserver?.disconnect();
      };
    },
    [threshold],
  );

  useEffect(() => () => cleanupRef.current?.(), []);

  return { scrollRef, isPinned, scrollToBottom };
}
