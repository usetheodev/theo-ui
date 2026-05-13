import type { Story } from "@ladle/react";
import { FileSearch, ListChecks, Pencil } from "lucide-react";
import { useState } from "react";
import { IntentSelector } from "./intent-selector.js";

export default { title: "Primitives / Agent / IntentSelector" };

const OPTIONS = [
  {
    id: "edit",
    label: "Edit",
    description: "Apply code changes directly.",
    icon: Pencil,
  },
  {
    id: "plan",
    label: "Plan",
    description: "Plan the change without executing.",
    icon: ListChecks,
  },
  {
    id: "review",
    label: "Review",
    description: "Analyze code and suggest improvements.",
    icon: FileSearch,
  },
];

export const Interactive: Story = () => {
  const [value, setValue] = useState("edit");
  return (
    <div className="flex max-w-xs flex-col gap-3 rounded-xl border border-border/40 bg-card p-4">
      <p className="font-mono text-label text-muted-foreground">Active intent: {value}</p>
      <IntentSelector value={value} onChange={setValue} options={OPTIONS} />
    </div>
  );
};
