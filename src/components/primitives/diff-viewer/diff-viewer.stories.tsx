import type { Story } from "@ladle/react";
import { DiffViewer } from "./diff-viewer.js";

export default { title: "Primitives / Code / DiffViewer" };

export const Default: Story = () => (
  <DiffViewer
    className="max-w-3xl"
    path="src/components/AlignmentGrid.tsx"
    stats={{ added: 85, removed: 12 }}
    hunks={[
      {
        id: "h1",
        header: "@@ -424,5 +424,5 @@",
        lines: [
          { kind: "removed", oldNumber: 424, content: "<select stiffness={0.8}" },
          { kind: "added", newNumber: 424, content: "<select snap={true}" },
          { kind: "added", newNumber: 425, content: "  bounce={false}" },
          { kind: "unchanged", oldNumber: 425, newNumber: 426, content: "  align='center'" },
        ],
      },
      {
        id: "h2",
        collapsed: true,
        lines: Array.from({ length: 38 }, () => ({ kind: "unchanged" as const, content: "" })),
      },
      {
        id: "h3",
        header: "@@ -480,3 +481,3 @@",
        lines: [
          { kind: "removed", oldNumber: 480, content: "// old comment" },
          { kind: "added", newNumber: 481, content: "// new comment with rationale" },
          { kind: "unchanged", oldNumber: 481, newNumber: 482, content: "}" },
        ],
      },
    ]}
  />
);
