import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { ApprovalModeSelector } from "./approval-mode-selector.js";

describe("ApprovalModeSelector", () => {
  it("reflects the current value in the trigger", () => {
    render(<ApprovalModeSelector value="auto-edits" onChange={() => {}} />);
    expect(screen.getByRole("button")).toHaveTextContent("Auto-approve edits");
  });

  it("offers the three approval modes when opened", async () => {
    const user = userEvent.setup();
    render(<ApprovalModeSelector value="ask" onChange={() => {}} />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("menuitem", { name: /Ask for approval/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Auto-approve edits/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Read-only/ })).toBeInTheDocument();
  });

  it("emits onChange with the picked mode", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ApprovalModeSelector value="ask" onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /Read-only/ }));
    expect(onChange).toHaveBeenCalledWith("readonly");
  });

  it("exposes a data-slot", () => {
    const { container } = render(<ApprovalModeSelector value="ask" onChange={() => {}} />);
    expect(container.querySelector('[data-slot="approval-mode-selector"]')).not.toBeNull();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<ApprovalModeSelector value="ask" onChange={() => {}} />);
  });
});
