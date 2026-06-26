import { useState } from "react";
import { SystemPromptEditor } from "@theokit/ui";



const DEFAULT = `You are Theo, an autonomous coding agent. You operate in a controlled sandbox.

Principles:
- Prefer the simplest solution that solves the problem.
- Stop and ask when below 95% confidence.
- Never run destructive commands without explicit confirmation.
- Honor the active permission matrix at all times.`;

export const Default = () => {
  const [override, setOverride] = useState("");
  return (
    <SystemPromptEditor
      className="max-w-2xl"
      defaultPrompt={DEFAULT}
      override={override}
      onOverrideChange={setOverride}
      tokenEstimate={override.length > 0 ? override.length / 4 : DEFAULT.length / 4}
    />
  );
};
