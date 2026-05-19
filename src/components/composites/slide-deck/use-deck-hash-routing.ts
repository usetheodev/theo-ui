/**
 * Hash routing hook (ADR D13).
 *
 * Pattern `#/N` (1-based). Bidirectional sync:
 *   - Initial state: read via `useDeckState`'s lazy `initFromHash` (D17 SSR-safe).
 *   - hashchange event → JUMP_TO.
 *   - currentIndex change → `history.replaceState` (does NOT trigger hashchange,
 *     so no infinite loop — verified in test EC-10).
 */
import { type Dispatch, useEffect } from "react";
import type { DeckAction } from "./use-deck-state.js";

export interface UseDeckHashRoutingOptions {
  enabled?: boolean;
  totalSlides: number;
  currentIndex: number;
}

/** Read hash → return 0-based index, or undefined if not present/invalid. */
export function readHashIndex(hash: string): number | undefined {
  if (!hash || hash === "#" || hash === "#/") return undefined;
  const match = hash.match(/^#\/(\d+)/);
  if (!match) return undefined;
  const oneBased = Number.parseInt(match[1] ?? "", 10);
  if (!Number.isFinite(oneBased) || oneBased < 1) return undefined;
  return oneBased - 1;
}

/** SSR-safe wrapper for initial hash read (D17). */
export function readInitialHash(): number | undefined {
  if (typeof window === "undefined") return undefined;
  return readHashIndex(window.location.hash);
}

/** Format index → hash string. */
export function formatHash(zeroBasedIndex: number): string {
  return `#/${zeroBasedIndex + 1}`;
}

export function useDeckHashRouting(
  dispatch: Dispatch<DeckAction>,
  opts: UseDeckHashRoutingOptions,
): void {
  const { enabled = true, totalSlides, currentIndex } = opts;

  // Listen for hashchange (back/forward, manual edit, shared link click).
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    const handler = (): void => {
      const idx = readHashIndex(window.location.hash);
      if (typeof idx !== "number") return;
      const clamped = Math.max(0, Math.min(idx, Math.max(0, totalSlides - 1)));
      dispatch({ type: "JUMP_TO", index: clamped });
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, [enabled, totalSlides, dispatch]);

  // Sync currentIndex → hash via replaceState (silent, no hashchange fired).
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    const targetHash = formatHash(currentIndex);
    if (window.location.hash === targetHash) return;
    // replaceState does NOT trigger hashchange — verified in test EC-10.
    window.history.replaceState(null, "", targetHash);
  }, [enabled, currentIndex]);
}
