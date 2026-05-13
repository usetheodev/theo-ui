import { forwardRef } from "react";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ElementType,
  HTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "../../lib/cn.js";

/**
 * Sidebar — vertical navigation shell.
 *
 * Composition:
 *   <Sidebar>
 *     <Sidebar.Header>…brand…</Sidebar.Header>
 *     <Sidebar.Section title="Workspace">
 *       <Sidebar.Item icon={Home} active>Overview</Sidebar.Item>
 *       <Sidebar.Item icon={Rocket} count={3}>Deployments</Sidebar.Item>
 *     </Sidebar.Section>
 *     <Sidebar.Footer>…user…</Sidebar.Footer>
 *   </Sidebar>
 *
 * Width is 260px by default (matches the wiremocks). Pass `className` to override.
 * Sidebar root is `<aside>` with a hairline right border.
 */

const Root = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(
        "flex h-full w-64 flex-col border-border/40 border-r bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  ),
);
Root.displayName = "Sidebar";

const Header = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex h-16 items-center gap-3 border-border/40 border-b px-5", className)}
      {...props}
    />
  ),
);
Header.displayName = "Sidebar.Header";

interface SectionProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
}

const Section = forwardRef<HTMLDivElement, SectionProps>(
  ({ className, title, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1 px-3 py-4", className)} {...props}>
      {title ? (
        <p className="px-2 pb-1 font-sans text-label-caps text-muted-foreground uppercase">
          {title}
        </p>
      ) : null}
      {children}
    </div>
  ),
);
Section.displayName = "Sidebar.Section";

interface ItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  icon?: ElementType;
  active?: boolean;
  count?: number | string;
  as?: "button" | "a";
  href?: string;
}

/**
 * Sidebar.Item — single nav row. Renders as <button> by default; pass `as="a"` + `href`
 * to render an anchor for routing.
 */
const Item = forwardRef<HTMLElement, ItemProps>(
  ({ className, icon: Icon, active, count, as = "button", href, children, ...props }, ref) => {
    const classes = cn(
      "group flex w-full items-center gap-3 rounded-lg px-2 py-2",
      "font-medium font-sans text-body-sm",
      "transition-colors duration-base ease-out-soft",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
      className,
    );

    const content = (
      <>
        {Icon ? (
          <Icon
            className={cn(
              "size-4 shrink-0",
              active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
            )}
          />
        ) : null}
        <span className="flex-1 truncate text-left">{children}</span>
        {count !== undefined ? (
          <span
            className={cn(
              "ml-auto rounded-full px-1.5 py-0.5 font-mono text-label",
              active ? "bg-primary text-primary-foreground" : "bg-muted-foreground/15",
            )}
          >
            {count}
          </span>
        ) : null}
      </>
    );

    if (as === "a") {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          aria-current={active ? "page" : undefined}
          {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={classes}
        aria-current={active ? "page" : undefined}
        {...props}
      >
        {content}
      </button>
    );
  },
);
Item.displayName = "Sidebar.Item";

const Footer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mt-auto border-border/40 border-t px-5 py-4", className)}
      {...props}
    />
  ),
);
Footer.displayName = "Sidebar.Footer";

const Sidebar = Root as typeof Root & {
  Header: typeof Header;
  Section: typeof Section;
  Item: typeof Item;
  Footer: typeof Footer;
};
Sidebar.Header = Header;
Sidebar.Section = Section;
Sidebar.Item = Item;
Sidebar.Footer = Footer;

export { Sidebar };
