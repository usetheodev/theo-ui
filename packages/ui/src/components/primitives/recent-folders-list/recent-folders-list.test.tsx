import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type RecentFolder, RecentFoldersList } from "./recent-folders-list.js";

const folders: RecentFolder[] = [
  { id: "1", name: "monorepo", path: "/work/monorepo", active: true },
  { id: "2", name: "docs", path: "/work/docs" },
];

describe("RecentFoldersList", () => {
  it("renders title, folder names, and paths", () => {
    render(<RecentFoldersList folders={folders} />);
    expect(screen.getByText(/Recent folders/i)).toBeInTheDocument();
    expect(screen.getByText("monorepo")).toBeInTheDocument();
    expect(screen.getByText("/work/monorepo")).toBeInTheDocument();
    expect(screen.getByText("docs")).toBeInTheDocument();
  });

  it("calls onSelect with the folder id when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<RecentFoldersList folders={folders} onSelect={onSelect} />);
    await user.click(screen.getByText("docs"));
    expect(onSelect).toHaveBeenCalledWith("2");
  });
});
