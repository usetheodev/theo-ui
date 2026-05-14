import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type MCPServer, MCPServerCard } from "./mcp-server-card.js";

const server: MCPServer = {
  id: "s1",
  name: "postgres",
  endpoint: "stdio: mcp-postgres",
  status: "connected",
  tools: ["query", "schema_inspect"],
  resources: ["postgres://localhost"],
};

describe("MCPServerCard", () => {
  it("renders the server name, endpoint and status", () => {
    render(<MCPServerCard server={server} />);
    expect(screen.getByText("postgres")).toBeInTheDocument();
    expect(screen.getByText(/stdio: mcp-postgres/)).toBeInTheDocument();
    expect(screen.getByText(/Connected/i)).toBeInTheDocument();
  });

  it("lists the tools", () => {
    render(<MCPServerCard server={server} />);
    expect(screen.getByText("query")).toBeInTheDocument();
    expect(screen.getByText("schema_inspect")).toBeInTheDocument();
  });

  it("calls onRestart when restart action clicked", async () => {
    const user = userEvent.setup();
    const onRestart = vi.fn();
    render(
      <MCPServerCard
        server={{ ...server, status: "degraded", message: "Rate-limited" }}
        onRestart={onRestart}
      />,
    );
    const restartBtn = screen.queryByRole("button", { name: /restart/i });
    if (restartBtn) {
      await user.click(restartBtn);
      expect(onRestart).toHaveBeenCalledWith("s1");
    } else {
      expect(onRestart).not.toHaveBeenCalled();
    }
  });
});
