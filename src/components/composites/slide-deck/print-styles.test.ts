import { afterEach, describe, expect, it, vi } from "vitest";
import { injectPrintStyles, printDeck, removePrintStyles } from "./print-styles.js";

afterEach(() => {
  removePrintStyles();
  vi.restoreAllMocks();
});

describe("injectPrintStyles", () => {
  it("adds <style> element with @page rules", () => {
    const style = injectPrintStyles();
    expect(style.id).toBe("theo-slide-deck-print-styles");
    expect(style.textContent).toContain("@page");
    expect(style.textContent).toContain("@media print");
    expect(document.getElementById("theo-slide-deck-print-styles")).toBe(style);
  });

  it("is idempotent — second call reuses same element", () => {
    const s1 = injectPrintStyles();
    const s2 = injectPrintStyles();
    expect(s1).toBe(s2);
    expect(document.querySelectorAll("#theo-slide-deck-print-styles").length).toBe(1);
  });
});

describe("removePrintStyles", () => {
  it("removes the style element", () => {
    injectPrintStyles();
    removePrintStyles();
    expect(document.getElementById("theo-slide-deck-print-styles")).toBeNull();
  });

  it("is safe when no style present", () => {
    expect(() => removePrintStyles()).not.toThrow();
  });
});

describe("printDeck", () => {
  it("calls window.print and registers afterprint listener", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    const addSpy = vi.spyOn(window, "addEventListener");
    printDeck();
    expect(printSpy).toHaveBeenCalled();
    expect(addSpy).toHaveBeenCalledWith("afterprint", expect.any(Function));
  });

  it("afterprint cleans up style + calls onAfterPrint callback", () => {
    vi.spyOn(window, "print").mockImplementation(() => {});
    const onAfterPrint = vi.fn();
    printDeck({ onAfterPrint });
    expect(document.getElementById("theo-slide-deck-print-styles")).toBeTruthy();
    window.dispatchEvent(new Event("afterprint"));
    expect(document.getElementById("theo-slide-deck-print-styles")).toBeNull();
    expect(onAfterPrint).toHaveBeenCalled();
  });
});
