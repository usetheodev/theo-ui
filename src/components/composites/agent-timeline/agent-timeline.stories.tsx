import type { Story } from "@ladle/react";
import { AgentTimeline } from "./agent-timeline.js";

export default { title: "Composites / Agent / AgentTimeline" };

export const FullRun: Story = () => (
  <AgentTimeline
    className="max-w-2xl"
    events={[
      {
        id: "1",
        type: "command",
        label: "Start dev server",
        status: "success",
        timestamp: "9:58:14 PM",
      },
      {
        id: "2",
        type: "file_write",
        label: "Write PanelGrid.tsx",
        path: "src/components/PanelGrid.tsx",
        diff: { added: 62, removed: 0 },
        status: "success",
        timestamp: "9:58:24 PM",
      },
      {
        id: "3",
        type: "edit",
        label: "Edit AlignmentGrid.tsx",
        path: "src/components/AlignmentGrid.tsx",
        diff: { added: 142, removed: 38 },
        status: "success",
        timestamp: "9:58:42 PM",
      },
      { id: "4", type: "lint", label: "Lint", status: "success" },
      { id: "5", type: "typecheck", label: "Typecheck", status: "success" },
      { id: "6", type: "build", label: "Build", status: "running" },
    ]}
  />
);
