import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef, HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * DropdownMenu — accessible menu primitive built on Radix.
 *
 * Composition (single import surface):
 *   <DropdownMenu>
 *     <DropdownMenu.Trigger>…</DropdownMenu.Trigger>
 *     <DropdownMenu.Content>
 *       <DropdownMenu.Label>Section</DropdownMenu.Label>
 *       <DropdownMenu.Item onSelect={…}>Edit</DropdownMenu.Item>
 *       <DropdownMenu.Separator />
 *       <DropdownMenu.Item disabled>Delete</DropdownMenu.Item>
 *     </DropdownMenu.Content>
 *   </DropdownMenu>
 *
 * The primitive consolidates 5 prior direct-Radix usages
 * (`model-selector`, `intent-selector`, `agent-profile`,
 * `theme-switcher`, `theo-code-shell`) under a single styled
 * wrapper so consumers get consistent visuals + the design tokens.
 *
 * a11y note for tests: Radix's focus-guard spans intentionally
 * violate `aria-hidden-focus`. Tests should pass
 * `{ rules: { "aria-hidden-focus": { enabled: false } } }` to axe.
 */

const Trigger = DropdownMenuPrimitive.Trigger;
const Portal = DropdownMenuPrimitive.Portal;
const Group = DropdownMenuPrimitive.Group;
const Sub = DropdownMenuPrimitive.Sub;
const RadioGroup = DropdownMenuPrimitive.RadioGroup;

const Content = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-32 overflow-hidden rounded-lg border border-border/40 bg-card p-1",
        "text-card-foreground shadow-md",
        "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in",
        "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
Content.displayName = "DropdownMenu.Content";

interface ItemProps extends ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  inset?: boolean;
}

const Item = forwardRef<ElementRef<typeof DropdownMenuPrimitive.Item>, ItemProps>(
  ({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5",
        "font-sans text-body-sm text-foreground outline-none",
        "transition-colors",
        "focus:bg-muted focus:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  ),
);
Item.displayName = "DropdownMenu.Item";

const CheckboxItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    checked={checked}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-md py-1.5 pr-2 pl-8",
      "font-sans text-body-sm text-foreground outline-none",
      "transition-colors focus:bg-muted focus:text-foreground",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check aria-hidden="true" className="size-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
CheckboxItem.displayName = "DropdownMenu.CheckboxItem";

const RadioItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-md py-1.5 pr-2 pl-8",
      "font-sans text-body-sm text-foreground outline-none",
      "transition-colors focus:bg-muted focus:text-foreground",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle aria-hidden="true" className="size-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
RadioItem.displayName = "DropdownMenu.RadioItem";

interface LabelProps extends ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> {
  inset?: boolean;
}

const Label = forwardRef<ElementRef<typeof DropdownMenuPrimitive.Label>, LabelProps>(
  ({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(
        "px-2 py-1.5 font-medium font-sans text-label-caps text-muted-foreground uppercase tracking-wider",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  ),
);
Label.displayName = "DropdownMenu.Label";

const Separator = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border/40", className)}
    {...props}
  />
));
Separator.displayName = "DropdownMenu.Separator";

const Shortcut = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn("ml-auto font-mono text-label text-muted-foreground", className)}
    {...props}
  />
);
Shortcut.displayName = "DropdownMenu.Shortcut";

const SubTrigger = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5",
      "font-sans text-body-sm text-foreground outline-none",
      "focus:bg-muted data-[state=open]:bg-muted",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight aria-hidden="true" className="ml-auto size-3.5" />
  </DropdownMenuPrimitive.SubTrigger>
));
SubTrigger.displayName = "DropdownMenu.SubTrigger";

const SubContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-32 overflow-hidden rounded-lg border border-border/40 bg-card p-1",
      "text-card-foreground shadow-md",
      "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in",
      "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
      className,
    )}
    {...props}
  />
));
SubContent.displayName = "DropdownMenu.SubContent";

type DropdownMenuRoot = typeof DropdownMenuPrimitive.Root & {
  Trigger: typeof Trigger;
  Portal: typeof Portal;
  Content: typeof Content;
  Item: typeof Item;
  CheckboxItem: typeof CheckboxItem;
  RadioItem: typeof RadioItem;
  Label: typeof Label;
  Separator: typeof Separator;
  Shortcut: typeof Shortcut;
  Group: typeof Group;
  Sub: typeof Sub;
  SubTrigger: typeof SubTrigger;
  SubContent: typeof SubContent;
  RadioGroup: typeof RadioGroup;
};

const DropdownMenu: DropdownMenuRoot = Object.assign(DropdownMenuPrimitive.Root, {
  Trigger,
  Portal,
  Content,
  Item,
  CheckboxItem,
  RadioItem,
  Label,
  Separator,
  Shortcut,
  Group,
  Sub,
  SubTrigger,
  SubContent,
  RadioGroup,
});

export { DropdownMenu };
