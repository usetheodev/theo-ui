import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, KeyboardEvent } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Pagination — accessible page-number navigation primitive.
 *
 * Renders a `<nav aria-label="Pagination">` containing a button group:
 * `[<<] [<] 1 ... 5 6 [7] 8 9 ... 42 [>] [>>]`. The active page carries
 * `aria-current="page"`. Keyboard navigation (ArrowLeft / ArrowRight /
 * Home / End) is wired on the nav. Ellipses are rendered as
 * non-interactive `<span>` elements with `aria-hidden`.
 *
 * Renders nothing when `totalPages <= 1` (the page is the whole list).
 *
 * `siblingCount` controls how many neighbors of the current page are
 * always visible (default 1 → "5 6 [7] 8 9"). `showJumpButtons`
 * toggles the first/last `<<` / `>>` buttons.
 *
 * Consumers control state (`currentPage`) and are responsible for any
 * URL routing — the buttons are `<button>`, not `<a>`.
 *
 * @example
 *   <Pagination
 *     currentPage={page}
 *     totalPages={42}
 *     onPageChange={setPage}
 *   />
 */
export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Neighbors of current page that stay visible. Default 1. */
  siblingCount?: number;
  /** Render `<<` / `>>` first/last buttons. Default true. */
  showJumpButtons?: boolean;
  /** Size variant. Default md. */
  size?: "sm" | "md";
}

/**
 * Pure helper: compute the visible page-range with ellipses.
 * Exported for unit testing — most pagination bugs live here.
 */
export function computePageRange(
  currentPage: number,
  totalPages: number,
  siblingCount = 1,
): Array<number | "ellipsis-start" | "ellipsis-end"> {
  if (totalPages <= 1) return [];

  // Always keep first + last + siblings around current.
  // Total "core" buttons: 1 + (siblingCount * 2 + 1) + 1 = siblingCount * 2 + 3.
  // Plus possibly 2 ellipsis placeholders → max visible = siblingCount * 2 + 5.
  const totalNumbers = siblingCount * 2 + 3;
  const totalWithEdges = totalNumbers + 2;

  if (totalPages <= totalWithEdges) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRangeEnd = 1 + (siblingCount * 2 + 2);
    const leftRange = Array.from({ length: leftRangeEnd }, (_, i) => i + 1);
    return [...leftRange, "ellipsis-end", totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightStart = totalPages - (siblingCount * 2 + 2);
    const rightRange = Array.from(
      { length: totalPages - rightStart + 1 },
      (_, i) => rightStart + i,
    );
    return [1, "ellipsis-start", ...rightRange];
  }

  // Both sides need ellipsis.
  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i,
  );
  return [1, "ellipsis-start", ...middleRange, "ellipsis-end", totalPages];
}

const SIZE: Record<NonNullable<PaginationProps["size"]>, string> = {
  sm: "size-7 text-label",
  md: "size-8 text-body-sm",
};

const ICON_SIZE: Record<NonNullable<PaginationProps["size"]>, string> = {
  sm: "size-3",
  md: "size-3.5",
};

const Pagination = forwardRef<HTMLElement, PaginationProps>(
  (
    {
      className,
      currentPage,
      totalPages,
      onPageChange,
      siblingCount = 1,
      showJumpButtons = true,
      size = "md",
      ...props
    },
    ref,
  ) => {
    if (totalPages <= 1) {
      return null;
    }

    const range = computePageRange(currentPage, totalPages, siblingCount);
    const prevDisabled = currentPage <= 1;
    const nextDisabled = currentPage >= totalPages;
    const sizeClass = SIZE[size];
    const iconClass = ICON_SIZE[size];

    const buttonBase = cn(
      "inline-flex items-center justify-center rounded-md font-mono tabular-nums",
      "transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      sizeClass,
    );

    function go(page: number) {
      const clamped = Math.max(1, Math.min(totalPages, page));
      if (clamped !== currentPage) onPageChange(clamped);
    }

    function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(currentPage - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(currentPage + 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        go(1);
      } else if (e.key === "End") {
        e.preventDefault();
        go(totalPages);
      }
    }

    return (
      <nav
        ref={ref}
        aria-label="Pagination"
        onKeyDown={handleKeyDown}
        className={cn("flex items-center gap-1", className)}
        {...props}
        data-slot="pagination"
      >
        {showJumpButtons ? (
          <button
            type="button"
            onClick={() => go(1)}
            disabled={prevDisabled}
            aria-label="Go to first page"
            aria-disabled={prevDisabled || undefined}
            className={cn(
              buttonBase,
              "text-foreground hover:bg-muted",
              prevDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
            )}
          >
            <ChevronsLeft aria-hidden="true" className={iconClass} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => go(currentPage - 1)}
          disabled={prevDisabled}
          aria-label="Go to previous page"
          aria-disabled={prevDisabled || undefined}
          className={cn(
            buttonBase,
            "text-foreground hover:bg-muted",
            prevDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
          )}
        >
          <ChevronLeft aria-hidden="true" className={iconClass} />
        </button>
        {range.map((item) => {
          if (item === "ellipsis-start" || item === "ellipsis-end") {
            return (
              <span
                key={item}
                aria-hidden="true"
                className={cn(
                  "inline-flex items-center justify-center text-muted-foreground",
                  sizeClass,
                )}
              >
                …
              </span>
            );
          }
          const isActive = item === currentPage;
          return (
            <button
              key={item}
              type="button"
              onClick={() => go(item)}
              aria-label={`Go to page ${item}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                buttonBase,
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {item}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => go(currentPage + 1)}
          disabled={nextDisabled}
          aria-label="Go to next page"
          aria-disabled={nextDisabled || undefined}
          className={cn(
            buttonBase,
            "text-foreground hover:bg-muted",
            nextDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
          )}
        >
          <ChevronRight aria-hidden="true" className={iconClass} />
        </button>
        {showJumpButtons ? (
          <button
            type="button"
            onClick={() => go(totalPages)}
            disabled={nextDisabled}
            aria-label="Go to last page"
            aria-disabled={nextDisabled || undefined}
            className={cn(
              buttonBase,
              "text-foreground hover:bg-muted",
              nextDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
            )}
          >
            <ChevronsRight aria-hidden="true" className={iconClass} />
          </button>
        ) : null}
      </nav>
    );
  },
);
Pagination.displayName = "Pagination";

export { Pagination };
