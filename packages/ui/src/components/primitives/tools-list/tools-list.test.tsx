import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type ToolEntry, ToolsList } from "./tools-list.js";

const tools: ToolEntry[] = [
  { id: "bash", name: "Bash", enablement: "ask", source: "built-in" },
  { id: "write", name: "Write", enablement: "enabled", source: "built-in" },
];

describe("ToolsList", () => {
  it("renders the title and each tool name", () => {
    render(<ToolsList tools={tools} />);
    expect(screen.getByRole("heading", { name: /Tools/i })).toBeInTheDocument();
    expect(screen.getByText("Bash")).toBeInTheDocument();
    expect(screen.getByText("Write")).toBeInTheDocument();
  });

  it("cycles enablement when a chip is clicked", async () => {
    const user = userEvent.setup();
    const onEnablementChange = vi.fn();
    render(<ToolsList tools={tools} onEnablementChange={onEnablementChange} />);
    await user.click(screen.getByRole("button", { name: /Cycle enablement for Write/i }));
    expect(onEnablementChange).toHaveBeenCalledWith("write", "ask");
  });
});
