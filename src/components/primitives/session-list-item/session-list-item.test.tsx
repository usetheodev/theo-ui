import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SessionListItem } from "./session-list-item.js";

describe("SessionListItem", () => {
  it("renders title and status label", () => {
    render(<SessionListItem title="Build alignment grid" status="running" />);
    expect(screen.getByText("Build alignment grid")).toBeInTheDocument();
    expect(screen.getByLabelText("Running")).toBeInTheDocument();
  });

  it("renders mode pill when mode is provided", () => {
    render(<SessionListItem title="Refactor auth" status="completed" mode="code" />);
    expect(screen.getByText("code")).toBeInTheDocument();
  });

  it("renders timestamp", () => {
    render(<SessionListItem title="Question" status="completed" timestamp="2m ago" />);
    expect(screen.getByText("2m ago")).toBeInTheDocument();
  });

  it("clips unread count at 99+", () => {
    render(<SessionListItem title="x" status="running" unread={250} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("does not render unread when zero", () => {
    render(<SessionListItem title="x" status="completed" unread={0} />);
    expect(screen.queryByText(/^\d+$/)).toBeNull();
  });

  it("exposes aria-current when active", () => {
    render(<SessionListItem title="x" status="running" active />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-current", "true");
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SessionListItem title="x" status="running" onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
