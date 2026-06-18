import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Progress — accessible progress bar primitive.
 *
 * Built on `<div role="progressbar">` (NOT native `<progress>`) so Tailwind
 * classes can style the track + fill cross-browser (Chrome/Safari/Firefox
 * shadow-DOM hooks for `<progress>` diverge). Matches Radix / shadcn /
 * Mantine convention.
 *
 * Variants:
 *   - intent: `default` | `success` | `warning` | `destructive` — controls fill color
 *   - height: `h-1` (4px, default) | `h-1.5` | `h-2` | `h-3`
 *   - indeterminate: animated bar, no value (e.g. "uploading…", "building…")
 *
 * Composition:
 *   <Progress value={42} max={100} intent="success" aria-label="Upload" />
 *   <Progress indeterminate aria-label="Building" />
 *
 * A11y:
 *   - role="progressbar"
 *   - aria-valuenow / aria-valuemin / aria-valuemax (determinate)
 *   - aria-busy="true" when indeterminate
 *   - Respects `prefers-reduced-motion` (no animation when set)
 *
 * Used by `<UsageMeter>` to render each metric's fill bar, but ships as a
 * standalone primitive for direct consumer use (deploy phase, file upload,
 * build progress, quota fill).
 */

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  /** Current value (0..max). Values outside the range are clamped. */
  value?: number;
  /** Maximum value. Defaults to 100. */
  max?: number;
  /** Visual intent — controls fill color. */
  intent?: "default" | "success" | "warning" | "destructive";
  /** Bar height in tailwind units. Defaults to `"h-1"` (4px). */
  height?: "h-1" | "h-1.5" | "h-2" | "h-3";
  /** When true, animated bar with no value. Omits `aria-valuenow`, adds `aria-busy`. */
  indeterminate?: boolean;
  /** Accessible label. Required if not preceded by an `aria-labelledby` element. */
  "aria-label"?: string;
}

const INTENT_FILL: Record<NonNullable<ProgressProps["intent"]>, string> = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      intent = "default",
      height = "h-1",
      indeterminate = false,
      ...props
    },
    ref,
  ) => {
    const clampedMax = Math.max(0, max);
    const clampedValue = Math.min(clampedMax, Math.max(0, value));
    const percent = clampedMax > 0 ? (clampedValue / clampedMax) * 100 : 0;
    const fillClass = INTENT_FILL[intent];

    return (
      // biome-ignore lint/a11y/useFocusableInteractive: WAI-ARIA `progressbar` is a status role (https://www.w3.org/TR/wai-aria-1.2/#progressbar) — NOT supposed to be focusable; screen readers announce updates without keyboard navigation.
      <div
        data-slot="progress"
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={clampedMax}
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-busy={indeterminate ? true : undefined}
        className={cn("relative w-full overflow-hidden rounded-full bg-muted", height, className)}
        {...props}
      >
        {indeterminate ? (
          <div
            className={cn(
              "absolute inset-y-0 left-0 w-1/3 rounded-full",
              "animate-[progress-indeterminate_1.4s_ease-in-out_infinite] motion-reduce:animate-none",
              "motion-reduce:w-full motion-reduce:opacity-50",
              fillClass,
            )}
          />
        ) : (
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-base ease-out-soft",
              "motion-reduce:transition-none",
              fillClass,
            )}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
