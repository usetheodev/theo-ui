import type { Story } from "@ladle/react";
import { useState } from "react";
import { ModelEffortPicker } from "./model-effort-picker.js";

const MODELS = [
  { id: "claude-fable-5", name: "Fable 5", blurb: "Deepest reasoning for complex builds" },
  { id: "claude-opus-4-8", name: "Opus 4.8", blurb: "Strong all-round builder" },
  { id: "claude-sonnet-4-6", name: "Sonnet 4.6", blurb: "Fast and balanced" },
  { id: "claude-haiku-4-5", name: "Haiku 4.5", blurb: "Snappy for quick edits" },
];

export const Interactive: Story = () => {
  const [model, setModel] = useState("claude-fable-5");
  const [effort, setEffort] = useState("Medium");
  return (
    <div className="flex justify-end">
      <ModelEffortPicker
        models={MODELS}
        model={model}
        onModelChange={setModel}
        effort={effort}
        onEffortChange={setEffort}
      />
    </div>
  );
};

export default { title: "Primitives / Agent / ModelEffortPicker" };
