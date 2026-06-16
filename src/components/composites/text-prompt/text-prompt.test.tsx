import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { TextPrompt } from "./text-prompt.js";

describe("TextPrompt", () => {
  it("renders the question, badge, and a single-line field by default", () => {
    render(<TextPrompt question="What should we name the service?" badge="Naming" />);
    expect(screen.getByText("What should we name the service?")).toBeInTheDocument();
    expect(screen.getByText("Naming")).toBeInTheDocument();
    const field = screen.getByRole("textbox", { name: /What should we name the service\?/ });
    expect(field.tagName).toBe("INPUT");
  });

  it("calls onValueChange as the user types", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TextPrompt question="q" onValueChange={onValueChange} />);
    await user.type(screen.getByRole("textbox", { name: /q/ }), "api");
    expect(onValueChange).toHaveBeenLastCalledWith("api");
  });

  it("renders a textarea when multiline is set", () => {
    render(<TextPrompt question="Describe the change" multiline />);
    expect(screen.getByRole("textbox", { name: /Describe the change/ }).tagName).toBe("TEXTAREA");
  });

  it("fires onConfirm with the typed text and onCancel", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<TextPrompt question="q" onConfirm={onConfirm} onCancel={onCancel} />);
    await user.type(screen.getByRole("textbox", { name: /q/ }), "payments");
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledWith({ text: "payments" });
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables Confirm while required and empty, enables after typing", async () => {
    const user = userEvent.setup();
    render(<TextPrompt question="q" required onConfirm={() => undefined} />);
    const confirm = screen.getByRole("button", { name: /confirm/i });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: /q/ }), "x");
    expect(confirm).toBeEnabled();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(
      <TextPrompt
        question="What should we name the service?"
        badge="Naming"
        description="Lowercase, no spaces."
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
  });
});
