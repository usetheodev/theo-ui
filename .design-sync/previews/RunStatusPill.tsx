import { type RunStatus, RunStatusPill } from "@theokit/ui";



const STATES: RunStatus[] = [
  "queued",
  "in_progress",
  "finished",
  "error",
  "cancelled",
  "interrupted",
];

export const AllStates = () => (
  <div className="flex flex-wrap gap-3">
    {STATES.map((s) => (
      <RunStatusPill key={s} status={s} />
    ))}
  </div>
);

export const WithDetail = () => (
  <RunStatusPill status="finished" detail="3.2s · 1.4k tokens" />
);
