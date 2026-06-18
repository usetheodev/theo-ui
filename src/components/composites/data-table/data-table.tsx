"use client";

import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { DropdownMenu } from "../../primitives/dropdown-menu/index.js";
import { EmptyState } from "../../primitives/empty-state/index.js";
import { Pagination } from "../../primitives/pagination/index.js";
import { Skeleton } from "../../primitives/skeleton/index.js";
import { Table } from "../../primitives/table/index.js";

/**
 * DataTable — generic, sortable, expandable composite over `<Table>`.
 *
 * Adds operator-grade entity-list patterns on top of the plain Table
 * primitive: sortable headers, sticky header, expandable rows
 * (multi-row by default), row action menus (Dropdown), client-side
 * pagination, loading skeleton rows, empty state. Both sort and
 * pagination support controlled OR uncontrolled mode (consumer
 * passes onSortChange / onPageChange to take over state).
 *
 * @example
 *   <DataTable
 *     columns={[
 *       { key: "name", label: "Name", sortable: true },
 *       { key: "status", label: "Status" },
 *     ]}
 *     data={domains}
 *     rowKey={(d) => d.id}
 *     expandable={(d) => d.status === "pending" ? <DnsRecords domain={d} /> : null}
 *     rowActions={(d) => (
 *       <>
 *         <DropdownMenu.Item onSelect={() => editDomain(d)}>Edit</DropdownMenu.Item>
 *         <DropdownMenu.Item onSelect={() => deleteDomain(d)}>Delete</DropdownMenu.Item>
 *       </>
 *     )}
 *   />
 */
