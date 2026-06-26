import { useState } from "react";

import { ExportChatDialog, type ExportFormat } from "@theokit/ui";



export const Interactive = () => {
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

export const SubsetFormats = () => {
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
