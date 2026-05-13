import type { Story } from "@ladle/react";
import { AgentEditor } from "./agent-editor.js";

export default { title: "Primitives / Agent / AgentEditor" };

const MODELS = [
  { id: "opus-4-7", label: "Opus 4.7" },
  { id: "sonnet-4-6", label: "Sonnet 4.6" },
  { id: "haiku-4-5", label: "Haiku 4.5" },
];

const SKILLS = [
  { id: "sk1", label: "diff-explainer" },
  { id: "sk2", label: "test-runner" },
  { id: "sk3", label: "security-audit" },
];

export const NewAgent: Story = () => (
  <div className="max-w-2xl rounded-xl border border-border/40 bg-card p-6">
    <AgentEditor
      models={MODELS}
      skills={SKILLS}
      onSave={() => undefined}
      onCancel={() => undefined}
    />
  </div>
);

export const EditExisting: Story = () => (
  <div className="max-w-2xl rounded-xl border border-border/40 bg-card p-6">
    <AgentEditor
      initial={{
        id: "a1",
        name: "Reviewer",
        initials: "RV",
        description: "Reviews code and writes regression tests before any fix.",
        tone: "info",
        model: "sonnet-4-6",
        systemPrompt:
          "You are the Reviewer. Your job is to spot bugs and write failing tests that demonstrate them before any code change.",
        allowedTools: ["Read", "Grep"],
        skillIds: ["sk1", "sk2"],
      }}
      models={MODELS}
      skills={SKILLS}
      onSave={() => undefined}
      onCancel={() => undefined}
      onDelete={() => undefined}
    />
  </div>
);
