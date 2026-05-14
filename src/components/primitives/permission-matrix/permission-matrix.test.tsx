import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PermissionMatrix, type PermissionRule } from "./permission-matrix.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
const rules: PermissionRule[] = [
  { id: "r1", tool: "Bash", path: "*", decision: "ask", note: "Confirm before running" },
  { id: "r2", tool: "Write", path: "src/**", decision: "allow" },
];

describe("PermissionMatrix", () => {
  it("renders the rules", () => {
    render(<PermissionMatrix rules={rules} />);
    expect(screen.getByText("Bash")).toBeInTheDocument();
    expect(screen.getByText("src/**")).toBeInTheDocument();
  });

  it("cycles a rule's decision when its pill is clicked", async () => {
    const user = userEvent.setup();
    const onDecisionChange = vi.fn();
    render(<PermissionMatrix rules={rules} onDecisionChange={onDecisionChange} />);
    await user.click(screen.getByRole("button", { name: /allow/i }));
    expect(onDecisionChange).toHaveBeenCalledWith("r2", "ask");
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<PermissionMatrix rules={rules} />);
  });

  // MEDIUM-003 / T6.7.1: native `<input>` and `<select>` inside the matrix
  // must use the same design-system tokens as Input/Select primitives.
  // This catches drift where someone refactors Input styling and forgets to
  // mirror the same tokens here.
  it("native input + select carry design-system tokens (no drift vs Input/Select)", () => {
    const { container } = render(
      <PermissionMatrix
        rules={rules}
        toolOptions={["bash", "edit"]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const pathInput = container.querySelector("input[placeholder]");
    const toolSelect = container.querySelector("select");
    expect(pathInput?.className ?? "").toMatch(/border-input/);
    expect(toolSelect?.className ?? "").toMatch(/border-input/);
    expect(pathInput?.className ?? "").toMatch(/font-mono/);
    expect(toolSelect?.className ?? "").toMatch(/font-mono/);
    expect(pathInput?.className ?? "").toMatch(/ring/);
  });
});
