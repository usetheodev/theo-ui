import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * PlanBadge — semantic pricing-tier badge.
 *
 * Five canonical tiers (`free` / `hobby` / `pro` / `team` / `enterprise`) with
 * distinct color tokens. Consumers self-document intent with `plan="hobby"`
 * instead of mapping a generic `<Badge variant="outline">` to colors per app.
 * Future rebrand / dark-mode tweaks propagate automatically — no consumer
 * code change.
 *
 * Visual spec (per `theo/docs/handoff/2026-05-23-theo-ui-cloud-dashboard-gaps-brief.md`):
 *
 *   | tier         | bg                  | border                   | text                  |
 *   |--------------|---------------------|--------------------------|-----------------------|
 *   | free         | bg-muted/40         | border-muted-foreground/20 | text-muted-foreground |
 *   | hobby        | bg-warning/10       | border-warning/30        | text-warning          |
 *   | pro          | bg-primary/10       | border-primary/30        | text-primary          |
 *   | team         | bg-success/10       | border-success/30        | text-success          |
 *   | enterprise   | bg-foreground/5     | border-foreground/20     | text-foreground       |
 *
 * Default label capitalizes the tier (`hobby → "Hobby"`, `enterprise → "Enterprise"`).
 *
 * Used by `<AccountMenu>` inline with the user name; usable standalone.
 */

export type PlanTier = "free" | "hobby" | "pro" | "team" | "enterprise";

export interface PlanBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Plan tier identifier. */
  plan: PlanTier;
  /** Override the display label. Defaults to the capitalized tier name. */
  label?: string;
  /** Size variant. */
  size?: "sm" | "md";
}

const TIER_CLASS: Record<PlanTier, string> = {
  free: "bg-muted/40 border-muted-foreground/20 text-muted-foreground",
  hobby: "bg-warning/10 border-warning/30 text-warning",
  pro: "bg-primary/10 border-primary/30 text-primary",
  team: "bg-success/10 border-success/30 text-success",
  enterprise: "bg-foreground/5 border-foreground/20 text-foreground",
};

const SIZE_CLASS = {
  sm: "px-1.5 py-0 text-label-caps",
  md: "px-2 py-0.5 text-label",
} as const;

function defaultLabel(plan: PlanTier): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

const PlanBadge = forwardRef<HTMLSpanElement, PlanBadgeProps>(
  ({ className, plan, label, size = "md", ...props }, ref) => {
    // Runtime fallback for unknown tier (TypeScript prevents this at compile
    // time; the guard handles consumers casting an arbitrary string).
    const tierClass = TIER_CLASS[plan] ?? TIER_CLASS.free;
    const displayLabel = label ?? defaultLabel(plan);
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-md border",
          "font-mono uppercase tabular-nums tracking-wider",
          tierClass,
          SIZE_CLASS[size],
          className,
        )}
        data-plan={plan}
        {...props}
        data-slot="plan-badge"
      >
        {displayLabel}
      </span>
    );
  },
);
PlanBadge.displayName = "PlanBadge";

export { PlanBadge };
