import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { ConfirmPrompt } from "./confirm-prompt.js";

describe("ConfirmPrompt", () => {
  it("renders the question, badge, and default Confirm/Cancel buttons", () => {
    render(<ConfirmPrompt question="Deploy to production?" badge="Deploy" />);
    expect(screen.getByText("Deploy to production?")).toBeInTheDocument();
    expect(screen.getByText("Deploy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("uses custom button labels when provided", () => {
    render(
      <ConfirmPrompt question="Delete the cluster?" confirmLabel="Delete" cancelLabel="Keep it" />,
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep it" })).toBeInTheDocument();
  });

  it("fires onConfirm and onCancel on the respective buttons", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmPrompt question="q" onConfirm={onConfirm} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders a destructive confirm action when variant=destructive", () => {
    render(
      <ConfirmPrompt
        question="Delete the cluster?"
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("alertdialog", { name: "Delete the cluster?" })).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(
      <ConfirmPrompt
        question="Deploy to production?"
        badge="Deploy"
        description="This rolls out v2.3.0 to all regions."
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
  });
});
