import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Tooltip — built on Radix Tooltip.
 *
 * Visual: dark surface in light mode (and inverse in dark) with rounded-md,
 * shadow-md, text-body-sm. 8px delay-show default.
 *
 * Wrap your app in <Tooltip.Provider> once (or use the default delayDuration here).
 */

const Provider = TooltipPrimitive.Provider;
const Root = TooltipPrimitive.Root;
const Trigger = TooltipPrimitive.Trigger;

const Content = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      data-slot="tooltip-content"
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md border border-border/40 bg-foreground px-2.5 py-1.5",
        "text-background text-body-sm shadow-md",
        "data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[state=delayed-open]:animate-in",
        "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
        "data-[side=top]:slide-in-from-bottom-1 data-[side=bottom]:slide-in-from-top-1",
        "data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
Content.displayName = "Tooltip.Content";

interface TooltipProps extends ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> {
  label: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  children: ReactNode;
}

/**
 * Shorthand: <Tooltip label="…"><Button>…</Button></Tooltip>
 * Wraps Provider + Root + Trigger asChild + Content for the common case.
 * For advanced usage (controlled state, custom content), use Tooltip.Root etc. directly.
 */
const Tooltip = ({
  label,
  side = "top",
  align = "center",
  delayDuration = 200,
  children,
  ...rootProps
}: TooltipProps) =>
  (
    <Provider delayDuration={delayDuration}>
      <Root {...rootProps}>
        <Trigger asChild>{children}</Trigger>
        <Content side={side} align={align}>
          {label}
        </Content>
      </Root>
    </Provider>
  ) as ReturnType<typeof Provider>;

const TooltipWithStatics = Tooltip as typeof Tooltip & {
  Provider: typeof Provider;
  Root: typeof Root;
  Trigger: typeof Trigger;
  Content: typeof Content;
};
TooltipWithStatics.Provider = Provider;
TooltipWithStatics.Root = Root;
TooltipWithStatics.Trigger = Trigger;
TooltipWithStatics.Content = Content;

export { TooltipWithStatics as Tooltip };
