import { Check, CircleDashed, Loader2 } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { TaskStep, TaskStepStatus } from "../../../types/task.js";

const statusIcon = {
  pending: CircleDashed,
  running: Loader2,
  done: Check,
  skipped: CircleDashed,
} as const;

const statusToneText: Record<TaskStepStatus, string> = {
  pending: "text-muted-foreground",
  running: "text-primary",
  done: "text-success line-through",
  skipped: "text-muted-foreground line-through",
};

const statusBg: Record<TaskStepStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  running: "bg-primary text-primary-foreground",
  done: "bg-success text-success-foreground",
  skipped: "bg-muted text-muted-foreground",
};

interface ProgressChecklistProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  steps: TaskStep[];
  /**
   * If true, shows percentage bar for running steps with `progress`.
   */
  showProgressBars?: boolean;
}

/**
 * ProgressChecklist — right-inspector checklist.
 *
 * Visual: vertical list of steps with status dot, label, optional progress bar.
 * Matches WIREMOCKS §3 / §4 ("Progresso") with checkmarks and pulse on running.
 */
const ProgressChecklist = forwardRef<HTMLDivElement, ProgressChecklistProps>(
  ({ className, title, steps, showProgressBars = true, ...props }, ref) => (
    <section
      ref={ref}
      className={cn("rounded-xl border bg-card p-4", className)}
      {...props}
      data-slot="progress-checklist"
    >
      {title ? (
        <header className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-title-md tracking-tight">{title}</h3>
        </header>
      ) : null}
      <ol className="grid gap-3">
        {steps.map((step) => {
          const Icon = statusIcon[step.status];
          return (
            <li key={step.id} className="grid grid-cols-[auto_1fr] items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 grid size-5 place-items-center rounded-full",
                  statusBg[step.status],
                )}
                aria-hidden="true"
              >
                <Icon className={cn("size-3", step.status === "running" && "animate-spin")} />
              </span>
              <div className="min-w-0">
                <p className={cn("text-body-sm", statusToneText[step.status])}>{step.label}</p>
                {showProgressBars && step.status === "running" && step.progress !== undefined ? (
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-[width] duration-base ease-out-soft"
                      style={{ width: `${Math.round(step.progress * 100)}%` }}
                    />
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  ),
);
ProgressChecklist.displayName = "ProgressChecklist";

export { ProgressChecklist };
