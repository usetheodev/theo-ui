import { type VariantProps, cva } from "class-variance-authority";
import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Badge — small status / tag indicator.
 *
 * Variants:
 *   - default     muted surface, hairline border
 *   - primary     violet outline + soft violet bg
 *   - accent      burnt sienna (celebration / pro / beta)
 *   - success     deploy succeeded
 *   - warning     attention needed
 *   - destructive failed
 *   - outline     transparent, just border
 *
 * Status dots are inlined via `<Badge.Dot />` for things like "Building…",
 * "Running", "Failed" rows in deployment lists.
 */
const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
    "font-sans text-label uppercase tracking-wider",
    "transition-colors",
  ],
  {
    variants: {
      variant: {
        default: "border-border/40 bg-muted text-muted-foreground",
        primary: "border-primary/30 bg-primary/10 text-primary",
        accent: "border-accent/40 bg-accent/15 text-accent",
        success: "border-success/40 bg-success/15 text-success",
        warning: "border-warning/40 bg-warning/15 text-warning",
        destructive: "border-destructive/40 bg-destructive/15 text-destructive",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, ...props }, ref) => (
  <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
));
Badge.displayName = "Badge";

interface BadgeDotProps extends HTMLAttributes<HTMLSpanElement> {
  pulse?: boolean;
  tone?: "primary" | "accent" | "success" | "warning" | "destructive" | "muted";
}

const toneClass: Record<NonNullable<BadgeDotProps["tone"]>, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  muted: "bg-muted-foreground",
};

const Dot = forwardRef<HTMLSpanElement, BadgeDotProps>(
  ({ className, pulse = false, tone = "success", ...props }, ref) => (
    <span
      ref={ref}
      aria-hidden
      className={cn(
        "inline-block size-1.5 rounded-full",
        toneClass[tone],
        pulse && "animate-pulse-glow",
        className,
      )}
      {...props}
    />
  ),
);
Dot.displayName = "Badge.Dot";

const BadgeWithDot = Badge as typeof Badge & { Dot: typeof Dot };
BadgeWithDot.Dot = Dot;

export { BadgeWithDot as Badge, badgeVariants };
