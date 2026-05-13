import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RadioGroup } from "./radio-group.js";

describe("RadioGroup", () => {
  it("renders each item as a radio with accessible name", () => {
    render(
      <RadioGroup defaultValue="a" aria-label="Plan">
        <RadioGroup.Item value="a" id="a" aria-label="A" />
        <RadioGroup.Item value="b" id="b" aria-label="B" />
      </RadioGroup>,
    );
    expect(screen.getByRole("radio", { name: "A" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "B" })).toBeInTheDocument();
  });

  it("checks the controlled value on mount", () => {
    render(
      <RadioGroup value="b" aria-label="Plan">
        <RadioGroup.Item value="a" aria-label="A" />
        <RadioGroup.Item value="b" aria-label="B" />
      </RadioGroup>,
    );
    expect(screen.getByRole("radio", { name: "B" })).toHaveAttribute("data-state", "checked");
    expect(screen.getByRole("radio", { name: "A" })).toHaveAttribute("data-state", "unchecked");
  });

  it("calls onValueChange when an item is selected", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioGroup defaultValue="a" onValueChange={onValueChange} aria-label="Plan">
        <RadioGroup.Item value="a" aria-label="A" />
        <RadioGroup.Item value="b" aria-label="B" />
      </RadioGroup>,
    );
    await user.click(screen.getByRole("radio", { name: "B" }));
    expect(onValueChange).toHaveBeenCalledWith("b");
  });
});
