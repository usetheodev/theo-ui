"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { forwardRef, useEffect } from "react";
import type { ElementType, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { ActionBar } from "../../primitives/action-bar/index.js";
import { Card } from "../../primitives/card/index.js";
import { EmptyState } from "../../primitives/empty-state/index.js";

/**
 * PageShell — page-level scaffold composite.
 *
 * Renders title + optional description + optional ActionBar, then
 * one of four mutually-exclusive content states:
 *   1. loading (highest precedence)
 *   2. error
 *   3. empty
 *   4. children (default)
 *
 * Scope-narrowed per Brief #5 D3: PageShell does NOT manage
 * `document.title`. Use the optional `onTitleChange` callback to
 * wire your own hook (e.g. useSetPageTitle, react-helmet,
 * next/head).
 *
 * @example
 *   <PageShell
 *     title="Domains"
 *     description="Custom domains and DNS verification."
 *     search={{ placeholder: "Search…", value: q, onChange: setQ }}
 *     primaryAction={{ label: "Add domain", icon: Plus, onClick: openModal }}
 *     loading={isLoading}
 *     error={error ? { message: error.message, onRetry: refetch } : undefined}
 *     empty={data?.length === 0 ? { title: "No domains yet" } : undefined}
 *   >
 *     <DataTable columns={…} data={data} />
 *   </PageShell>
 */
export interface PageShellProps {
  title: string;
  description?: ReactNode;
  /** Optional callback invoked when `title` changes — wire to your own document.title hook. */
  onTitleChange?: (title: string) => void;
  primaryAction?: {
    label: ReactNode;
    icon?: ElementType;
    onClick: () => void;
    loading?: boolean;
  };
  search?: {
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
  };
  onFilterClick?: () => void;
  loading?: boolean;
  /** Custom loading UI. Defaults to a centered spinner card. */
  loadingNode?: ReactNode;
  error?: {
    message: string;
    onRetry?: () => void;
    docsHref?: string;
  };
  empty?: {
    icon?: ElementType;
    title: string;
    description?: ReactNode;
    action?: { label: string; onClick: () => void };
  };
  children?: ReactNode;
  className?: string;
}

const PageShell = forwardRef<HTMLElement, PageShellProps>(
  (
    {
      title,
      description,
      onTitleChange,
      primaryAction,
      search,
      onFilterClick,
      loading = false,
      loadingNode,
      error,
      empty,
      children,
      className,
    },
    ref,
  ) => {
    useEffect(() => {
      onTitleChange?.(title);
    }, [title, onTitleChange]);

    const hasActionBar =
      search !== undefined || primaryAction !== undefined || onFilterClick !== undefined;

    // State precedence: loading > error > empty > children
    let content: ReactNode;
    if (loading) {
      content = loadingNode ?? (
        <Card className="flex items-center justify-center gap-3 p-12 text-muted-foreground">
          <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          <span className="font-sans text-body-sm">Loading…</span>
        </Card>
      );
    } else if (error) {
      content = (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <AlertCircle aria-hidden="true" className="size-8 text-destructive" />
          <p className="font-sans text-body-sm text-foreground">{error.message}</p>
          <div className="flex items-center gap-3">
            {error.onRetry ? (
              <button
                type="button"
                onClick={error.onRetry}
                className={cn(
                  "inline-flex items-center rounded-md border border-border/40 px-3 py-1.5",
                  "font-sans text-body-sm text-foreground",
                  "transition-colors hover:bg-muted",
                )}
              >
                Retry
              </button>
            ) : null}
            {error.docsHref ? (
              <a
                href={error.docsHref}
                className="font-sans text-body-sm text-primary hover:underline"
              >
                View docs
              </a>
            ) : null}
          </div>
        </Card>
      );
    } else if (empty) {
      const emptyAction = empty.action;
      content = (
        <EmptyState
          icon={empty.icon as Parameters<typeof EmptyState>[0]["icon"]}
          title={empty.title}
          description={empty.description}
          action={
            emptyAction ? (
              <button
                type="button"
                onClick={emptyAction.onClick}
                className={cn(
                  "inline-flex items-center rounded-md bg-primary px-3 py-1.5",
                  "font-medium font-sans text-body-sm text-primary-foreground",
                  "transition-colors hover:bg-primary-deep",
                )}
              >
                {emptyAction.label}
              </button>
            ) : undefined
          }
        />
      );
    } else {
      content = children;
    }

    return (
      <main
        ref={ref}
        aria-busy={loading || undefined}
        className={cn("flex flex-col gap-6", className)}
        data-slot="page-shell"
      >
        <header className="flex flex-col gap-1">
          <h1 className="font-display font-semibold text-display-sm text-foreground tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="font-sans text-body-md text-muted-foreground">{description}</p>
          ) : null}
        </header>
        {hasActionBar ? (
          <ActionBar search={search} primaryAction={primaryAction} onFilterClick={onFilterClick} />
        ) : null}
        {/* Content slot: `flex flex-col gap-6` matches the outer <main> gap so
         * direct children (e.g. multiple <Card>s, a <Table>, an inline <Alert>)
         * automatically receive consistent section spacing. Without this,
         * pages with 2+ top-level children would render them flush against
         * each other — a regression observed in dashboard /memory landing
         * (5 sibling sections collided). Pages that already wrap their content
         * in a single grid/div are unaffected (gap only applies between siblings). */}
        <div className="flex flex-col gap-6">{content}</div>
      </main>
    );
  },
);
PageShell.displayName = "PageShell";

export { PageShell };
