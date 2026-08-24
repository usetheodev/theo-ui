import type { Story } from "@ladle/react";
import type { ToolUIPart } from "../../../types/chat.js";
import { AgentToolRenderer } from "./agent-tool-renderer.js";

export default { title: "Composites / Agent / AgentToolRenderer" };

const base = (over: Partial<ToolUIPart> & Pick<ToolUIPart, "type" | "toolName">): ToolUIPart => ({
  toolCallId: `call-${over.toolName}`,
  state: "output-available",
  ...over,
});

/** `read_file` → classified as `code` → rendered through `<CodeBlock>`. */
export const Code: Story = () => (
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

/** `shell` → classified as `terminal` → rendered through `<TerminalPanel>`. */
export const Terminal: Story = () => (
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

/** `git_diff` with a structured output → rendered through `<DiffViewer>`. */
export const Diff: Story = () => (
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

/** `list_dir` returning object rows → rendered through `<DataTable>`. */
export const DataTableKind: Story = () => (
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

/** `write_file` with a structured files output → rendered through `<CreatedFilesCard>`. */
export const CreatedFiles: Story = () => (
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

/** Unmapped tool name → falls back to the generic `<ToolCallPart>`. */
export const Fallback: Story = () => (
  <div className="w-full max-w-2xl">
    <AgentToolRenderer
      part={base({
        type: "tool-fetch_weather",
        toolName: "fetch_weather",
        input: { city: "Lisbon" },
        output: { tempC: 21, sky: "clear" },
      })}
    />
  </div>
);

/** An errored tool routes to `<ToolCallPart>` so the error is never swallowed. */
export const ErrorState: Story = () => (
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
