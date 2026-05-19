import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type DeckState, deckReducer, useDeckState } from "./use-deck-state.js";

const initial: DeckState = {
  currentIndex: 0,
  currentFragment: 0,
  presenterMode: false,
  fullscreen: false,
  transitionDirection: "none",
  totalSlides: 5,
  totalFragmentsInCurrent: 0,
};

describe("deckReducer", () => {
  it("NEXT_SLIDE advances index by 1", () => {
    expect(deckReducer(initial, { type: "NEXT_SLIDE" }).currentIndex).toBe(1);
  });

  it("NEXT_SLIDE on last slide is no-op", () => {
    const s = { ...initial, currentIndex: 4 };
    expect(deckReducer(s, { type: "NEXT_SLIDE" })).toBe(s);
  });

  it("NEXT_SLIDE advances fragment when fragments remain", () => {
    const s = { ...initial, currentFragment: 0, totalFragmentsInCurrent: 3 };
    const next = deckReducer(s, { type: "NEXT_SLIDE" });
    expect(next.currentFragment).toBe(1);
    expect(next.currentIndex).toBe(0);
  });

  it("NEXT_SLIDE advances slide after last fragment", () => {
    const s = { ...initial, currentFragment: 3, totalFragmentsInCurrent: 3 };
    const next = deckReducer(s, { type: "NEXT_SLIDE" });
    expect(next.currentIndex).toBe(1);
    expect(next.currentFragment).toBe(0);
  });

  it("PREV_SLIDE decrements fragment first, then slide", () => {
    const s = { ...initial, currentIndex: 1, currentFragment: 2 };
    const r1 = deckReducer(s, { type: "PREV_SLIDE" });
    expect(r1.currentFragment).toBe(1);
    expect(r1.currentIndex).toBe(1);

    const s2 = { ...r1, currentFragment: 0 };
    const r2 = deckReducer(s2, { type: "PREV_SLIDE" });
    expect(r2.currentIndex).toBe(0);
  });

  it("PREV_SLIDE on first slide is no-op", () => {
    expect(deckReducer(initial, { type: "PREV_SLIDE" })).toBe(initial);
  });

  it("JUMP_TO clamps to valid range", () => {
    expect(deckReducer(initial, { type: "JUMP_TO", index: 100 }).currentIndex).toBe(4);
    expect(deckReducer(initial, { type: "JUMP_TO", index: -5 }).currentIndex).toBe(0);
  });

  it("JUMP_TO resets currentFragment to 0", () => {
    const s = { ...initial, currentFragment: 2, totalFragmentsInCurrent: 3 };
    expect(deckReducer(s, { type: "JUMP_TO", index: 3 }).currentFragment).toBe(0);
  });

  it("JUMP_TO same index is no-op", () => {
    expect(deckReducer(initial, { type: "JUMP_TO", index: 0 })).toBe(initial);
  });

  it("TOGGLE_PRESENTER flips boolean", () => {
    expect(deckReducer(initial, { type: "TOGGLE_PRESENTER" }).presenterMode).toBe(true);
  });

  it("SET_FULLSCREEN sets explicit value", () => {
    expect(deckReducer(initial, { type: "SET_FULLSCREEN", value: true }).fullscreen).toBe(true);
  });

  it("SET_FULLSCREEN same value is no-op", () => {
    expect(deckReducer(initial, { type: "SET_FULLSCREEN", value: false })).toBe(initial);
  });

  it("UPDATE_TOTAL_SLIDES clamps currentIndex if shrinks (EC-4)", () => {
    const s = { ...initial, currentIndex: 7, totalSlides: 10 };
    const next = deckReducer(s, { type: "UPDATE_TOTAL_SLIDES", total: 4 });
    expect(next.totalSlides).toBe(4);
    expect(next.currentIndex).toBe(3);
  });

  it("totalSlides=0 produces valid clamped state", () => {
    const s = { ...initial, totalSlides: 0, currentIndex: 0 };
    const next = deckReducer(s, { type: "UPDATE_TOTAL_SLIDES", total: 0 });
    expect(next.currentIndex).toBe(0);
  });

  it("TRANSITION_END resets to 'none'", () => {
    const s = { ...initial, transitionDirection: "next" as const };
    expect(deckReducer(s, { type: "TRANSITION_END" }).transitionDirection).toBe("none");
  });

  it("TRANSITION_END is idempotent when already none (D16)", () => {
    expect(deckReducer(initial, { type: "TRANSITION_END" })).toBe(initial);
  });

  it("NEXT_FRAGMENT advances fragment", () => {
    const s = { ...initial, currentFragment: 0, totalFragmentsInCurrent: 3 };
    expect(deckReducer(s, { type: "NEXT_FRAGMENT" }).currentFragment).toBe(1);
  });

  it("NEXT_FRAGMENT at end is no-op", () => {
    const s = { ...initial, currentFragment: 3, totalFragmentsInCurrent: 3 };
    expect(deckReducer(s, { type: "NEXT_FRAGMENT" })).toBe(s);
  });

  it("UPDATE_TOTAL_FRAGMENTS sets count", () => {
    expect(
      deckReducer(initial, { type: "UPDATE_TOTAL_FRAGMENTS", total: 5 }).totalFragmentsInCurrent,
    ).toBe(5);
  });
});

describe("useDeckState hook", () => {
  it("initial state respects initialIndex", () => {
    const { result } = renderHook(() => useDeckState({ initialIndex: 2, totalSlides: 5 }));
    expect(result.current[0].currentIndex).toBe(2);
  });

  it("initialIndex > totalSlides clamps to last", () => {
    const { result } = renderHook(() => useDeckState({ initialIndex: 100, totalSlides: 5 }));
    expect(result.current[0].currentIndex).toBe(4);
  });

  it("initialIndex < 0 clamps to 0", () => {
    const { result } = renderHook(() => useDeckState({ initialIndex: -5, totalSlides: 5 }));
    expect(result.current[0].currentIndex).toBe(0);
  });

  it("totalSlides=0 produces valid state", () => {
    const { result } = renderHook(() => useDeckState({ initialIndex: 0, totalSlides: 0 }));
    expect(result.current[0].currentIndex).toBe(0);
    expect(result.current[0].totalSlides).toBe(0);
  });

  it("initFromHash lazy initializer overrides initialIndex (D17)", () => {
    const { result } = renderHook(() =>
      useDeckState({
        initialIndex: 0,
        totalSlides: 5,
        initFromHash: () => 3,
      }),
    );
    expect(result.current[0].currentIndex).toBe(3);
  });

  it("initFromHash returning undefined falls back to initialIndex (SSR-safe / D17)", () => {
    const { result } = renderHook(() =>
      useDeckState({
        initialIndex: 1,
        totalSlides: 5,
        initFromHash: () => undefined,
      }),
    );
    expect(result.current[0].currentIndex).toBe(1);
  });

  it("dispatch updates state", () => {
    const { result } = renderHook(() => useDeckState({ initialIndex: 0, totalSlides: 5 }));
    act(() => result.current[1]({ type: "NEXT_SLIDE" }));
    expect(result.current[0].currentIndex).toBe(1);
  });
});
