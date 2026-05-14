import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type QuickAction, QuickActionChips } from "./quick-action-chips.js";

const actions: QuickAction[] = [
  { id: "write", label: "Write", primary: true },
  { id: "learn", label: "Learn" },
];

describe("QuickActionChips", () => {
  it("renders all actions", () => {
    render(<QuickActionChips actions={actions} />);
    expect(screen.getByRole("button", { name: "Write" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn" })).toBeInTheDocument();
  });

  it("fires onSelect with the action id when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<QuickActionChips actions={actions} onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "Learn" }));
    expect(onSelect).toHaveBeenCalledWith("learn");
  });
});
