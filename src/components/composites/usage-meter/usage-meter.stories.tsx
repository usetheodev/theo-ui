import type { Story } from "@ladle/react";
import { Badge } from "@usetheo/ui";
import { UsageMeter } from "./usage-meter.js";

export default { title: "Composites / Feedback / UsageMeter" };

export const Default: Story = () => (
  <div className="w-80">
    <UsageMeter
      title="Last 30 days"
      action={<Badge variant="outline">Upgrade</Badge>}
      metrics={[
        { label: "Fast Data Transfer", value: 12, max: 100, unit: "GB" },
        { label: "Fast Origin Transfer", value: 1, max: 10, unit: "GB" },
        {
          label: "Edge Requests",
          value: 12_000,
          max: 1_000_000,
          unit: "req",
          formatter: (v, m) =>
            `${v.toLocaleString()} / ${m >= 1_000_000 ? `${m / 1_000_000}M` : m.toLocaleString()}`,
        },
      ]}
    />
  </div>
);

export const OverQuota: Story = () => (
  <div className="w-80">
    <UsageMeter
      title="This billing period"
      action={<Badge variant="warning">Action needed</Badge>}
      metrics={[
        { label: "Build Minutes", value: 720, max: 600, unit: "min" },
        { label: "Bandwidth", value: 50, max: 100, unit: "GB" },
      ]}
    />
  </div>
);

export const Compact: Story = () => (
  <div className="w-64">
    <UsageMeter
      compact
      metrics={[
        { label: "Data", value: 12, max: 100, unit: "GB" },
        { label: "Requests", value: 12_000, max: 1_000_000, unit: "req" },
        { label: "Seats", value: 3, max: 5, unit: "seats" },
      ]}
    />
  </div>
);

export const SingleMetric: Story = () => (
  <div className="w-80">
    <UsageMeter title="Seats" metrics={[{ label: "Members", value: 3, max: 5 }]} />
  </div>
);
