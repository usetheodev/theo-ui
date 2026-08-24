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

  // M3: tiles layout (build-intent grid).
  it("tiles layout renders a button per option (no dropdown)", () => {
    render(<IntentSelector layout="tiles" value="edit" options={OPTIONS} />);
    expect(screen.getByRole("button", { name: /Edit/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Plan/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Review/ })).toBeInTheDocument();
    // all three visible at once (grid), unlike the menu which needs opening
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("tiles layout emits onChange on tile click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<IntentSelector layout="tiles" value="edit" options={OPTIONS} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /Plan/ }));
    expect(onChange).toHaveBeenCalledWith("plan");
  });

  it("menu layout is unchanged (regression)", () => {
    render(<IntentSelector value="edit" options={OPTIONS} />);
    // menu renders a single trigger button
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  // 1.2.0: per-tile icon-chip color override (build-intent tiles with distinct hues).
  it("tiles layout applies per-option tileClassName to the icon chip", () => {
    const withColor = [
      { id: "edit", label: "Edit", icon: Pencil, tileClassName: "bg-sky-500/15 text-sky-400" },
      { id: "plan", label: "Plan", icon: ListChecks },
    ];
    const { container } = render(
      <IntentSelector layout="tiles" value="edit" options={withColor} />,
    );
    // the overridden option's chip uses the custom classes
    const chip = container.querySelector(".bg-sky-500\\/15");
    expect(chip).not.toBeNull();
    expect(chip).toHaveClass("text-sky-400");
    // an option without an override keeps the default primary chip
    expect(container.querySelector(".bg-primary\\/15")).not.toBeNull();
  });

  it("tiles layout defaults the chip to primary when no tileClassName is set", () => {
    const { container } = render(<IntentSelector layout="tiles" value="edit" options={OPTIONS} />);
    // no overrides → every chip is the default primary tint
    expect(container.querySelectorAll(".bg-primary\\/15")).toHaveLength(OPTIONS.length);
    expect(container.querySelector(".bg-sky-500\\/15")).toBeNull();
  });
});
