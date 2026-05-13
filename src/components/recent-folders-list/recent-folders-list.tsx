import { Folder } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn.js";

export interface RecentFolder {
  id: string;
  name: ReactNode;
  path: string;
  /** When true, the row is highlighted as selected. */
  active?: boolean;
}

interface RecentFoldersListProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "onSelect"> {
  title?: ReactNode;
  folders: RecentFolder[];
  onSelect?: (id: string) => void;
}

/**
 * RecentFoldersList — recently-used folders for the Cowork home picker.
 *
 * Visual: a stack of rows with folder icon + name + path (smaller, muted),
 * active row highlighted with violet bg.
 */
const RecentFoldersList = forwardRef<HTMLDivElement, RecentFoldersListProps>(
  ({ className, title = "Recent folders", folders, onSelect, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-xl border bg-card", className)} {...props}>
      {title ? (
        <p className="border-border/40 border-b px-3 py-2 font-sans text-label-caps text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
      ) : null}
      <ul>
        {folders.map((folder) => (
          <li key={folder.id}>
            <button
              type="button"
              onClick={() => onSelect?.(folder.id)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2",
                "text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                folder.active ? "bg-primary/10 text-primary" : "hover:bg-muted",
              )}
            >
              <Folder
                className={cn(
                  "size-4 shrink-0",
                  folder.active ? "text-primary" : "text-muted-foreground",
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-body-sm">{folder.name}</p>
                <p className="truncate font-mono text-label text-muted-foreground">{folder.path}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  ),
);
RecentFoldersList.displayName = "RecentFoldersList";

export { RecentFoldersList };
