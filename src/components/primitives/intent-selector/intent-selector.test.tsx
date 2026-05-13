import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileSearch, ListChecks, Pencil } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { IntentSelector } from "./intent-selector.js";

const OPTIONS = [
  { id: "edit", label: "Edit", description: "Make code changes", icon: Pencil },
  { id: "plan", label: "Plan", description: "Plan without executing", icon: ListChecks },
  { id: "review", label: "Review", description: "Analyze the code", icon: FileSearch },
];

describe("IntentSelector", () => {
  it("renders the current option label", () => {
    render(<IntentSelector value="plan" options={OPTIONS} />);
    expect(screen.getByRole("button", { name: /plan/i })).toBeInTheDocument();
  });

  it("opens the menu on click and shows all options", async () => {
    const user = userEvent.setup();
    render(<IntentSelector value="edit" options={OPTIONS} />);
    await user.click(screen.getByRole("button", { name: /edit/i }));
    expect(screen.getByText("Plan")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Plan without executing")).toBeInTheDocument();
  });

  it("calls onChange when an option is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<IntentSelector value="edit" options={OPTIONS} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.click(screen.getByRole("menuitem", { name: /review/i }));
    expect(onChange).toHaveBeenCalledWith("review");
  });

  it("falls back to the first option when value does not match", () => {
    render(<IntentSelector value="unknown" options={OPTIONS} />);
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });
});
