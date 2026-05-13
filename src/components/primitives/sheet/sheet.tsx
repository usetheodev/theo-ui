import * as DialogPrimitive from "@radix-ui/react-dialog";
import { type VariantProps, cva } from "class-variance-authority";
import { X } from "lucide-react";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef, HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Sheet — slide-in side panel built on Radix Dialog.
 *
 * Same Radix primitive as Dialog, but Content slides from an edge instead of
 * fading from center. Used for: workspace overlays (Memory, Observability,
 * Sub-agents), Settings, contextual filters.
 *
 * Composition:
 *   <Sheet>
 *     <Sheet.Trigger>Open</Sheet.Trigger>
 *     <Sheet.Content side="right">
 *       <Sheet.Header>
 *         <Sheet.Title>Memory</Sheet.Title>
 *         <Sheet.Description>Episodes and wiki pages</Sheet.Description>
 *       </Sheet.Header>
 *       <Sheet.Body>…</Sheet.Body>
 *       <Sheet.Footer>…</Sheet.Footer>
 *     </Sheet.Content>
 *   </Sheet>
 */

const Overlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/80",
      "data-[state=open]:fade-in-0 data-[state=open]:animate-in",
      "data-[state=closed]:fade-out-0 data-[state=closed]:animate-out",
      className,
    )}
    {...props}
  />
));
Overlay.displayName = "Sheet.Overlay";

const sheetVariants = cva(
  [
    "fixed z-50 flex flex-col gap-3 border-border/40 bg-card text-card-foreground shadow-lg",
    "transition duration-base ease-out-soft",
    "data-[state=closed]:animate-out data-[state=open]:animate-in",
  ],
  {
    variants: {
      side: {
        right:
          "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right inset-y-0 right-0 h-full w-3/4 max-w-md border-l",
        left: "data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left inset-y-0 left-0 h-full w-3/4 max-w-md border-r",
        top: "data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top inset-x-0 top-0 h-auto max-h-[80vh] border-b",
        bottom:
          "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom inset-x-0 bottom-0 h-auto max-h-[80vh] border-t",
      },
    },
    defaultVariants: { side: "right" },
  },
);

interface ContentProps
  extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  hideCloseButton?: boolean;
}

const Content = forwardRef<ElementRef<typeof DialogPrimitive.Content>, ContentProps>(
  ({ className, children, hideCloseButton, side = "right", ...props }, ref) => (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        {!hideCloseButton ? (
          <DialogPrimitive.Close
            className={cn(
              "absolute top-4 right-4 rounded-md p-1 opacity-70",
              "transition-opacity hover:opacity-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              "disabled:pointer-events-none",
            )}
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
);
Content.displayName = "Sheet.Content";

const Header = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-1.5 border-border/40 border-b px-6 py-5 text-left", className)}
    {...props}
  />
);
Header.displayName = "Sheet.Header";

const Body = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1 overflow-y-auto px-6 py-4 text-body-md", className)} {...props} />
);
Body.displayName = "Sheet.Body";

const Footer = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 border-border/40 border-t px-6 py-4 sm:flex-row sm:justify-end",
      className,
    )}
    {...props}
  />
);
Footer.displayName = "Sheet.Footer";

const Title = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("font-display text-foreground text-title-lg tracking-tight", className)}
    {...props}
  />
));
Title.displayName = "Sheet.Title";

const Description = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-body-sm text-muted-foreground", className)}
    {...props}
  />
));
Description.displayName = "Sheet.Description";

const Sheet = DialogPrimitive.Root as typeof DialogPrimitive.Root & {
  Trigger: typeof DialogPrimitive.Trigger;
  Close: typeof DialogPrimitive.Close;
  Content: typeof Content;
  Overlay: typeof Overlay;
  Header: typeof Header;
  Body: typeof Body;
  Footer: typeof Footer;
  Title: typeof Title;
  Description: typeof Description;
};
Sheet.Trigger = DialogPrimitive.Trigger;
Sheet.Close = DialogPrimitive.Close;
Sheet.Content = Content;
Sheet.Overlay = Overlay;
Sheet.Header = Header;
Sheet.Body = Body;
Sheet.Footer = Footer;
Sheet.Title = Title;
Sheet.Description = Description;

export { Sheet, sheetVariants };
