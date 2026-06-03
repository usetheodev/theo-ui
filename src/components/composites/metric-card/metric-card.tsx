import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { type HTMLAttributes, type ReactNode, forwardRef } from "react";

import { cn } from "../../../lib/cn.js";
import { Card } from "../../primitives/card/index.js";

/**
 * MetricCard — dashboard metric tile (composite).
 *
 * Pattern recurrente "Card + CardHeader + value + delta + trend icon" promoted
 * to a first-class composite per ADR-0007 community-best-practices plan.
 *
 * Trend → token mapping (default `invertTrend=false`):
 *   up    → text-success     (positive growth)
 *   down  → text-destructive (negative growth)
 *   neutral → text-muted-foreground
 *
 * EC-17 absorbed: pass `invertTrend` for metrics where "up is bad" (cost,
 * churn, latency). The mapping inverts cleanly:
 *   up    → text-destructive (cost growing = bad)
 *   down  → text-success     (cost dropping = good)
 *
 * @example
 *   <MetricCard title="Revenue" value="$12,345" delta={{ value: "+12%", trend: "up" }} />
 *   <MetricCard title="Monthly Cost" value="$3,200" delta={{ value: "+18%", trend: "up" }} invertTrend />
 */

export type MetricCardTrend = "up" | "down" | "neutral";

export interface MetricCardDelta {
  /** Display text (e.g., `"+12%"`, `"-3.4 pp"`, `"unchanged"`). */
  value: string;
  /** Trend direction — drives icon and color (subject to `invertTrend`). */
  trend: MetricCardTrend;
}

export interface MetricCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Metric label (e.g., "Revenue", "Active Users"). */
  title: string;
  /** Headline value (e.g., "$12,345", "1,234"). */
  value: ReactNode;
  /** Optional delta with trend direction. */
  delta?: MetricCardDelta;
  /** Optional subtle context line below the value (e.g., "vs last month"). */
  hint?: ReactNode;
  /** Optional icon rendered top-right (e.g., `<DollarSign />`). */
  icon?: ReactNode;
  /**
   * EC-17: invert default trend semantics. Use for Cost / Churn / Latency
   * metrics where "up" is bad. Default `false` (Revenue / Users / Conversions).
   */
  invertTrend?: boolean;
}

function trendColor(trend: MetricCardTrend, invert: boolean): string {
  if (trend === "neutral") return "text-muted-foreground";
  const isPositive = invert ? trend === "down" : trend === "up";
  return isPositive ? "text-success" : "text-destructive";
}

function TrendIcon({ trend, className }: { trend: MetricCardTrend; className?: string }) {
  if (trend === "up") return <TrendingUp className={cn("size-3.5", className)} aria-hidden />;
  if (trend === "down") return <TrendingDown className={cn("size-3.5", className)} aria-hidden />;
  return <Minus className={cn("size-3.5", className)} aria-hidden />;
}

export const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  ({ title, value, delta, hint, icon, invertTrend = false, className, ...rest }, ref) => {
    return (
      <Card
        ref={ref}
        // T5.5: `@container/metric-card` makes the tile responsive to its PARENT
        // width, not the viewport. Consumers can drop multiple cards into any
        // grid and child elements scale via `@sm:`, `@md:`, `@lg:` variants.
        className={cn("@container/metric-card flex flex-col gap-2 p-4", className)}
        data-testid="metric-card"
        {...rest}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {title}
          </span>
          {icon !== undefined && (
            <span className="text-muted-foreground" aria-hidden>
              {icon}
            </span>
          )}
        </div>
        {/* Value scales 2xl → 3xl when the card container exceeds 18rem. */}
        <div className="font-semibold @sm/metric-card:text-3xl text-2xl text-foreground tracking-tight">
          {value}
        </div>
        {(delta !== undefined || hint !== undefined) && (
          <div className="flex items-center gap-2 text-xs">
            {delta !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium",
                  trendColor(delta.trend, invertTrend),
                )}
                data-trend={delta.trend}
              >
                <TrendIcon trend={delta.trend} />
                {delta.value}
              </span>
            )}
            {hint !== undefined && <span className="text-muted-foreground">{hint}</span>}
          </div>
        )}
      </Card>
    );
  },
);
MetricCard.displayName = "MetricCard";
