import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FolderSelector } from "./folder-selector.js";

describe("FolderSelector", () => {
  it("renders the active path", () => {
    render(<FolderSelector path="/home/me/project" />);
    expect(screen.getByText("/home/me/project")).toBeInTheDocument();
  });

  it("forwards click events", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<FolderSelector path="/x" onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies compact sizing when prop set", () => {
    render(<FolderSelector path="/x" compact />);
    expect(screen.getByRole("button").className).toContain("h-8");
  });
});
