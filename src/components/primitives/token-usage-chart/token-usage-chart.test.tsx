import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TokenUsageChart, type TokenUsagePoint } from "./token-usage-chart.js";

const points: TokenUsagePoint[] = [
  { label: "2026-05-10", input: 12_000, output: 4_000 },
  { label: "2026-05-11", input: 8_500, output: 2_300 },
];

describe("TokenUsageChart", () => {
  it("renders the default title and the legend", () => {
    render(<TokenUsageChart points={points} />);
    expect(screen.getByText(/Token usage/i)).toBeInTheDocument();
    expect(screen.getByText(/Input/)).toBeInTheDocument();
    expect(screen.getByText(/Output/)).toBeInTheDocument();
  });

  it("can hide the legend via showLegend=false", () => {
    render(<TokenUsageChart points={points} showLegend={false} />);
    expect(screen.queryByText(/Input/)).not.toBeInTheDocument();
  });

  it("renders an SVG bar for each point", () => {
    const { container } = render(<TokenUsageChart points={points} />);
    const rects = container.querySelectorAll("svg rect");
    expect(rects.length).toBeGreaterThanOrEqual(points.length);
  });
});
