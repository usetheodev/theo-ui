import { ToolResult } from "@theokit/ui";
import { ToolCall } from "@theokit/ui";



export const Variants = () => (
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
