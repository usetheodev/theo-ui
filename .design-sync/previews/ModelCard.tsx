import { useState } from "react";
import { ModelCard, type ModelInfo, modelCapabilityPresets } from "@theokit/ui";



const MODELS: ModelInfo[] = [
  {
    id: "opus-4-7",
    name: "Opus 4.7",
    vendor: "Anthropic",
    tag: "smart",
    contextWindow: 1_000_000,
    maxOutput: 32_000,
    pricePerMInput: 15,
    pricePerMOutput: 75,
    cutoff: "Jan 2026",
    description: "Top capability, best reasoning, longest context.",
    capabilities: [
      { ...modelCapabilityPresets.vision, enabled: true },
      { ...modelCapabilityPresets.tools, enabled: true },
      { ...modelCapabilityPresets.reasoning, enabled: true },
      { ...modelCapabilityPresets.fineTuning, enabled: false },
    ],
  },
  {
    id: "sonnet-4-6",
    name: "Sonnet 4.6",
    vendor: "Anthropic",
    tag: "default",
    contextWindow: 200_000,
    maxOutput: 16_000,
    pricePerMInput: 3,
    pricePerMOutput: 15,
    cutoff: "Oct 2025",
    description: "The default workhorse — fast and well-balanced.",
    capabilities: [
      { ...modelCapabilityPresets.vision, enabled: true },
      { ...modelCapabilityPresets.tools, enabled: true },
      { ...modelCapabilityPresets.reasoning, enabled: true },
    ],
  },
  {
    id: "haiku-4-5",
    name: "Haiku 4.5",
    vendor: "Anthropic",
    tag: "fast",
    contextWindow: 200_000,
    maxOutput: 8_000,
    pricePerMInput: 0.8,
    pricePerMOutput: 4,
    cutoff: "Oct 2025",
    description: "Fastest, cheapest, suitable for high-throughput tasks.",
    capabilities: [
      { ...modelCapabilityPresets.tools, enabled: true },
      { ...modelCapabilityPresets.vision, enabled: false },
    ],
  },
];

export const Picker = () => {
  const [selected, setSelected] = useState("sonnet-4-6");
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {MODELS.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          selected={selected === model.id}
          onSelect={setSelected}
        />
      ))}
    </div>
  );
};
