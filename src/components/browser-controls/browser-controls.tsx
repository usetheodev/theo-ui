import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

interface BrowserControlsProps extends HTMLAttributes<HTMLDivElement> {
  url: string;
  onUrlChange?: (next: string) => void;
  onBack?: () => void;
  onForward?: () => void;
  onReload?: () => void;
  /**
   * Disable URL editing (some previews are read-only).
   */
  readOnlyUrl?: boolean;
}

/**
 * BrowserControls — back/forward/reload + URL bar.
 *
 * Used as the top of PreviewPanel in the Code workspace.
 */
const BrowserControls = forwardRef<HTMLDivElement, BrowserControlsProps>(
  ({ className, url, onUrlChange, onBack, onForward, onReload, readOnlyUrl, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-1 border-border/40 border-b bg-card px-3 py-2",
        className,
      )}
      {...props}
    >
      <NavBtn aria-label="Back" {...(onBack ? { onClick: onBack } : {})}>
        <ArrowLeft className="size-3.5" />
      </NavBtn>
      <NavBtn aria-label="Forward" {...(onForward ? { onClick: onForward } : {})}>
        <ArrowRight className="size-3.5" />
      </NavBtn>
      <NavBtn aria-label="Reload" {...(onReload ? { onClick: onReload } : {})}>
        <RotateCw className="size-3.5" />
      </NavBtn>
      <input
        type="url"
        value={url}
        onChange={(e) => onUrlChange?.(e.target.value)}
        readOnly={readOnlyUrl ?? !onUrlChange}
        aria-label="Address"
        className={cn(
          "ml-2 h-7 flex-1 rounded-md border border-border/40 bg-muted/40 px-2",
          "font-mono text-code-sm text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      />
    </div>
  ),
);
BrowserControls.displayName = "BrowserControls";

function NavBtn({
  onClick,
  children,
  "aria-label": ariaLabel,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={!onClick}
      className={cn(
        "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-30 disabled:hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}

export { BrowserControls };
