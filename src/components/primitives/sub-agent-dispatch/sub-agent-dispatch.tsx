import { Bot, CornerDownRight, Loader2 } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

export type SubAgentState = "spawning" | "running" | "completed" | "failed" | "cancelled";

export interface SubAgentRun {
  id: string;
  /** Profile name (matches AgentProfile.name). */
  agent: string;
  /** Short task description given to the sub-agent. */
  task: string;
  state: SubAgentState;
  /** Optional duration label. */
  duration?: string;
  /** Optional last status line (preview of the latest event). */
  lastEvent?: string;
  /** Optional result summary (one-liner). */
  result?: ReactNode;
}

interface SubAgentDispatchProps extends HTMLAttributes<HTMLElement> {
  run: SubAgentRun;
  /** When provided, renders a cancel button while the run is in flight. */
  onCancel?: (id: string) => void;
}

const STATE_CONFIG: Record<SubAgentState, { label: string; class: string }> = {
  spawning: {
    label: "Spawning",
    class: "border-primary/40 bg-primary/10 text-primary animate-pulse",
  },
  running: { label: "Running", class: "border-primary/40 bg-primary/15 text-primary" },
  completed: { label: "Done", class: "border-success/40 bg-success/15 text-success" },
  failed: { label: "Failed", class: "border-destructive/40 bg-destructive/15 text-destructive" },
  cancelled: { label: "Cancelled", class: "border-border/40 bg-muted text-muted-foreground" },
};

/**
 * SubAgentDispatch — visualization for a Task() / sub-agent invocation.
 *
 * Shows the agent name, the task summary, current state, an inline event
 * preview, and an optional result. Use inside the agent timeline to make
 * delegation visible.
 */
const SubAgentDispatch = forwardRef<HTMLElement, SubAgentDispatchProps>(
  ({ className, run, onCancel, ...props }, ref) => {
    const cfg = STATE_CONFIG[run.state];
    const isLive = run.state === "spawning" || run.state === "running";
    return (
      <article
        ref={ref}
        className={cn(
          "grid gap-2 rounded-lg border border-primary/30 border-l-2 border-l-primary bg-card px-4 py-3",
          className,
        )}
        {...props}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <CornerDownRight className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            <Bot className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="font-medium font-mono text-code-sm text-foreground">dispatch</span>
            <span className="font-mono text-code-sm text-primary">{run.agent}</span>
            {run.duration ? (
              <span className="font-mono text-label text-muted-foreground tabular-nums">
                · {run.duration}
              </span>
            ) : null}
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5",
              "font-mono text-label uppercase tracking-wider",
              cfg.class,
            )}
          >
            {isLive ? <Loader2 className="size-3 animate-spin" aria-hidden="true" /> : null}
            {cfg.label}
          </span>
        </header>

        <p className="text-body-sm text-foreground">
          <span className="mr-2 font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
            task
          </span>
          {run.task}
        </p>

        {run.lastEvent ? (
          <p className="truncate font-mono text-code-sm text-muted-foreground">
            <span className="text-muted-foreground/60">›</span> {run.lastEvent}
          </p>
        ) : null}

        {run.result ? (
          <p className="rounded-md bg-muted/40 px-3 py-2 text-body-sm text-foreground">
            <span className="mr-2 font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
              result
            </span>
            {run.result}
          </p>
        ) : null}

        {isLive && onCancel ? (
          <footer className="flex justify-end">
            <button
              type="button"
              onClick={() => onCancel(run.id)}
              className="rounded-md border border-border/60 bg-card px-2.5 py-1 font-mono text-label text-muted-foreground hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
          </footer>
        ) : null}
      </article>
    );
  },
);
SubAgentDispatch.displayName = "SubAgentDispatch";

export { SubAgentDispatch };
