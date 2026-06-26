import { AgentToolRenderer, type ToolUIPart } from "@theokit/ui";

const base = (over: Partial<ToolUIPart> & Pick<ToolUIPart, "type" | "toolName">): ToolUIPart => ({
  toolCallId: `call-${over.toolName}`,
  state: "output-available",
  ...over,
});

export const Code = () => (
  <div className="w-full max-w-2xl">
    <AgentToolRenderer
      part={base({
        type: "tool-read_file",
        toolName: "read_file",
        input: { path: "src/index.ts" },
        output: "export const greet = (name: string): string => `Hello, ${name}!`;\n",
      })}
    />
  </div>
);

export const Terminal = () => (
  <div className="w-full max-w-2xl">
    <AgentToolRenderer
      part={base({
        type: "tool-shell",
        toolName: "shell",
        input: { command: "pnpm test" },
        output:
          "✓ src/lib/cn.test.ts (3)\n✓ src/components/button.test.tsx (5)\n\nTest Files  2 passed",
      })}
    />
  </div>
);

export const Diff = () => (
  <div className="w-full max-w-2xl">
    <AgentToolRenderer
      part={base({
        type: "tool-git_diff",
        toolName: "git_diff",
        output: {
          path: "src/lib/cn.ts",
          stats: { added: 1, removed: 1 },
          hunks: [
            {
              id: "h1",
              header: "@@ -1,2 +1,2 @@",
              lines: [
                { kind: "removed", oldNumber: 1, content: "export const cn = clsx" },
                { kind: "added", newNumber: 1, content: "export const cn = twMerge" },
                { kind: "unchanged", oldNumber: 2, newNumber: 2, content: "" },
              ],
            },
          ],
        },
      })}
    />
  </div>
);

export const DataTableKind = () => (
  <div className="w-full max-w-2xl">
    <AgentToolRenderer
      part={base({
        type: "tool-list_dir",
        toolName: "list_dir",
        input: { path: "src/lib" },
        output: [
          { name: "cn.ts", type: "file", size: 412 },
          { name: "markdown", type: "directory", size: 0 },
        ],
      })}
    />
  </div>
);

export const CreatedFiles = () => (
  <div className="w-full max-w-2xl">
    <AgentToolRenderer
      part={base({
        type: "tool-write_file",
        toolName: "write_file",
        output: {
          title: "Patched 2 files",
          files: [
            { id: "src/a.ts", name: "a.ts" },
            { id: "src/b.ts", name: "b.ts" },
          ],
        },
      })}
    />
  </div>
);

export const ErrorState = () => (
  <div className="w-full max-w-2xl">
    <AgentToolRenderer
      part={base({
        type: "tool-shell",
        toolName: "shell",
        state: "output-error",
        input: { command: "pnpm typecheck" },
        errorText: "tsc exited with code 2: 3 type errors",
      })}
    />
  </div>
);
