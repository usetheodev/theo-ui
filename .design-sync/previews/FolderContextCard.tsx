import { FolderContextCard } from "@theokit/ui";



export const Tree = () => (
  <FolderContextCard
    className="max-w-sm"
    title="capturas"
    entries={[
      {
        id: "folder",
        name: "capturas",
        kind: "folder",
        open: true,
        children: [
          { id: "claude", name: "Instruções · CLAUDE.md", kind: "file" },
          {
            id: "draft",
            name: "Rascunho",
            kind: "folder",
            open: true,
            children: [
              { id: "p1", name: "2026_05_13.png", kind: "file" },
              { id: "p2", name: "2026_05_14.png", kind: "file" },
            ],
          },
          { id: "out", name: "Projeto-A", kind: "folder" },
        ],
      },
    ]}
  />
);
