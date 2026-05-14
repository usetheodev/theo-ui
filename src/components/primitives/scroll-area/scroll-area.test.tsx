import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollArea } from "./scroll-area.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
/**
 * Note: in happy-dom there is no real layout, so Radix ScrollArea with the
 * default `type="hover"` won't mount a scrollbar (it relies on overflow
 * detection). We pass `type="always"` in the structural tests to force the
 * scrollbar nodes to render and assert against them.
 */
describe("ScrollArea", () => {
  it("renders children inside the viewport", () => {
    render(
      <ScrollArea className="h-40">
        <p>scroll content</p>
      </ScrollArea>,
    );
    expect(screen.getByText("scroll content")).toBeInTheDocument();
  });

  it("renders the vertical scrollbar by default (vertical orientation)", () => {
    const { container } = render(
      <ScrollArea type="always" className="h-40">
        <div className="h-[400px]">tall</div>
      </ScrollArea>,
    );
    expect(container.querySelector('[data-orientation="vertical"]')).not.toBeNull();
    expect(container.querySelector('[data-orientation="horizontal"]')).toBeNull();
  });

  it("renders horizontal-only scrollbar when orientation=horizontal", () => {
    const { container } = render(
      <ScrollArea type="always" orientation="horizontal" className="w-40">
        <div className="w-[400px]">wide</div>
      </ScrollArea>,
    );
    expect(container.querySelector('[data-orientation="horizontal"]')).not.toBeNull();
    expect(container.querySelector('[data-orientation="vertical"]')).toBeNull();
  });

  it("renders both scrollbars when orientation=both", () => {
    const { container } = render(
      <ScrollArea type="always" orientation="both" className="h-40 w-40">
        <div className="h-[400px] w-[400px]">grid</div>
      </ScrollArea>,
    );
    expect(container.querySelector('[data-orientation="vertical"]')).not.toBeNull();
    expect(container.querySelector('[data-orientation="horizontal"]')).not.toBeNull();
  });

  it("applies thin size classes by default", () => {
    const { container } = render(
      <ScrollArea type="always" className="h-40">
        <div className="h-[400px]">tall</div>
      </ScrollArea>,
    );
    const bar = container.querySelector('[data-orientation="vertical"]');
    expect(bar).not.toBeNull();
    expect(bar?.className ?? "").toContain("w-2.5");
  });

  it("applies regular size classes when requested", () => {
    const { container } = render(
      <ScrollArea type="always" size="regular" className="h-40">
        <div className="h-[400px]">tall</div>
      </ScrollArea>,
    );
    const bar = container.querySelector('[data-orientation="vertical"]');
    expect(bar).not.toBeNull();
    expect(bar?.className ?? "").toContain("w-3");
  });

  it("applies custom className on the root", () => {
    const { container } = render(
      <ScrollArea className="custom-scroller h-40">
        <p>x</p>
      </ScrollArea>,
    );
    expect(container.querySelector(".custom-scroller")).not.toBeNull();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(
      <ScrollArea className="h-40">
        <p>scroll content</p>
      </ScrollArea>,
    );
  });

  // MEDIUM-007 / T7.1: ScrollArea.Bar compound pattern.
  it("exposes ScrollArea.Bar as the canonical compound surface", () => {
    expect(ScrollArea.displayName).toBe("ScrollArea");
    expect(ScrollArea.Bar.displayName).toBe("ScrollArea.Bar");
  });
});
