"use client";

import { forwardRef, useEffect } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { isDev } from "../../../lib/env.js";

/**
 * StatusDot — semantic status indicator (colored circle + optional label).
 *
 * Five status kinds:
 *   - `live`     — deployed / verified / healthy (success)
 *   - `building` — in-progress / queued (warning, auto-pulses)
 *   - `failed`   — error / down / rejected (destructive)
 *   - `idle`     — pending / offline (muted)
 *   - `warning`  — degraded but functional (warning, static)
 *
 * Three sizes (xs 6px, sm 8px default, md 10px). `pulse` defaults to
 * `true` for `building` and `false` otherwise; passing `pulse` explicitly
 * overrides the auto behavior. When no visible `label` AND no `aria-label`
 * are provided, the component auto-applies `aria-label={status}` and
 * emits a dev-mode warning (a status communicated only by color is
 * invisible to screen readers).
 *
 * @example
 *   <StatusDot status="live" label="Production" />
 *   <StatusDot status="building" />            // auto-pulses + auto-aria-label
 */
export type StatusKind = "live" | "building" | "failed" | "idle" | "warning";

export interface StatusDotProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  status: StatusKind;
  label?: ReactNode;
  size?: "xs" | "sm" | "md";
  pulse?: boolean;
}

const DOT_COLOR: Record<StatusKind, string> = {
  live: "bg-success",
  building: "bg-warning",
  failed: "bg-destructive",
  idle: "bg-muted-foreground/40",
  warning: "bg-warning",
};

const LABEL_COLOR: Record<StatusKind, string> = {
  live: "text-success",
  building: "text-warning",
  failed: "text-destructive",
  idle: "text-muted-foreground",
  warning: "text-warning",
};

const SIZE: Record<NonNullable<StatusDotProps["size"]>, string> = {
  xs: "size-1.5",
  sm: "size-2",
  md: "size-2.5",
};

const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ className, status, label, size = "sm", pulse, "aria-label": ariaLabel, ...props }, ref) => {
    const shouldPulse = pulse ?? status === "building";

    const hasVisibleLabel = label !== undefined && label !== null;
    const effectiveAriaLabel = ariaLabel ?? (hasVisibleLabel ? undefined : status);

    // EC-6: dev warning when neither label nor aria-label is provided.
    useEffect(() => {
      if (isDev() && !hasVisibleLabel && ariaLabel === undefined) {
        // biome-ignore lint/suspicious/noConsole: dev-only diagnostic for a11y misconfiguration.
        console.warn(
          `<StatusDot status="${status}" />: no \`label\` or \`aria-label\` provided. Color-only status is invisible to screen readers. Falling back to aria-label="${status}".`,
        );
      }
    }, [hasVisibleLabel, ariaLabel, status]);

    const dot = (
      <span
        aria-hidden={hasVisibleLabel ? "true" : undefined}
        className={cn(
          "inline-block shrink-0 rounded-full",
          SIZE[size],
          DOT_COLOR[status],
          shouldPulse && "animate-pulse",
        )}
      />
    );

    if (!hasVisibleLabel) {
      return (
        <span
          ref={ref}
          // biome-ignore lint/a11y/useSemanticElements: StatusDot is a generic inline indicator; there is no HTML element with implicit role="status" that is an inline span. The native <output> is block-level and form-bound, which doesn't fit this use case.
          role="status"
          aria-label={effectiveAriaLabel}
          className={cn("inline-flex items-center", className)}
          {...props}
        >
          {dot}
        </span>
      );
    }

    return (
      <span
        ref={ref}
        aria-label={effectiveAriaLabel}
        className={cn(
          "inline-flex items-center gap-1.5 font-mono text-label",
          LABEL_COLOR[status],
          className,
        )}
        {...props}
      >
        {dot}
        <span>{label}</span>
      </span>
    );
  },
);
StatusDot.displayName = "StatusDot";

export { StatusDot };
