import type { Story } from "@ladle/react";
import { type PlanNode, TaskPlan } from "./task-plan.js";

export default { title: "Primitives / Agent / TaskPlan" };

const NODES: PlanNode[] = [
  {
    id: "1",
    label: "Scan repository structure",
    status: "done",
    children: [
      { id: "1a", label: "Detect framework", status: "done" },
      { id: "1b", label: "Inventory dependencies", status: "done" },
    ],
  },
  {
    id: "2",
    label: "Implement the deploy command",
    status: "running",
    detail: "Editing src/cli/deploy.ts",
    children: [
      { id: "2a", label: "Parse CLI flags", status: "done" },
      { id: "2b", label: "Wire HTTP client", status: "running" },
      { id: "2c", label: "Handle errors", status: "pending" },
    ],
  },
  {
    id: "3",
    label: "Write unit tests",
    status: "pending",
  },
  {
    id: "4",
    label: "Run typecheck + lint",
    status: "pending",
  },
  {
    id: "5",
    label: "Update CHANGELOG",
    status: "skipped",
    detail: "Skipped because no public API changed.",
  },
];

export const Default: Story = () => (
  <TaskPlan className="max-w-xl" title="Build plan" nodes={NODES} />
);
