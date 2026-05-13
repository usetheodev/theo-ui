import type { Story } from "@ladle/react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "../button/button.js";
import { CreatedFilesCard } from "./created-files-card.js";

export default { title: "Primitives / Files / CreatedFilesCard" };

export const Default: Story = () => (
  <CreatedFilesCard
    className="max-w-xl"
    files={[
      {
        id: "1",
        name: "expense-report.xlsx",
        icon: FileSpreadsheet,
        size: "42 KB",
        destination: "Google Drive · /Reports",
        href: "#",
      },
      {
        id: "2",
        name: "summary.md",
        icon: FileText,
        size: "3 KB",
        destination: "Local · ~/Downloads",
      },
    ]}
    cta={<Button size="sm">Open all</Button>}
  />
);
