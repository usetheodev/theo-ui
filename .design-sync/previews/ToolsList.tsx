import { Eye, Globe, Pencil, Search, Terminal, Wrench } from "lucide-react";
import { useState } from "react";
import { type ToolEnablement, type ToolEntry, ToolsList } from "@theokit/ui";



const INITIAL: ToolEntry[] = [
  {
    id: "read",
    name: "Read",
    source: "builtin",
    icon: Eye,
    description: "Read files from the working directory.",
    enablement: "enabled",
  },
  {
    id: "write",
    name: "Write",
    source: "builtin",
    icon: Pencil,
    description: "Create or replace file contents.",
    enablement: "enabled",
    badge: "destructive",
  },
  {
    id: "bash",
    name: "Bash",
    source: "builtin",
    icon: Terminal,
    description: "Execute shell commands.",
    enablement: "ask",
  },
  {
    id: "grep",
    name: "Grep",
    source: "builtin",
    icon: Search,
    description: "Search for patterns in files.",
    enablement: "enabled",
  },
  {
    id: "webfetch",
    name: "WebFetch",
    source: "builtin",
    icon: Globe,
    description: "Fetch and parse URLs.",
    enablement: "denied",
  },
  {
    id: "mcp_pg",
    name: "postgres.query",
    source: "mcp · postgres",
    icon: Wrench,
    description: "Query the Postgres MCP server.",
    enablement: "ask",
  },
];

export const Interactive = () => {
  const [tools, setTools] = useState(INITIAL);
  return (
    <ToolsList
      className="max-w-xl"
      tools={tools}
      onEnablementChange={(id, next) =>
        setTools((cur) =>
          cur.map((t) => (t.id === id ? { ...t, enablement: next as ToolEnablement } : t)),
        )
      }
    />
  );
};
