import { SubAgentDispatch, type SubAgentRun } from "@theokit/ui";



const RUNS: SubAgentRun[] = [
  {
    id: "1",
    agent: "researcher",
    task: "Find the latest Geist font version and its OpenType features.",
    state: "running",
    duration: "12s",
    lastEvent: "fetching https://vercel.com/geist…",
  },
  {
    id: "2",
    agent: "code-reviewer",
    task: "Review the changes in scripts/build-registry.ts for SQL safety.",
    state: "completed",
    duration: "1m 04s",
    result: "No issues found. 47 lines reviewed, 0 blocking, 2 suggestions.",
  },
  {
    id: "3",
    agent: "deployer",
    task: "Roll back theo-api to v1.3.0 in production.",
    state: "failed",
    duration: "8s",
    result: "k8s cluster unreachable: connection refused at iad1-prod.",
  },
];

export const States = () => (
  <div className="grid max-w-2xl gap-3">
    {RUNS.map((run) => (
      <SubAgentDispatch key={run.id} run={run} onCancel={() => undefined} />
    ))}
  </div>
);
