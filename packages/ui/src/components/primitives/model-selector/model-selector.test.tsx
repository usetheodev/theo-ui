import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type ModelOption, ModelSelector } from "./model-selector.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
const options: ModelOption[] = [
  { id: "opus", label: "Opus 4.7", vendor: "Anthropic" },
  { id: "sonnet", label: "Sonnet 4.6", vendor: "Anthropic" },
];

describe("ModelSelector", () => {
  it("renders the current selection label", () => {
    render(<ModelSelector value="opus" options={options} />);
    expect(screen.getByRole("button", { name: /Opus 4\.7/ })).toBeInTheDocument();
  });

  it("opens dropdown and fires onChange when an option is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ModelSelector value="opus" options={options} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /Opus 4\.7/ }));
    await user.click(await screen.findByText("Sonnet 4.6"));
    expect(onChange).toHaveBeenCalledWith("sonnet");
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<ModelSelector value="opus" options={options} />);
  });
});
