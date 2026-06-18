/**
 * `<SlideDeck.ProgressBar>` — horizontal HTML5 progress element.
 */
import type { FC } from "react";
import { useDeckContext } from "./context.js";

export interface ProgressBarProps {
  className?: string;
}

export const ProgressBar: FC<ProgressBarProps> = ({ className }) => {
  const { state } = useDeckContext();
  // Edge case: totalSlides=0 → 0% safely.
  const value = state.totalSlides === 0 ? 0 : state.currentIndex + 1;
  const max = Math.max(1, state.totalSlides);
  return (
    <progress
      data-slot="progress-bar"
      className={["theo-slide-deck-progress", className].filter(Boolean).join(" ")}
      data-theo-slide-deck-progress
      value={value}
      max={max}
      aria-label="Slide progress"
    />
  );
};
