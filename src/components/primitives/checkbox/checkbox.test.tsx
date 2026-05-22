import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./checkbox.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
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

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<Checkbox aria-label="Accept" />);
  });

  // T1.4 — size prop (theming-and-sizes plan)
  it("applies size-3.5 + expanded tap target when size='sm'", () => {
    render(<Checkbox aria-label="sm" size="sm" />);
    const box = screen.getByRole("checkbox", { name: "sm" });
    expect(box.className).toContain("size-3.5");
    expect(box.className).toContain("before:inset-[-5px]");
  });

  it("applies size-4 (16px) when size omitted (default md)", () => {
    render(<Checkbox aria-label="md" />);
    expect(screen.getByRole("checkbox", { name: "md" }).className).toContain("size-4");
  });

  it("applies size-5 when size='lg'", () => {
    render(<Checkbox aria-label="lg" size="lg" />);
    expect(screen.getByRole("checkbox", { name: "lg" }).className).toContain("size-5");
  });

  it("has no a11y violations in each size", async () => {
    await expectNoA11yViolations(<Checkbox aria-label="s" size="sm" />);
    await expectNoA11yViolations(<Checkbox aria-label="m" size="md" />);
    await expectNoA11yViolations(<Checkbox aria-label="l" size="lg" />);
  });
});
