import { useState } from "react";
import { MemoryEditor, type MemoryLayer, type MemoryScope } from "@theokit/ui";



const INITIAL: MemoryLayer[] = [
  {
    scope: "global",
    path: "~/.claude/CLAUDE.md",
    content: "# Theo global rules\n\n- Always respond in pt-BR.\n- 95% confidence rule.\n",
    modifiedAt: "1h ago",
  },
  {
    scope: "project",
    path: "./CLAUDE.md",
    content:
      "# theo-desktop\n\n- shadcn-style component library.\n- Default theme: Violet Forge.\n- Geist Sans + Geist Mono.\n",
    modifiedAt: "12m ago",
  },
  {
    scope: "session",
    path: ".claude/session/2026-05-13.md",
    content: "User is currently iterating on the agent components sprint.",
    modifiedAt: "just now",
  },
];

export const Interactive = () => {
  const [layers, setLayers] = useState(INITIAL);
  const [scope, setScope] = useState<MemoryScope>("project");
  return (
    <MemoryEditor
      className="max-w-2xl"
      layers={layers}
      activeScope={scope}
      onScopeChange={setScope}
      onContentChange={(s, content) =>
        setLayers((cur) =>
          cur.map((l) => (l.scope === s ? { ...l, content, modifiedAt: "just now" } : l)),
        )
      }
    />
  );
};
