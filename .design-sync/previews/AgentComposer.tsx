import { AgentComposer } from "@theokit/ui";
import { Bookmark, FileText, Terminal } from "lucide-react";
import { useState } from "react";

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

export const Default = () => {
  const [value, setValue] = useState("Refactor the alignment grid to snap mode");
  return (
    <div className="max-w-2xl">
      <p className="mb-3 font-mono text-label text-muted-foreground">
        Try typing <code>/</code>, <code>@</code>, or <code>#</code>. Use ↑↓, Enter, Esc.
      </p>
      <AgentComposer
        mode="code"
        value={value}
        onValueChange={setValue}
        onSubmit={() => setValue("")}
        commands={COMMANDS}
        files={FILES}
        memories={MEMORIES}
      />
    </div>
  );
};
