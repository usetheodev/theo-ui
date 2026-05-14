import { ChevronRight } from "lucide-react";
import { Fragment, forwardRef } from "react";
import type { HTMLAttributes, KeyboardEvent, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * TopNav — horizontal app bar (64px).
 *
 * Composition:
 *   <TopNav>
 *     <TopNav.Left>
 *       <TopNav.Breadcrumbs items={[{label: "acme"}, {label: "api"}]} />
 *     </TopNav.Left>
 *     <TopNav.Center>…segmented switcher…</TopNav.Center>
 *     <TopNav.Right>…actions…</TopNav.Right>
 *   </TopNav>
 *
 * Variant — hairline bottom border. No glass/blur (anti-glass guideline).
 */

const Root = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        "flex h-16 items-center justify-between gap-4 border-border/40 border-b bg-card px-6",
        className,
      )}
      {...props}
    />
  ),
);
Root.displayName = "TopNav";

const Left = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-1 items-center gap-3", className)} {...props} />
  ),
);
Left.displayName = "TopNav.Left";

const Center = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("hidden flex-1 justify-center md:flex", className)} {...props} />
  ),
);
Center.displayName = "TopNav.Center";

const Right = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-1 items-center justify-end gap-2", className)}
      {...props}
    />
  ),
);
Right.displayName = "TopNav.Right";

interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
}

interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ className, items, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1.5 text-body-sm", className)}
      {...props}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const key = typeof item.label === "string" ? item.label : idx;
        return (
          <Fragment key={key}>
            {item.href && !isLast ? (
              <a
                href={item.href}
                className="font-sans text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={cn(
                  "font-sans",
                  isLast ? "font-medium text-foreground" : "text-muted-foreground",
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
            {!isLast ? (
              <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
            ) : null}
          </Fragment>
        );
      })}
    </nav>
  ),
);
Breadcrumbs.displayName = "TopNav.Breadcrumbs";

interface ModeSwitcherOption {
  value: string;
  label: ReactNode;
}

interface ModeSwitcherProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: string;
  options: ModeSwitcherOption[];
  onChange?: (value: string) => void;
  /**
   * Accessible label for the radiogroup. Defaults to "Mode".
   */
  ariaLabel?: string;
}

/**
 * TopNav.ModeSwitcher — segmented control (Chat / Code / Infra).
 *
 * ARIA semantics: `role="radiogroup"` + `role="radio"` per option, with roving
 * tabindex and full keyboard navigation (Arrow keys + Home/End). Per WAI-ARIA
 * radiogroup pattern, exactly one option has `tabIndex=0` (the active one) and
 * the rest have `tabIndex=-1`, so Tab moves in and Tab moves out.
 *
 * Stateless: pass `value` + `onChange`.
 */
const ModeSwitcher = forwardRef<HTMLDivElement, ModeSwitcherProps>(
  ({ className, value, options, onChange, ariaLabel = "Mode", ...props }, ref) => {
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (!onChange || options.length === 0) return;
      const idx = options.findIndex((o) => o.value === value);
      const current = idx >= 0 ? idx : 0;
      let nextIdx: number | null = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        nextIdx = (current + 1) % options.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        nextIdx = (current - 1 + options.length) % options.length;
      } else if (e.key === "Home") {
        nextIdx = 0;
      } else if (e.key === "End") {
        nextIdx = options.length - 1;
      }
      if (nextIdx === null) return;
      e.preventDefault();
      const target = options[nextIdx];
      if (target) onChange(target.value);
    };

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        className={cn(
          "inline-flex items-center rounded-lg border border-border/60 bg-muted p-1",
          className,
        )}
        {...props}
      >
        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              // biome-ignore lint/a11y/useSemanticElements: WAI-ARIA radiogroup pattern requires role="radio" on buttons for segmented controls
              role="radio"
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange?.(opt.value)}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium font-sans text-body-sm",
                "transition-all duration-base ease-out-soft",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  },
);
ModeSwitcher.displayName = "TopNav.ModeSwitcher";

const TopNav = /*#__PURE__*/ Object.assign(Root, {
  Left,
  Center,
  Right,
  Breadcrumbs,
  ModeSwitcher,
});

export { TopNav };
