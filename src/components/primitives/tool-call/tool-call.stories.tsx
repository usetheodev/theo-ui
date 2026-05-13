import type { Story } from "@ladle/react";
import { ToolResult } from "../tool-result/tool-result.js";
import { ToolCall } from "./tool-call.js";

export default { title: "Primitives / Agent / ToolCall" };

export const Variants: Story = () => (
  <div className="grid max-w-2xl gap-3">
    <ToolCall name="bash" summary="Executou 2 comandos" />
    <ToolCall
      name="read_file"
      summary="Leu 18 arquivos"
      detail={
        <ToolResult variant="code">
          {`README.md
src/index.ts
src/lib/cn.ts
... (15 more)`}
        </ToolResult>
      }
    />
    <ToolCall
      defaultOpen
      summary="Search the codebase for occurrences of 'AgentEvent'"
      detail={<ToolResult>Found 12 matches across 5 files.</ToolResult>}
    />
  </div>
);
