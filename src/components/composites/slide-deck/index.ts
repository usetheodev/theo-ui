/**
 * Public surface of `@theokit/ui/slide-deck`. Subpath-isolated composite engine.
 */
export { SlideDeck } from "./slide-deck.js";
export type { SlideDeckProps } from "./slide-deck.js";
export {
  slideDeckInput,
  slideDeckSlide,
  slideDeckTransition,
  type SlideDeckInput,
  type SlideDeckSlide,
  type SlideDeckTransition,
} from "./schema.js";
export { splitDeck } from "./split-deck.js";
export { extractNotes } from "./notes.js";
export { countFragmentsInMarkdown } from "./fragments.js";
export {
  formatHash,
  readHashIndex,
  readInitialHash,
  useDeckHashRouting,
} from "./use-deck-hash-routing.js";
export {
  deckReducer,
  useDeckState,
  type DeckAction,
  type DeckState,
} from "./use-deck-state.js";
export { useDeckKeyboard } from "./use-deck-keyboard.js";
export { useDeckSwipe } from "./use-deck-swipe.js";
export { useFullscreen } from "./use-fullscreen.js";
export {
  injectPrintStyles,
  printDeck,
  removePrintStyles,
} from "./print-styles.js";
export { Controls } from "./controls.js";
export { ProgressBar } from "./progress-bar.js";
export { SlideNumber } from "./slide-number.js";
export { Thumbnails } from "./thumbnails.js";
export { PresenterView } from "./presenter-view.js";
export {
  DeckContext,
  useDeckContext,
  type DeckContextValue,
} from "./context.js";
