import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import { useInLiveRegion } from "../../../lib/live-region-context.js";

/**
 * Skeleton — placeholder block shown while content is loading.
 *
 * Uses --muted as base + a subtle shimmer that respects the violet theme.
 * Compose multiple Skeletons to mirror your component layout while loading.
 *
 * Accessibility (LOW-004): the default `role="status"` + `aria-live="polite"`
 * announces "Loading" to screen readers. In loops or grids where many
 * Skeletons mount simultaneously, this can be noisy. Override per-instance
 * with `aria-live="off"` and/or `aria-hidden` when only one container-level
 * loading announcement is desired:
 *
 *   <div role="status" aria-live="polite" aria-label="Loading deployments">
 *     {placeholders.map(id => (
 *       <Skeleton key={id} aria-live="off" aria-hidden="true" className="h-8" />
 *     ))}
 *   </div>
 */
const Skeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    // T4.1 (MF-4): when nested inside a container live region (BuildLogStream,
    // ChatThread, etc.), omit role/aria-live so AT doesn't announce every
    // placeholder mount as a separate "loading" event.
    const inLiveRegion = useInLiveRegion();
    return (
      <div
        ref={ref}
        role={inLiveRegion ? undefined : "status"}
        aria-live={inLiveRegion ? undefined : "polite"}
        aria-label={inLiveRegion ? undefined : "Loading"}
        className={cn("animate-pulse rounded-md bg-muted", className)}
        {...props}
      />
    );
  },
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
