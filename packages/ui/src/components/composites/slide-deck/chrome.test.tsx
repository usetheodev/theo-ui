/**
 * Integration tests for the chrome sub-components (Controls, ProgressBar,
 * SlideNumber). Uses a minimal DeckContext provider directly — full component
 * integration is covered in slide-deck.test.tsx.
 */
import { fireEvent, render } from "@testing-library/react";
import { type Dispatch, type ReactNode, useReducer } from "react";
import { describe, expect, it } from "vitest";
import { DeckContext, type DeckContextValue } from "./context.js";
import { Controls } from "./controls.js";
import { ProgressBar } from "./progress-bar.js";
import type { SlideDeckSlide } from "./schema.js";
import { SlideNumber } from "./slide-number.js";
import { type DeckAction, type DeckState, deckReducer } from "./use-deck-state.js";

interface HarnessProps {
  initial?: Partial<DeckState>;
  slides?: SlideDeckSlide[];
  children: ReactNode;
}

function Harness({ initial = {}, slides = [], children }: HarnessProps) {
  const [state, dispatch] = useReducer(deckReducer, {
    currentIndex: 0,
    currentFragment: 0,
    presenterMode: false,
    fullscreen: false,
    transitionDirection: "none",
    totalSlides: slides.length > 0 ? slides.length : 5,
    totalFragmentsInCurrent: 0,
    ...initial,
  });
  const value: DeckContextValue = {
    state,
    dispatch: dispatch as Dispatch<DeckAction>,
    slides,
    transition: "fade",
    deckId: "test-deck",
    toggleFullscreen: () => undefined,
    print: () => undefined,
  };
  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
}

describe("<Controls>", () => {
  it("renders Previous and Next buttons", () => {
    const { getByLabelText } = render(
      <Harness>
        <Controls />
      </Harness>,
    );
    expect(getByLabelText("Previous slide")).toBeTruthy();
    expect(getByLabelText("Next slide")).toBeTruthy();
  });

  it("Previous button disabled at index 0", () => {
    const { getByLabelText } = render(
      <Harness initial={{ currentIndex: 0, totalSlides: 5 }}>
        <Controls />
      </Harness>,
    );
    const prev = getByLabelText("Previous slide") as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
  });

  it("Next button disabled at last index", () => {
    const { getByLabelText } = render(
      <Harness initial={{ currentIndex: 4, totalSlides: 5 }}>
        <Controls />
      </Harness>,
    );
    const next = getByLabelText("Next slide") as HTMLButtonElement;
    expect(next.disabled).toBe(true);
  });

  it("click Next dispatches NEXT_SLIDE", () => {
    const { getByLabelText, container } = render(
      <Harness initial={{ currentIndex: 0, totalSlides: 5 }}>
        <Controls />
      </Harness>,
    );
    fireEvent.click(getByLabelText("Next slide"));
    expect(container.querySelector(".theo-slide-deck-controls-indicator")?.textContent).toBe(
      "2 / 5",
    );
  });

  it("click Previous dispatches PREV_SLIDE", () => {
    const { getByLabelText, container } = render(
      <Harness initial={{ currentIndex: 2, totalSlides: 5 }}>
        <Controls />
      </Harness>,
    );
    fireEvent.click(getByLabelText("Previous slide"));
    expect(container.querySelector(".theo-slide-deck-controls-indicator")?.textContent).toBe(
      "2 / 5",
    );
  });

  it("indicator shows 'N / Total' format", () => {
    const { container } = render(
      <Harness initial={{ currentIndex: 2, totalSlides: 12 }}>
        <Controls />
      </Harness>,
    );
    expect(container.querySelector(".theo-slide-deck-controls-indicator")?.textContent).toBe(
      "3 / 12",
    );
  });

  it("totalSlides=0 renders '0 / 0' safely", () => {
    const { container } = render(
      <Harness initial={{ currentIndex: 0, totalSlides: 0 }}>
        <Controls />
      </Harness>,
    );
    expect(container.querySelector(".theo-slide-deck-controls-indicator")?.textContent).toBe(
      "0 / 0",
    );
  });
});

describe("<ProgressBar>", () => {
  it("renders progress element", () => {
    const { container } = render(
      <Harness>
        <ProgressBar />
      </Harness>,
    );
    expect(container.querySelector("progress")).toBeTruthy();
  });

  it("value reflects currentIndex", () => {
    const { container } = render(
      <Harness initial={{ currentIndex: 2, totalSlides: 5 }}>
        <ProgressBar />
      </Harness>,
    );
    const p = container.querySelector("progress") as HTMLProgressElement;
    expect(p.value).toBe(3);
    expect(p.max).toBe(5);
  });

  it("totalSlides=0 renders progress safely (value=0, max=1)", () => {
    const { container } = render(
      <Harness initial={{ currentIndex: 0, totalSlides: 0 }}>
        <ProgressBar />
      </Harness>,
    );
    const p = container.querySelector("progress") as HTMLProgressElement;
    expect(p.value).toBe(0);
  });
});

describe("<SlideNumber>", () => {
  it("renders 'N / Total' text", () => {
    const { container } = render(
      <Harness initial={{ currentIndex: 2, totalSlides: 12 }}>
        <SlideNumber />
      </Harness>,
    );
    expect(container.textContent).toContain("3 / 12");
  });

  it("aria-hidden=true (decorative)", () => {
    const { container } = render(
      <Harness initial={{ currentIndex: 0, totalSlides: 5 }}>
        <SlideNumber />
      </Harness>,
    );
    const el = container.querySelector(".theo-slide-deck-slide-number") as HTMLElement;
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders null when totalSlides=0", () => {
    const { container } = render(
      <Harness initial={{ currentIndex: 0, totalSlides: 0 }}>
        <SlideNumber />
      </Harness>,
    );
    expect(container.querySelector(".theo-slide-deck-slide-number")).toBeNull();
  });
});

describe("Context guard", () => {
  it("throws when sub-components used outside SlideDeck", () => {
    // Suppress expected error log.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Controls />)).toThrow(/SlideDeck/);
    spy.mockRestore();
  });
});

// Need to import vi for the last test.
import { vi } from "vitest";
