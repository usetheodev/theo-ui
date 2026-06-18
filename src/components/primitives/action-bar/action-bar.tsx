import { Filter, Loader2, Search } from "lucide-react";
import { forwardRef } from "react";
import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * ActionBar — page-top action strip primitive.
 *
 * A horizontal flexbox row with three optional slots:
 *   - Search input (flex-1, grows to fill)
 *   - Filter icon button (next to search)
 *   - Primary action button (right-aligned)
 *
 * Returns `null` when no props are provided — don't render an empty
 * bar. Used standalone or composed inside `<PageShell>` (Brief #5).
 *
 * @example
 *   <ActionBar
 *     search={{ placeholder: "Search projects…", value: q, onChange: setQ }}
 *     primaryAction={{ label: "New project", icon: Plus, onClick: openModal }}
 *   />
 */

export interface ActionBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  search?: {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
  };
  primaryAction?: {
    label: ReactNode;
    icon?: ElementType;
    onClick: () => void;
    loading?: boolean;
  };
  onFilterClick?: () => void;
}

const ActionBar = forwardRef<HTMLDivElement, ActionBarProps>(
  ({ className, search, primaryAction, onFilterClick, ...props }, ref) => {
    if (!search && !primaryAction && !onFilterClick) {
      return null;
    }

    const PrimaryIcon = primaryAction?.icon;
    const isLoading = primaryAction?.loading === true;

    return (
      <div
        ref={ref}
        className={cn("flex w-full items-center gap-2", className)}
        {...props}
        data-slot="action-bar"
      >
        {search ? (
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
            />
            <input
              type="search"
              placeholder={search.placeholder}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              className={cn(
                "w-full rounded-md border border-border/40 bg-card py-2 pr-3 pl-9",
                "font-sans text-body-sm text-foreground placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            />
          </div>
        ) : null}
        {onFilterClick !== undefined ? (
          <button
            type="button"
            onClick={onFilterClick}
            aria-label="Filter"
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-md border border-border/40",
              "text-muted-foreground transition-colors",
              "hover:bg-muted hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <Filter aria-hidden="true" className="size-4" />
          </button>
        ) : null}
        {primaryAction !== undefined ? (
          <button
            type="button"
            onClick={primaryAction.onClick}
            disabled={isLoading}
            className={cn(
              "ml-auto inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2",
              "font-medium font-sans text-body-sm text-primary-foreground",
              "transition-colors hover:bg-primary-deep",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            {isLoading ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : PrimaryIcon ? (
              <PrimaryIcon aria-hidden="true" className="size-4" />
            ) : null}
            {primaryAction.label}
          </button>
        ) : null}
      </div>
    );
  },
);
ActionBar.displayName = "ActionBar";

export { ActionBar };
