import { ConfirmPrompt } from "@theokit/ui";



export const Default = () => (
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

export const Destructive = () => (
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
