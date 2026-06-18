import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { Progress } from "../../primitives/progress/index.js";

/**
 * UsageMeter — multi-metric stacked usage card.
 *
 * PaaS-shape sibling of `<CostMeter>` (which is mono-USD). Displays N
 * metrics with arbitrary units (GB, requests, build-minutes, seats) per
 * the reference TheoCloud dashboard mockup. Each row = label + value/max
 * + `<Progress>` fill bar.
 *
 * Composition:
 *
 *   <UsageMeter
 *     title="Last 30 days"
 *     action={<Badge variant="outline">Upgrade</Badge>}
 *     metrics={[
 *       { label: "Fast Data Transfer", value: 0, max: 100, unit: "GB" },
 *       { label: "Edge Requests", value: 0, max: 1_000_000, unit: "req",
 *         formatter: (v, m) => `${v} / ${m >= 1e6 ? `${m / 1e6}M` : m}` },
 *     ]}
 *   />
 *
 * Over-quota detection: when `value > max`, the value text gets the
 * `text-warning` class and the underlying `<Progress>` uses
 * `intent="warning"` (bar fills 100% via Progress's own clamping).
 *
 * `compact` mode renders only the bars (no label/value text) — useful in
 * narrow nav-bar slots.
 *
 * Imports the sibling `<Progress>` primitive via relative path (per RFC
 * dashboard-paas-primitives D3) — primitives must not depend on the
 * `@theokit/ui` barrel.
 */

export interface UsageMetric {
  /** Display label (e.g. "Fast Data Transfer"). */
  label: ReactNode;
  /** Current consumption. */
  value: number;
  /** Maximum allowed in the current period. */
  max: number;
  /** Unit string (e.g. "GB", "req", "min"). Rendered after value/max. */
  unit?: string;
  /** Optional custom formatter — overrides default `${value} / ${max} ${unit}`. */
  formatter?: (value: number, max: number, unit?: string) => string;
}

export interface UsageMeterProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Card title (e.g. "Last 30 days", "This billing period"). */
  title?: ReactNode;
  /** Optional right-aligned action slot (e.g. an Upgrade Badge or Button). */
  action?: ReactNode;
  /** Array of metrics to display. Order preserved. */
  metrics: UsageMetric[];
  /** When true, show only the bars without label/value text (sparkline mode). */
  compact?: boolean;
}

function defaultFormat(value: number, max: number, unit?: string): string {
  return `${value} / ${max}${unit ? ` ${unit}` : ""}`;
}

function metricAriaLabel(metric: UsageMetric, formatted: string): string {
  // Label may be a ReactNode; coerce to string for aria-label.
  const label = typeof metric.label === "string" ? metric.label : "metric";
  return `${label}: ${formatted}`;
}

const UsageMeter = forwardRef<HTMLDivElement, UsageMeterProps>(
  ({ className, title, action, metrics, compact = false, ...props }, ref) => {
    const hasHeader = Boolean(title) || Boolean(action);
    return (
      <div
        data-slot="usage-meter"
        ref={ref}
        className={cn(
          "grid gap-3 rounded-xl border border-border bg-card p-4",
          compact && "gap-2",
          className,
        )}
        data-theo-usage-meter=""
        {...props}
      >
        {hasHeader ? (
          <header className="flex items-baseline justify-between gap-3">
            {title ? (
              <span
                className={cn(
                  "font-mono text-label-caps text-muted-foreground uppercase tracking-wider",
                )}
              >
                {title}
              </span>
            ) : (
              <span />
            )}
            {action ? <div className="shrink-0">{action}</div> : null}
          </header>
        ) : null}

        {metrics.map((metric, idx) => {
          const overQuota = metric.value > metric.max;
          const fmt = metric.formatter ?? defaultFormat;
          const formatted = fmt(metric.value, metric.max, metric.unit);
          const intent = overQuota ? "warning" : "default";
          // Each metric needs a stable key. Without a unique id field we
          // synthesize one from label + idx — duplicates resolve via the
          // index suffix.
          const key = `${typeof metric.label === "string" ? metric.label : "metric"}-${idx}`;

          if (compact) {
            return (
              <Progress
                key={key}
                value={metric.value}
                max={metric.max}
                intent={intent}
                aria-label={metricAriaLabel(metric, formatted)}
              />
            );
          }

          return (
            <div key={key} className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-body-sm">
                <span className="truncate text-muted-foreground">{metric.label}</span>
                <span
                  className={cn(
                    "shrink-0 font-mono tabular-nums",
                    overQuota ? "text-warning" : "text-foreground",
                  )}
                >
                  {formatted}
                </span>
              </div>
              <Progress
                value={metric.value}
                max={metric.max}
                intent={intent}
                aria-label={metricAriaLabel(metric, formatted)}
              />
            </div>
          );
        })}
      </div>
    );
  },
);
UsageMeter.displayName = "UsageMeter";

export { UsageMeter };
