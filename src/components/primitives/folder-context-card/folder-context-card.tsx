import { ChevronRight, File, Folder } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";

export interface FolderEntry {
  id: string;
  name: string;
  kind: "folder" | "file";
  /**
   * If true, the entry is expanded (icons + nested children).
   * Pure visual flag; toggling is the caller's job.
   */
  open?: boolean;
  /**
   * Optional nested entries when this is a folder.
   */
  children?: FolderEntry[];
  /** Optional adornment after the name (badge, modified indicator). */
  trailing?: ReactNode;
  /** Override the icon. */
  icon?: IconComponent;
}

interface FolderContextCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  /**
   * Root entries shown directly in the card.
   */
  entries: FolderEntry[];
  /**
   * Fires when an entry row is clicked.
   */
  onEntryClick?: (id: string) => void;
}

/**
 * FolderContextCard — file/folder tree fragment for the right inspector.
 *
 * Visual: 1-level tree with chevron indicating expanded state. Renders nested
 * children recursively, but does not manage open state — caller controls
 * `entry.open` and reacts to `onEntryClick`.
 */
const FolderContextCard = forwardRef<HTMLElement, FolderContextCardProps>(
  ({ className, title, entries, onEntryClick, ...props }, ref) => (
    <section
      data-slot="folder-context-card"
      ref={ref}
      className={cn("rounded-xl border bg-card p-4", className)}
      {...props}
    >
      {title ? (
        <header className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-title-md tracking-tight">{title}</h3>
        </header>
      ) : null}
      <Tree entries={entries} {...(onEntryClick ? { onEntryClick } : {})} depth={0} />
    </section>
  ),
);
FolderContextCard.displayName = "FolderContextCard";

function Tree({
  entries,
  onEntryClick,
  depth,
}: {
  entries: FolderEntry[];
  onEntryClick?: (id: string) => void;
  depth: number;
}) {
  return (
    <ul className={cn("grid", depth === 0 ? "gap-0.5" : "gap-0")}>
      {entries.map((entry) => {
        const IconComp = entry.icon ?? (entry.kind === "folder" ? Folder : File);
        const hasChildren = entry.kind === "folder" && entry.children && entry.children.length > 0;
        return (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onEntryClick?.(entry.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5",
                "font-sans text-body-sm text-foreground",
                "transition-colors hover:bg-muted",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              style={{ paddingLeft: `${0.5 + depth * 0.9}rem` }}
            >
              {hasChildren ? (
                <ChevronRight
                  className={cn(
                    "size-3 shrink-0 text-muted-foreground transition-transform",
                    entry.open && "rotate-90",
                  )}
                  aria-hidden="true"
                />
              ) : (
                <span className="w-3" aria-hidden="true" />
              )}
              <IconComp
                className={cn(
                  "size-4 shrink-0",
                  entry.kind === "folder" ? "text-primary" : "text-muted-foreground",
                )}
                aria-hidden="true"
              />
              <span className="flex-1 truncate text-left">{entry.name}</span>
              {entry.trailing}
            </button>
            {hasChildren && entry.open ? (
              <Tree
                entries={entry.children as FolderEntry[]}
                {...(onEntryClick ? { onEntryClick } : {})}
                depth={depth + 1}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export { FolderContextCard };
