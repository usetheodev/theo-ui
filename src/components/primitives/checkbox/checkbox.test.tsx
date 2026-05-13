import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./checkbox.js";

describe("Checkbox", () => {
  it("renders with role=checkbox", () => {
    render(<Checkbox aria-label="Accept" />);
    expect(screen.getByRole("checkbox", { name: "Accept" })).toBeInTheDocument();
  });

  it("reflects controlled checked state", () => {
    render(<Checkbox aria-label="On" checked />);
    expect(screen.getByRole("checkbox", { name: "On" })).toHaveAttribute("data-state", "checked");
  });

  it("supports indeterminate via tri-state", () => {
    render(<Checkbox aria-label="Partial" checked="indeterminate" />);
    expect(screen.getByRole("checkbox", { name: "Partial" })).toHaveAttribute(
      "data-state",
      "indeterminate",
    );
  });

  it("calls onCheckedChange on click", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="Toggle" onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole("checkbox"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("does not fire onChange when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="Off" disabled onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole("checkbox"));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
