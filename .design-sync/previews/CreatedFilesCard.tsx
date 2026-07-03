import { Button, CreatedFilesCard } from "@theokit/ui";
import { FileSpreadsheet, FileText } from "lucide-react";

export const Default = () => (
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
