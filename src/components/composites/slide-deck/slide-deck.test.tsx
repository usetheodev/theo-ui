import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SlidePlugin } from "../../primitives/slide/index.js";
import type { SlideDeckSlide } from "./schema.js";
import { SlideDeck } from "./slide-deck.js";

const sampleMd = "# Slide A\n\n---\n\n# Slide B\n\n---\n\n# Slide C";

describe("<SlideDeck>", () => {
  it("renders the deck region with aria-roledescription", () => {
    const { container } = render(<SlideDeck slides={sampleMd} />);
    const deck = container.querySelector("[data-theo-slide-deck]");
    expect(deck).toBeTruthy();
    expect(deck?.getAttribute("aria-roledescription")).toBe("slide deck");
  });

  it("renders multi-slide deck splitting on top-level ---", async () => {
    const { container } = render(<SlideDeck slides={sampleMd} />);
    await waitFor(() => {
      const indicator = container.querySelector(".theo-slide-deck-controls-indicator");
      expect(indicator?.textContent).toBe("1 / 3");
    });
  });

  it("accepts SlideDeckSlide[] prop", async () => {
    const slides: SlideDeckSlide[] = [{ markdown: "# A" }, { markdown: "# B" }];
    const { container } = render(<SlideDeck slides={slides} />);
    await waitFor(() => {
      const indicator = container.querySelector(".theo-slide-deck-controls-indicator");
      expect(indicator?.textContent).toBe("1 / 2");
    });
  });

  it("keyboard ArrowRight advances slide", async () => {
    const { container } = render(<SlideDeck slides={sampleMd} />);
    await waitFor(() => {
      expect(container.querySelector(".theo-slide-deck-controls-indicator")?.textContent).toBe(
        "1 / 3",
      );
    });
    fireEvent.keyDown(document, { key: "ArrowRight" });
    await waitFor(() => {
      expect(container.querySelector(".theo-slide-deck-controls-indicator")?.textContent).toBe(
        "2 / 3",
      );
    });
  });

  it("aria-live region announces 'Slide N of M'", async () => {
    const { container } = render(<SlideDeck slides={sampleMd} />);
    await waitFor(() => {
      const status = container.querySelector('[role="status"]');
      expect(status?.textContent).toBe("Slide 1 of 3");
    });
  });

  it("empty deck renders without crashing + shows 'Empty deck'", () => {
    const { container } = render(<SlideDeck slides={[]} />);
    expect(container.querySelector("[data-theo-slide-deck-empty]")).toBeTruthy();
    expect(container.textContent).toContain("Empty deck");
  });

  it("initialIndex respected", async () => {
    const { container } = render(
      <SlideDeck slides={sampleMd} initialIndex={2} enableHashRouting={false} />,
    );
    await waitFor(() => {
      expect(container.querySelector(".theo-slide-deck-controls-indicator")?.textContent).toBe(
        "3 / 3",
      );
    });
  });

  it("onIndexChange callback fires on navigation", async () => {
    const onIndexChange = vi.fn();
    const { container } = render(
      <SlideDeck slides={sampleMd} onIndexChange={onIndexChange} enableHashRouting={false} />,
    );
    // Wait for parse to finish (indicator shows correct total).
    await waitFor(() => {
      expect(container.querySelector(".theo-slide-deck-controls-indicator")?.textContent).toBe(
        "1 / 3",
      );
    });
    fireEvent.keyDown(document, { key: "ArrowRight" });
    await waitFor(() => {
      expect(onIndexChange).toHaveBeenCalled();
    });
    const lastCall = onIndexChange.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe(1);
    expect(lastCall?.[1]?.markdown).toContain("Slide B");
  });

  it("renders default layout when no children", async () => {
    const { container } = render(<SlideDeck slides={sampleMd} />);
    await waitFor(() => {
      expect(container.querySelector(".theo-slide-deck-default-layout")).toBeTruthy();
      expect(container.querySelector("[data-theo-slide-deck-controls]")).toBeTruthy();
    });
  });

  it("renders custom (headless) layout when children provided", async () => {
    const { container } = render(
      <SlideDeck slides={sampleMd} enableHashRouting={false}>
        <div data-custom-chrome="true">
          <SlideDeck.Controls />
        </div>
      </SlideDeck>,
    );
    await waitFor(() => {
      expect(container.querySelector("[data-custom-chrome]")).toBeTruthy();
      expect(container.querySelector(".theo-slide-deck-default-layout")).toBeNull();
    });
  });

  it("EC-4: slides prop shrinks below currentIndex → clamps to last", async () => {
    const slides1: SlideDeckSlide[] = [
      { markdown: "# A" },
      { markdown: "# B" },
      { markdown: "# C" },
      { markdown: "# D" },
      { markdown: "# E" },
    ];
    const { container, rerender } = render(
      <SlideDeck slides={slides1} initialIndex={4} enableHashRouting={false} />,
    );
    await waitFor(() => {
      expect(container.querySelector(".theo-slide-deck-controls-indicator")?.textContent).toBe(
        "5 / 5",
      );
    });
    const slides2: SlideDeckSlide[] = [{ markdown: "# A" }, { markdown: "# B" }];
    rerender(<SlideDeck slides={slides2} initialIndex={4} enableHashRouting={false} />);
    await waitFor(() => {
      expect(container.querySelector(".theo-slide-deck-controls-indicator")?.textContent).toBe(
        "2 / 2",
      );
    });
  });

  it("data-theo-slide-deck-fullscreen attribute reflects state", () => {
    const { container } = render(<SlideDeck slides={sampleMd} />);
    const deck = container.querySelector("[data-theo-slide-deck]") as HTMLElement;
    // Initially not fullscreen.
    expect(deck.getAttribute("data-theo-slide-deck-fullscreen")).toBeNull();
  });

  it("aria-label propagates", () => {
    const { getByLabelText } = render(
      <SlideDeck slides={sampleMd} aria-label="Quarterly review deck" />,
    );
    expect(getByLabelText("Quarterly review deck")).toBeTruthy();
  });

  it("plugins prop relayed to every internal <Slide> (T0.3 / D15)", async () => {
    const calls: string[] = [];
    const plugin: SlidePlugin = {
      name: "spy",
      mdastTransform: (tree) => {
        calls.push("called");
        // rename h1 → h2 so we can observe per slide
        for (const node of tree.children) {
          if (node.type === "heading" && node.depth === 1) {
            node.depth = 2 as 1 | 2 | 3 | 4 | 5 | 6;
          }
        }
        return tree;
      },
    };
    const slides: SlideDeckSlide[] = [{ markdown: "# one" }, { markdown: "# two" }];
    const { container } = render(<SlideDeck slides={slides} plugins={[plugin]} />);
    await waitFor(() => {
      expect(container.querySelector("h2")?.textContent).toContain("one");
    });
    expect(calls.length).toBeGreaterThan(0);
    expect(container.querySelector("h1")).toBeFalsy();
  });
});
