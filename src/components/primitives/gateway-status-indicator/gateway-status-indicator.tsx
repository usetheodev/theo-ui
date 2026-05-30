import { type HTMLAttributes, forwardRef } from "react";

import { cn } from "../../../lib/cn.js";

/**
 * GatewayStatusIndicator — live connection-status dot for a gateway/server.
 *
 * Variants:
 *   - compact  : colored dot only (sidebar footer use)
 *   - labeled  : dot + label + optional latency text
 *
 * `reconnecting` state animates with `animate-pulse` and respects
 * `prefers-reduced-motion` automatically (Tailwind defaults).
 */

export type GatewayStatus = "online" | "offline" | "degraded" | "reconnecting";

export interface GatewayStatusIndicatorProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "title"> {
  status: GatewayStatus;
  latencyMs?: number;
  variant?: "compact" | "labeled";
  "data-testid"?: string;
}

const STATUS_META: Record<GatewayStatus, { dot: string; label: string; aria: string }> = {
  online: {
    dot: "bg-emerald-500",
    label: "Online",
    aria: "Gateway online",
  },
  offline: {
    dot: "bg-red-500",
    label: "Offline",
    aria: "Gateway offline",
  },
  degraded: {
    dot: "bg-amber-500",
    label: "Degraded",
    aria: "Gateway degraded",
  },
  reconnecting: {
    dot: "bg-blue-500",
    label: "Reconnecting…",
    aria: "Gateway reconnecting",
  },
};

function formatLatency(ms: number | undefined): string | null {
  if (ms === undefined) return null;
  if (!Number.isFinite(ms) || ms < 0) return null;
  if (ms < 1) return "<1ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export const GatewayStatusIndicator = forwardRef<HTMLSpanElement, GatewayStatusIndicatorProps>(
  (
    { status, latencyMs, variant = "labeled", className, "data-testid": dataTestId, ...rest },
    ref,
  ) => {
    const meta = STATUS_META[status];
    const latency = formatLatency(latencyMs);
    return (
      <span
        ref={ref}
        role="img"
        aria-label={meta.aria}
        className={cn("inline-flex items-center gap-2 font-medium text-xs", className)}
        data-testid={dataTestId ?? "gateway-status-indicator"}
        data-status={status}
        {...rest}
      >
        <span
          className={cn(
            "inline-block size-2 rounded-full",
            meta.dot,
            status === "reconnecting" && "animate-pulse",
          )}
          aria-hidden
        />
        {variant === "labeled" && (
          <span className="text-foreground">
            {meta.label}
            {latency !== null && (
              <span className="ml-1 text-muted-foreground" data-testid="gateway-latency">
                {latency}
              </span>
            )}
          </span>
        )}
      </span>
    );
  },
);
GatewayStatusIndicator.displayName = "GatewayStatusIndicator";
