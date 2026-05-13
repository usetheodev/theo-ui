import type { Story } from "@ladle/react";
import { useState } from "react";
import { AttachmentChip } from "./attachment-chip.js";

export default { title: "Primitives / Chat / AttachmentChip" };

const INITIAL = [
  { id: "1", name: "expense-report.xlsx", size: "42 KB", type: "spreadsheet" },
  { id: "2", name: "screenshot-2026-05-13.png", size: "1.2 MB", type: "image" },
  { id: "3", name: "deploy-config.yaml", size: "3 KB", type: "code" },
  { id: "4", name: "notes.txt", size: "412 B", type: "text" },
  {
    id: "5",
    name: "very-long-filename-that-will-truncate-because-it-is-just-too-much.pdf",
    size: "8 MB",
  },
];

export const Removable: Story = () => {
  const [items, setItems] = useState(INITIAL);
  return (
    <div className="flex max-w-2xl flex-wrap gap-2">
      {items.map((a) => (
        <AttachmentChip
          key={a.id}
          attachment={a}
          onRemove={(id) => setItems((cur) => cur.filter((x) => x.id !== id))}
        />
      ))}
    </div>
  );
};
