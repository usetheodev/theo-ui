import { ProjectSwitcher } from "@theokit/ui";



export const States = () => (
  <div className="grid max-w-xs gap-4 rounded-xl border border-border/40 bg-card p-4">
    <ProjectSwitcher
      workspace="acme-web"
      branch="claude/alignment-grid"
      status="running"
      onClick={() => undefined}
    />
    <ProjectSwitcher workspace="theo-code" branch="main" status="idle" onClick={() => undefined} />
    <ProjectSwitcher workspace="ledger-svc" branch="fix/race-condition" status="error" />
    <ProjectSwitcher workspace="offline-repo" status="offline" />
    <ProjectSwitcher workspace="custom" brand="θ" branch="dev" status="idle" />
  </div>
);

export const Interactive = () => (
  <div className="max-w-xs rounded-xl border border-border/40 bg-card p-2">
    <ProjectSwitcher
      workspace="acme-web"
      branch="claude/alignment-grid"
      status="running"
      onClick={() => alert("open project picker")}
    />
  </div>
);
