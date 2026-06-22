import { Maximize2, RefreshCw, X } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

interface ArtifactPreviewProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  /** Optional source/destination label (e.g. "Google Drive", "Local · ~/reports"). */
  source?: ReactNode;
  /**
   * Tabs at the bottom of the artifact (e.g. "Expense Report | Currency Summary").
   * Caller controls the active state externally.
   */
  tabs?: ReactNode;
  /** Top toolbar actions. Defaults to refresh + maximize + close. */
  toolbar?: ReactNode;
  onMaximize?: () => void;
  onRefresh?: () => void;
  onClose?: () => void;
}

/**
 * ArtifactPreview — shell for previewing a generated artifact (XLSX, PDF, image…).
 *
 * Renders a toolbar + content slot + optional bottom tabs. The actual preview
 * (spreadsheet, PDF embed, image) is the caller's `children`, so this stays
 * dependency-free.
 */
const ArtifactPreview = forwardRef<HTMLElement, ArtifactPreviewProps>(
  (
    { className, title, source, tabs, toolbar, onMaximize, onRefresh, onClose, children, ...props },
    ref,
  ) => (
    <section
      data-slot="artifact-preview"
      ref={ref}
      className={cn("flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card", className)}
      {...props}
    >
      <header className="flex items-center gap-3 border-border/40 border-b px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-body-sm text-foreground">{title}</p>
          {source ? (
            <p className="truncate font-mono text-label text-muted-foreground">{source}</p>
          ) : null}
        </div>
        {toolbar ?? (
          <div className="flex items-center gap-1">
            {onRefresh ? (
              <ToolbarButton onClick={onRefresh} aria-label="Refresh">
                <RefreshCw className="size-3.5" />
              </ToolbarButton>
            ) : null}
            {onMaximize ? (
              <ToolbarButton onClick={onMaximize} aria-label="Maximize">
                <Maximize2 className="size-3.5" />
              </ToolbarButton>
            ) : null}
            {onClose ? (
              <ToolbarButton onClick={onClose} aria-label="Close preview">
                <X className="size-3.5" />
              </ToolbarButton>
            ) : null}
          </div>
        )}
      </header>
      <div className="flex-1 overflow-auto">{children}</div>
      {tabs ? (
        <footer className="flex items-center gap-1 border-border/40 border-t px-2 py-1">
          {tabs}
        </footer>
      ) : null}
    </section>
  ),
);
ArtifactPreview.displayName = "ArtifactPreview";

function ToolbarButton({
  onClick,
  children,
  "aria-label": ariaLabel,
}: {
  onClick?: () => void;
  children: ReactNode;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {children}
    </button>
  );
}

export { ArtifactPreview };
