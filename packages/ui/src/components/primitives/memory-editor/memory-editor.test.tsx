import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryEditor, type MemoryLayer } from "./memory-editor.js";

const layers: MemoryLayer[] = [
  { scope: "global", path: "~/.claude/CLAUDE.md", content: "## global notes" },
  { scope: "project", path: "./CLAUDE.md", content: "## project rules" },
  { scope: "session", path: ":memory:", content: "" },
];

describe("MemoryEditor", () => {
  it("renders the title and the active scope content", () => {
    render(
      <MemoryEditor
        layers={layers}
        activeScope="global"
        onScopeChange={() => undefined}
        onContentChange={() => undefined}
      />,
    );
    expect(screen.getByRole("heading", { name: /Memory/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("## global notes")).toBeInTheDocument();
  });

  it("changes scope when a tab is clicked", async () => {
    const user = userEvent.setup();
    const onScopeChange = vi.fn();
    render(
      <MemoryEditor
        layers={layers}
        activeScope="global"
        onScopeChange={onScopeChange}
        onContentChange={() => undefined}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Project/i }));
    expect(onScopeChange).toHaveBeenCalledWith("project");
  });

  it("calls onContentChange with the new content", async () => {
    const user = userEvent.setup();
    const onContentChange = vi.fn();
    render(
      <MemoryEditor
        layers={layers}
        activeScope="global"
        onScopeChange={() => undefined}
        onContentChange={onContentChange}
      />,
    );
    const textarea = screen.getByDisplayValue("## global notes");
    await user.type(textarea, "!");
    expect(onContentChange).toHaveBeenCalled();
    expect(onContentChange.mock.calls[0]?.[0]).toBe("global");
  });
});
