"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { createContext, forwardRef, useContext } from "react";
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Table — semantic data table primitive with sub-components.
 *
 * Composition:
 *   <Table density="default">
 *     <Table.Header>
 *       <Table.Row>
 *         <Table.HeaderCell>Date</Table.HeaderCell>
 *         <Table.HeaderCell align="right">Amount</Table.HeaderCell>
 *       </Table.Row>
 *     </Table.Header>
 *     <Table.Body>
 *       <Table.Row>
 *         <Table.Cell>2026-05-23</Table.Cell>
 *         <Table.Cell align="right" numeric>$ 42.00</Table.Cell>
 *       </Table.Row>
 *     </Table.Body>
 *   </Table>
 *
 * density propagates via Context so Cells pick up vertical padding without
 * prop drilling. Sub-components are attached as static properties on the
 * root (`Table.Header`, etc.) — single import surface.
 *
 * Sortable header: pass `onSort` + `sortDirection`. The HeaderCell renders
 * the sort affordance (ChevronUp/ChevronDown) and triggers the consumer
 * callback. `sortDirection` without `onSort` is a no-op (header stays
 * static); `sortDirection="none"` with `onSort` shows a dimmed affordance.
 */

type TableDensity = "default" | "compact";
type AlignKind = "left" | "center" | "right";
type SortDirection = "asc" | "desc" | "none";

const TableDensityContext = createContext<TableDensity>("default");

const alignClass: Record<AlignKind, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  density?: TableDensity;
}

const Root = forwardRef<HTMLTableElement, TableProps>(
  ({ className, density = "default", children, ...props }, ref) => (
    <TableDensityContext.Provider value={density}>
      <table
        ref={ref}
        className={cn("w-full border-collapse font-sans text-body-sm", className)}
        {...props}
      >
        {children}
      </table>
    </TableDensityContext.Provider>
  ),
);
Root.displayName = "Table";

const Header = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(
        "border-border/40 border-b text-label-caps text-muted-foreground uppercase tracking-wider",
        className,
      )}
      {...props}
    />
  ),
);
Header.displayName = "Table.Header";

const Body = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("text-foreground", className)} {...props} />
  ),
);
Body.displayName = "Table.Body";

const Row = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-border/20 border-b transition-colors last:border-0 hover:bg-muted/40",
        className,
      )}
      {...props}
    />
  ),
);
Row.displayName = "Table.Row";

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: AlignKind;
  numeric?: boolean;
}

const Cell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align = "left", numeric, children, ...props }, ref) => {
    const density = useContext(TableDensityContext);
    return (
      <td
        ref={ref}
        className={cn(
          "px-3",
          density === "compact" ? "py-1.5" : "py-3",
          alignClass[align],
          numeric && "font-mono tabular-nums",
          className,
        )}
        {...props}
      >
        {children}
      </td>
    );
  },
);
Cell.displayName = "Table.Cell";

export interface TableHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: AlignKind;
  /** When provided, header becomes a sort trigger. */
  onSort?: () => void;
  /** Current sort state for this column. */
  sortDirection?: SortDirection;
}

const HeaderCell = forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
  ({ className, align = "left", onSort, sortDirection = "none", children, ...props }, ref) => {
    const sortAffordance =
      onSort !== undefined ? (
        <span className="ml-1 inline-flex flex-col">
          <ChevronUp
            aria-hidden="true"
            className={cn("-mb-1 size-3", sortDirection === "asc" ? "opacity-100" : "opacity-30")}
          />
          <ChevronDown
            aria-hidden="true"
            className={cn("size-3", sortDirection === "desc" ? "opacity-100" : "opacity-30")}
          />
        </span>
      ) : null;

    const ariaSort: ThHTMLAttributes<HTMLTableCellElement>["aria-sort"] =
      onSort === undefined
        ? undefined
        : sortDirection === "asc"
          ? "ascending"
          : sortDirection === "desc"
            ? "descending"
            : "none";

    return (
      <th
        ref={ref}
        scope="col"
        aria-sort={ariaSort}
        className={cn(
          "px-3 py-2.5 font-medium",
          alignClass[align],
          align === "right" && "[&_button]:justify-end",
          className,
        )}
        {...props}
      >
        {onSort !== undefined ? (
          <button
            type="button"
            onClick={onSort}
            className={cn(
              "inline-flex items-center gap-1",
              "text-label-caps uppercase tracking-wider",
              "transition-colors hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {children}
            {sortAffordance}
          </button>
        ) : (
          children
        )}
      </th>
    );
  },
);
HeaderCell.displayName = "Table.HeaderCell";

type TableRoot = typeof Root & {
  Header: typeof Header;
  Body: typeof Body;
  Row: typeof Row;
  Cell: typeof Cell;
  HeaderCell: typeof HeaderCell;
};

const Table: TableRoot = Object.assign(Root, { Header, Body, Row, Cell, HeaderCell });

export { Table };
