import { type HTMLAttributes, forwardRef } from "react";

import { cn } from "../../../lib/cn.js";

/**
 * BranchIndicator — small "×N" pill that shows when a run was retried/branched.
 *
 * Renders `null` when `branchCount < 2` OR when not a positive integer.
 * EC-10 guard: parametrized over [-1, 0, 0.5] in tests.
 */

export interface BranchIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  branchCount: number;
  tooltipText?: string;
  "data-testid"?: string;
}

export const BranchIndicator = forwardRef<HTMLSpanElement, BranchIndicatorProps>(
  ({ branchCount, tooltipText, className, "data-testid": dataTestId, ...rest }, ref) => {
    if (!Number.isInteger(branchCount) || branchCount < 2) return null;
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border border-border bg-muted",
          "px-1.5 py-0.5 font-medium text-muted-foreground text-xs",
          className,
        )}
        title={tooltipText ?? `Run branched ${branchCount - 1} time${branchCount > 2 ? "s" : ""}`}
        data-testid={dataTestId ?? "branch-indicator"}
        data-branch-count={branchCount}
        {...rest}
      >
        ×{branchCount}
      </span>
    );
  },
);
BranchIndicator.displayName = "BranchIndicator";