export interface DataTableColumn<T> {
  key: string;
  label: ReactNode;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  width?: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableSort {
  key: string;
  direction: "asc" | "desc";
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  stickyHeader?: boolean;
  expandable?: (row: T) => ReactNode | null;
  expandMode?: "single" | "multiple";
  rowActions?: (row: T) => ReactNode;
  pagination?: {
    pageSize: number;
    controlledPage?: number;
    onPageChange?: (page: number) => void;
  } | null;
  defaultSort?: DataTableSort;
  sort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;
  loading?: boolean;
  emptyState?: ReactNode;
  className?: string;
}

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function DataTable<T>(props: DataTableProps<T>): ReactNode {
  const {
    data,
    columns,
    rowKey,
    stickyHeader = true,
    expandable,
    expandMode = "multiple",
    rowActions,
    pagination,
    defaultSort,
    sort: controlledSort,
    onSortChange,
    loading = false,
    emptyState,
    className,
  } = props;

  const isControlledSort = onSortChange !== undefined;
  const [uncontrolledSort, setUncontrolledSort] = useState<DataTableSort | null>(
    defaultSort ?? null,
  );
  const sort = isControlledSort ? (controlledSort ?? null) : uncontrolledSort;

  const isControlledPage = pagination?.controlledPage !== undefined;
  const [uncontrolledPage, setUncontrolledPage] = useState(0);
  const currentPage = isControlledPage ? (pagination?.controlledPage ?? 0) : uncontrolledPage;

  // EC-9: clamp pageSize to >= 1 to avoid divide-by-zero / infinite render
  const effectivePageSize = Math.max(1, pagination?.pageSize ?? 10);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function handleSort(columnKey: string) {
    // Cycle: none → asc → desc → none
    let nextSort: DataTableSort | null;
    if (sort?.key !== columnKey) {
      nextSort = { key: columnKey, direction: "asc" };
    } else if (sort.direction === "asc") {
      nextSort = { key: columnKey, direction: "desc" };
    } else {
      nextSort = null;
    }
    if (isControlledSort) {
      onSortChange?.(nextSort);
    } else {
      setUncontrolledSort(nextSort);
      // EC-8: sort change resets pagination to page 0
      if (!isControlledPage) setUncontrolledPage(0);
    }
  }

  function handlePageChange(page: number) {
    // Pagination uses 1-indexed; internal state 0-indexed
    const zeroIdx = page - 1;
    if (isControlledPage) {
      pagination?.onPageChange?.(zeroIdx);
    } else {
      setUncontrolledPage(zeroIdx);
    }
  }

  function toggleExpand(key: string) {
    if (expandMode === "single") {
      setExpanded((prev) => (prev.has(key) ? new Set() : new Set([key])));
    } else {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    }
  }

  // Apply client-side sort in uncontrolled mode
  const sortedData = useMemo(() => {
    if (isControlledSort || sort === null) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return data;
    const sorted = [...data].sort((a, b) => {
      const aVal = col.render
        ? null
        : (a as Record<string, unknown>)[sort.key as keyof T as string];
      const bVal = col.render
        ? null
        : (b as Record<string, unknown>)[sort.key as keyof T as string];
      const cmp = compareValues(aVal, bVal);
      return sort.direction === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [data, sort, isControlledSort, columns]);

  // Apply client-side pagination in uncontrolled mode
  const visibleData = useMemo(() => {
    if (!pagination) return sortedData;
    if (isControlledPage) return sortedData; // consumer pre-sliced
    const start = currentPage * effectivePageSize;
    return sortedData.slice(start, start + effectivePageSize);
  }, [sortedData, pagination, isControlledPage, currentPage, effectivePageSize]);

  // EC-1 fix: compute colSpan accounting for chevron + actions columns
  const extraCols = (expandable ? 1 : 0) + (rowActions ? 1 : 0);
  const expandedColSpan = columns.length + extraCols;
  const totalCols = columns.length + extraCols;

  // Loading state (EC-7: loading > empty)
  if (loading) {
    return (
      <div className={cn("w-full", className)} data-slot="data-table">
        <Table>
          <Table.Header className={stickyHeader ? "sticky top-0 bg-card" : undefined}>
            <Table.Row>
              {expandable ? (
                <Table.HeaderCell>
                  <span className="sr-only">Expand</span>
                </Table.HeaderCell>
              ) : null}
              {columns.map((col) => (
                <Table.HeaderCell key={col.key} align={col.align}>
                  {col.label}
                </Table.HeaderCell>
              ))}
              {rowActions ? (
                <Table.HeaderCell>
                  <span className="sr-only">Actions</span>
                </Table.HeaderCell>
              ) : null}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {Array.from({ length: 5 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows are positional placeholders
              <Table.Row key={`skeleton-${i}`}>
                {Array.from({ length: totalCols }, (_, j) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton cells are positional placeholders
                  <Table.Cell key={`s-${i}-${j}`}>
                    <Skeleton className="h-4 w-full" />
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    );
  }

  // Empty state (after loading check)
  if (sortedData.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        {emptyState ?? <EmptyState title="No data" description="There's nothing here yet." />}
      </div>
    );
  }

  const totalPages = pagination ? Math.ceil(sortedData.length / effectivePageSize) : 1;

  return (
    <div className={cn("w-full", className)}>
      <Table>
        <Table.Header className={stickyHeader ? "sticky top-0 z-10 bg-card" : undefined}>
          <Table.Row>
            {expandable ? (
              <Table.HeaderCell>
                <span className="sr-only">Expand</span>
              </Table.HeaderCell>
            ) : null}
            {columns.map((col) => {
              const isSortable = col.sortable === true;
              const isActive = sort?.key === col.key;
              return (
                <Table.HeaderCell
                  key={col.key}
                  align={col.align}
                  onSort={isSortable ? () => handleSort(col.key) : undefined}
                  sortDirection={isSortable ? (isActive ? sort?.direction : "none") : undefined}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </Table.HeaderCell>
              );
            })}
            {rowActions ? (
              <Table.HeaderCell>
                <span className="sr-only">Actions</span>
              </Table.HeaderCell>
            ) : null}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {visibleData.map((row) => {
            const key = rowKey(row);
            const expandedContent = expandable ? expandable(row) : null;
            const isExpandable = expandedContent !== null && expandedContent !== undefined;
            const isExpanded = expanded.has(key);
            return (
              <Fragment key={key}>
                <Table.Row>
                  {expandable ? (
                    <Table.Cell>
                      {isExpandable ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(key)}
                          aria-expanded={isExpanded}
                          aria-controls={`expanded-${key}`}
                          aria-label={isExpanded ? "Collapse row" : "Expand row"}
                          className="inline-flex items-center justify-center rounded-md p-0.5 hover:bg-muted"
                        >
                          {isExpanded ? (
                            <ChevronDown aria-hidden="true" className="size-4" />
                          ) : (
                            <ChevronRight aria-hidden="true" className="size-4" />
                          )}
                        </button>
                      ) : null}
                    </Table.Cell>
                  ) : null}
                  {columns.map((col) => (
                    <Table.Cell key={col.key} align={col.align} className={col.className}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </Table.Cell>
                  ))}
                  {rowActions ? (
                    <Table.Cell align="right">
                      <DropdownMenu>
                        <DropdownMenu.Trigger
                          aria-label="Row actions"
                          className={cn(
                            "inline-flex size-7 items-center justify-center rounded-md",
                            "text-muted-foreground hover:bg-muted hover:text-foreground",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          )}
                        >
                          <MoreHorizontal aria-hidden="true" className="size-4" />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="end">{rowActions(row)}</DropdownMenu.Content>
                      </DropdownMenu>
                    </Table.Cell>
                  ) : null}
                </Table.Row>
                {isExpanded && isExpandable ? (
                  <tr id={`expanded-${key}`}>
                    <td colSpan={expandedColSpan} className="bg-muted/30 p-4">
                      {expandedContent}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </Table.Body>
      </Table>
      {pagination && totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-end">
          <Pagination
            currentPage={currentPage + 1}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      ) : null}
    </div>
  );
}

export { DataTable };
