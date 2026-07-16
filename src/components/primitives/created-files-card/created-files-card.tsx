import { Cloud, FileSpreadsheet, Folder, SquarePen } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";

export interface CreatedFile {
  id: string;
  name: string;
  /** Optional size for display, e.g. "42 KB". */
  size?: string;
  /** Icon override. */
  icon?: IconComponent;
  /** Optional destination metadata (e.g. "Google Drive · /Reports"). */
  destination?: ReactNode;
  /** Optional URL to open the file. */
  href?: string;
  /** Lines added (shown as `+N` when present — used by the `edited` variant). */
  additions?: number;
  /** Lines removed (shown as `-N` when present — used by the `edited` variant). */
  deletions?: number;
}

interface CreatedFilesCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  files: CreatedFile[];
  /**
   * `created` (default) — files produced by a task (Cloud icon, "Files created").
   * `edited` — files a coding agent changed (SquarePen icon, "Edited N files", per-file +/-).
   */
  variant?: "created" | "edited";
  /**
   * Optional CTA shown at the bottom (e.g. "Move to Google Drive", or Review / Undo actions
   * for the `edited` variant).
   */
  cta?: ReactNode;
  /**
   * Where to render the `cta`. `footer` (default) — a bottom row; `header` — inline on the
   * title row (right-aligned), for a compact coding-agent edited-files card.
   */
  ctaPlacement?: "header" | "footer";
  /**
   * Optional aggregate line/removed counts shown next to the title (edited variant), e.g.
   * `+6 -3` summing every changed file.
   */
  headerAggregate?: { additions: number; deletions: number };
}

/**
 * CreatedFilesCard — surfaces files produced by a completed task.
 *
 * From WIREMOCKS §2: each file is a card-like row with icon + name + destination.
 * Used as social proof of delivery in Task Completed views.
 */
const CreatedFilesCard = forwardRef<HTMLElement, CreatedFilesCardProps>(
  (
    {
      className,
      title,
      variant = "created",
      files,
      cta,
      ctaPlacement = "footer",
      headerAggregate,
      ...props
    },
    ref,
  ) => {
    const edited = variant === "edited";
    const HeaderIcon = edited ? SquarePen : Cloud;
    const resolvedTitle =
      title ??
      (edited ? `Edited ${files.length} file${files.length === 1 ? "" : "s"}` : "Files created");
    return (
      <section
        data-slot="created-files-card"
        data-variant={variant}
        ref={ref}
        className={cn(
          "rounded-xl border p-4",
          edited ? "border-border/40 bg-card/60" : "border-primary/40 bg-primary/5",
          className,
        )}
        {...props}
      >
        <header className="mb-3 flex items-center gap-2">
          <HeaderIcon className="size-4 text-primary" aria-hidden="true" />
          <h3 className="font-display text-title-md tracking-tight">{resolvedTitle}</h3>
          {headerAggregate ? (
            <span className="font-mono text-code-sm">
              <span className="text-success">+{headerAggregate.additions}</span>{" "}
              <span className="text-destructive">-{headerAggregate.deletions}</span>
            </span>
          ) : null}
          {cta && ctaPlacement === "header" ? <span className="ml-auto">{cta}</span> : null}
        </header>
        <ul className="grid gap-2">
          {files.map((file) => {
            const Icon = file.icon ?? FileSpreadsheet;
            const RowTag = file.href ? "a" : "div";
            return (
              <li key={file.id}>
                <RowTag
                  href={file.href}
                  target={file.href ? "_blank" : undefined}
                  rel={file.href ? "noreferrer" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md border border-border/40 bg-card px-3 py-2",
                    file.href &&
                      "transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-code-md text-foreground">{file.name}</p>
                    {file.destination ? (
                      <p className="flex items-center gap-1 truncate text-body-sm text-muted-foreground">
                        <Folder className="size-3 shrink-0" aria-hidden="true" /> {file.destination}
                      </p>
                    ) : null}
                  </div>
                  {file.additions != null || file.deletions != null ? (
                    <span className="shrink-0 font-mono text-code-sm">
                      {file.additions != null ? (
                        <span className="text-success">+{file.additions}</span>
                      ) : null}{" "}
                      {file.deletions != null ? (
                        <span className="text-destructive">-{file.deletions}</span>
                      ) : null}
                    </span>
                  ) : null}
                  {file.size ? (
                    <span className="font-mono text-code-sm text-muted-foreground">
                      {file.size}
                    </span>
                  ) : null}
                </RowTag>
              </li>
            );
          })}
        </ul>
        {cta && ctaPlacement !== "header" ? (
          <div className="mt-3 flex justify-end">{cta}</div>
        ) : null}
      </section>
    );
  },
);
CreatedFilesCard.displayName = "CreatedFilesCard";

export { CreatedFilesCard };
