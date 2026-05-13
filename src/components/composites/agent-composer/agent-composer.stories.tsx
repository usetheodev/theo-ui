import type { Story } from "@ladle/react";
import { Bookmark, FileText, Terminal } from "lucide-react";
import { useState } from "react";
import { AgentComposer } from "./agent-composer.js";

export default { title: "Composites / Agent / AgentComposer" };

const COMMANDS = [
  { id: "1", label: "/clear", description: "Reset session", icon: Terminal },
  { id: "2", label: "/checkpoint", description: "Save state", icon: Terminal },
  { id: "3", label: "/undo", description: "Undo last action", icon: Terminal },
  { id: "4", label: "/help", description: "Show help", icon: Terminal },
];

const FILES = [
  {
    id: "1",
    label: "src/components/AlignmentGrid.tsx",
    description: "modified · +85 −12",
    icon: FileText,
  },
  { id: "2", label: "src/components/PanelGrid.tsx", description: "new", icon: FileText },
  { id: "3", label: "src/styles/tokens.css", description: "modified · +2 −1", icon: FileText },
];

const MEMORIES = [
  { id: "1", label: "#alignment-grid", description: "snap not stiffness", icon: Bookmark },
  { id: "2", label: "#auth-flow", description: "OAuth device flow", icon: Bookmark },
];

export const Default: Story = () => {
  const [value, setValue] = useState("");
  return (
    <div className="max-w-2xl">
      <p className="mb-3 font-mono text-label text-muted-foreground">
        Try typing <code>/</code>, <code>@</code>, or <code>#</code>. Use ↑↓, Enter, Esc.
      </p>
      <AgentComposer
        mode="code"
        value={value}
        onValueChange={setValue}
        onSubmit={(v) => {
          alert(`submit: ${v}`);
          setValue("");
        }}
        commands={COMMANDS}
        files={FILES}
        memories={MEMORIES}
      />
    </div>
  );
};
