import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "./switch.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
describe("Switch", () => {
  it("renders a switch with accessible name", () => {
    render(<Switch aria-label="Auto-accept" />);
    expect(screen.getByRole("switch", { name: "Auto-accept" })).toBeInTheDocument();
  });

  it("reflects controlled state", () => {
    render(<Switch aria-label="On" checked />);
    expect(screen.getByRole("switch", { name: "On" })).toHaveAttribute("data-state", "checked");
  });

  it("calls onCheckedChange when toggled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Toggle" onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("ignores click when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Off" disabled onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<Switch aria-label="Auto-accept" />);
  });

  // T1.5 — size prop (theming-and-sizes plan)
  it("applies h-4 w-7 track when size='sm'", () => {
    render(<Switch aria-label="sm" size="sm" />);
    const root = screen.getByRole("switch", { name: "sm" });
    expect(root.className).toContain("h-4");
    expect(root.className).toContain("w-7");
  });

  it("applies h-5 w-9 (default) when size omitted", () => {
    render(<Switch aria-label="md" />);
    const root = screen.getByRole("switch", { name: "md" });
    expect(root.className).toContain("h-5");
    expect(root.className).toContain("w-9");
  });

  it("applies h-6 w-11 track when size='lg'", () => {
    render(<Switch aria-label="lg" size="lg" />);
    const root = screen.getByRole("switch", { name: "lg" });
    expect(root.className).toContain("h-6");
    expect(root.className).toContain("w-11");
  });

  it("applies the thumb translate appropriate for each size", () => {
    render(<Switch aria-label="lg" size="lg" />);
    const root = screen.getByRole("switch", { name: "lg" });
    const thumb = root.querySelector("[data-state]");
    expect(thumb?.className ?? "").toContain("size-5");
    expect(thumb?.className ?? "").toContain("data-[state=checked]:translate-x-5");
  });

  it("has no a11y violations in each size", async () => {
    await expectNoA11yViolations(<Switch aria-label="s" size="sm" />);
    await expectNoA11yViolations(<Switch aria-label="m" size="md" />);
    await expectNoA11yViolations(<Switch aria-label="l" size="lg" />);
  });
});
