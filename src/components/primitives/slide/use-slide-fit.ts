/**
 * Container-fit hook for the Slide primitive.
 *
 * Observes the host element via `ResizeObserver` and computes a CSS scale
 * factor that fits the fixed logical canvas (default 1280×720) inside it,
 * preserving aspect ratio. Clamped to `[minScale, maxScale]`.
 *
 * Algorithm: `scale = clamp(min(W / canvasW, H / canvasH), min, max)`.
 *
 * Adapted from Reveal.js `transformSlides` (see reference doc §4.5 / §14.2).
 *
 * Cleanup: disconnects the observer on unmount or when deps change.
 */
import { type RefObject, useEffect, useState } from "react";

export interface UseSlideFitOptions {
  /** Lower clamp for scale. Default 0.1. */
  minScale?: number;
  /** Upper clamp for scale. Default 4. */
  maxScale?: number;
}

export function useSlideFit(
  ref: RefObject<HTMLElement | null>,
  canvasW: number,
  canvasH: number,
  opts: UseSlideFitOptions = {},
): number {
  const { minScale = 0.1, maxScale = 4 } = opts;
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof ResizeObserver === "undefined") {
      // Test environments without ResizeObserver: do a one-shot measurement.
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        const raw = Math.min(width / canvasW, height / canvasH);
        setScale(Math.max(minScale, Math.min(raw, maxScale)));
      }
      return;
    }
    const update = (): void => {
      const { width, height } = el.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      const raw = Math.min(width / canvasW, height / canvasH);
      const clamped = Math.max(minScale, Math.min(raw, maxScale));
      if (Number.isFinite(clamped)) setScale(clamped);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, canvasW, canvasH, minScale, maxScale]);

  return scale;
}
