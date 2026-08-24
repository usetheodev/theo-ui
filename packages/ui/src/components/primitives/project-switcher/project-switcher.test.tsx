import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProjectSwitcher } from "./project-switcher.js";

describe("ProjectSwitcher", () => {
  it("renders workspace name and branch", () => {
    render(<ProjectSwitcher workspace="acme-web" branch="main" />);
    expect(screen.getByText("acme-web")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();
  });

  it("infers brand from first character of workspace string", () => {
    render(<ProjectSwitcher workspace="acme-web" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("uses provided brand override", () => {
    render(<ProjectSwitcher workspace="acme-web" brand="θ" />);
    expect(screen.getByText("θ")).toBeInTheDocument();
  });

  it("exposes accessible status label", () => {
    render(<ProjectSwitcher workspace="acme-web" status="running" />);
    expect(screen.getByLabelText("Agent running")).toBeInTheDocument();
  });

  it("renders as a button when onClick is provided", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ProjectSwitcher workspace="acme-web" onClick={onClick} />);
    const btn = screen.getByRole("button", { name: /acme-web/ });
    await user.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders as a static element when not clickable", () => {
    render(<ProjectSwitcher workspace="acme-web" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("respects disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ProjectSwitcher workspace="acme-web" onClick={onClick} disabled />);
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
