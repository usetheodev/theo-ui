import type { Story } from "@ladle/react";
import { useState } from "react";
import { type ApprovalMode, ApprovalModeSelector } from "./approval-mode-selector.js";

export default { title: "Primitives / Agent / ApprovalModeSelector" };

export const Interactive: Story = () => {
  const [mode, setMode] = useState<ApprovalMode>("ask");
  return (
    <div className="max-w-sm">
      <ApprovalModeSelector value={mode} onChange={setMode} />
      <p className="mt-3 font-mono text-muted-foreground text-xs">value: {mode}</p>
    </div>
  );
};
