/**
 * Print CSS injection (ADR D7).
 *
 * Injects a `<style id="theo-slide-deck-print">` element into the document
 * head with `@page` + `@media print` rules that render `.theo-slide-deck-print-container`
 * with one slide per page. Calls `window.print()`. Removes the style on the
 * `afterprint` event (cleanup runs regardless of print cancel/complete).
 */

const STYLE_ID = "theo-slide-deck-print-styles";
const PRINT_CSS = `
@media print {
  @page {
    size: 1280px 720px;
    margin: 0;
  }
  body > * {
    visibility: hidden;
  }
  .theo-slide-deck-print-container,
  .theo-slide-deck-print-container * {
    visibility: visible;
  }
  .theo-slide-deck-print-container {
    position: absolute;
    inset: 0;
  }
  .theo-slide-deck-print-slide {
    page-break-after: always;
    break-after: page;
    width: 1280px;
    height: 720px;
    overflow: hidden;
  }
  .theo-slide-deck-print-slide:last-child {
    page-break-after: auto;
    break-after: auto;
  }
}
`;

export function injectPrintStyles(): HTMLStyleElement {
  if (typeof document === "undefined") {
    throw new Error("injectPrintStyles requires a document (browser env)");
  }
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = PRINT_CSS;
    document.head.appendChild(style);
  }
  return style;
}

export function removePrintStyles(): void {
  if (typeof document === "undefined") return;
  const style = document.getElementById(STYLE_ID);
  if (style) style.remove();
}

export interface PrintDeckOptions {
  /** Optional callback fired after print dialog closes (success or cancel). */
  onAfterPrint?: () => void;
}

/**
 * Trigger native print dialog with deck-specific CSS injected.
 *
 * The `afterprint` event listener is cleaned up automatically. Idempotent —
 * calling twice in quick succession is safe (style is reused).
 */
export function printDeck(opts: PrintDeckOptions = {}): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  injectPrintStyles();
  const cleanup = (): void => {
    removePrintStyles();
    window.removeEventListener("afterprint", cleanup);
    opts.onAfterPrint?.();
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}
