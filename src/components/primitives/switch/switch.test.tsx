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
});
