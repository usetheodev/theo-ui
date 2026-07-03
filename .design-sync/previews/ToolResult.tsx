import { ToolResult } from "@theokit/ui";



export const Variants = () => (
  <div className="grid max-w-2xl gap-4">
    <section className="grid gap-1">
      <p className="font-mono text-label-caps text-muted-foreground uppercase">text</p>
      <ToolResult>Operation completed successfully. 18 files processed in 1.2 seconds.</ToolResult>
    </section>
    <section className="grid gap-1">
      <p className="font-mono text-label-caps text-muted-foreground uppercase">code</p>
      <ToolResult variant="code">
        {`$ pnpm test
✓ src/lib/cn.test.ts (5)
✓ src/components/primitives/button/button.test.tsx (10)
Test Files  22 passed
     Tests  122 passed`}
      </ToolResult>
    </section>
    <section className="grid gap-1">
      <p className="font-mono text-label-caps text-muted-foreground uppercase">json</p>
      <ToolResult variant="json">
        {`{
  "id": "dpl_8f3jka",
  "status": "live",
  "url": "https://acme-api.usetheo.dev",
  "duration_ms": 24700
}`}
      </ToolResult>
    </section>
  </div>
);
