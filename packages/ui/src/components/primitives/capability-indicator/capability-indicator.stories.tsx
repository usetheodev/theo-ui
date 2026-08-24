import type { Story } from "@ladle/react";
import { CapabilityIndicator, capabilityPresets } from "./capability-indicator.js";

export default { title: "Primitives / Agent / CapabilityIndicator" };

export const AgentBar: Story = () => (
  <div className="grid gap-4">
    <CapabilityIndicator
      capabilities={[
        { ...capabilityPresets.read, state: "enabled" },
        { ...capabilityPresets.write, state: "active", hint: "Editing src/lib/cn.ts" },
        { ...capabilityPresets.bash, state: "enabled" },
        { ...capabilityPresets.network, state: "disabled" },
        { ...capabilityPresets.delete, state: "blocked" },
        { ...capabilityPresets.deploy, state: "enabled" },
        { ...capabilityPresets.llm, state: "enabled" },
      ]}
    />
  </div>
);
