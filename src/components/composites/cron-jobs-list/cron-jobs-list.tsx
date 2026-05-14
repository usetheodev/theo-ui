import { Plus } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { type CronJob, CronJobCard } from "../../primitives/cron-job-card/index.js";

interface CronJobsListProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  jobs: CronJob[];
  title?: ReactNode;
  onAdd?: () => void;
  onRunNow?: (id: string) => void;
  onToggle?: (id: string, enabled: boolean) => void;
  onRemove?: (id: string) => void;
}

/**
 * CronJobsList — grid of CronJobCards with a sticky "new job" action.
 */
const CronJobsList = forwardRef<HTMLDivElement, CronJobsListProps>(
  (
    { className, jobs, title = "Scheduled jobs", onAdd, onRunNow, onToggle, onRemove, ...props },
    ref,
  ) => (
    <section
      ref={ref}
      className={cn("grid gap-3", className)}
      aria-label="Scheduled agent jobs"
      {...props}
    >
      <header className="flex items-baseline justify-between">
        {title ? <h3 className="font-display text-title-md tracking-tight">{title}</h3> : <span />}
        <div className="flex items-center gap-3">
          <span className="font-mono text-label text-muted-foreground">
            {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
          </span>
          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 font-sans text-label text-primary-foreground hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="size-3.5" /> New job
            </button>
          ) : null}
        </div>
      </header>
      {jobs.length === 0 ? (
        <p className="rounded-xl border border-border/60 border-dashed bg-muted/30 px-4 py-8 text-center font-sans text-body-sm text-muted-foreground">
          No scheduled jobs yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {jobs.map((job) => (
            <CronJobCard
              key={job.id}
              job={job}
              {...(onRunNow ? { onRunNow } : {})}
              {...(onToggle ? { onToggle } : {})}
              {...(onRemove ? { onRemove } : {})}
            />
          ))}
        </div>
      )}
    </section>
  ),
);
CronJobsList.displayName = "CronJobsList";

export { CronJobsList };
