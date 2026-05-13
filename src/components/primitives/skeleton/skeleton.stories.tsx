import type { Story } from "@ladle/react";
import { Skeleton } from "./skeleton.js";

export default { title: "Primitives / Foundations / Skeleton" };

export const Shapes: Story = () => (
  <div className="grid max-w-md gap-6">
    <section>
      <p className="mb-2 font-mono text-label-caps text-muted-foreground uppercase">Lines</p>
      <div className="grid gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </section>
    <section>
      <p className="mb-2 font-mono text-label-caps text-muted-foreground uppercase">Card</p>
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    </section>
  </div>
);
