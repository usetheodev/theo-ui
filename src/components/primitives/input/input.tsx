import { type VariantProps, cva } from "class-variance-authority";
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

const inputVariants = cva(
  [
    "flex w-full rounded-md border border-input bg-card",
    "text-foreground placeholder:text-muted-foreground",
    "transition-[box-shadow,border-color] duration-base ease-out-soft",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "focus-visible:border-primary",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "file:border-0 file:bg-transparent file:font-medium file:text-body-sm",
  ],
  {
    variants: {
      size: {
        sm: "h-8 px-2.5 py-1 text-body-sm",
        // md: density-tunable via CSS var. Comfortable (default) = 36px.
        md: "h-[var(--theo-control-h,2.25rem)] px-[var(--theo-control-px,0.875rem)] py-1.5 text-body-sm",
        lg: "h-11 px-4 py-2.5 text-body-md",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/**
 * Input — text input primitive.
 *
 * Violet Forge specifics:
 *   - height 40px (h-10) matching default Button md.
 *   - rounded-md (6px) — slightly less than buttons to differentiate.
 *   - focus uses violet ring (--ring).
 *   - placeholder uses --muted-foreground.
 *
 * The `size` prop accepts `"sm" | "md" | "lg"`. Default `md` preserves the
 * 40px tall input from before this prop existed. EC-1 (edge-case review):
 * this overrides the native HTML `size` attribute (text-input columns) —
 * use `{...{ size: 20 } as any}` if you genuinely need the HTML attribute,
 * which is exceedingly rare.
 */
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", size, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(inputVariants({ size }), className)}
      {...props}
      data-slot="input"
      data-size={size}
    />
  ),
);
Input.displayName = "Input";

export { Input, inputVariants };
