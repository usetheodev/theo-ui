/**
 * `<SlideDeck.SlideNumber>` — decorative "N / Total" overlay.
 *
 * aria-hidden because the live indicator in <Controls> already announces the
 * current position; this is purely visual chrome.
 */
import type { FC } from "react";
import { useDeckContext } from "./context.js";

export interface SlideNumberProps {
  className?: string;
}

export const SlideNumber: FC<SlideNumberProps> = ({ className }) => {
  const { state } = useDeckContext();
  if (state.totalSlides === 0) return null;
  return (
    <div
      className={["theo-slide-deck-slide-number", className].filter(Boolean).join(" ")}
      data-theo-slide-deck-slide-number
      aria-hidden="true"
      style={{
        position: "absolute",
        bottom: 12,
        right: 16,
        fontVariantNumeric: "tabular-nums",
        fontSize: 14,
        opacity: 0.6,
      }}
    >
      {state.currentIndex + 1} / {state.totalSlides}
    </div>
  );
};
