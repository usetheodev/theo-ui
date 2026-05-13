import * as TabsPrimitive from "@radix-ui/react-tabs";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { cn } from "../../lib/cn.js";

/**
 * Tabs — built on Radix Tabs.
 *
 * Visual: underlined active tab in primary (violet), inactive in muted-foreground.
 * Used in project views (Overview / Deployments / Logs / Settings).
 */

const List = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center border-border/40 border-b text-muted-foreground",
      className,
    )}
    {...props}
  />
));
List.displayName = "Tabs.List";

const Trigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex h-10 items-center justify-center whitespace-nowrap px-4",
      "font-medium font-sans text-body-sm text-muted-foreground",
      "transition-colors duration-base ease-out-soft",
      "hover:text-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:text-foreground",
      // Active underline using a pseudo-element via shadow
      "data-[state=active]:shadow-[inset_0_-2px_0_0_hsl(var(--primary))]",
      className,
    )}
    {...props}
  />
));
Trigger.displayName = "Tabs.Trigger";

const Content = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      className,
    )}
    {...props}
  />
));
Content.displayName = "Tabs.Content";

const Tabs = TabsPrimitive.Root as typeof TabsPrimitive.Root & {
  List: typeof List;
  Trigger: typeof Trigger;
  Content: typeof Content;
};
Tabs.List = List;
Tabs.Trigger = Trigger;
Tabs.Content = Content;

export { Tabs };
