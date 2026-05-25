import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { type VariantProps, cva } from "class-variance-authority";
import { Check, Minus } from "lucide-react";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Checkbox — built on Radix Checkbox.
 *
 * Supports tri-state via `checked="indeterminate"`. Violet fill when on,
 * border-only when off. Themed via tokens (--primary, --background).
 *
 * The `size` prop accepts `"sm" | "md" | "lg"`. Default `md` preserves the
 * 16px box from before this prop existed. The `sm` size keeps a >=24px
 * effective tap target via an invisible expanded hit area (WCAG 2.5.5).
 */
const checkboxVariants = cva(
  [
    "peer relative shrink-0 rounded-sm border border-border bg-card",
    "transition-[background-color,border-color,box-shadow] duration-base ease-out-soft",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
    "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      size: {
        sm: "size-3.5 before:absolute before:inset-[-5px] before:content-['']",
        md: "size-4",
        lg: "size-5",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const iconClassBySize: Record<
  NonNullable<VariantProps<typeof checkboxVariants>["size"]>,
  string
> = {
  sm: "size-2.5",
  md: "size-3.5",
  lg: "size-3.5",
};

interface CheckboxProps
  extends ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {}

const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, size, ...props }, ref) => {
    const iconClass = iconClassBySize[size ?? "md"];
    return (
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(checkboxVariants({ size }), className)}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          {props.checked === "indeterminate" ? (
            <Minus className={iconClass} aria-hidden="true" strokeWidth={3} />
          ) : (
            <Check className={iconClass} aria-hidden="true" strokeWidth={3} />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox, checkboxVariants };
