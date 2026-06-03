import type { Story } from "@ladle/react";

import { StatusIndicator } from "./status-indicator.js";

export const AllStatuses: Story = () => (
  <div className="flex flex-col gap-3 p-6">
    <StatusIndicator status="online" label="Online" />
    <StatusIndicator status="offline" label="Offline" />
    <StatusIndicator status="degraded" label="Degraded" />
    <StatusIndicator status="info" label="Info" />
  </div>
);

export const Sizes: Story = () => (
  <div className="flex flex-col gap-3 p-6">
    <StatusIndicator status="online" label="Small (default)" size="sm" />
    <StatusIndicator status="online" label="Medium" size="md" />
  </div>
);

export const WithPulse: Story = () => (
  <div className="flex flex-col gap-3 p-6">
    <StatusIndicator status="online" label="Heartbeat" pulse />
    <StatusIndicator status="degraded" label="Reconnecting" pulse />
  </div>
);

export const DotOnly: Story = () => (
  <div className="flex gap-3 p-6">
    <StatusIndicator status="online" />
    <StatusIndicator status="offline" />
    <StatusIndicator status="degraded" />
    <StatusIndicator status="info" />
  </div>
);
