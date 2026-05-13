import { Cloud, FileSpreadsheet, Folder } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn.js";
import type { IconComponent } from "../../lib/types.js";

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
}

interface CreatedFilesCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  files: CreatedFile[];
  /**
   * Optional CTA shown at the bottom (e.g. "Move to Google Drive").
   */
  cta?: ReactNode;
}

/**
 * CreatedFilesCard — surfaces files produced by a completed task.
 *
 * From WIREMOCKS §2: each file is a card-like row with icon + name + destination.
 * Used as social proof of delivery in Cowork Task Completed views.
 */
const CreatedFilesCard = forwardRef<HTMLElement, CreatedFilesCardProps>(
  ({ className, title = "Files created", files, cta, ...props }, ref) => (
    <section
      ref={ref}
      className={cn("rounded-xl border border-primary/40 bg-primary/5 p-4", className)}
      {...props}
    >
      <header className="mb-3 flex items-center gap-2">
        <Cloud className="size-4 text-primary" aria-hidden />
        <h3 className="font-display text-title-md tracking-tight">{title}</h3>
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
                <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-code-md text-foreground">{file.name}</p>
                  {file.destination ? (
                    <p className="flex items-center gap-1 truncate text-body-sm text-muted-foreground">
                      <Folder className="size-3 shrink-0" aria-hidden /> {file.destination}
                    </p>
                  ) : null}
                </div>
                {file.size ? (
                  <span className="font-mono text-code-sm text-muted-foreground">{file.size}</span>
                ) : null}
              </RowTag>
            </li>
          );
        })}
      </ul>
      {cta ? <div className="mt-3 flex justify-end">{cta}</div> : null}
    </section>
  ),
);
CreatedFilesCard.displayName = "CreatedFilesCard";

export { CreatedFilesCard };
