import type { Story } from "@ladle/react";
import { Bookmark, FileText, Terminal } from "lucide-react";
import { MentionMenu } from "./mention-menu.js";

export default { title: "Primitives / Agent / MentionMenu" };

export const Commands: Story = () => (
  <div className="relative h-72 max-w-xl rounded-xl border border-border/40 bg-card p-4 font-mono text-body-sm text-muted-foreground">
    <span>{"agent> /"}</span>
    <MentionMenu
      open
      trigger="/"
      items={[
        { id: "clear", label: "/clear", description: "Reset session", icon: Terminal },
        { id: "checkpoint", label: "/checkpoint", description: "Save state", icon: Terminal },
        { id: "undo", label: "/undo", description: "Undo last action", icon: Terminal },
        { id: "help", label: "/help", description: "Show help", icon: Terminal },
      ]}
      onSelect={() => undefined}
      onClose={() => undefined}
    />
  </div>
);

export const Files: Story = () => (
  <div className="relative h-72 max-w-xl rounded-xl border border-border/40 bg-card p-4 font-mono text-body-sm text-muted-foreground">
    <span>{"agent> @"}</span>
    <MentionMenu
      open
      trigger="@"
      items={[
        {
          id: "1",
          label: "src/components/AlignmentGrid.tsx",
          description: "modified · +85 −12",
          icon: FileText,
        },
        {
          id: "2",
          label: "src/components/PanelGrid.tsx",
          description: "new",
          icon: FileText,
        },
        {
          id: "3",
          label: "src/styles/tokens.css",
          description: "modified · +2 −1",
          icon: FileText,
        },
      ]}
      onSelect={() => undefined}
      onClose={() => undefined}
    />
  </div>
);

export const Memories: Story = () => (
  <div className="relative h-72 max-w-xl rounded-xl border border-border/40 bg-card p-4 font-mono text-body-sm text-muted-foreground">
    <span>{"agent> #"}</span>
    <MentionMenu
      open
      trigger="#"
      items={[
        {
          id: "1",
          label: "#alignment-grid",
          description: "uses snap, not stiffness",
          icon: Bookmark,
        },
        { id: "2", label: "#auth-flow", description: "device flow + OAuth PKCE", icon: Bookmark },
        {
          id: "3",
          label: "#typescript-imports",
          description: "all .js extensions per ESM",
          icon: Bookmark,
        },
      ]}
      onSelect={() => undefined}
      onClose={() => undefined}
    />
  </div>
);

export const Empty: Story = () => (
  <div className="relative h-72 max-w-xl rounded-xl border border-border/40 bg-card p-4 font-mono text-body-sm text-muted-foreground">
    <span>{"agent> @unknown"}</span>
    <MentionMenu
      open
      trigger="@"
      items={[]}
      onSelect={() => undefined}
      onClose={() => undefined}
      emptyLabel="No matching files"
    />
  </div>
);
