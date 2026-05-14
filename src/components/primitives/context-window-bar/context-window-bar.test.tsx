import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContextWindowBar } from "./context-window-bar.js";

describe("ContextWindowBar", () => {
  it("renders used/total ratio with default label", () => {
    render(<ContextWindowBar used={50000} total={200000} />);
    expect(screen.getByText(/Context/i)).toBeInTheDocument();
    expect(screen.getByText(/50\.0k \/ 200\.0k/)).toBeInTheDocument();
    expect(screen.getByText(/\(25%\)/)).toBeInTheDocument();
  });

  it("uses the warning tone above warnAt threshold", () => {
    const { container } = render(
      <ContextWindowBar used={150000} total={200000} warnAt={0.7} dangerAt={0.9} />,
    );
    expect(container.querySelector(".bg-warning")).not.toBeNull();
  });

  it("uses the destructive tone above dangerAt threshold", () => {
    const { container } = render(
      <ContextWindowBar used={195000} total={200000} warnAt={0.7} dangerAt={0.9} />,
    );
    expect(container.querySelector(".bg-destructive")).not.toBeNull();
  });

  it("hides label and numbers in compact mode but keeps the bar", () => {
    render(<ContextWindowBar used={50} total={100} compact />);
    expect(screen.queryByText(/\(50%\)/)).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
  });
});
