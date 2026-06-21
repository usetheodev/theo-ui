import { describe, expect, it } from "vitest";
import type { TokenUsagePoint } from "./token-usage-chart.js";
import { splitUsagePoints, toUsageMetrics } from "./usage-metrics.js";

const pts: TokenUsagePoint[] = [
  { label: "a", input: 10, output: 5 },
  { label: "b", input: 2, output: 20 },
];

describe("toUsageMetrics (M5-7)", () => {
  it("computes totals + peak per-period total + count", () => {
    expect(toUsageMetrics(pts)).toEqual({
      totalInput: 12,
      totalOutput: 25,
      total: 37,
      peak: 22, // max(10+5, 2+20)
      pointCount: 2,
    });
  });
  it("returns zeros for empty input", () => {
    expect(toUsageMetrics([])).toEqual({
      totalInput: 0,
      totalOutput: 0,
      total: 0,
      peak: 0,
      pointCount: 0,
    });
  });
});

describe("splitUsagePoints (M5-7)", () => {
  it("transposes into parallel labels/input/output arrays", () => {
    expect(splitUsagePoints(pts)).toEqual({
      labels: ["a", "b"],
      input: [10, 2],
      output: [5, 20],
    });
  });
  it("returns empty parallel arrays for empty input", () => {
    expect(splitUsagePoints([])).toEqual({ labels: [], input: [], output: [] });
  });
});

describe("token-usage-chart barrel (M5-7 wiring)", () => {
  it("exposes the helpers", async () => {
    const mod = await import("./index.js");
    expect(typeof mod.toUsageMetrics).toBe("function");
    expect(typeof mod.splitUsagePoints).toBe("function");
  });
});
