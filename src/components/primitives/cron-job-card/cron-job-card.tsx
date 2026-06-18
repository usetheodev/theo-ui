import { Clock, Play, Square, Trash2 } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

export type CronJobStatus = "idle" | "running" | "failed" | "disabled";

export interface CronJob {
  id: string;
  /** Human-readable job name. */
  name: string;
  /** Cron expression — e.g. every 4 hours. */
  schedule: string;
  /** What gets run (prompt or command). */
  prompt: string;
  status: CronJobStatus;
  /** ISO/string timestamp of last run. */
  lastRun?: string;
  /** ISO/string timestamp of next run. */
  nextRun?: string;
  /** Optional last-run result line. */
  lastResult?: ReactNode;
}

interface CronJobCardProps extends Omit<HTMLAttributes<HTMLElement>, "onToggle"> {
  job: CronJob;
  onRunNow?: (id: string) => void;
  onToggle?: (id: string, enabled: boolean) => void;
  onRemove?: (id: string) => void;
}

const STATUS_CONFIG: Record<CronJobStatus, { label: string; class: string }> = {
  idle: { label: "Scheduled", class: "border-success/40 bg-success/10 text-success" },
  running: {
    label: "Running",
    class: "border-primary/40 bg-primary/10 text-primary animate-pulse",
  },
  failed: {
    label: "Last run failed",
    class: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  disabled: { label: "Disabled", class: "border-border/40 bg-muted text-muted-foreground" },
};

/**
 * CronJobCard — one scheduled agent job. Shows cron expression, prompt,
 * status, last/next run. Inline actions: run now, pause, delete.
 */
const CronJobCard = forwardRef<HTMLElement, CronJobCardProps>(
  ({ className, job, onRunNow, onToggle, onRemove, ...props }, ref) => {
    const cfg = STATUS_CONFIG[job.status];
    const enabled = job.status !== "disabled";
    return (
      <article
        ref={ref}
        className={cn(
          "grid gap-3 rounded-xl border bg-card p-4",
          job.status === "disabled" && "opacity-70",
          className,
        )}
        {...props}
        data-slot="cron-job-card"
      >
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-display text-title-md tracking-tight">{job.name}</h4>
            <p className="mt-0.5 inline-flex items-center gap-2 font-mono text-code-sm text-muted-foreground">
              <Clock className="size-3" aria-hidden="true" /> {job.schedule}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5",
              "font-mono text-label uppercase tracking-wider",
              cfg.class,
            )}
          >
            {cfg.label}
          </span>
        </header>

        <p className="line-clamp-2 rounded-md bg-muted/60 px-3 py-2 font-mono text-code-sm text-foreground">
          {job.prompt}
        </p>

        <div className="grid grid-cols-2 gap-3 font-mono text-label text-muted-foreground">
          <span>
            <span className="text-muted-foreground/60">last:</span> {job.lastRun ?? "never"}
          </span>
          <span>
            <span className="text-muted-foreground/60">next:</span> {job.nextRun ?? "—"}
          </span>
        </div>

        {job.lastResult ? (
          <p className="text-body-sm text-muted-foreground">{job.lastResult}</p>
        ) : null}

        <footer className="flex items-center justify-end gap-1.5">
          {onRunNow ? (
            <button
              type="button"
              onClick={() => onRunNow(job.id)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-2.5 py-1 font-mono text-label hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Play className="size-3" /> Run now
            </button>
          ) : null}
          {onToggle ? (
            <button
              type="button"
              onClick={() => onToggle(job.id, !enabled)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-2.5 py-1 font-mono text-label hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Square className="size-3" /> {enabled ? "Pause" : "Enable"}
            </button>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(job.id)}
              aria-label={`Remove ${job.name}`}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </footer>
      </article>
    );
  },
);
CronJobCard.displayName = "CronJobCard";

export { CronJobCard };
