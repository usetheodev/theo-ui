import { type CronJob, CronJobsList } from "@theokit/ui";

const JOBS: CronJob[] = [
  {
    id: "1",
    name: "Daily TypeScript audit",
    schedule: "0 9 * * *",
    prompt: "Run typecheck across the workspace, summarize errors by category.",
    status: "idle",
    lastRun: "Yesterday 09:00",
    nextRun: "Tomorrow 09:00",
    lastResult: "0 errors, 14 warnings.",
  },
  {
    id: "2",
    name: "Hourly deploy health",
    schedule: "0 * * * *",
    prompt: "Check deploy status of theo-api in production and ping if degraded.",
    status: "running",
    lastRun: "55m ago",
    nextRun: "in 5m",
  },
  {
    id: "3",
    name: "Weekly dependency review",
    schedule: "0 10 * * 1",
    prompt: "List outdated dependencies with security advisories.",
    status: "failed",
    lastRun: "Mon 10:00",
    nextRun: "Next Mon 10:00",
    lastResult: "Failed: npm registry timeout.",
  },
  {
    id: "4",
    name: "End-of-day rollup",
    schedule: "0 18 * * 1-5",
    prompt: "Summarize today's commits and open PRs.",
    status: "disabled",
  },
];

export const Default = () => (
  <CronJobsList
    className="max-w-4xl"
    jobs={JOBS}
    onAdd={() => undefined}
    onRunNow={() => undefined}
    onToggle={() => undefined}
    onRemove={() => undefined}
  />
);
