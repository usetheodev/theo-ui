import * as ToastPrimitive from "@radix-ui/react-toast";
import { type VariantProps, cva } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Toast — transient notification built on Radix Toast.
 *
 * Composition: app mounts <Toaster /> once. Components call `toast(...)` via
 * the `useToast()` hook (see toaster.tsx). The look is theme-aware: status
 * icon coloured by --primary/--success/--warning/--destructive; the body
 * card uses --popover surface.
 *
 * Variants:
 *   - default (neutral)
 *   - info (primary tint)
 *   - success (deploy ok, action completed)
 *   - warning (queued, permission requested)
 *   - destructive (failed, fatal)
 */

const toastVariants = cva(
  [
    "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border pr-10 shadow-md",
    "data-[state=open]:slide-in-from-top-full data-[state=open]:fade-in-0 data-[state=open]:animate-in",
    "data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=closed]:animate-out",
    "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
    "data-[swipe=end]:animate-out data-[swipe=cancel]:transition-[transform_var(--duration-base)] data-[swipe=move]:transition-none",
  ],
  {
    variants: {
      variant: {
        default: "border-border/40 bg-popover text-popover-foreground",
        info: "border-primary/40 bg-popover text-popover-foreground",
        success: "border-success/40 bg-popover text-popover-foreground",
        warning: "border-warning/40 bg-popover text-popover-foreground",
        destructive: "border-destructive/50 bg-popover text-popover-foreground",
      },
      size: {
        sm: "p-3 text-body-sm",
        md: "p-4 text-body-md",
        lg: "p-5 text-body-lg",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

const iconForVariant: Record<NonNullable<ToastVariant>, ReactNode> = {
  default: <Info className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />,
  info: <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />,
  success: <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />,
  warning: <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden="true" />,
  destructive: <AlertCircle className="size-4 shrink-0 text-destructive" aria-hidden="true" />,
};

type ToastVariant = NonNullable<VariantProps<typeof toastVariants>["variant"]>;

interface ToastProps
  extends ComponentPropsWithoutRef<typeof ToastPrimitive.Root>,
    VariantProps<typeof toastVariants> {}

const ToastRoot = forwardRef<ElementRef<typeof ToastPrimitive.Root>, ToastProps>(
  ({ className, variant = "default", size, children, ...props }, ref) => (
    <ToastPrimitive.Root
      data-slot="toast"
      data-variant={variant}
      data-size={size}
      ref={ref}
      className={cn(toastVariants({ variant, size }), className)}
      {...props}
    >
      <span aria-hidden="true">{iconForVariant[variant as ToastVariant]}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </ToastPrimitive.Root>
  ),
);
ToastRoot.displayName = "Toast";

const ToastTitle = forwardRef<
  ElementRef<typeof ToastPrimitive.Title>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    data-slot="toast-title"
    ref={ref}
    className={cn("font-medium text-body-sm text-foreground", className)}
    {...props}
  />
));
ToastTitle.displayName = "Toast.Title";

const ToastDescription = forwardRef<
  ElementRef<typeof ToastPrimitive.Description>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    data-slot="toast-description"
    ref={ref}
    className={cn("mt-0.5 text-body-sm text-muted-foreground", className)}
    {...props}
  />
));
ToastDescription.displayName = "Toast.Description";

const ToastClose = forwardRef<
  ElementRef<typeof ToastPrimitive.Close>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    data-slot="toast-close"
    ref={ref}
    className={cn(
      "absolute top-2 right-2 rounded-md p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="size-3.5" />
    <span className="sr-only">Close</span>
  </ToastPrimitive.Close>
));
ToastClose.displayName = "Toast.Close";

const ToastAction = forwardRef<
  ElementRef<typeof ToastPrimitive.Action>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    data-slot="toast-action"
    ref={ref}
    className={cn(
      "mt-2 inline-flex h-7 items-center rounded-md border border-border/60 bg-card px-2 font-sans text-foreground text-label",
      "transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = "Toast.Action";

const Toast = /*#__PURE__*/ Object.assign(ToastRoot, {
  Title: ToastTitle,
  Description: ToastDescription,
  Close: ToastClose,
  Action: ToastAction,
  Provider: ToastPrimitive.Provider,
  Viewport: ToastPrimitive.Viewport,
});

export { Toast, toastVariants, type ToastVariant };
