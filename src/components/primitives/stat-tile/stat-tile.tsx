import { ArrowUpRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ElementType, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * StatTile — big number + label + optional delta + optional icon.
 *
 * Dual mode based on `onClick`:
 *   - With onClick → renders as `<button>` with hover state + trailing
 *     ArrowUpRight chevron (navigation affordance).
 *   - Without onClick → renders as static `<div>`.
 *
 * Delta trend drives icon + color: up=success/TrendingUp, down=destructive/
 * TrendingDown, flat=muted/Minus. Big value uses font-display + tabular-nums.
 *
 * @example
 *   <StatTile value="42" label="Projects" />
 *   <StatTile value="$1,234" label="MRR" icon={DollarSign}
 *             delta={{ value: "+12%", trend: "up" }} onClick={openBilling} />
 */
export interface StatTileProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "value"> {
  value: ReactNode;
  label: ReactNode;
  icon?: ElementType;
  delta?: { value: ReactNode; trend: "up" | "down" | "flat" };
}

const TREND: Record<"up" | "down" | "flat", { icon: ElementType; color: string }> = {
  up: { icon: TrendingUp, color: "text-success" },
  down: { icon: TrendingDown, color: "text-destructive" },
  flat: { icon: Minus, color: "text-muted-foreground" },
};

const StatTile = forwardRef<HTMLElement, StatTileProps>(
  ({ className, value, label, icon: Icon, delta, onClick, children: _children, ...props }, ref) => {
    const isInteractive = onClick !== undefined;
    const TrendIcon = delta !== undefined ? TREND[delta.trend].icon : null;
    const trendColor = delta !== undefined ? TREND[delta.trend].color : "";

    const inner = (
      <>
        {(Icon !== undefined || isInteractive) && (
          <div className="mb-3 flex items-center justify-between">
            {Icon !== undefined ? (
              <div className="flex size-8 items-center justify-center rounded-lg border border-border/40 bg-muted/40">
                <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
              </div>
            ) : (
              <div />
            )}
            {isInteractive ? (
              <ArrowUpRight
                aria-hidden="true"
                className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground"
              />
            ) : null}
          </div>
        )}
        <div className="whitespace-nowrap font-bold font-display text-display-md text-foreground tabular-nums leading-none tracking-tight">
          {value}
        </div>
        <div className="mt-1 font-sans text-body-sm text-muted-foreground">{label}</div>
        {delta !== undefined && TrendIcon !== null ? (
          <div
            className={cn("mt-2 inline-flex items-center gap-1 font-mono text-label", trendColor)}
          >
            <TrendIcon aria-hidden="true" className="size-3" />
            <span>{delta.value}</span>
          </div>
        ) : null}
      </>
    );

    if (isInteractive) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          onClick={onClick}
          className={cn(
            "group block w-full rounded-xl border border-border/40 bg-card p-5 text-left",
            "cursor-pointer transition-colors hover:border-primary/30",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            className,
          )}
          {...props}
          data-slot="stat-tile"
        >
          {inner}
        </button>
      );
    }

    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn("rounded-xl border border-border/40 bg-card p-5", className)}
        data-slot="stat-tile"
      >
        {inner}
      </div>
    );
  },
);
StatTile.displayName = "StatTile";

export { StatTile };
