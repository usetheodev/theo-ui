import { useState } from "react";
import { ModelSelector } from "@theokit/ui";



const MODELS = [
  { id: "opus-4-7", label: "Opus 4.7", vendor: "Anthropic", tag: "smart" },
  { id: "sonnet-4-6", label: "Sonnet 4.6", vendor: "Anthropic", tag: "default" },
  { id: "haiku-4-5", label: "Haiku 4.5", vendor: "Anthropic", tag: "fast" },
  { id: "gpt-5-4", label: "GPT-5.4", vendor: "OpenAI" },
  { id: "gemini-2-5", label: "Gemini 2.5", vendor: "Google" },
];

export const Default = () => {
  const [value, setValue] = useState("sonnet-4-6");
  return <ModelSelector value={value} onChange={setValue} options={MODELS} />;
};
