import type { Story } from "@ladle/react";
import { FileEdit, FileText, Search, Terminal } from "lucide-react";
import { ToolCallCard } from "./tool-call-card.js";

export default { title: "Primitives / Agent / ToolCallCard" };

export const Statuses: Story = () => (
  <div className="grid max-w-2xl gap-2">
    <ToolCallCard tool="Bash" icon={Terminal} target="pnpm dev" status="running" />
    <ToolCallCard
      tool="Bash"
      icon={Terminal}
      target="tsc --noEmit"
      status="success"
      timestamp="9:58 PM"
      output={<pre className="whitespace-pre-wrap text-success">[vite] ready in 504 ms</pre>}
    />
    <ToolCallCard
      tool="Bash"
      icon={Terminal}
      target="pnpm test"
      status="failed"
      timestamp="9:59 PM"
      defaultExpanded
      output={
        <pre className="whitespace-pre-wrap text-destructive">
          FAIL src/components/AlignmentGrid.test.tsx{"\n"}
          {"  "}× renders snap mode (12ms){"\n"}
          {"    "}Expected: "snap"{"\n"}
          {"    "}Received: "stiffness"
        </pre>
      }
    />
    <ToolCallCard
      tool="Edit"
      icon={FileEdit}
      target="src/components/AlignmentGrid.tsx"
      status="success"
      timestamp="9:58 PM"
    />
    <ToolCallCard
      tool="Grep"
      icon={Search}
      target="stiffness"
      status="success"
      output={
        <pre className="whitespace-pre-wrap text-muted-foreground">
          src/components/AlignmentGrid.tsx:424: stiffness={"{"}0.8{"}"}
          {"\n"}
          src/components/PanelGrid.tsx:88: stiffness: 1{"\n"}
          src/styles/tokens.css:85: --align-stiffness: 0.8;
        </pre>
      }
    />
    <ToolCallCard tool="Read" icon={FileText} target="src/lib/cn.ts" status="queued" />
  </div>
);
