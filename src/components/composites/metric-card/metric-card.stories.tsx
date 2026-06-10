import type { Story } from "@ladle/react";
import { DollarSign, Users, Zap } from "lucide-react";

import { MetricCard } from "./metric-card.js";

export const Default: Story = () => (
  <div className="p-6">
    <MetricCard title="Revenue" value="$12,345" delta={{ value: "+12%", trend: "up" }} />
  </div>
);

export const WithHint: Story = () => (
  <div className="p-6">
    <MetricCard
      title="Active Users"
      value="1,234"
      delta={{ value: "+8.5%", trend: "up" }}
      hint="vs last week"
      icon={<Users className="size-4" />}
    />
  </div>
);

export const DashboardRow: Story = () => (
  <div className="grid grid-cols-1 gap-3 p-6 md:grid-cols-3">
    <MetricCard
      title="Revenue"
      value="$12,345"
      delta={{ value: "+12%", trend: "up" }}
      hint="vs last month"
      icon={<DollarSign className="size-4" />}
    />
    <MetricCard
      title="Active Users"
      value="1,234"
      delta={{ value: "+8.5%", trend: "up" }}
      hint="vs last week"
      icon={<Users className="size-4" />}
    />
    <MetricCard
      title="P95 Latency"
      value="142ms"
      delta={{ value: "+18ms", trend: "up" }}
      hint="vs last 24h"
      icon={<Zap className="size-4" />}
      invertTrend
    />
  </div>
);

export const InvertedTrend: Story = () => (
  <div className="grid grid-cols-2 gap-3 p-6">
    <MetricCard
      title="Monthly Cost"
      value="$3,200"
      delta={{ value: "+18%", trend: "up" }}
      invertTrend
    />
    <MetricCard
      title="Churn Rate"
      value="2.1%"
      delta={{ value: "-0.5pp", trend: "down" }}
      invertTrend
    />
  </div>
);
