/**
 * Pure aggregate + transpose helpers for `TokenUsagePoint[]` (M5-7).
 * No React — usable to drive metric displays, fixed-scale comparisons, or
 * other chart surfaces.
 */
import type { TokenUsagePoint } from "./token-usage-chart.js";

export interface UsageMetrics {
  totalInput: number;
  totalOutput: number;
  total: number;
  /** The largest per-period total (`input + output`); 0 for an empty series. */
  peak: number;
  pointCount: number;
}

/** Aggregate totals + the peak per-period total. Pure. */
export function toUsageMetrics(points: TokenUsagePoint[]): UsageMetrics {
  let totalInput = 0;
  let totalOutput = 0;
  let peak = 0;
  for (const p of points) {
    totalInput += p.input;
    totalOutput += p.output;
    const periodTotal = p.input + p.output;
    if (periodTotal > peak) peak = periodTotal;
  }
  return {
    totalInput,
    totalOutput,
    total: totalInput + totalOutput,
    peak,
    pointCount: points.length,
  };
}

export interface UsageSeries {
  labels: string[];
  input: number[];
  output: number[];
}

/** Transpose stacked points into parallel `labels`/`input`/`output` arrays. Pure. */
export function splitUsagePoints(points: TokenUsagePoint[]): UsageSeries {
  return {
    labels: points.map((p) => p.label),
    input: points.map((p) => p.input),
    output: points.map((p) => p.output),
  };
}
