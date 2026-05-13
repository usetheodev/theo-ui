import type { Story } from "@ladle/react";
import { type Metric, MetricsPanel } from "./metrics-panel.js";

export default { title: "Compostos / MetricsPanel" };

const spark = (n: number, seed = 1) =>
  Array.from({ length: n }, (_, i) => Math.abs(Math.sin((i + seed) * 0.7)) * 0.8 + 0.1);

const metrics: Metric[] = [
  { label: "Requests/s", value: "1.2k", delta: "+12%", deltaGood: true, sparkline: spark(18, 1) },
  {
    label: "p95 latency",
    value: "182",
    unit: "ms",
    delta: "-4ms",
    deltaGood: true,
    sparkline: spark(18, 2),
  },
  {
    label: "Error rate",
    value: "0.03",
    unit: "%",
    delta: "+0.01pp",
    deltaGood: false,
    sparkline: spark(18, 3),
  },
  { label: "CPU", value: "42", unit: "%", sparkline: spark(18, 4) },
  { label: "Memory", value: "1.4", unit: "GB", delta: "-0.2GB", deltaGood: true },
  { label: "Active deploys", value: "3" },
];

export const ObservabilityDashboard: Story = () => (
  <MetricsPanel
    title="Last 24 hours"
    description="acme-api · production · iad1"
    metrics={metrics}
  />
);
