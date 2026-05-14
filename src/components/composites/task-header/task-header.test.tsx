import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskHeader } from "./task-header.js";

describe("TaskHeader", () => {
  it("renders the title", () => {
    render(<TaskHeader title="Build pipeline" />);
    expect(screen.getByRole("heading", { name: "Build pipeline" })).toBeInTheDocument();
  });

  it("renders the status badge when status is provided", () => {
    render(<TaskHeader title="Deploy" status="running" />);
    expect(screen.getByText("Running")).toBeInTheDocument();
  });

  it("fires onToggle when the chevron is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<TaskHeader title="Task" onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: /Toggle task details/ }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders the actions slot", () => {
    render(<TaskHeader title="Task" actions={<button type="button">Cancel</button>} />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});
