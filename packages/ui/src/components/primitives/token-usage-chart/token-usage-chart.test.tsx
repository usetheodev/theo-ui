import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { TokenUsageChart, type TokenUsagePoint } from "./token-usage-chart.js";

const points: TokenUsagePoint[] = [
  { label: "2026-05-10", input: 12_000, output: 4_000 },
  { label: "2026-05-11", input: 8_500, output: 2_300 },
];

describe("TokenUsageChart", () => {
  it("renders the default title and the legend", () => {
    render(<TokenUsageChart points={points} />);
    // The default title appears as the heading (the sr-only table caption
    // also contains "Token usage" — we target the heading specifically).
    expect(screen.getByRole("heading", { name: /Token usage/i })).toBeInTheDocument();
    // Legend labels (singular "Input" / "Output") live in <footer>.
    expect(screen.getByText("Input")).toBeInTheDocument();
    expect(screen.getByText("Output")).toBeInTheDocument();
  });

  it("can hide the legend via showLegend=false", () => {
    render(<TokenUsageChart points={points} showLegend={false} />);
    // Legend text disappears; the sr-only table header "Input tokens" is the
    // only remaining occurrence — assert the legend variant is gone.
    expect(screen.queryByText("Input")).not.toBeInTheDocument();
  });

  it("renders an SVG bar for each point", () => {
    const { container } = render(<TokenUsageChart points={points} />);
    const rects = container.querySelectorAll("svg rect");
    expect(rects.length).toBeGreaterThanOrEqual(points.length);
  });

  // HIGH-013 — Screen readers need a tabular fallback because the SVG <title>
  // tooltip is unreliably exposed across NVDA / VoiceOver / JAWS. The sr-only
  // <table> exposes the same numeric series cell-by-cell.
  it("exposes an sr-only data table for screen readers", () => {
    render(<TokenUsageChart points={points} />);
    const table = screen.getByRole("table");
    expect(within(table).getByText(/Token usage by period/i)).toBeInTheDocument();
    // header row + one row per binned point
    const rows = within(table).getAllByRole("row");
    expect(rows.length).toBe(points.length + 1);
    // Numbers from the original series are present in the table
    expect(within(table).getByText("12000")).toBeInTheDocument();
    expect(within(table).getByText("4000")).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<TokenUsageChart points={points} />);
  });
});

/* ─── M5-7 — maxScale + splitSeries ──────────────────────────────────── */

const one: TokenUsagePoint[] = [{ label: "a", input: 5, output: 5 }];
const rectWidths = (c: HTMLElement): number[] =>
  [...c.querySelectorAll("rect")].map((r) => Number(r.getAttribute("width")));
const rectHeights = (c: HTMLElement): number[] =>
  [...c.querySelectorAll("rect")].map((r) => Number(r.getAttribute("height")));

describe("TokenUsageChart props (M5-7)", () => {
  it("shows a fixed y-axis max with maxScale", () => {
    render(<TokenUsageChart points={one} maxScale={1000} />);
    expect(screen.getByText("1.0k")).toBeInTheDocument(); // formatTokens(1000)
  });

  it("derives the header total via toUsageMetrics", () => {
    render(<TokenUsageChart points={[{ label: "x", input: 1000, output: 1000 }]} />);
    expect(screen.getByText(/total · 2\.0k/)).toBeInTheDocument();
  });

  it("renders full-width stacked bars sharing the same x by default", () => {
    const { container } = render(<TokenUsageChart points={one} />);
    expect(rectWidths(container).every((w) => w > 50)).toBe(true); // innerWidth ~98
    // stacked → both segments share one x column (distinguishes from grouped)
    const xs = [...container.querySelectorAll("rect")].map((r) => r.getAttribute("x"));
    expect(new Set(xs).size).toBe(1);
  });

  it("renders half-width grouped bars at distinct x with splitSeries", () => {
    const { container } = render(<TokenUsageChart points={one} splitSeries />);
    expect(rectWidths(container).every((w) => w < 50)).toBe(true); // half ~49
    const xs = [...container.querySelectorAll("rect")].map((r) => r.getAttribute("x"));
    expect(new Set(xs).size).toBe(2); // input + output side by side
  });

  it("clamps a stacked bar over maxScale to the scale, split PROPORTIONALLY (no overlap)", () => {
    const { container } = render(
      <TokenUsageChart points={[{ label: "a", input: 1000, output: 1000 }]} maxScale={1000} />,
    );
    // total 2000 > maxScale 1000 → totalH clamps to 100, split 50/50 (not both 100)
    const heights = rectHeights(container);
    expect(Math.max(...heights)).toBeLessThanOrEqual(100);
    expect(heights).toEqual([50, 50]);
  });

  it("clamps binned bars against a fixed maxScale", () => {
    const many = Array.from({ length: 120 }, (_, i) => ({
      label: `d${i}`,
      input: 50,
      output: 50,
    }));
    const { container } = render(<TokenUsageChart points={many} maxBars={10} maxScale={100} />);
    // each binned bar sums ~12 periods → far exceeds maxScale 100 → all clamp ≤ 100
    expect(Math.max(...rectHeights(container))).toBeLessThanOrEqual(100);
  });

  it("keeps the true value in the a11y table even when clamped", () => {
    render(
      <TokenUsageChart points={[{ label: "a", input: 1000, output: 5000 }]} maxScale={1000} />,
    );
    expect(screen.getByText("5000")).toBeInTheDocument();
  });
});
