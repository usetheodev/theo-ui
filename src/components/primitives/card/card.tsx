import { Slot } from "@radix-ui/react-slot";
import { createContext, forwardRef, useContext } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

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
 * The `size` prop on the root propagates to subparts via Context, so a
 * single declaration controls padding + heading scale across the compound.
 * Subparts used in isolation default to `md`. Subparts do NOT accept a `size`
 * prop of their own — use `className` for granular per-subpart tweaks.
 * (EC-8, edge-case review 2026-05-20.)
 */

type CardSize = "sm" | "md" | "lg";

interface CardContextValue {
  size: CardSize;
}

const CardContext = createContext<CardContextValue>({ size: "md" });

const useCardSize = (): CardSize => useContext(CardContext).size;

interface CardRootProps extends HTMLAttributes<HTMLDivElement> {
  size?: CardSize;
}

const Root = forwardRef<HTMLDivElement, CardRootProps>(
  ({ className, size = "md", ...props }, ref) => (
    <CardContext.Provider value={{ size }}>
      <div
        ref={ref}
        className={cn(
          "rounded-xl border bg-card text-card-foreground shadow-md",
          "transition-shadow duration-base ease-out-soft",
          className,
        )}
        {...props}
      />
    </CardContext.Provider>
  ),
);
Root.displayName = "Card";

const headerPadBySize: Record<CardSize, string> = {
  sm: "gap-1 p-3 pb-1.5",
  md: "gap-1.5 p-5 pb-2.5",
  lg: "gap-2 p-6 pb-3",
};

const Header = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const size = useCardSize();
    return (
      <div ref={ref} className={cn("flex flex-col", headerPadBySize[size], className)} {...props} />
    );
  },
);
Header.displayName = "Card.Header";

const titleFontBySize: Record<CardSize, string> = {
  sm: "text-title-md",
  md: "text-title-lg",
  lg: "text-headline",
};

interface TitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /**
   * When true, renders the child element with the Card.Title styles applied
   * (Radix Slot pattern). Use to swap the default `<h3>` for `<h1>` / `<h2>`
   * when the heading hierarchy requires it.
   */
  asChild?: boolean;
}

const Title = forwardRef<HTMLHeadingElement, TitleProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "h3";
    const size = useCardSize();
    return (
      <Comp
        ref={ref}
        className={cn(
          "font-display text-foreground tracking-tight",
          titleFontBySize[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Title.displayName = "Card.Title";

const Description = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-body-sm text-muted-foreground", className)} {...props} />
  ),
);
Description.displayName = "Card.Description";

const bodyPadBySize: Record<CardSize, string> = {
  sm: "p-3 pt-1.5",
  md: "p-5 pt-2.5",
  lg: "p-6 pt-3",
};

const Body = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const size = useCardSize();
    return <div ref={ref} className={cn(bodyPadBySize[size], className)} {...props} />;
  },
);
Body.displayName = "Card.Body";

const footerPadBySize: Record<CardSize, string> = {
  sm: "gap-2 p-3 pt-2",
  md: "gap-3 p-5 pt-3",
  lg: "gap-4 p-6 pt-4",
};

const Footer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const size = useCardSize();
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center border-border/40 border-t",
          footerPadBySize[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Footer.displayName = "Card.Footer";

const Card = /*#__PURE__*/ Object.assign(Root, {
  Header,
  Title,
  Description,
  Body,
  Footer,
});

export { Card };
