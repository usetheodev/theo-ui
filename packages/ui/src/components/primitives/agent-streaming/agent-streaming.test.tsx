import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LiveRegionProvider } from "../../../lib/live-region-context.js";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { AgentStreaming } from "./agent-streaming.js";

describe("AgentStreaming", () => {
  it("renders the default thinking placeholder", () => {
    render(<AgentStreaming />);
    expect(screen.getByText("thinking…")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders the partial text when provided", () => {
    render(<AgentStreaming partial="On it. I'll inspect the…" />);
    expect(screen.getByText(/On it. I'll inspect/)).toBeInTheDocument();
    expect(screen.queryByText("thinking…")).toBeNull();
  });

  it("renders the model chip when provided", () => {
    render(<AgentStreaming model="Opus 4.7" />);
    expect(screen.getByText("Opus 4.7")).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<AgentStreaming />);
  });

  it("standalone has role=status and aria-live=polite", () => {
    render(<AgentStreaming />);
    const region = screen.getByRole("status");
    expect(region.getAttribute("aria-live")).toBe("polite");
  });

  it("nested in LiveRegionProvider omits its own role + aria-live (T4.1, MF-4)", () => {
    const { container } = render(
      <LiveRegionProvider value={true}>
        <AgentStreaming partial="hi" />
      </LiveRegionProvider>,
    );
    // The outer wrapper inside the component should NOT carry role=status
    // or aria-live, because the parent live region (provided by ancestor)
    // is the single announcement source.
    const wrappers = container.querySelectorAll("div[aria-label='Agent is responding']");
    expect(wrappers.length).toBe(1);
    const wrapper = wrappers[0] as HTMLElement;
    expect(wrapper.getAttribute("role")).toBeNull();
    expect(wrapper.getAttribute("aria-live")).toBeNull();
  });
});
