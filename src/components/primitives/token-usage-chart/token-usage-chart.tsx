import { forwardRef, useMemo } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

export interface TokenUsagePoint {
  /** ISO date or friendly label for the x-axis tooltip. */
  label: string;
  /** Input tokens for this period (e.g. day). */
  input: number;
  /** Output tokens for this period. */
  output: number;
}

interface TokenUsageChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  points: TokenUsagePoint[];
  /** Title above the chart. */
  title?: ReactNode;
  /** Chart height in px. Default 160. */
  height?: number;
  /** Show legend below the chart. Default true. */
  showLegend?: boolean;
  /**
   * Maximum number of bars to render. When `points.length` exceeds this, the
   * series is binned (summed in equal-width windows) so the chart stays
   * legible and SVG node count stays bounded. Default 60.
   */
  maxBars?: number;
}

function binPoints(points: TokenUsagePoint[], maxBars: number): TokenUsagePoint[] {
  if (points.length <= maxBars) return points;
  const binSize = Math.ceil(points.length / maxBars);
  const out: TokenUsagePoint[] = [];
  for (let i = 0; i < points.length; i += binSize) {
    const slice = points.slice(i, i + binSize);
    if (slice.length === 0) continue;
    const first = slice[0]?.label ?? "";
    const last = slice[slice.length - 1]?.label ?? first;
    out.push({
      label: slice.length === 1 ? first : `${first}…${last}`,
      input: slice.reduce((a, p) => a + p.input, 0),
      output: slice.reduce((a, p) => a + p.output, 0),
    });
  }
  return out;
}

const formatTokens = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
};

/**
 * TokenUsageChart — stacked-bar chart of input vs output tokens over time.
 *
 * Pure SVG, no chart lib. Width is fluid; bars adjust to viewBox. Hover any
 * bar to see the breakdown in the tooltip slot below.
 */
const TokenUsageChart = forwardRef<HTMLDivElement, TokenUsageChartProps>(
  (
    {
      className,
      points,
      title = "Token usage",
      height = 160,
      showLegend = true,
      maxBars = 60,
      ...props
    },
    ref,
  ) => {
    const series = useMemo(() => binPoints(points, maxBars), [points, maxBars]);
    const max = Math.max(1, ...series.map((p) => p.input + p.output));
    const barCount = series.length;
    const barWidth = 100 / Math.max(1, barCount);
    const gap = Math.min(2, barWidth * 0.2);
    const innerWidth = barWidth - gap;

    const total = series.reduce((acc, p) => acc + p.input + p.output, 0);

    return (
      <section
        ref={ref}
        className={cn("rounded-xl border bg-card p-4", className)}
        aria-label="Token usage over time"
        {...props}
        data-slot="token-usage-chart"
      >
        <header className="flex items-baseline justify-between gap-3">
          {title ? (
            <h3 className="font-display text-title-md tracking-tight">{title}</h3>
          ) : (
            <span />
          )}
          <span className="font-mono text-label text-muted-foreground tabular-nums">
            total · {formatTokens(total)}
          </span>
        </header>
        <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
          {/* Y-axis ticks */}
          <div
            className="grid font-mono text-label text-muted-foreground"
            style={{ height, gridTemplateRows: "1fr 1fr 1fr" }}
            aria-hidden="true"
          >
            <span className="tabular-nums">{formatTokens(max)}</span>
            <span className="tabular-nums">{formatTokens(max / 2)}</span>
            <span className="self-end tabular-nums">0</span>
          </div>
          {/* Chart */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full"
            style={{ height }}
            role="img"
            aria-label={`Token usage across ${barCount} periods`}
          >
            {/* gridlines */}
            {[25, 50, 75].map((y) => (
              <line
                key={y}
                x1={0}
                y1={y}
                x2={100}
                y2={y}
                stroke="hsl(var(--border) / 0.4)"
                strokeWidth={0.2}
              />
            ))}
            {series.map((p, idx) => {
              const totalH = ((p.input + p.output) / max) * 100;
              const inputH = (p.input / max) * 100;
              const outputH = (p.output / max) * 100;
              const x = idx * barWidth + gap / 2;
              return (
                <g key={p.label}>
                  <title>{`${p.label} — input ${formatTokens(p.input)} · output ${formatTokens(p.output)}`}</title>
                  {/* output (top, primary tone) */}
                  <rect
                    x={x}
                    y={100 - totalH}
                    width={innerWidth}
                    height={outputH}
                    fill="hsl(var(--primary))"
                    opacity={0.85}
                  />
                  {/* input (bottom, accent tone) */}
                  <rect
                    x={x}
                    y={100 - inputH}
                    width={innerWidth}
                    height={inputH}
                    fill="hsl(var(--accent))"
                    opacity={0.85}
                  />
                </g>
              );
            })}
          </svg>
        </div>
        {/* x-axis labels — aligned with the chart column of the parent grid */}
        <div
          className="mt-1 grid grid-cols-[auto_1fr] gap-2 font-mono text-label text-muted-foreground"
          aria-hidden="true"
        >
          <span aria-hidden="true" />
          <div className="grid" style={{ gridTemplateColumns: `repeat(${barCount}, 1fr)` }}>
            {series.map((p) => (
              <span key={p.label} className="truncate text-center">
                {p.label}
              </span>
            ))}
          </div>
        </div>
        {/* Screen-reader fallback: the SVG is decorative-ish for AT users.
         * `<title>` per bar is unreliably exposed across NVDA/VoiceOver/JAWS,
         * so we ship an `sr-only` table with the same data. Sighted users
         * never see this; AT users can navigate the values cell-by-cell.
         * Reference: WCAG 1.1.1 (Non-text content). */}
        <table className="sr-only">
          <caption>Token usage by period — input vs output</caption>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">Input tokens</th>
              <th scope="col">Output tokens</th>
            </tr>
          </thead>
          <tbody>
            {series.map((p) => (
              <tr key={`a11y-${p.label}`}>
                <td>{p.label}</td>
                <td>{p.input}</td>
                <td>{p.output}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {showLegend ? (
          <footer className="mt-3 flex items-center gap-4 font-mono text-label text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-accent" aria-hidden="true" />
              Input
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-primary" aria-hidden="true" />
              Output
            </span>
          </footer>
        ) : null}
      </section>
    );
  },
);
TokenUsageChart.displayName = "TokenUsageChart";

export { TokenUsageChart };
