import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";

interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Icon shown above the title. */
  icon?: IconComponent;
  title: ReactNode;
  description?: ReactNode;
  /** Optional action slot (typically <Button>). */
  action?: ReactNode;
  /** Hint shown above the title (e.g. uppercase eyebrow). */
  eyebrow?: ReactNode;
  /** Bordered dashed surface (placeholder vibe). Default true. */
  dashed?: boolean;
}

/**
 * EmptyState — visual placeholder for empty lists / first-run screens.
 *
 * Composition: icon + eyebrow + title + description + action. All slots are
 * optional except title.
 */
const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    { className, icon: Icon, title, description, action, eyebrow, dashed = true, ...props },
    ref,
  ) => (
    <div
      data-slot="empty-state"
      ref={ref}
      className={cn(
        "grid place-items-center gap-3 rounded-2xl border bg-card px-6 py-12 text-center",
        dashed ? "border-border/60 border-dashed" : "border-border/40",
        className,
      )}
      {...props}
    >
      {Icon ? (
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      ) : null}
      {eyebrow ? (
        <p className="font-mono text-label-caps text-muted-foreground uppercase">{eyebrow}</p>
      ) : null}
      <h3 className="font-display text-foreground text-title-md">{title}</h3>
      {description ? (
        <p className="max-w-md text-body-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  ),
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
