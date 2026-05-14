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
});
