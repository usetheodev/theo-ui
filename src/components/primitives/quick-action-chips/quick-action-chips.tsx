import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";

export interface QuickAction {
  id: string;
  label: ReactNode;
  /** Icon component (e.g. from lucide-react). */
  icon?: IconComponent;
  /** When true, the chip is highlighted as the suggested next action. */
  primary?: boolean;
}

interface QuickActionChipsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  actions: QuickAction[];
  onSelect?: (id: string) => void;
}

/**
 * QuickActionChips — row of intent chips below a hero composer.
 *
 * Used in Chat Home ("Escrever / Aprender / Código / Assuntos pessoais")
 * and the Files panel.
 */
const QuickActionChips = forwardRef<HTMLDivElement, QuickActionChipsProps>(
  ({ className, actions, onSelect, ...props }, ref) => (
    <div
      data-slot="quick-action-chips"
      ref={ref}
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
      {...props}
    >
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelect?.(a.id)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-4",
              "font-medium font-sans text-body-sm",
              "transition-[box-shadow,background-color,border-color,color] duration-base ease-out-soft",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              a.primary
                ? "border-transparent bg-primary text-primary-foreground hover:shadow-glow"
                : "border-border/60 bg-card text-foreground hover:border-primary/40 hover:bg-muted",
            )}
          >
            {Icon ? <Icon className="size-4" /> : null}
            {a.label}
          </button>
        );
      })}
    </div>
  ),
);
QuickActionChips.displayName = "QuickActionChips";

export { QuickActionChips };
