/**
 * Touch swipe hook (ADR D10).
 *
 * Detecta swipe horizontal via Pointer Events nativos:
 *   - threshold: 50px de deslocamento
 *   - velocity: > 0.3 px/ms
 *   - direction guard: |dx| > 2*|dy| (bloqueia swipe vertical / scroll)
 *
 * Swipe left (dx < 0) → NEXT_SLIDE
 * Swipe right (dx > 0) → PREV_SLIDE
 *
 * EC-6: pointercancel limpa o tracking state (mobile browser pode cancelar mid-swipe).
 * EC-7: tracking limita ao primeiro pointerId (multi-touch é ignorado).
 */
import { type Dispatch, type RefObject, useEffect } from "react";
import type { DeckAction } from "./use-deck-state.js";

export interface UseDeckSwipeOptions {
  enabled?: boolean;
}

interface TrackedPointer {
  pointerId: number;
  startX: number;
  startY: number;
  startedAt: number;
}

const SWIPE_THRESHOLD_PX = 50;
const SWIPE_VELOCITY_PX_PER_MS = 0.3;

export function useDeckSwipe(
  ref: RefObject<HTMLElement | null>,
  dispatch: Dispatch<DeckAction>,
  opts: UseDeckSwipeOptions = {},
): void {
  const { enabled = true } = opts;
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let tracked: TrackedPointer | null = null;

    const onPointerDown = (e: PointerEvent): void => {
      // EC-7: ignore secondary pointers (multi-touch).
      if (tracked !== null) return;
      tracked = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startedAt: e.timeStamp,
      };
    };

    const onPointerUp = (e: PointerEvent): void => {
      if (!tracked || e.pointerId !== tracked.pointerId) return;
      const dx = e.clientX - tracked.startX;
      const dy = e.clientY - tracked.startY;
      const dt = Math.max(1, e.timeStamp - tracked.startedAt);
      tracked = null;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const velocity = absDx / dt;

      // Direction guard: horizontal-dominant swipe only.
      if (absDx < absDy * 2) return;
      // Threshold + velocity guard.
      if (absDx < SWIPE_THRESHOLD_PX) return;
      if (velocity < SWIPE_VELOCITY_PX_PER_MS) return;

      if (dx < 0) {
        dispatch({ type: "NEXT_SLIDE" });
      } else if (dx > 0) {
        dispatch({ type: "PREV_SLIDE" });
      }
    };

    const onPointerCancel = (e: PointerEvent): void => {
      // EC-6: clear tracking on cancel (browser back gesture, system interruption).
      if (tracked && e.pointerId === tracked.pointerId) {
        tracked = null;
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [enabled, ref, dispatch]);
}
