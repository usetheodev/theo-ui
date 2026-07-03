import { ChoicePrompt, type ChoicePromptResult } from "@theokit/ui";
import { useState } from "react";

const DEPLOY_OPTIONS = [
  { value: "blue-green", label: "Blue-green", description: "Zero downtime, 2x infra cost" },
  { value: "rolling", label: "Rolling", description: "Gradual rollout, no cost spike" },
  { value: "recreate", label: "Recreate", description: "Cheapest, brief downtime" },
];

export const Default = () => {
  const [value, setValue] = useState<string>();
  return (
    <div className="max-w-xl">
      <ChoicePrompt
        question="Which deploy strategy?"
        badge="Deploy"
        description="Pick how the new version rolls out to production."
        options={DEPLOY_OPTIONS}
        value={value}
        onValueChange={setValue}
        onConfirm={(r: ChoicePromptResult) => console.log(r)}
        onCancel={() => setValue(undefined)}
      />
    </div>
  );
};

export const WithOther = () => (
  <div className="max-w-xl">
    <ChoicePrompt
      question="Which region should we deploy to?"
      badge="Region"
      options={[
        { value: "us-east-1", label: "us-east-1", description: "N. Virginia" },
        { value: "eu-west-1", label: "eu-west-1", description: "Ireland" },
      ]}
      allowOther
      otherPlaceholder="Enter a custom region…"
      onConfirm={(r: ChoicePromptResult) => console.log(r)}
    />
  </div>
);

export const WithPreview = () => {
  const [value, setValue] = useState("compact");
  return (
    <div className="max-w-3xl">
      <ChoicePrompt
        question="Which layout?"
        badge="Layout"
        value={value}
        onValueChange={setValue}
        options={[
          {
            value: "compact",
            label: "Compact",
            description: "Dense rows, more on screen",
            preview:
              "┌ Compact ───────┐\n│ ▪ row          │\n│ ▪ row          │\n│ ▪ row          │\n└────────────────┘",
          },
          {
            value: "comfortable",
            label: "Comfortable",
            description: "Roomy rows, easier scan",
            preview:
              "┌ Comfortable ───┐\n│  ▪ row         │\n│                │\n│  ▪ row         │\n└────────────────┘",
          },
        ]}
        onConfirm={(r: ChoicePromptResult) => console.log(r)}
      />
    </div>
  );
};

export const Disabled = () => (
  <div className="max-w-xl">
    <ChoicePrompt
      question="Pick a plan"
      options={[
        { value: "hobby", label: "Hobby", description: "Free" },
        { value: "pro", label: "Pro", description: "$20/mo" },
        { value: "enterprise", label: "Enterprise", description: "Contact sales", disabled: true },
      ]}
      onConfirm={(r: ChoicePromptResult) => console.log(r)}
    />
  </div>
);
