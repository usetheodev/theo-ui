import type { Story } from "@ladle/react";
import { SkillEditor } from "./skill-editor.js";

export default { title: "Primitives / Agent / SkillEditor" };

export const NewSkill: Story = () => (
  <div className="max-w-2xl rounded-xl border border-border/40 bg-card p-6">
    <SkillEditor onSave={() => undefined} onCancel={() => undefined} />
  </div>
);

export const EditExisting: Story = () => (
  <div className="max-w-2xl rounded-xl border border-border/40 bg-card p-6">
    <SkillEditor
      initial={{
        id: "s1",
        name: "diff-explainer",
        description: "Explain a diff in plain English.",
        instructions:
          "When invoked, read the diff via Read or Grep and produce a concise summary of intent + risk.",
        source: "user",
        state: "enabled",
        allowedTools: ["Read", "Grep"],
        triggers: ["explain diff", "summarize change"],
      }}
      onSave={() => undefined}
      onCancel={() => undefined}
      onDelete={() => undefined}
    />
  </div>
);
