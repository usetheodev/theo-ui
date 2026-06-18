import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * DangerZone — destructive-actions section primitive.
 *
 * Red-bordered container with a title bar and `DangerZone.Action` rows.
 * Each Action is laid out as title + description on the left, with a
 * consumer-provided action slot (typically a destructive Button) on
 * the right. Rows are separated by hairline dividers; the last row
 * has no bottom border via `last:border-b-0`.
 *
 * The consumer supplies the destructive button — this primitive never
 * imports `<Button>`, keeping it free of internal `@theokit/ui` deps
 * (true primitive).
 *
 * @example
 *   <DangerZone>
 *     <DangerZone.Action
 *       title="Delete project"
 *       description="Permanently delete this project."
 *       action={<Button variant="destructive">Delete</Button>}
 *     />
 *   </DangerZone>
 */
export interface DangerZoneProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Section title. Default "Danger Zone". */
  title?: ReactNode;
}

const Root = forwardRef<HTMLElement, DangerZoneProps>(
  ({ className, title = "Danger Zone", children, ...props }, ref) => (
    <section
      ref={ref}
      aria-label={typeof title === "string" ? title : "Danger Zone"}
      className={cn("rounded-xl border border-destructive/30 bg-destructive/[0.02]", className)}
      {...props}
      data-slot="root"
    >
      <div className="border-destructive/20 border-b px-5 py-3 font-sans text-destructive text-label-caps uppercase tracking-wider">
        {title}
      </div>
      {children}
    </section>
  ),
);
Root.displayName = "DangerZone";

export interface DangerZoneActionProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  description: ReactNode;
  /** Consumer-provided destructive button (or any ReactNode). */
  action: ReactNode;
}

const Action = forwardRef<HTMLDivElement, DangerZoneActionProps>(
  ({ className, title, description, action, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between gap-4 border-destructive/10 border-b px-5 py-4 last:border-b-0",
        className,
      )}
      {...props}
      data-slot="action"
    >
      <div className="flex flex-col">
        <span className="font-medium font-sans text-body-sm text-foreground">{title}</span>
        <span className="mt-0.5 font-sans text-label text-muted-foreground">{description}</span>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  ),
);
Action.displayName = "DangerZone.Action";

type DangerZoneRoot = typeof Root & { Action: typeof Action };
const DangerZone: DangerZoneRoot = Object.assign(Root, { Action });

export { DangerZone };
