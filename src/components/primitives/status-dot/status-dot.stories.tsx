import type { Story } from "@ladle/react";
import { StatusDot, type StatusKind } from "./status-dot.js";

export default { title: "Primitives / Display / StatusDot" };

const kinds: StatusKind[] = ["live", "building", "failed", "idle", "warning"];

export const Kinds: Story = () => (
  <div className="flex gap-6">
    {kinds.map((k) => (
      <StatusDot key={k} status={k} aria-label={k} />
    ))}
  </div>
);

export const Sizes: Story = () => (
  <div className="flex items-center gap-6">
    <StatusDot status="live" size="xs" aria-label="xs" />
    <StatusDot status="live" size="sm" aria-label="sm" />
    <StatusDot status="live" size="md" aria-label="md" />
  </div>
);

export const WithLabels: Story = () => (
  <div className="flex flex-col gap-2">
    {kinds.map((k) => (
      <StatusDot key={k} status={k} label={k.charAt(0).toUpperCase() + k.slice(1)} />
    ))}
  </div>
);
