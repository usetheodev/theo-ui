import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { MultiSelectPrompt } from "./multi-select-prompt.js";

const OPTIONS = [
  { value: "auto", label: "Auto-scaling", description: "Scale on demand" },
  { value: "spot", label: "Spot instances", description: "Cheaper, interruptible" },
  { value: "reserved", label: "Reserved", description: "Committed capacity" },
];

describe("MultiSelectPrompt", () => {
  it("renders the question, badge, and every option as a checkbox", () => {
    render(
      <MultiSelectPrompt question="Which capacity options?" badge="Scaling" options={OPTIONS} />,
    );
    expect(screen.getByText("Which capacity options?")).toBeInTheDocument();
    expect(screen.getByText("Scaling")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Auto-scaling/ })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Spot instances/ })).toBeInTheDocument();
  });

  it("toggles a value on and off via clicks", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MultiSelectPrompt question="q" options={OPTIONS} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("checkbox", { name: /Spot instances/ }));
    expect(onValueChange).toHaveBeenLastCalledWith(["spot"]);
    await user.click(screen.getByRole("checkbox", { name: /Spot instances/ }));
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it("accumulates multiple selections", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MultiSelectPrompt question="q" options={OPTIONS} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("checkbox", { name: /Auto-scaling/ }));
    await user.click(screen.getByRole("checkbox", { name: /Reserved/ }));
    expect(onValueChange).toHaveBeenLastCalledWith(["auto", "reserved"]);
  });

  it("toggles the Nth option when its number key is pressed", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MultiSelectPrompt question="q" options={OPTIONS} onValueChange={onValueChange} />);
    await user.tab();
    onValueChange.mockClear();
    await user.keyboard("2");
    expect(onValueChange).toHaveBeenLastCalledWith(["spot"]);
  });

  it("includes the Other free-text in the onConfirm payload", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<MultiSelectPrompt question="q" options={OPTIONS} allowOther onConfirm={onConfirm} />);
    await user.click(screen.getByRole("checkbox", { name: /Other/ }));
    await user.type(screen.getByRole("textbox", { name: /Other/i }), "burstable");
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledWith({ values: ["__theo_other__"], otherText: "burstable" });
  });

  it("shows a preview block for each selected option", async () => {
    const user = userEvent.setup();
    const withPreview = [
      { value: "a", label: "Option A", preview: "PREVIEW-A" },
      { value: "b", label: "Option B", preview: "PREVIEW-B" },
    ];
    render(<MultiSelectPrompt question="q" options={withPreview} defaultValue={["a"]} />);
    expect(screen.getByText("PREVIEW-A")).toBeInTheDocument();
    expect(screen.queryByText("PREVIEW-B")).toBeNull();
    await user.click(screen.getByRole("checkbox", { name: /Option B/ }));
    expect(screen.getByText("PREVIEW-A")).toBeInTheDocument();
    expect(screen.getByText("PREVIEW-B")).toBeInTheDocument();
  });

  it("fires onConfirm with the selected values and onCancel", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <MultiSelectPrompt
        question="q"
        options={OPTIONS}
        defaultValue={["auto", "reserved"]}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledWith({ values: ["auto", "reserved"] });
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables Confirm until at least one option is selected", () => {
    render(<MultiSelectPrompt question="q" options={OPTIONS} onConfirm={() => undefined} />);
    expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(
      <MultiSelectPrompt
        question="Which capacity options?"
        badge="Scaling"
        options={OPTIONS}
        allowOther
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
  });
});
