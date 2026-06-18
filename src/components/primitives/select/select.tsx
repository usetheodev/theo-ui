import * as SelectPrimitive from "@radix-ui/react-select";
import { type VariantProps, cva } from "class-variance-authority";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Trigger size variant (theming-and-sizes plan T1.9).
 * Items inside Select.Content stay md-equivalent regardless — the floating
 * menu is isolated from the trigger context (documented decision).
 *
 * EC-2 guard: `<Select.Trigger>` is a Radix `<button>` — no SelectHTMLAttributes
 * conflict to Omit. Verified before implementation.
 */
const selectTriggerVariants = cva(
  [
    "flex w-full items-center justify-between gap-2 rounded-md border border-input bg-card",
    "text-foreground placeholder:text-muted-foreground",
    "transition-[border-color,box-shadow] duration-base ease-out-soft",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "focus-visible:border-primary",
    "data-[placeholder]:text-muted-foreground",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "[&>span]:line-clamp-1",
  ],
  {
    variants: {
      size: {
        sm: "h-8 px-2.5 py-1 text-body-sm",
        md: "h-[var(--theo-control-h,2.25rem)] px-[var(--theo-control-px,0.875rem)] py-1.5 text-body-sm",
        lg: "h-11 px-4 py-2.5 text-body-md",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/**
 * Select — styled wrapper around Radix Select.
 *
 * Composition:
 *   <Select value={value} onValueChange={setValue}>
 *     <Select.Trigger>
 *       <Select.Value placeholder="Pick…" />
 *     </Select.Trigger>
 *     <Select.Content>
 *       <Select.Group>
 *         <Select.Label>Group</Select.Label>
 *         <Select.Item value="a">A</Select.Item>
 *       </Select.Group>
 *     </Select.Content>
 *   </Select>
 *
 * Trigger matches Input height + violet focus ring. Content uses popover
 * surface with check on the selected item.
 */

interface SelectTriggerProps
  extends ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    VariantProps<typeof selectTriggerVariants> {}

const SelectTrigger = forwardRef<ElementRef<typeof SelectPrimitive.Trigger>, SelectTriggerProps>(
  ({ className, children, size, ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(selectTriggerVariants({ size }), className)}
      {...props}
      data-slot="select-trigger"
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  ),
);
SelectTrigger.displayName = "Select.Trigger";

const SelectScrollUpButton = forwardRef<
  ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
    data-slot="select-scroll-up-button"
  >
    <ChevronUp className="size-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = "Select.ScrollUpButton";

const SelectScrollDownButton = forwardRef<
  ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
    data-slot="select-scroll-down-button"
  >
    <ChevronDown className="size-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = "Select.ScrollDownButton";

const SelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md",
        "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in",
        "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
        position === "popper" && "data-[side=top]:-translate-y-1 data-[side=bottom]:translate-y-1",
        className,
      )}
      {...props}
      data-slot="select-content"
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "Select.Content";

const SelectLabel = forwardRef<
  ElementRef<typeof SelectPrimitive.Label>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 font-mono text-label-caps text-muted-foreground uppercase tracking-wider",
      className,
    )}
    {...props}
    data-slot="select-label"
  />
));
SelectLabel.displayName = "Select.Label";

const SelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center gap-2 rounded-md py-1.5 pr-2 pl-7",
      "text-body-sm outline-none",
      "focus:bg-muted focus:text-foreground",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
    data-slot="select-item"
  >
    <span className="absolute left-1.5 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-3.5 text-primary" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "Select.Item";

const SelectSeparator = forwardRef<
  ElementRef<typeof SelectPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border/40", className)}
    {...props}
    data-slot="select-separator"
  />
));
SelectSeparator.displayName = "Select.Separator";

const Select = SelectPrimitive.Root as typeof SelectPrimitive.Root & {
  Trigger: typeof SelectTrigger;
  Value: typeof SelectPrimitive.Value;
  Content: typeof SelectContent;
  Group: typeof SelectPrimitive.Group;
  Label: typeof SelectLabel;
  Item: typeof SelectItem;
  Separator: typeof SelectSeparator;
};
Select.Trigger = SelectTrigger;
Select.Value = SelectPrimitive.Value;
Select.Content = SelectContent;
Select.Group = SelectPrimitive.Group;
Select.Label = SelectLabel;
Select.Item = SelectItem;
Select.Separator = SelectSeparator;

export { Select };
