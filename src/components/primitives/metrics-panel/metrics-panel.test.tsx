import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type Metric, MetricsPanel } from "./metrics-panel.js";

const metrics: Metric[] = [
  { label: "Requests/s", value: "1.2k", delta: "+12%", deltaGood: true },
  { label: "p95 latency", value: "182", unit: "ms", delta: "-4ms", deltaGood: true },
  { label: "Error rate", value: "0.03", unit: "%", delta: "+0.01pp", deltaGood: false },
  { label: "CPU", value: "42", unit: "%" },
];

describe("MetricsPanel", () => {
  it("renders title and description", () => {
    render(<MetricsPanel title="Last 24h" description="Across all regions" metrics={metrics} />);
    expect(screen.getByText("Last 24h")).toBeInTheDocument();
    expect(screen.getByText("Across all regions")).toBeInTheDocument();
  });

  it("renders every metric label and value", () => {
    render(<MetricsPanel metrics={metrics} />);
    expect(screen.getByText("Requests/s")).toBeInTheDocument();
    expect(screen.getByText("1.2k")).toBeInTheDocument();
    expect(screen.getByText("p95 latency")).toBeInTheDocument();
    expect(screen.getByText("182")).toBeInTheDocument();
  });

  it("renders unit suffix when provided", () => {
    render(<MetricsPanel metrics={[{ label: "RAM", value: "8", unit: "GB" }]} />);
    expect(screen.getByText("GB")).toBeInTheDocument();
  });

  it("renders delta with direction", () => {
    render(<MetricsPanel metrics={[{ label: "x", value: "1", delta: "+5%", deltaGood: true }]} />);
    expect(screen.getByText("+5%")).toBeInTheDocument();
  });

  it("fires onClick on interactive tile", async () => {
    const user = userEvent.setup();
    const handle = vi.fn();
    render(<MetricsPanel metrics={[{ label: "Requests", value: "100", onClick: handle }]} />);
    await user.click(screen.getByRole("button", { name: /Requests/ }));
    expect(handle).toHaveBeenCalledTimes(1);
  });

  it("renders non-interactive tile as div (no button role)", () => {
    render(<MetricsPanel metrics={[{ label: "x", value: "1" }]} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
