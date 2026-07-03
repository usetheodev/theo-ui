import { TerminalPanel } from "@theokit/ui";



export const BuildLog = () => (
  <TerminalPanel
    className="max-w-3xl"
    lines={[
      { id: "1", kind: "command", content: "pnpm typecheck" },
      { id: "2", kind: "stdout", content: "> tsc --noEmit" },
      { id: "3", kind: "ok", content: "✓ typecheck passed (0 errors)" },
      { id: "4", kind: "command", content: "pnpm build" },
      { id: "5", kind: "stdout", content: "ESM dist/index.js 130.32 KB" },
      {
        id: "6",
        kind: "stderr",
        content: "AlignmentGrid.tsx(424,41): Property 'stiffness' is missing",
      },
      { id: "7", kind: "ok", content: "[vite] error resolved" },
      { id: "8", kind: "prompt", content: "_" },
    ]}
  />
);
