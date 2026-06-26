import { AgentEvent } from "@theokit/ui";

export const Statuses = () => (
  <div className="grid max-w-2xl gap-2">
    <AgentEvent
      event={{
        id: "1",
        type: "command",
        label: "Start dev server",
        status: "success",
        timestamp: "9:58:14 PM",
      }}
    />
    <AgentEvent
      event={{
        id: "2",
        type: "edit",
        label: "Edit AlignmentGrid.tsx",
        path: "src/components/AlignmentGrid.tsx",
        diff: { added: 142, removed: 38 },
        status: "success",
      }}
    />
    <AgentEvent event={{ id: "3", type: "lint", label: "Lint", status: "running" }} />
    <AgentEvent event={{ id: "4", type: "typecheck", label: "Typecheck", status: "pending" }} />
    <AgentEvent
      collapsible
      event={{
        id: "5",
        type: "tool",
        label: "Read file failed",
        status: "failed",
        detail: "ENOENT: no such file or directory '/tmp/missing.txt'",
      }}
    />
  </div>
);
