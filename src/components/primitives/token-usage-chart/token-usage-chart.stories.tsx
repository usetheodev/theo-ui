import type { Story } from "@ladle/react";
import { TokenUsageChart, type TokenUsagePoint } from "./token-usage-chart.js";

export default { title: "Primitives / Agent / TokenUsageChart" };

const WEEK: TokenUsagePoint[] = [
  { label: "Mon", input: 24_000, output: 6_000 },
  { label: "Tue", input: 41_000, output: 12_000 },
  { label: "Wed", input: 33_000, output: 8_500 },
  { label: "Thu", input: 67_000, output: 18_000 },
  { label: "Fri", input: 52_000, output: 14_000 },
  { label: "Sat", input: 9_000, output: 2_000 },
  { label: "Sun", input: 14_000, output: 3_500 },
];

export const Weekly: Story = () => (
  <TokenUsageChart className="max-w-2xl" points={WEEK} title="This week" />
);
