import { TrendingDown, TrendingUp } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn.js";

export interface Metric {
  /**
   * Short label, e.g. "Requests/s", "p95 latency", "Error rate".
   */
  label: string;
  /**
   * Pre-formatted value string, e.g. "1.2k", "182ms", "0.03%".
   * Consumer formats; the component does not parse.
   */
  value: string;
  /**
   * Optional unit suffix appended after value with .9 opacity.
   */
  unit?: string;
  /**
   * Optional change vs comparison period, e.g. "+12%", "-4ms", "+0.01pp".
   */
  delta?: string;
  /**
   * If true, delta is "good" (success color); if false, "bad" (destructive).
   * If omitted, delta is rendered in muted (neutral).
   *
   * Caller decides semantics — "more requests" is good but "more errors" is bad.
   */
  deltaGood?: boolean;
  /**
   * Optional sparkline data, 0..1 normalized. Consumer is responsible for normalization.
   */
  sparkline?: number[];
  /**
   * Optional onClick to drill into the metric.
   */
  onClick?: () => void;
}

interface MetricsPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  metrics: Metric[];
  /**
   * Grid columns. Defaults to auto-fit ~180px min.
   */
  columns?: number;
}

/**
 * MetricsPanel — grid of metric tiles for observability dashboards.
 *
 * Visual: each tile is a soft surface with a big value (font-display),
 * label uppercase muted, optional delta with arrow icon + tone color,
 * optional CSS-only sparkline drawn as flexed bars.
 *
 * No external chart lib — keeps the registry copy-pasteable.
 */
const MetricsPanel = forwardRef<HTMLDivElement, MetricsPanelProps>(
  ({ className, title, description, metrics, columns, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-xl border bg-card p-5 shadow-sm", className)} {...props}>
      {title || description ? (
        <header className="mb-4 grid gap-0.5">
          {title ? <h3 className="font-display text-title-md tracking-tight">{title}</h3> : null}
          {description ? <p className="text-body-sm text-muted-foreground">{description}</p> : null}
        </header>
      ) : null}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: columns
            ? `repeat(${columns}, minmax(0, 1fr))`
            : "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        {metrics.map((m) => (
          <Tile key={m.label} metric={m} />
        ))}
      </div>
    </div>
  ),
);
MetricsPanel.displayName = "MetricsPanel";

function Tile({ metric }: { metric: Metric }) {
  const interactive = metric.onClick !== undefined;
  const Tag = interactive ? "button" : "div";
  return (
    <Tag
      type={interactive ? "button" : undefined}
      onClick={metric.onClick}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border/30 bg-muted/30 p-4 text-left",
        "transition-colors duration-base ease-out-soft",
        interactive &&
          "hover:border-primary/40 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
      )}
    >
      <span className="font-sans text-label-caps text-muted-foreground uppercase">
        {metric.label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-bold font-display text-display-md tabular-nums leading-none">
          {metric.value}
        </span>
        {metric.unit ? (
          <span className="font-mono text-body-sm text-muted-foreground">{metric.unit}</span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {metric.delta ? <Delta metric={metric} /> : null}
        {metric.sparkline && metric.sparkline.length > 0 ? (
          <Sparkline values={metric.sparkline} />
        ) : null}
      </div>
    </Tag>
  );
}

function Delta({ metric }: { metric: Metric }) {
  const tone =
    metric.deltaGood === undefined
      ? "text-muted-foreground"
      : metric.deltaGood
        ? "text-success"
        : "text-destructive";
  const Icon = metric.deltaGood === false ? TrendingDown : TrendingUp;
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono text-body-sm", tone)}>
      <Icon className="size-3" /> {metric.delta}
    </span>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const clamped = values.map((v) => Math.max(0, Math.min(1, v)));
  return (
    <span className="ml-auto flex h-6 items-end gap-[2px]" aria-hidden>
      {clamped.map((v, idx) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: positional, values are not stable identifiers
          key={idx}
          className="w-[3px] rounded-sm bg-primary/60"
          style={{ height: `${Math.max(8, v * 100)}%` }}
        />
      ))}
    </span>
  );
}

export { MetricsPanel };
