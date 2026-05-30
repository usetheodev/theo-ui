import type { Story } from "@ladle/react";
import { useState } from "react";

import { ExportChatDialog, type ExportFormat } from "./export-chat-dialog.js";

export default { title: "Primitives / Agent / ExportChatDialog" };

export const Interactive: Story = () => {
  const [open, setOpen] = useState(true);
  return (
    <ExportChatDialog
      open={open}
      onOpenChange={setOpen}
      sessionLabel="sess_demo"
      onExport={async (format: ExportFormat) => {
        await new Promise((r) => setTimeout(r, 800));
        alert(`Exported as ${format}`);
      }}
    />
  );
};

export const SubsetFormats: Story = () => {
  const [open, setOpen] = useState(true);
  return (
    <ExportChatDialog
      open={open}
      onOpenChange={setOpen}
      availableFormats={["markdown", "json"]}
      onExport={(f) => alert(`Exported as ${f}`)}
    />
  );
};
