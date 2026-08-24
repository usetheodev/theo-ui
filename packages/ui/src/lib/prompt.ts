import type { ReactNode } from "react";

/**
 * A selectable option shared by the prompt composites (`ChoicePrompt`,
 * `MultiSelectPrompt`). Modeled on the question/option shape that drives an
 * AI-agent "ask the user" surface (the same UX Claude Code's question card
 * exposes): a stable value, a visible label, an optional secondary line, and
 * an optional rich preview shown side-by-side.
 */
export interface PromptOption {
  /** Stable value returned on selection. Must be unique within the option set. */
  value: string;
  /** Visible primary label. */
  label: ReactNode;
  /** Optional secondary line rendered under the label. */
  description?: ReactNode;
  /** When true, the option cannot be selected. */
  disabled?: boolean;
  /**
   * Optional rich preview (markdown-ish mockup, code snippet, diagram) shown in
   * the side-by-side pane while the option is selected. The presence of any
   * preview across the option set switches the layout to two columns — matching
   * the Claude Code question card's focused-option preview.
   */
  preview?: ReactNode;
}

/**
 * Reserved value for the synthesized free-text "Other" option that the choice
 * composites inject when `allowOther` is set. Kept out of the public barrel so
 * consumers cannot collide with it accidentally; compare against it via the
 * exported `isOtherValue` helper instead.
 */
export const OTHER_OPTION_VALUE = "__theo_other__";

/** True when `value` is the synthesized free-text "Other" option. */
export function isOtherValue(value: string | undefined): boolean {
  return value === OTHER_OPTION_VALUE;
}

/**
 * Map a single keyboard digit to a zero-based option index. Returns `null` when
 * the key is not a `1`..`9` digit. `"1"` → `0`, `"9"` → `8`. Used by the choice
 * composites to wire number-key shortcuts (terminal-style selection).
 */
export function digitKeyToIndex(key: string): number | null {
  if (key.length !== 1 || key < "1" || key > "9") return null;
  return Number(key) - 1;
}
