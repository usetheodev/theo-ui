import { ChevronDown, Folder } from "lucide-react";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

interface FolderSelectorProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Currently selected absolute path. */
  path: string;
  /**
   * Render in compact mode (smaller height, no chevron padding).
   * Default is the full-width composer variant used in Cowork home.
   */
  compact?: boolean;
}

/**
 * FolderSelector — chip showing the active working directory.
 *
 * Visual: folder icon + monospaced path (truncated middle) + chevron.
 * Stateless: caller handles the actual folder-picker dialog.
 */
const FolderSelector = forwardRef<HTMLButtonElement, FolderSelectorProps>(
  ({ className, path, compact, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card",
        "font-mono text-code-sm text-foreground",
        "transition-colors duration-base ease-out-soft",
        "hover:border-primary/40 hover:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        compact ? "h-8 px-2.5" : "h-10 px-3",
        className,
      )}
      {...props}
    >
      <Folder className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-left">{path}</span>
      <ChevronDown className="size-3 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  ),
);
FolderSelector.displayName = "FolderSelector";

export { FolderSelector };
