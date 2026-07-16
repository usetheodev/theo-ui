import type { Story } from "@ladle/react";
import { useState } from "react";
import { CodeReviewPanel, type ReviewFile } from "./code-review-panel.js";

const FILES: ReviewFile[] = [
  {
    path: "agents/support-agent.ts",
    additions: 14,
    deletions: 3,
    diff: `--- a/agents/support-agent.ts
+++ b/agents/support-agent.ts
 import { defineAgent } from "@theokit/agents";
-  model: "openai/gpt-4o-mini",
+  model: "anthropic/claude-sonnet-4-6",
+  tools: [lookupTool],
 });`,
  },
  {
    path: "agents/tools/lookup.ts",
    additions: 22,
    deletions: 0,
    diff: `+++ b/agents/tools/lookup.ts
+import { defineTool } from "@theokit/agents";
+export const lookupTool = defineTool({
+  name: "lookup",
+});`,
  },
];

export const Interactive: Story = () => {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="h-[420px]">
      <CodeReviewPanel
        files={FILES}
        selectedPath={selected}
        onSelect={setSelected}
        onClose={() => undefined}
      />
    </div>
  );
};

export default { title: "Primitives / Code / CodeReviewPanel" };
