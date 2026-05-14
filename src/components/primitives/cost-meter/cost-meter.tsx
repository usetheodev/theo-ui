import { Coins, TrendingDown, TrendingUp } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

interface CostMeterProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Current cost in USD. */
  cost: number;
  /** Optional monthly budget; renders progress bar when present. */
  budget?: number;
  /** Optional title (e.g. "This session", "Monthly"). */
  title?: ReactNode;
  /** Optional delta vs previous period. */
  delta?: { value: number; period: string };
  /** Compact mode — single-line summary. */
  compact?: boolean;
}

const formatUsd = (n: number) =>
  n >= 100 ? `$${n.toFixed(0)}` : n >= 10 ? `$${n.toFixed(1)}` : `$${n.toFixed(2)}`;

/**
 * CostMeter — gauge for token spend. Two visuals:
 *   - card: title + big number + optional progress bar + optional delta.
 *   - compact: chip "Coins $4.20" for nav bars.
 */
const CostMeter = forwardRef<HTMLDivElement, CostMeterProps>(
  ({ className, cost, budget, title = "Spend", delta, compact, ...props }, ref) => {
    if (compact) {
      return (
        <div
          ref={ref}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-2.5 py-1",
            "font-mono text-label",
            className,
          )}
          {...props}
        >
          <Coins className="size-3 text-primary" aria-hidden="true" />
          <span className="text-foreground tabular-nums">{formatUsd(cost)}</span>
          {budget ? <span className="text-muted-foreground">/ {formatUsd(budget)}</span> : null}
        </div>
      );
    }

    const ratio = budget ? Math.max(0, Math.min(1, cost / budget)) : 0;
    const percent = Math.round(ratio * 100);
    const overBudget = budget !== undefined && cost > budget;

    return (
      <div
        ref={ref}
        className={cn("grid gap-2 rounded-xl border bg-card p-4", className)}
        {...props}
      >
        <header className="flex items-baseline justify-between">
          <span className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          {delta ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-mono text-body-sm tabular-nums",
                delta.value >= 0 ? "text-warning" : "text-success",
              )}
            >
              {delta.value >= 0 ? (
                <TrendingUp className="size-3" aria-hidden="true" />
              ) : (
                <TrendingDown className="size-3" aria-hidden="true" />
              )}
              {delta.value >= 0 ? "+" : ""}
              {formatUsd(Math.abs(delta.value))}{" "}
              <span className="text-muted-foreground">{delta.period}</span>
            </span>
          ) : null}
        </header>
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold font-display text-display-md text-foreground tabular-nums leading-none">
            {formatUsd(cost)}
          </span>
          {budget !== undefined ? (
            <span className="font-mono text-body-sm text-muted-foreground">
              of {formatUsd(budget)}
            </span>
          ) : null}
        </div>
        {budget !== undefined ? (
          <div className="grid gap-1">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              tabIndex={-1}
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-[width,background-color]",
                  overBudget ? "bg-destructive" : ratio > 0.75 ? "bg-warning" : "bg-primary",
                )}
                style={{ width: `${Math.min(100, percent)}%` }}
              />
            </div>
            <span className="font-mono text-label text-muted-foreground tabular-nums">
              {percent}% of budget {overBudget ? "· over!" : "used"}
            </span>
          </div>
        ) : null}
      </div>
    );
  },
);
CostMeter.displayName = "CostMeter";

export { CostMeter };
