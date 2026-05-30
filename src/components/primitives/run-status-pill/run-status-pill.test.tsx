import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type RunStatus, RunStatusPill } from "./run-status-pill.js";

describe("RunStatusPill", () => {
  const cases: Array<{ status: RunStatus; label: string }> = [
    { status: "queued", label: "Queued" },
    { status: "in_progress", label: "In progress" },
    { status: "finished", label: "Done" },
    { status: "error", label: "Error" },
    { status: "cancelled", label: "Cancelled" },
    { status: "interrupted", label: "Interrupted" },
  ];

  for (const c of cases) {
    it(`renders the right label for ${c.status}`, () => {
      render(<RunStatusPill status={c.status} />);
      expect(screen.getByText(c.label)).toBeInTheDocument();
      expect(screen.getByTestId("run-status-pill")).toHaveAttribute("data-status", c.status);
    });
  }

  it("animates the spinner only when status is in_progress", () => {
    const { rerender } = render(<RunStatusPill status="in_progress" />);
    expect(screen.getByTestId("run-status-pill").querySelector("svg")?.className).toContain(
      "animate-spin",
    );
    rerender(<RunStatusPill status="finished" />);
    expect(screen.getByTestId("run-status-pill").querySelector("svg")?.className).not.toContain(
      "animate-spin",
    );
  });

  it("renders detail text when provided", () => {
    render(<RunStatusPill status="finished" detail="3.2s · 1.4k tokens" />);
    expect(screen.getByTestId("run-status-detail").textContent).toContain("3.2s · 1.4k tokens");
  });
});
