import * as SwitchPrimitive from "@radix-ui/react-switch";
import { type VariantProps, cva } from "class-variance-authority";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Switch — built on Radix Switch. Used for binary toggles (autoaccept,
 * dark mode preview, feature flags).
 *
 * Off-state uses --muted, on-state uses --primary with a subtle glow shadow
 * to mark "this is active" in the violet brand language.
 *
 * The `size` prop accepts `"sm" | "md" | "lg"`. Default `md` preserves the
 * 20×36 track from before this prop existed.
 */
const switchVariants = cva(
  [
    "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent",
    "transition-[background-color,box-shadow] duration-base ease-out-soft",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "data-[state=checked]:bg-primary data-[state=checked]:shadow-[0_0_8px_hsl(var(--primary)/0.35)]",
    "data-[state=unchecked]:bg-muted",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      size: {
        sm: "h-4 w-7",
        md: "h-5 w-9",
        lg: "h-6 w-11",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const thumbClassBySize: Record<NonNullable<VariantProps<typeof switchVariants>["size"]>, string> = {
  sm: "size-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0.5",
  md: "size-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5",
  lg: "size-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5",
};

interface SwitchProps
  extends ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {}

const Switch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  ({ className, size, ...props }, ref) => (
    <SwitchPrimitive.Root ref={ref} className={cn(switchVariants({ size }), className)} {...props}>
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-card shadow-sm",
          "transition-transform duration-base ease-out-soft",
          thumbClassBySize[size ?? "md"],
        )}
      />
    </SwitchPrimitive.Root>
  ),
);
Switch.displayName = "Switch";

export { Switch, switchVariants };
