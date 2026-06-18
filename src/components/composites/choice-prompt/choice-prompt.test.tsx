import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { ChoicePrompt } from "./choice-prompt.js";

const OPTIONS = [
  { value: "blue-green", label: "Blue-green", description: "Zero downtime, 2x infra cost" },
  { value: "rolling", label: "Rolling", description: "Gradual, no cost spike" },
  { value: "recreate", label: "Recreate", description: "Cheapest, brief downtime" },
];

describe("ChoicePrompt", () => {
  it("renders the question, badge, and every option label + description", () => {
    render(
      <ChoicePrompt
        question="Which deploy strategy?"
        badge="Deploy"
        description="Pick how the new version rolls out."
        options={OPTIONS}
      />,
    );
    expect(screen.getByText("Which deploy strategy?")).toBeInTheDocument();
    expect(screen.getByText("Deploy")).toBeInTheDocument();
    expect(screen.getByText("Pick how the new version rolls out.")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Blue-green/ })).toBeInTheDocument();
    expect(screen.getByText("Zero downtime, 2x infra cost")).toBeInTheDocument();
  });

  it("calls onValueChange with the option value when an option is clicked", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ChoicePrompt question="q" options={OPTIONS} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("radio", { name: /Rolling/ }));
    expect(onValueChange).toHaveBeenCalledWith("rolling");
  });

  it("selects the Nth option when its number key is pressed", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ChoicePrompt question="q" options={OPTIONS} onValueChange={onValueChange} />);
    // Move focus into the card (Tab lands on the radiogroup), then press "2".
    await user.tab();
    onValueChange.mockClear();
    await user.keyboard("2");
    expect(onValueChange).toHaveBeenCalledWith("rolling");
  });

  it("does not hijack number keys typed into the Other text field", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ChoicePrompt question="q" options={OPTIONS} allowOther onValueChange={onValueChange} />,
    );
    await user.click(screen.getByRole("radio", { name: /Other/ }));
    onValueChange.mockClear();
    const input = screen.getByRole("textbox", { name: /Other/i });
    await user.type(input, "3 replicas");
    // Typing "3" inside the field must not re-select option #3.
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("3 replicas");
  });

  it("reveals the Other free-text input only after the Other option is selected", async () => {
    const user = userEvent.setup();
    const onOtherTextChange = vi.fn();
    render(
      <ChoicePrompt
        question="q"
        options={OPTIONS}
        allowOther
        onOtherTextChange={onOtherTextChange}
      />,
    );
    expect(screen.queryByRole("textbox", { name: /Other/i })).toBeNull();
    await user.click(screen.getByRole("radio", { name: /Other/ }));
    const input = screen.getByRole("textbox", { name: /Other/i });
    await user.type(input, "canary");
    expect(onOtherTextChange).toHaveBeenLastCalledWith("canary");
  });

  it("shows the selected option's preview in a side-by-side pane", async () => {
    const user = userEvent.setup();
    const withPreview = [
      { value: "a", label: "Option A", preview: "PREVIEW-A" },
      { value: "b", label: "Option B", preview: "PREVIEW-B" },
    ];
    render(<ChoicePrompt question="q" options={withPreview} defaultValue="a" />);
    expect(screen.getByText("PREVIEW-A")).toBeInTheDocument();
    expect(screen.queryByText("PREVIEW-B")).toBeNull();
    await user.click(screen.getByRole("radio", { name: /Option B/ }));
    expect(screen.getByText("PREVIEW-B")).toBeInTheDocument();
  });

  it("fires onConfirm with the selected value and onCancel on the respective buttons", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ChoicePrompt
        question="q"
        options={OPTIONS}
        defaultValue="rolling"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledWith({ value: "rolling" });
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("includes the typed Other text in the onConfirm payload", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ChoicePrompt question="q" options={OPTIONS} allowOther onConfirm={onConfirm} />);
    await user.click(screen.getByRole("radio", { name: /Other/ }));
    await user.type(screen.getByRole("textbox", { name: /Other/i }), "spot fleet");
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledWith({ value: "__theo_other__", otherText: "spot fleet" });
  });

  it("disables Confirm until something is selected", () => {
    render(<ChoicePrompt question="q" options={OPTIONS} onConfirm={() => undefined} />);
    expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(
      <ChoicePrompt
        question="Which deploy strategy?"
        badge="Deploy"
        options={OPTIONS}
        allowOther
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
  });
});
