import type { Story } from "@ladle/react";
import { useState } from "react";
import { TextPrompt, type TextPromptResult } from "./text-prompt.js";

export default { title: "Composites / Prompts / TextPrompt" };

export const Default: Story = () => {
  const [value, setValue] = useState("");
  return (
    <div className="max-w-xl">
      <TextPrompt
        question="What should we name the service?"
        badge="Naming"
        description="Lowercase, no spaces."
        placeholder="payments-api"
        required
        value={value}
        onValueChange={setValue}
        onConfirm={(r: TextPromptResult) => alert(JSON.stringify(r))}
        onCancel={() => setValue("")}
      />
    </div>
  );
};

export const Multiline: Story = () => (
  <div className="max-w-xl">
    <TextPrompt
      question="Describe the change in one paragraph"
      badge="Summary"
      multiline
      rows={5}
      placeholder="This change…"
      onConfirm={(r: TextPromptResult) => alert(JSON.stringify(r))}
    />
  </div>
);
