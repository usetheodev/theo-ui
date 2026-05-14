import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select } from "./select.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
function Example({ onValueChange }: { onValueChange?: (v: string) => void }) {
  return (
    <Select onValueChange={onValueChange}>
      <Select.Trigger aria-label="Region">
        <Select.Value placeholder="Pick a region" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="iad1">Washington (iad1)</Select.Item>
        <Select.Item value="gru1">São Paulo (gru1)</Select.Item>
      </Select.Content>
    </Select>
  );
}

describe("Select", () => {
  it("renders placeholder when no value", () => {
    render(<Example />);
    expect(screen.getByText("Pick a region")).toBeInTheDocument();
  });

  it("opens the menu on trigger click", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByLabelText("Region"));
    expect(screen.getByRole("option", { name: /Washington/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /São Paulo/ })).toBeInTheDocument();
  });

  it("calls onValueChange when an option is selected", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await user.click(screen.getByLabelText("Region"));
    await user.click(screen.getByRole("option", { name: /São Paulo/ }));
    expect(onValueChange).toHaveBeenCalledWith("gru1");
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<Example />);
  });
});
