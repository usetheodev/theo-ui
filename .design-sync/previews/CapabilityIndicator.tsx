import { CapabilityIndicator, capabilityPresets } from "@theokit/ui";

export const AgentBar = () => (
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
