import type { Story } from "@ladle/react";

import { type RunStatus, RunStatusPill } from "./run-status-pill.js";

export default { title: "Primitives / Agent / RunStatusPill" };

const STATES: RunStatus[] = [
  "queued",
  "in_progress",
  "finished",
  "error",
  "cancelled",
  "interrupted",
];

export const AllStates: Story = () => (
  <div className="flex flex-wrap gap-3">
    {STATES.map((s) => (
      <RunStatusPill key={s} status={s} />
    ))}
  </div>
);

export const WithDetail: Story = () => (
  <RunStatusPill status="finished" detail="3.2s · 1.4k tokens" />
);
