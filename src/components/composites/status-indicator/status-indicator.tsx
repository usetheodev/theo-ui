import { type HTMLAttributes, forwardRef } from "react";

import { cn } from "../../../lib/cn.js";

/**
 * StatusIndicator — semantic operational-state indicator (composite).
 *
 * Consumes the `--status-online` / `--status-offline` / `--status-degraded`
 * / `--status-info` token group (ADR-0007). Statuses describe component
 * liveness (alive/dead/slow/info-flag), distinct from action-result
 * semantics (success/destructive/warning/info — see `StatusDot` primitive).
 *
 * Hierarchy invariant (T4.1): this composite consumes primitives via
 * Tailwind tokens (`bg-status-*`), never imports another composite. The
 * `StatusDot` primitive remains as a separate, more generic API.
 *
 * @example
 *   <StatusIndicator status="online" />
 *   <StatusIndicator status="degraded" label="Slow" />
 *   <StatusIndicator status="offline" label="Disconnected" size="md" />
 */

export type StatusIndicatorKind = "online" | "offline" | "degraded" | "info";
export type StatusIndicatorSize = "sm" | "md";

export interface StatusIndicatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Operational state to convey. Maps to `--status-{kind}`. */
  status: StatusIndicatorKind;
  /** Optional inline label to the right of the dot. */
  label?: string;
  /** Size of the dot. Default `sm` (8px). */
  size?: StatusIndicatorSize;
  /** When true, pulses the dot to draw attention (e.g., live state). */
  pulse?: boolean;
}

const DOT_COLOR: Record<StatusIndicatorKind, string> = {
  online: "bg-status-online",
  offline: "bg-status-offline",
  degraded: "bg-status-degraded",
  info: "bg-status-info",
};

const LABEL_COLOR: Record<StatusIndicatorKind, string> = {
  online: "text-foreground",
  offline: "text-foreground",
  degraded: "text-foreground",
  info: "text-foreground",
};

const ARIA_LABEL: Record<StatusIndicatorKind, string> = {
  online: "Online",
  offline: "Offline",
  degraded: "Degraded",
  info: "Information",
};

const SIZE_DOT: Record<StatusIndicatorSize, string> = {
  sm: "size-2",
  md: "size-2.5",
};

export const StatusIndicator = forwardRef<HTMLSpanElement, StatusIndicatorProps>(
  (
    { status, label, size = "sm", pulse = false, className, "aria-label": ariaLabel, ...rest },
    ref,
  ) => {
    const accessibleLabel = label ?? ariaLabel ?? ARIA_LABEL[status];
    return (
      <span
        data-slot="status-indicator"
        ref={ref}
        role="img"
        aria-label={accessibleLabel}
        className={cn("inline-flex items-center gap-2 font-medium text-xs", className)}
        data-status={status}
        {...rest}
      >
        <span
          className={cn(
            "inline-block rounded-full",
            SIZE_DOT[size],
            DOT_COLOR[status],
            pulse && "animate-pulse",
          )}
          aria-hidden
        />
        {label !== undefined && <span className={LABEL_COLOR[status]}>{label}</span>}
      </span>
    );
  },
);
StatusIndicator.displayName = "StatusIndicator";
