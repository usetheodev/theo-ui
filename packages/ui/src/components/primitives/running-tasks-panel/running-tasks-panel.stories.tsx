import type { Story } from "@ladle/react";
import { RunningTasksPanel } from "./running-tasks-panel.js";

export default { title: "Primitives / Code / RunningTasksPanel" };

export const Default: Story = () => (
  <RunningTasksPanel
    className="max-w-sm"
    tasks={[
      {
        id: "1",
        source: "agent",
        label: "Verify constraint solver convergence",
        status: "running",
      },
      { id: "2", source: "bash", label: "npm run dev (background)", status: "running" },
      { id: "3", source: "bash", label: "npx tsc --noEmit", status: "completed" },
      { id: "4", source: "tool", label: "Lint completed", status: "completed" },
      { id: "5", source: "bash", label: "vitest run", status: "failed" },
    ]}
  />
);
