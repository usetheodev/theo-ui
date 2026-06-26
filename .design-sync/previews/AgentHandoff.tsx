import { AgentHandoff } from "@theokit/ui";

export const Chain = () => (
  <div className="grid max-w-2xl gap-3">
    <AgentHandoff
      from={{ name: "planner", tone: "accent", initials: "PL" }}
      to={{ name: "coder", tone: "primary", initials: "CD" }}
      reason="Plan complete · 7 steps · ready for implementation."
      footer="10:01:32 · token budget transferred: 120k"
    />
    <AgentHandoff
      from={{ name: "coder", tone: "primary", initials: "CD" }}
      to={{ name: "reviewer", tone: "info", initials: "RV" }}
      reason="3 files edited, typecheck passing. Please review src/lib/cn.ts and src/themes/violet-forge.ts."
      footer="10:42:15"
    />
    <AgentHandoff
      from={{ name: "reviewer", tone: "info", initials: "RV" }}
      to={{ name: "deployer", tone: "success", initials: "OP" }}
      reason="LGTM. Ship it to staging."
      footer="10:58:02 · gate passed"
    />
  </div>
);
