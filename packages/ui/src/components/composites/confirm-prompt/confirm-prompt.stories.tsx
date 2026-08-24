import type { Story } from "@ladle/react";
import { ConfirmPrompt } from "./confirm-prompt.js";

export default { title: "Composites / Prompts / ConfirmPrompt" };

export const Default: Story = () => (
  <div className="max-w-xl">
    <ConfirmPrompt
      question="Deploy to production?"
      badge="Deploy"
      description="This rolls out v2.3.0 to all regions."
      onConfirm={() => alert("confirmed")}
      onCancel={() => alert("cancelled")}
    />
  </div>
);

export const Destructive: Story = () => (
  <div className="max-w-xl">
    <ConfirmPrompt
      question="Delete the cluster?"
      badge="Danger"
      variant="destructive"
      description="This permanently removes all nodes and data. There is no undo."
      confirmLabel="Delete cluster"
      cancelLabel="Keep it"
      onConfirm={() => alert("deleted")}
      onCancel={() => alert("kept")}
    />
  </div>
);
