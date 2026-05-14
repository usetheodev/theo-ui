import type { Story } from "@ladle/react";
import { FilePlus, GitBranch, Rocket, Search, Settings, Terminal } from "lucide-react";
import { useState } from "react";
import { Button } from "../../primitives/button/index.js";
import { CommandPalette } from "./command-palette.js";

export default { title: "Composites / Code / CommandPalette" };

export const Default: Story = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open command palette (⌘K)</Button>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        // biome-ignore lint/suspicious/noConsole: demo story sink
        onSelect={(id) => console.log("selected", id)}
        items={[
          {
            id: "deploy",
            label: "Deploy production",
            hint: "theo deploy --env production",
            icon: Rocket,
            group: "Actions",
            searchable: "deploy production",
          },
          {
            id: "rollback",
            label: "Roll back to previous",
            hint: "theo rollback",
            icon: GitBranch,
            group: "Actions",
            searchable: "rollback revert",
          },
          {
            id: "new-file",
            label: "Create new file",
            icon: FilePlus,
            group: "Workspace",
            searchable: "new file create",
          },
          {
            id: "terminal",
            label: "Toggle terminal",
            hint: "⌃ + `",
            icon: Terminal,
            group: "Workspace",
            searchable: "terminal shell",
          },
          {
            id: "search",
            label: "Search project",
            hint: "⌘ + P",
            icon: Search,
            group: "Navigation",
            searchable: "search find",
          },
          {
            id: "settings",
            label: "Open settings",
            icon: Settings,
            group: "Navigation",
            searchable: "settings preferences",
          },
        ]}
      />
    </>
  );
};
