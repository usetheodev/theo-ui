import type { Story } from "@ladle/react";
import { useState } from "react";
import type { Rule } from "../../../types/rule.js";
import { RuleEditor } from "./rule-editor.js";

export default { title: "Primitives / Agent / RuleEditor" };

const sample: Rule = {
  id: "r1",
  title: "Always write tests before fixes",
  body: "When fixing a bug, first write a failing regression test, then the fix. Commit the test in its own commit so the bisect history stays clean.",
  scope: "global",
  state: "enabled",
  tags: ["testing", "process"],
};

export const NewRule: Story = () => {
  const [saved, setSaved] = useState<unknown>(null);
  return (
    <div className="max-w-2xl rounded-xl border border-border/40 bg-card p-6">
      <RuleEditor onSave={(d) => setSaved(d)} onCancel={() => undefined} />
      {saved ? (
        <pre className="mt-4 overflow-x-auto rounded bg-muted/40 p-3 font-mono text-code-sm">
          {JSON.stringify(saved, null, 2)}
        </pre>
      ) : null}
    </div>
  );
};

export const EditExisting: Story = () => (
  <div className="max-w-2xl rounded-xl border border-border/40 bg-card p-6">
    <RuleEditor
      initial={sample}
      onSave={() => undefined}
      onCancel={() => undefined}
      onDelete={() => undefined}
    />
  </div>
);
