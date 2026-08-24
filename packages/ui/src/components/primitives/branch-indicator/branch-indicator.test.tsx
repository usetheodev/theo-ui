import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BranchIndicator } from "./branch-indicator.js";

describe("BranchIndicator", () => {
  it("renders null when branchCount is 1", () => {
    const { container } = render(<BranchIndicator branchCount={1} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders pill when branchCount is >= 2", () => {
    render(<BranchIndicator branchCount={2} />);
    expect(screen.getByTestId("branch-indicator").textContent).toBe("×2");
  });

  it("renders ×N for arbitrary count", () => {
    render(<BranchIndicator branchCount={7} />);
    expect(screen.getByTestId("branch-indicator").textContent).toBe("×7");
  });

  // EC-10: guard zero / negative / non-integer
  for (const invalid of [-1, 0, 0.5, Number.NaN]) {
    it(`renders null for branchCount=${invalid}`, () => {
      const { container } = render(<BranchIndicator branchCount={invalid} />);
      expect(container.firstChild).toBeNull();
    });
  }

  it("uses custom tooltipText when provided", () => {
    render(<BranchIndicator branchCount={3} tooltipText="Retried twice" />);
    expect(screen.getByTestId("branch-indicator")).toHaveAttribute("title", "Retried twice");
  });
});
