import { BookOpen } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";

interface ContextCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  /** Optional illustration slot (rendered above title). */
  illustration?: ReactNode;
  /** Icon for the title row — used when illustration is omitted. */
  icon?: IconComponent;
}

/**
 * ContextCard — generic "informational" card for the right inspector.
 *
 * Used as the "Contexto" card on Files screens: illustration / icon, title,
 * short description. Inert by design — no actions.
 */
const ContextCard = forwardRef<HTMLElement, ContextCardProps>(
  ({ className, title, description, illustration, icon, ...props }, ref) => {
    const Icon = icon ?? BookOpen;
    return (
      <section
        ref={ref}
        className={cn("grid gap-3 rounded-xl border border-border/40 bg-muted/30 p-4", className)}
        {...props}
      >
        {illustration ? (
          <div className="flex justify-center">{illustration}</div>
        ) : (
          <Icon className="size-5 text-primary" aria-hidden="true" />
        )}
        {title ? <h3 className="font-display text-title-md tracking-tight">{title}</h3> : null}
        {description ? <p className="text-body-sm text-muted-foreground">{description}</p> : null}
      </section>
    );
  },
);
ContextCard.displayName = "ContextCard";

export { ContextCard };
