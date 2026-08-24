import type { Story } from "@ladle/react";
import { MCPServerCard } from "./mcp-server-card.js";

export default { title: "Primitives / Agent / MCPServerCard" };

export const States: Story = () => (
  <div className="grid max-w-xl gap-3">
    <MCPServerCard
      server={{
        id: "s1",
        name: "postgres",
        endpoint: "stdio: mcp-postgres",
        status: "connected",
        tools: ["query", "schema_inspect", "explain"],
        resources: ["postgres://localhost/dev"],
      }}
      onRestart={() => undefined}
      onDisconnect={() => undefined}
    />
    <MCPServerCard
      server={{
        id: "s2",
        name: "github",
        endpoint: "https://mcp.github.com",
        status: "connected",
        tools: ["list_issues", "create_issue", "get_pr_diff"],
      }}
      onRestart={() => undefined}
    />
    <MCPServerCard
      server={{
        id: "s3",
        name: "slack",
        endpoint: "stdio: mcp-slack",
        status: "degraded",
        tools: ["send_message", "list_channels"],
        message: "Rate-limited by Slack API — retrying in 30s.",
      }}
      onRestart={() => undefined}
    />
    <MCPServerCard
      server={{
        id: "s4",
        name: "filesystem",
        endpoint: "stdio: mcp-fs",
        status: "disconnected",
        tools: [],
        message: "Process exited (code 137 — OOM).",
      }}
      onRestart={() => undefined}
    />
  </div>
);
