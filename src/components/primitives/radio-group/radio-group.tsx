import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * RadioGroup — built on Radix RadioGroup.
 *
 * Composition:
 *   <RadioGroup value={v} onValueChange={setV}>
 *     <RadioGroup.Item value="a" id="a" />
 *     <Label htmlFor="a">Option A</Label>
 *   </RadioGroup>
 *
 * Group spaces items by 0.75rem vertically; switch to grid utilities if you
 * need horizontal/grid layouts.
 */

const RadioGroupRoot = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Root>,
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={cn("grid gap-3", className)} {...props} />
));
RadioGroupRoot.displayName = "RadioGroup";

const RadioGroupItem = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Item>,
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "aspect-square size-4 rounded-full border border-border bg-card text-primary",
      "transition-[border-color,box-shadow] duration-base ease-out-soft",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "data-[state=checked]:border-primary",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <Circle className="size-2 fill-primary text-primary" aria-hidden />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = "RadioGroup.Item";

const RadioGroup = RadioGroupRoot as typeof RadioGroupRoot & {
  Item: typeof RadioGroupItem;
};
RadioGroup.Item = RadioGroupItem;

export { RadioGroup };
