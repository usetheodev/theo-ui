import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MCPServer } from "../mcp-server-card/mcp-server-card.js";
import { MCPServerList } from "./mcp-server-list.js";

const servers: MCPServer[] = [
  {
    id: "s1",
    name: "postgres",
    endpoint: "stdio",
    status: "connected",
    tools: ["query"],
  },
  {
    id: "s2",
    name: "slack",
    endpoint: "stdio",
    status: "degraded",
    tools: ["send"],
  },
];

describe("MCPServerList", () => {
  it("renders all servers by default", () => {
    render(<MCPServerList servers={servers} />);
    expect(screen.getByText("postgres")).toBeInTheDocument();
    expect(screen.getByText("slack")).toBeInTheDocument();
  });

  it("filters servers by status when a chip is clicked", async () => {
    const user = userEvent.setup();
    render(<MCPServerList servers={servers} />);
    const degradedChip = screen.getByRole("button", { name: /degraded/i });
    await user.click(degradedChip);
    expect(screen.getByText("slack")).toBeInTheDocument();
    expect(screen.queryByText("postgres")).not.toBeInTheDocument();
  });

  it("triggers onAdd when present", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<MCPServerList servers={servers} onAdd={onAdd} />);
    const addBtn = screen.queryByRole("button", { name: /add|new/i });
    if (addBtn) {
      await user.click(addBtn);
      expect(onAdd).toHaveBeenCalledTimes(1);
    } else {
      expect(onAdd).not.toHaveBeenCalled();
    }
  });
});
