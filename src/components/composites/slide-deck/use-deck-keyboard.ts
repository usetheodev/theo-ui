/**
 * Keyboard navigation hook (ADR D9).
 *
 * Hardcoded bindings (no remap in v0.4):
 *   ArrowRight, Space, PageDown → NEXT_SLIDE
 *   ArrowLeft,  PageUp          → PREV_SLIDE
 *   Home                        → JUMP_TO 0
 *   End                         → JUMP_TO last
 *   Escape                      → SET_FULLSCREEN false
 *   f / F                       → toggleFullscreen callback
 *   n / N / p / P               → TOGGLE_PRESENTER
 *   Ctrl+P / Meta+P             → onPrint callback (preventDefault)
 *
 * Guards: ignora events quando target é INPUT, TEXTAREA, ou contentEditable
 * (consumer pode ter inputs em modais sem conflito).
 */
import { type Dispatch, useEffect } from "react";
import type { DeckAction } from "./use-deck-state.js";

export interface UseDeckKeyboardOptions {
  enabled?: boolean;
  totalSlides: number;
  onToggleFullscreen?: () => void;
  onPrint?: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useDeckKeyboard(
  dispatch: Dispatch<DeckAction>,
  opts: UseDeckKeyboardOptions,
): void {
  const { enabled = true, totalSlides, onToggleFullscreen, onPrint } = opts;
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: KeyboardEvent): void => {
      if (isEditableTarget(event.target)) return;

      const key = event.key;
      const isPrintCombo = (event.ctrlKey || event.metaKey) && (key === "p" || key === "P");

      if (isPrintCombo) {
        event.preventDefault();
        onPrint?.();
        return;
      }

      switch (key) {
        case "ArrowRight":
        case " ":
        case "Spacebar":
        case "PageDown":
          dispatch({ type: "NEXT_SLIDE" });
          break;
        case "ArrowLeft":
        case "PageUp":
          dispatch({ type: "PREV_SLIDE" });
          break;
        case "Home":
          dispatch({ type: "JUMP_TO", index: 0 });
          break;
        case "End":
          dispatch({ type: "JUMP_TO", index: Math.max(0, totalSlides - 1) });
          break;
        case "Escape":
          dispatch({ type: "SET_FULLSCREEN", value: false });
          break;
        case "f":
        case "F":
          onToggleFullscreen?.();
          break;
        case "n":
        case "N":
        case "p":
        case "P":
          dispatch({ type: "TOGGLE_PRESENTER" });
          break;
        default:
          return;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [enabled, totalSlides, dispatch, onToggleFullscreen, onPrint]);
}
