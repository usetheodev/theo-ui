import { CronJobCard } from "@theokit/ui";

export const States = () => (
  <div className="grid max-w-xl gap-3">
    <CronJobCard
      job={{
        id: "j1",
        name: "Nightly type-check",
        schedule: "0 3 * * *",
        prompt: "Run pnpm typecheck and report any errors.",
        status: "idle",
        lastRun: "9h ago",
        nextRun: "in 15h",
        lastResult: "✓ no type errors",
      }}
      onRunNow={() => undefined}
      onToggle={() => undefined}
      onRemove={() => undefined}
    />
    <CronJobCard
      job={{
        id: "j2",
        name: "Dependency audit",
        schedule: "0 0 * * 1",
        prompt: "Check npm audit and summarise vulnerabilities.",
        status: "disabled",
        lastRun: "3d ago",
        lastResult: "2 moderate vulnerabilities",
      }}
      onToggle={() => undefined}
    />
    <CronJobCard
      job={{
        id: "j3",
        name: "Production health check",
        schedule: "*/15 * * * *",
        prompt: "Probe /healthz on production and alert on failure.",
        status: "idle",
        lastRun: "2m ago",
        nextRun: "in 13m",
      }}
    />
  </div>
);
