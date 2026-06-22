import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef, HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Dialog — modal overlay built on Radix Dialog.
 *
 * Composition:
 *   <Dialog>
 *     <Dialog.Trigger>Open</Dialog.Trigger>
 *     <Dialog.Content>
 *       <Dialog.Header>
 *         <Dialog.Title>…</Dialog.Title>
 *         <Dialog.Description>…</Dialog.Description>
 *       </Dialog.Header>
 *       <Dialog.Body>…</Dialog.Body>
 *       <Dialog.Footer>…</Dialog.Footer>
 *     </Dialog.Content>
 *   </Dialog>
 *
 * Overlay is a theme-neutral backdrop (`bg-background/80`) with no glass blur
 * (anti-glass guideline). Content uses card surface, rounded-2xl, shadow-lg
 * + slight glow on enter.
 */

const Overlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    data-slot="dialog-overlay"
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
Overlay.displayName = "Dialog.Overlay";

interface ContentProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  hideCloseButton?: boolean;
}

const Content = forwardRef<ElementRef<typeof DialogPrimitive.Content>, ContentProps>(
  ({ className, children, hideCloseButton, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        ref={ref}
        className={cn(
          "-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 z-50 w-full max-w-lg",
          "rounded-2xl border border-border bg-card text-card-foreground shadow-lg",
          "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in",
          "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
          "duration-base",
          className,
        )}
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
Content.displayName = "Dialog.Content";

const Header = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1.5 p-6 pb-3 text-left", className)} {...props} />
);
Header.displayName = "Dialog.Header";

const Body = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-6 pb-6 text-body-md text-muted-foreground", className)} {...props} />
);
Body.displayName = "Dialog.Body";

const Footer = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse gap-2 p-6 pt-3 sm:flex-row sm:justify-end", className)}
    {...props}
  />
);
Footer.displayName = "Dialog.Footer";

type TitleProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;

const Title = forwardRef<ElementRef<typeof DialogPrimitive.Title>, TitleProps>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      ref={ref}
      className={cn("font-display text-foreground text-title-lg tracking-tight", className)}
      {...props}
    />
  ),
);
Title.displayName = "Dialog.Title";

const Description = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    data-slot="dialog-description"
    ref={ref}
    className={cn("text-body-sm text-muted-foreground", className)}
    {...props}
  />
));
Description.displayName = "Dialog.Description";

const Dialog = /*#__PURE__*/ Object.assign(DialogPrimitive.Root, {
  Trigger: DialogPrimitive.Trigger,
  Close: DialogPrimitive.Close,
  Content,
  Overlay,
  Header,
  Body,
  Footer,
  Title,
  Description,
});

export { Dialog };
