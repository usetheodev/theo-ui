import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  type LucideIcon,
  PauseCircle,
  XCircle,
} from "lucide-react";
import { type HTMLAttributes, forwardRef } from "react";

import { cn } from "../../../lib/cn.js";

/**
 * RunStatusPill — compact status indicator for Run/Task lifecycle states.
 * Mirrors OpenClaw's `Run status: In progress | Done | Interrupted` pill.
 * Closed enum mirrors SDK `Task` state (D362).
 */

export type RunStatus =
  | "queued"
  | "in_progress"
  | "finished"
  | "error"
  | "cancelled"
  | "interrupted";

export interface RunStatusPillProps extends Omit<HTMLAttributes<HTMLSpanElement>, "title"> {
  status: RunStatus;
  detail?: string;
  "data-testid"?: string;
}

interface StatusMeta {
  icon: LucideIcon;
  label: string;
  className: string;
  spin?: boolean;
}

const STATUS_META: Record<RunStatus, StatusMeta> = {
  queued: {
    icon: Clock,
    label: "Queued",
    className: "border-border bg-muted text-muted-foreground",
  },
  in_progress: {
    icon: Loader2,
    label: "In progress",
    className: "border-primary/40 bg-primary/10 text-primary",
    spin: true,
  },
  finished: {
    icon: CheckCircle2,
    label: "Done",
    className: "border-success/40 bg-success/10 text-success",
  },
  error: {
    icon: AlertCircle,
    label: "Error",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  cancelled: {
    icon: XCircle,
    label: "Cancelled",
    className: "border-border bg-muted text-muted-foreground",
  },
  interrupted: {
    icon: PauseCircle,
    label: "Interrupted",
    className: "border-warning/40 bg-warning/10 text-warning",
  },
};

export const RunStatusPill = forwardRef<HTMLSpanElement, RunStatusPillProps>(
  ({ status, detail, className, "data-testid": dataTestId, ...rest }, ref) => {
    const meta = STATUS_META[status];
    const Icon = meta.icon;
    return (
      <span
        ref={ref}
        // biome-ignore lint/a11y/useSemanticElements: inline status badge — <span role="status"> keeps it phrasing-content compatible inside chat headers and table cells, where the implicit <output> placement would break layout
        role="status"
        aria-live="polite"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium text-xs",
          meta.className,
          className,
        )}
        data-testid={dataTestId ?? "run-status-pill"}
        data-status={status}
        {...rest}
      >
        <Icon className={cn("size-3", meta.spin && "animate-spin")} aria-hidden />
        <span>{meta.label}</span>
        {detail !== undefined && detail.length > 0 && (
          <span className="text-muted-foreground" data-testid="run-status-detail">
            {" · "}
            {detail}
          </span>
        )}
      </span>
    );
  },
);
RunStatusPill.displayName = "RunStatusPill";
