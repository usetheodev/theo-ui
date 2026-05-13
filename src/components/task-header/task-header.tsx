import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn.js";
import type { TaskStatus } from "../../types/task.js";
import { Badge } from "../badge/badge.js";

const statusVariant: Record<
  TaskStatus,
  "default" | "primary" | "warning" | "success" | "destructive"
> = {
  idle: "default",
  permission_required: "warning",
  starting: "primary",
  running: "primary",
  verifying: "primary",
  completed: "success",
  failed: "destructive",
};
const statusDot: Record<TaskStatus, "primary" | "success" | "warning" | "destructive" | "muted"> = {
  idle: "muted",
  permission_required: "warning",
  starting: "primary",
  running: "primary",
  verifying: "primary",
  completed: "success",
  failed: "destructive",
};
const statusLabel: Record<TaskStatus, string> = {
  idle: "Idle",
  permission_required: "Permission required",
  starting: "Starting up",
  running: "Running",
  verifying: "Verifying",
  completed: "Completed",
  failed: "Failed",
};

interface TaskHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  status?: TaskStatus;
  /**
   * If provided, a chevron is shown next to the title and clicking it fires this callback.
   * Used as the "expand task metadata" affordance in the Cowork shell.
   */
  onToggle?: () => void;
  /** Right-side actions (e.g. cancel task, close panel). */
  actions?: ReactNode;
}

/**
 * TaskHeader — title bar for a task pane.
 *
 * Visual: display-md title with chevron + optional status badge with pulse + actions slot.
 */
const TaskHeader = forwardRef<HTMLElement, TaskHeaderProps>(
  ({ className, title, status, onToggle, actions, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-card px-4 py-3",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="truncate font-display text-title-lg tracking-tight">{title}</h2>
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Toggle task details"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronDown className="size-4" />
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {status ? (
          <Badge variant={statusVariant[status]}>
            <Badge.Dot
              tone={statusDot[status]}
              pulse={status === "running" || status === "starting" || status === "verifying"}
            />
            {statusLabel[status]}
          </Badge>
        ) : null}
        {actions}
      </div>
    </header>
  ),
);
TaskHeader.displayName = "TaskHeader";

export { TaskHeader };
