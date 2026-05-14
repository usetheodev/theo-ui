import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";

export interface SocialProvider {
  id: string;
  label: ReactNode;
  /** Icon component (e.g. brand-specific SVG). */
  icon: IconComponent;
}

interface SocialAuthRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  providers: SocialProvider[];
  onSelect?: (id: string) => void;
  /**
   * Stack vertically instead of horizontally (single-column flow).
   */
  vertical?: boolean;
}

/**
 * SocialAuthRow — row of OAuth provider buttons.
 *
 * Stateless; caller wires the redirect on `onSelect`. Buttons share Theo button
 * styling but with provider icon prominently on the left.
 */
const SocialAuthRow = forwardRef<HTMLDivElement, SocialAuthRowProps>(
  ({ className, providers, onSelect, vertical, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "grid gap-2",
        vertical ? "grid-cols-1" : `grid-cols-${Math.min(providers.length, 4)}`,
        className,
      )}
      style={
        !vertical
          ? { gridTemplateColumns: `repeat(${providers.length}, minmax(0, 1fr))` }
          : undefined
      }
      {...props}
    >
      {providers.map((p) => {
        const Icon = p.icon;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect?.(p.id)}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card",
              "px-4 font-medium font-sans text-body-sm text-foreground",
              "transition-colors duration-base ease-out-soft",
              "hover:bg-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {p.label}
          </button>
        );
      })}
    </div>
  ),
);
SocialAuthRow.displayName = "SocialAuthRow";

export { SocialAuthRow };
