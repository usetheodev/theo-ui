import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

/**
 * Card — surface container for grouping related content.
 *
 * Composition pattern (shadcn-style):
 *   <Card>
 *     <Card.Header>
 *       <Card.Title>…</Card.Title>
 *       <Card.Description>…</Card.Description>
 *     </Card.Header>
 *     <Card.Body>…</Card.Body>
 *     <Card.Footer>…</Card.Footer>
 *   </Card>
 *
 * Variants are applied via Tailwind utility classes on the root.
 * Use `bg-dotted-violet` utility on a parent to get the signature page texture.
 */

const Root = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-md",
        "transition-shadow duration-base ease-out-soft",
        className,
      )}
      {...props}
    />
  ),
);
Root.displayName = "Card";

const Header = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 p-6 pb-3", className)} {...props} />
  ),
);
Header.displayName = "Card.Header";

const Title = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-display text-foreground text-title-lg tracking-tight", className)}
      {...props}
    />
  ),
);
Title.displayName = "Card.Title";

const Description = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-body-sm text-muted-foreground", className)} {...props} />
  ),
);
Description.displayName = "Card.Description";

const Body = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-3", className)} {...props} />
  ),
);
Body.displayName = "Card.Body";

const Footer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-3 border-border/40 border-t p-6 pt-4", className)}
      {...props}
    />
  ),
);
Footer.displayName = "Card.Footer";

const Card = Root as typeof Root & {
  Header: typeof Header;
  Title: typeof Title;
  Description: typeof Description;
  Body: typeof Body;
  Footer: typeof Footer;
};
Card.Header = Header;
Card.Title = Title;
Card.Description = Description;
Card.Body = Body;
Card.Footer = Footer;

export { Card };
