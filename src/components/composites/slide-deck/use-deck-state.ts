/**
 * Deck state machine (ADR D5).
 *
 * Single useReducer governs all deck-level state transitions: currentIndex,
 * currentFragment, presenterMode, fullscreen, transitionDirection.
 *
 * NEXT_SLIDE advances fragment first if `currentFragment < totalFragmentsInCurrent`,
 * else advances slide. PREV_SLIDE mirrors. JUMP_TO clamps to valid range.
 *
 * ADR D17: lazy init reads hash via `initFromHash` callback when provided —
 * SSR-safe (callback guards `typeof window !== "undefined"`).
 */
import { type Dispatch, useReducer } from "react";

export interface DeckState {
  currentIndex: number;
  currentFragment: number;
  presenterMode: boolean;
  fullscreen: boolean;
  transitionDirection: "none" | "next" | "prev";
  totalSlides: number;
  totalFragmentsInCurrent: number;
}

export type DeckAction =
  | { type: "NEXT_SLIDE" }
  | { type: "PREV_SLIDE" }
  | { type: "JUMP_TO"; index: number }
  | { type: "NEXT_FRAGMENT" }
  | { type: "PREV_FRAGMENT" }
  | { type: "RESET_FRAGMENTS" }
  | { type: "TOGGLE_PRESENTER" }
  | { type: "SET_FULLSCREEN"; value: boolean }
  | { type: "UPDATE_TOTAL_SLIDES"; total: number }
  | { type: "UPDATE_TOTAL_FRAGMENTS"; total: number }
  | { type: "TRANSITION_END" };

export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case "NEXT_SLIDE": {
      // Advance fragment first when there are remaining fragments.
      if (state.currentFragment < state.totalFragmentsInCurrent) {
        return { ...state, currentFragment: state.currentFragment + 1 };
      }
      const next = Math.min(state.currentIndex + 1, Math.max(0, state.totalSlides - 1));
      if (next === state.currentIndex) return state;
      return {
        ...state,
        currentIndex: next,
        currentFragment: 0,
        transitionDirection: "next",
      };
    }
    case "PREV_SLIDE": {
      if (state.currentFragment > 0) {
        return { ...state, currentFragment: state.currentFragment - 1 };
      }
      const prev = Math.max(state.currentIndex - 1, 0);
      if (prev === state.currentIndex) return state;
      return {
        ...state,
        currentIndex: prev,
        currentFragment: 0,
        transitionDirection: "prev",
      };
    }
    case "JUMP_TO": {
      const clamped = Math.max(0, Math.min(action.index, Math.max(0, state.totalSlides - 1)));
      if (clamped === state.currentIndex) return state;
      return {
        ...state,
        currentIndex: clamped,
        currentFragment: 0,
        transitionDirection: "none",
      };
    }
    case "NEXT_FRAGMENT": {
      if (state.currentFragment >= state.totalFragmentsInCurrent) return state;
      return { ...state, currentFragment: state.currentFragment + 1 };
    }
    case "PREV_FRAGMENT": {
      if (state.currentFragment <= 0) return state;
      return { ...state, currentFragment: state.currentFragment - 1 };
    }
    case "RESET_FRAGMENTS":
      return { ...state, currentFragment: 0 };
    case "TOGGLE_PRESENTER":
      return { ...state, presenterMode: !state.presenterMode };
    case "SET_FULLSCREEN":
      return state.fullscreen === action.value ? state : { ...state, fullscreen: action.value };
    case "UPDATE_TOTAL_SLIDES": {
      const next = Math.max(0, action.total);
      const clampedIdx = Math.max(0, Math.min(state.currentIndex, Math.max(0, next - 1)));
      return { ...state, totalSlides: next, currentIndex: clampedIdx };
    }
    case "UPDATE_TOTAL_FRAGMENTS":
      return { ...state, totalFragmentsInCurrent: Math.max(0, action.total) };
    case "TRANSITION_END":
      return state.transitionDirection === "none"
        ? state
        : { ...state, transitionDirection: "none" };
  }
}

export interface UseDeckStateOptions {
  initialIndex?: number;
  totalSlides: number;
  /** Lazy initializer hook (D17): returns initial index, e.g. parsing hash. */
  initFromHash?: () => number | undefined;
}

function initDeckState(init: UseDeckStateOptions): DeckState {
  const total = Math.max(0, init.totalSlides);
  let idx = init.initialIndex ?? 0;
  if (init.initFromHash) {
    const fromHash = init.initFromHash();
    if (typeof fromHash === "number" && Number.isFinite(fromHash)) {
      idx = fromHash;
    }
  }
  const clamped = Math.max(0, Math.min(idx, Math.max(0, total - 1)));
  return {
    currentIndex: clamped,
    currentFragment: 0,
    presenterMode: false,
    fullscreen: false,
    transitionDirection: "none",
    totalSlides: total,
    totalFragmentsInCurrent: 0,
  };
}

export function useDeckState(
  opts: UseDeckStateOptions,
): readonly [DeckState, Dispatch<DeckAction>] {
  const [state, dispatch] = useReducer(deckReducer, opts, initDeckState);
  return [state, dispatch] as const;
}
