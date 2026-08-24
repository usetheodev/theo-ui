import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { SlideDeck } from "./slide-deck.js";

const sampleMd = "# Slide A\n\n- item one\n- item two\n\n---\n\n# Slide B\n\nContent two.";

describe("<SlideDeck> accessibility", () => {
  it("has zero axe violations on default render", async () => {
    const { container } = render(<SlideDeck slides={sampleMd} enableHashRouting={false} />);
    await waitFor(() => {
      expect(container.querySelector(".theo-slide-deck-controls-indicator")?.textContent).toBe(
        "1 / 2",
      );
    });
    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  it("has zero axe violations with custom aria-label", async () => {
    const { container } = render(
      <SlideDeck slides={sampleMd} enableHashRouting={false} aria-label="Quarterly review" />,
    );
    await waitFor(() => {
      expect(container.querySelector(".theo-slide-deck-controls-indicator")?.textContent).toBe(
        "1 / 2",
      );
    });
    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  it("has zero axe violations on empty deck", async () => {
    const { container } = render(<SlideDeck slides={[]} enableHashRouting={false} />);
    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  it("deck region carries proper semantic", () => {
    const { container } = render(<SlideDeck slides={sampleMd} aria-label="test" />);
    const deck = container.querySelector("[data-theo-slide-deck]");
    expect(deck?.getAttribute("aria-roledescription")).toBe("slide deck");
    expect(deck?.getAttribute("aria-label")).toBe("test");
  });
});
