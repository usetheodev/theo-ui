import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { BrowserControls } from "../../primitives/browser-controls/index.js";

interface PreviewPanelProps extends Omit<HTMLAttributes<HTMLElement>, "content"> {
  url: string;
  onUrlChange?: (next: string) => void;
  onBack?: () => void;
  onForward?: () => void;
  onReload?: () => void;
  /**
   * Region rendered as the preview body. Typically an <iframe>.
   */
  content: ReactNode;
  /**
   * Optional logs section rendered below the preview (e.g. dev server output).
   */
  logsSlot?: ReactNode;
}

/**
 * PreviewPanel — browser preview with controls + integrated logs slot.
 *
 * The Code workspace shows live dev-server URL + HMR logs side-by-side; this
 * panel keeps both in a single card so the user doesn't switch contexts.
 */
const PreviewPanel = forwardRef<HTMLElement, PreviewPanelProps>(
  (
    { className, url, onUrlChange, onBack, onForward, onReload, content, logsSlot, ...props },
    ref,
  ) => (
    <section
      ref={ref}
      className={cn("flex h-full flex-col overflow-hidden rounded-xl border bg-card", className)}
      {...props}
    >
      <BrowserControls
        url={url}
        {...(onUrlChange ? { onUrlChange } : {})}
        {...(onBack ? { onBack } : {})}
        {...(onForward ? { onForward } : {})}
        {...(onReload ? { onReload } : {})}
      />
      <div className="flex-1 overflow-hidden bg-background">{content}</div>
      {logsSlot ? (
        <div className="max-h-48 overflow-auto border-border/40 border-t bg-card">{logsSlot}</div>
      ) : null}
    </section>
  ),
);
PreviewPanel.displayName = "PreviewPanel";

export { PreviewPanel };
