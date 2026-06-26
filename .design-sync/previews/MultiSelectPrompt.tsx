import { useState } from "react";
import { MultiSelectPrompt, type MultiSelectPromptResult } from "@theokit/ui";



const CAPACITY_OPTIONS = [
  { value: "auto", label: "Auto-scaling", description: "Scale on demand" },
  { value: "spot", label: "Spot instances", description: "Cheaper, interruptible" },
  { value: "reserved", label: "Reserved", description: "Committed capacity" },
];

export const Default = () => {
  const [values, setValues] = useState<string[]>([]);
  return (
    <div className="max-w-xl">
      <MultiSelectPrompt
        question="Which capacity options should we enable?"
        badge="Scaling"
        description="Select any that apply."
        options={CAPACITY_OPTIONS}
        value={values}
        onValueChange={setValues}
        onConfirm={(r: MultiSelectPromptResult) => alert(JSON.stringify(r))}
        onCancel={() => setValues([])}
      />
    </div>
  );
};

export const WithOther = () => (
  <div className="max-w-xl">
    <MultiSelectPrompt
      question="Which channels should we notify?"
      badge="Notify"
      options={[
        { value: "email", label: "Email" },
        { value: "slack", label: "Slack" },
        { value: "webhook", label: "Webhook" },
      ]}
      allowOther
      otherPlaceholder="Add a custom channel…"
      onConfirm={(r: MultiSelectPromptResult) => alert(JSON.stringify(r))}
    />
  </div>
);

export const WithPreview = () => {
  const [values, setValues] = useState<string[]>(["dark"]);
  return (
    <div className="max-w-3xl">
      <MultiSelectPrompt
        question="Which theme variants to ship?"
        badge="Themes"
        value={values}
        onValueChange={setValues}
        options={[
          { value: "dark", label: "Dark", preview: "bg: #0a0a0a\nfg: #fafafa" },
          { value: "light", label: "Light", preview: "bg: #ffffff\nfg: #0a0a0a" },
          { value: "violet", label: "Violet Forge", preview: "bg: #1a0a2e\nfg: #e9d5ff" },
        ]}
        onConfirm={(r: MultiSelectPromptResult) => alert(JSON.stringify(r))}
      />
    </div>
  );
};
