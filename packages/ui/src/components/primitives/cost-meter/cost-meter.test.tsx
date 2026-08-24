import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CostMeter } from "./cost-meter.js";

describe("CostMeter", () => {
  it("renders title and cost in card variant", () => {
    render(<CostMeter cost={4.2} title="Session" />);
    expect(screen.getByText(/Session/i)).toBeInTheDocument();
    expect(screen.getByText(/\$4\.20/)).toBeInTheDocument();
  });

  it("renders compact chip when compact prop set", () => {
    const { container } = render(<CostMeter cost={4.2} budget={50} compact />);
    expect(screen.getByText("$4.20")).toBeInTheDocument();
    expect(container.textContent ?? "").toMatch(/\$50/);
  });

  it("renders progress bar with percent label when budget provided", () => {
    render(<CostMeter cost={25} budget={100} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    expect(screen.getByText(/25% of budget/)).toBeInTheDocument();
  });

  it("marks over-budget state", () => {
    render(<CostMeter cost={120} budget={100} />);
    expect(screen.getByText(/over!/)).toBeInTheDocument();
  });
});
