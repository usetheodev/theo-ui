import type { Story } from "@ladle/react";
import { Button } from "@usetheo/ui";
import { FileEdit, Search, Terminal } from "lucide-react";
import { AgentStream, type AgentStreamItem } from "./agent-stream.js";

export default { title: "Composites / Agent / AgentStream" };

const items: AgentStreamItem[] = [
  {
    kind: "message",
    id: "u1",
    message: {
      id: "u1",
      role: "user",
      parts: [{ type: "text", text: "Find every call site of stiffness and refactor to snap." }],
    },
  },
  {
    kind: "message",
    id: "a1",
    message: {
      id: "a1",
      role: "assistant",
      parts: [
        { type: "text", text: "I'll start by grepping the codebase for stiffness call sites." },
      ],
    },
  },
  {
    kind: "tool-call",
    id: "t1",
    tool: "Grep",
    icon: Search,
    target: "stiffness",
    status: "success",
    timestamp: "9:58:14 PM",
    output: (
      <pre className="whitespace-pre-wrap text-muted-foreground">
        src/components/AlignmentGrid.tsx:424: stiffness={"{"}0.8{"}"}
        {"\n"}src/components/PanelGrid.tsx:88: stiffness: 1{"\n"}src/styles/tokens.css:85:
        --align-stiffness: 0.8;
      </pre>
    ),
  },
  {
    kind: "message",
    id: "a2",
    message: {
      id: "a2",
      role: "assistant",
      parts: [{ type: "text", text: "Found 3 call sites. Patching AlignmentGrid.tsx first." }],
    },
  },
  {
    kind: "approval",
    id: "p1",
    severity: "warning",
    title: "Edit outside default sandbox?",
    request: "Edit · ~/.config/theo/tokens.css",
    description: "This file lives in your home directory.",
    onApprove: () => undefined,
    onDeny: () => undefined,
    onAlways: () => undefined,
  },
  {
    kind: "tool-call",
    id: "t2",
    tool: "Edit",
    icon: FileEdit,
    target: "src/components/AlignmentGrid.tsx",
    status: "success",
    timestamp: "9:58:42 PM",
  },
  {
    kind: "tool-call",
    id: "t3",
    tool: "Bash",
    icon: Terminal,
    target: "pnpm test",
    status: "failed",
    timestamp: "9:59 PM",
    defaultExpanded: true,
    output: (
      <pre className="whitespace-pre-wrap text-destructive">
        FAIL src/components/AlignmentGrid.test.tsx{"\n"}× renders snap mode (12ms){"\n"}
        Expected: "snap" / Received: "stiffness"
      </pre>
    ),
  },
  {
    kind: "error",
    id: "e1",
    errorKind: "rate-limit",
    title: "Rate limit hit",
    detail: "anthropic: 429 — retry after 60s",
    timestamp: "9:59 PM",
    actions: <Button size="sm">Retry in 60s</Button>,
  },
  {
    kind: "streaming",
    id: "s1",
    model: "Opus 4.7",
    partial: "Resuming. Let me re-run the failing test with verbose output…",
  },
];

export const FullStream: Story = () => (
  <div className="max-w-2xl">
    <AgentStream items={items} />
  </div>
);
