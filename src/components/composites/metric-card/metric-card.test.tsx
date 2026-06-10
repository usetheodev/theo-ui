import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MetricCard } from "./metric-card.js";

describe("MetricCard", () => {
  it("renders title and value", () => {
    render(<MetricCard title="Revenue" value="$12,345" />);
    expect(screen.getByText("Revenue")).toBeTruthy();
    expect(screen.getByText("$12,345")).toBeTruthy();
  });

  it("renders delta with positive trend → text-success (default)", () => {
    render(<MetricCard title="Users" value="1,234" delta={{ value: "+12%", trend: "up" }} />);
    const delta = screen.getByText("+12%").closest("span");
    expect(delta?.className).toMatch(/text-success/);
    expect(delta?.getAttribute("data-trend")).toBe("up");
  });

  it("renders delta with negative trend → text-destructive (default)", () => {
    render(<MetricCard title="Users" value="1,234" delta={{ value: "-5%", trend: "down" }} />);
    const delta = screen.getByText("-5%").closest("span");
    expect(delta?.className).toMatch(/text-destructive/);
  });

  it("EC-17: invertTrend swaps semantics — up becomes destructive", () => {
    render(
      <MetricCard title="Cost" value="$3,200" delta={{ value: "+18%", trend: "up" }} invertTrend />,
    );
    const delta = screen.getByText("+18%").closest("span");
    expect(delta?.className).toMatch(/text-destructive/);
  });

  it("EC-17: invertTrend — down becomes success", () => {
    render(
      <MetricCard
        title="Churn"
        value="2.1%"
        delta={{ value: "-0.5pp", trend: "down" }}
        invertTrend
      />,
    );
    const delta = screen.getByText("-0.5pp").closest("span");
    expect(delta?.className).toMatch(/text-success/);
  });

  it("neutral trend → text-muted-foreground regardless of invertTrend", () => {
    render(<MetricCard title="Users" value="1,234" delta={{ value: "0%", trend: "neutral" }} />);
    const delta = screen.getByText("0%").closest("span");
    expect(delta?.className).toMatch(/text-muted-foreground/);
  });

  it("renders hint when provided", () => {
    render(
      <MetricCard
        title="Revenue"
        value="$1k"
        delta={{ value: "+1%", trend: "up" }}
        hint="vs last month"
      />,
    );
    expect(screen.getByText("vs last month")).toBeTruthy();
  });

  it("renders icon when provided", () => {
    render(<MetricCard title="Revenue" value="$1k" icon={<span data-testid="icon">$</span>} />);
    expect(screen.getByTestId("icon")).toBeTruthy();
  });

  it("sets data-testid root attribute for smoke tests", () => {
    render(<MetricCard title="Foo" value="Bar" />);
    expect(screen.getByTestId("metric-card")).toBeTruthy();
  });
});
