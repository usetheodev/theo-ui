/**
 * `<SlideDeck.Controls>` — prev/next buttons + slide indicator ("3 / 12").
 */
import type { FC } from "react";
import { useDeckContext } from "./context.js";

export interface ControlsProps {
  className?: string;
}

export const Controls: FC<ControlsProps> = ({ className }) => {
  const { state, dispatch } = useDeckContext();
  const atStart = state.currentIndex <= 0;
  const atEnd = state.currentIndex >= state.totalSlides - 1;
  return (
    <div
      className={["theo-slide-deck-controls", className].filter(Boolean).join(" ")}
      data-theo-slide-deck-controls
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
      data-slot="controls"
    >
      <button
        type="button"
        aria-label="Previous slide"
        disabled={atStart}
        onClick={() => dispatch({ type: "PREV_SLIDE" })}
        className="theo-slide-deck-controls-prev"
      >
        ←
      </button>
      <span
        aria-live="polite"
        className="theo-slide-deck-controls-indicator"
        style={{ fontVariantNumeric: "tabular-nums", minWidth: 64, textAlign: "center" }}
      >
        {state.totalSlides === 0 ? "0 / 0" : `${state.currentIndex + 1} / ${state.totalSlides}`}
      </span>
      <button
        type="button"
        aria-label="Next slide"
        disabled={atEnd}
        onClick={() => dispatch({ type: "NEXT_SLIDE" })}
        className="theo-slide-deck-controls-next"
      >
        →
      </button>
    </div>
  );
};
