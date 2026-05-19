import { render } from "@testing-library/react";
import { type Dispatch, useReducer } from "react";
import { describe, expect, it } from "vitest";
import { DeckContext, type DeckContextValue } from "./context.js";
import { PresenterView } from "./presenter-view.js";
import type { SlideDeckSlide } from "./schema.js";
import { type DeckAction, type DeckState, deckReducer } from "./use-deck-state.js";

interface HarnessProps {
  slides: SlideDeckSlide[];
  initial?: Partial<DeckState>;
}

function Harness({ slides, initial = {} }: HarnessProps) {
  const [state, dispatch] = useReducer(deckReducer, {
    currentIndex: 0,
    currentFragment: 0,
    presenterMode: true, // default ON for these tests
    fullscreen: false,
    transitionDirection: "none",
    totalSlides: slides.length,
    totalFragmentsInCurrent: 0,
    ...initial,
  });
  const value: DeckContextValue = {
    state,
    dispatch: dispatch as Dispatch<DeckAction>,
    slides,
    transition: "fade",
    deckId: "test",
    toggleFullscreen: () => undefined,
    print: () => undefined,
  };
  return (
    <DeckContext.Provider value={value}>
      <PresenterView />
    </DeckContext.Provider>
  );
}

describe("<PresenterView>", () => {
  it("renders null when presenterMode is false", () => {
    const slides: SlideDeckSlide[] = [{ markdown: "# A" }];
    const { container } = render(<Harness slides={slides} initial={{ presenterMode: false }} />);
    expect(container.querySelector("[data-theo-slide-deck-presenter]")).toBeNull();
  });

  it("renders panel when presenterMode is true", () => {
    const slides: SlideDeckSlide[] = [{ markdown: "# A" }, { markdown: "# B" }];
    const { container } = render(<Harness slides={slides} />);
    expect(container.querySelector("[data-theo-slide-deck-presenter]")).toBeTruthy();
  });

  it("shows 'End of deck' when no next slide", () => {
    const slides: SlideDeckSlide[] = [{ markdown: "# Only slide" }];
    const { getByText } = render(<Harness slides={slides} initial={{ currentIndex: 0 }} />);
    expect(getByText(/End of deck/i)).toBeTruthy();
  });

  it("renders speaker notes when current slide has them", () => {
    const slides: SlideDeckSlide[] = [{ markdown: "# A", notes: "Remember timing" }];
    const { getByText } = render(<Harness slides={slides} />);
    expect(getByText(/Remember timing/)).toBeTruthy();
  });

  it("no notes section when current slide has none", () => {
    const slides: SlideDeckSlide[] = [{ markdown: "# A" }];
    const { container } = render(<Harness slides={slides} />);
    expect(container.querySelector('[aria-label="Speaker notes"]')).toBeNull();
  });

  it("timer shows initial 00:00", () => {
    const slides: SlideDeckSlide[] = [{ markdown: "# A" }];
    const { getByLabelText } = render(<Harness slides={slides} />);
    expect(getByLabelText("Elapsed time").textContent).toBe("00:00");
  });

  it("renders Current and Next sections (a11y)", () => {
    const slides: SlideDeckSlide[] = [{ markdown: "# A" }, { markdown: "# B" }];
    const { getByLabelText } = render(<Harness slides={slides} />);
    expect(getByLabelText("Current slide preview")).toBeTruthy();
    expect(getByLabelText("Next slide preview")).toBeTruthy();
  });
});
