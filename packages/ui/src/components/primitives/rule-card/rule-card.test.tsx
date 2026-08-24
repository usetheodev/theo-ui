import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Rule } from "../../../types/rule.js";
import { RuleCard } from "./rule-card.js";

const rule: Rule = {
  id: "r1",
  title: "Always write tests before fixes",
  body: "When fixing a bug, first write a failing regression test, then the fix.",
  scope: "global",
  state: "enabled",
  tags: ["testing"],
  updatedAt: "2d ago",
};

describe("RuleCard", () => {
  it("renders title, body preview, scope and tags", () => {
    render(<RuleCard rule={rule} />);
    expect(screen.getByText(rule.title)).toBeInTheDocument();
    expect(screen.getByText(/failing regression test/)).toBeInTheDocument();
    expect(screen.getByText("Global")).toBeInTheDocument();
    expect(screen.getByText("testing")).toBeInTheDocument();
  });

  it("calls onSelect when the card body is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<RuleCard rule={rule} onSelect={onSelect} />);
    await user.click(screen.getByText(rule.title));
    expect(onSelect).toHaveBeenCalledWith("r1");
  });

  it("calls onEdit when the pencil button is clicked and stops propagation", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onEdit = vi.fn();
    render(<RuleCard rule={rule} onSelect={onSelect} onEdit={onEdit} />);
    await user.click(screen.getByRole("button", { name: "Edit rule" }));
    expect(onEdit).toHaveBeenCalledWith("r1");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("toggles state via onToggle", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<RuleCard rule={rule} onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: "Disable rule" }));
    expect(onToggle).toHaveBeenCalledWith("r1", "disabled");
  });

  it("renders the delete button only when onDelete is provided", () => {
    const { rerender } = render(<RuleCard rule={rule} />);
    expect(screen.queryByRole("button", { name: "Delete rule" })).toBeNull();
    rerender(<RuleCard rule={rule} onDelete={() => undefined} />);
    expect(screen.getByRole("button", { name: "Delete rule" })).toBeInTheDocument();
  });
});
