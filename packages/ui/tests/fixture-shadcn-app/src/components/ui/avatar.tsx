import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { type VariantProps, cva } from "class-variance-authority";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Avatar — user/team avatar with safe fallback to initials.
 *
 * Composition:
 *   <Avatar size="md">
 *     <Avatar.Image src="…" alt="…" />
 *     <Avatar.Fallback>AA</Avatar.Fallback>
 *   </Avatar>
 *
 * Built on Radix Avatar (handles image load failures → fallback automatically).
 * Sizes scale on the root; fallback inherits the size's text scale.
 */

const avatarVariants = cva(
  [
    "relative inline-flex shrink-0 overflow-hidden rounded-full",
    "border border-border/40 bg-muted text-foreground",
  ],
  {
    variants: {
      size: {
        xs: "size-6 text-label",
        sm: "size-7 text-label",
        md: "size-9 text-body-sm",
        lg: "size-12 text-body-md",
        xl: "size-16 text-title-md",
      },
      tone: {
        muted: "bg-muted text-foreground",
        primary: "bg-primary text-primary-foreground",
        accent: "bg-accent text-accent-foreground",
      },
    },
    defaultVariants: { size: "md", tone: "muted" },
  },
);

interface AvatarProps
  extends ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

const AvatarRoot = forwardRef<ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
  ({ className, size, tone, ...props }, ref) => (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(avatarVariants({ size, tone }), className)}
      {...props}
    />
  ),
);
AvatarRoot.displayName = "Avatar";

const AvatarImage = forwardRef<
  ElementRef<typeof AvatarPrimitive.Image>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square size-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = "Avatar.Image";

const AvatarFallback = forwardRef<
  ElementRef<typeof AvatarPrimitive.Fallback>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center font-medium leading-none",
      className,
    )}
    delayMs={300}
    {...props}
  />
));
AvatarFallback.displayName = "Avatar.Fallback";

const Avatar = /*#__PURE__*/ Object.assign(AvatarRoot, {
  Image: AvatarImage,
  Fallback: AvatarFallback,
});

export { Avatar, avatarVariants };
