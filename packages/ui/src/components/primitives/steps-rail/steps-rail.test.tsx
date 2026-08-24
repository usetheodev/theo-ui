import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StepsRail } from "./steps-rail.js";

describe("StepsRail", () => {
  it("renders all steps with the title", () => {
    render(
      <StepsRail
        title="STEPS"
        steps={[
          { id: 1, state: "complete" },
          { id: 2, state: "current" },
          { id: 3, state: "pending" },
        ]}
      />,
    );
    expect(screen.getByText("STEPS")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("marks the current step with aria-current=step", () => {
    render(
      <StepsRail
        steps={[
          { id: "a", state: "complete" },
          { id: "b", state: "current" },
        ]}
      />,
    );
    const current = screen.getByText("2");
    expect(current.getAttribute("aria-current")).toBe("step");
  });

  it("falls back to the index label when no custom label is provided", () => {
    render(<StepsRail steps={[{ id: 1 }, { id: 2 }]} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
