import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FolderContextCard, type FolderEntry } from "./folder-context-card.js";

const entries: FolderEntry[] = [
  {
    id: "src",
    name: "src",
    kind: "folder",
    open: true,
    children: [{ id: "index", name: "index.ts", kind: "file" }],
  },
  { id: "readme", name: "README.md", kind: "file" },
];

describe("FolderContextCard", () => {
  it("renders the root entries", () => {
    render(<FolderContextCard entries={entries} />);
    expect(screen.getByText("src")).toBeInTheDocument();
    expect(screen.getByText("README.md")).toBeInTheDocument();
  });

  it("renders nested children when the folder is open", () => {
    render(<FolderContextCard entries={entries} />);
    expect(screen.getByText("index.ts")).toBeInTheDocument();
  });

  it("triggers onEntryClick with the entry id", async () => {
    const user = userEvent.setup();
    const onEntryClick = vi.fn();
    render(<FolderContextCard entries={entries} onEntryClick={onEntryClick} />);
    await user.click(screen.getByText("README.md"));
    expect(onEntryClick).toHaveBeenCalledWith("readme");
  });
});
