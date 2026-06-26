import { CostMeter } from "@theokit/ui";

export const Variants = () => (
  <div className="grid max-w-md gap-4">
    <CostMeter cost={4.2} title="This session" />
    <CostMeter
      cost={42.18}
      budget={100}
      title="This month"
      delta={{ value: 8.3, period: "vs last month" }}
    />
    <CostMeter
      cost={114.5}
      budget={100}
      title="Over budget"
      delta={{ value: -12.5, period: "vs last month" }}
    />
    <CostMeter compact cost={4.2} />
    <CostMeter compact cost={42.18} budget={100} />
  </div>
);
