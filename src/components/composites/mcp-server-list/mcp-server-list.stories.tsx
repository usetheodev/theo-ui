import type { Story } from "@ladle/react";
import type { MCPServer } from "../../primitives/mcp-server-card/index.js";
import { MCPServerList } from "./mcp-server-list.js";

export default { title: "Composites / Agent / MCPServerList" };

const SERVERS: MCPServer[] = [
  {
    id: "fs",
    name: "filesystem",
    endpoint: "stdio · npx @modelcontextprotocol/server-filesystem",
    status: "connected",
    tools: ["read_file", "write_file", "list_directory", "search_files"],
    resources: ["file:///workspace/**"],
  },
  {
    id: "pg",
    name: "postgres",
    endpoint: "stdio · npx @modelcontextprotocol/server-postgres",
    status: "connected",
    tools: ["query", "schema", "explain"],
  },
  {
    id: "github",
    name: "github",
    endpoint: "https://api.github.com",
    status: "degraded",
    tools: ["create_issue", "list_prs"],
    message: "rate limit reached — 0/5000 remaining (resets in 12m)",
  },
  {
    id: "linear",
    name: "linear",
    endpoint: "stdio · npx @linear/mcp-server",
    status: "disconnected",
    tools: [],
    message: "process exited with code 127 (binary not found)",
  },
  {
    id: "vault",
    name: "vault",
    endpoint: "https://vault.usetheo.dev:8200",
    status: "starting",
    tools: [],
  },
];

export const Default: Story = () => (
  <MCPServerList
    className="max-w-4xl"
    servers={SERVERS}
    onAdd={() => undefined}
    onRestart={() => undefined}
    onDisconnect={() => undefined}
  />
);
