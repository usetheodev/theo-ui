import { ChevronRight, Wrench } from "lucide-react";
import { forwardRef, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn.js";

interface ToolCallProps extends HTMLAttributes<HTMLDivElement> {
  /** Tool name e.g. "bash", "read_file", "edit_file". */
  name?: string;
  /**
   * Summary label e.g. "Executou 2 comandos", "Leu 18 arquivos".
   */
  summary: ReactNode;
  /**
   * Collapsible payload (e.g. command, stdout, file list).
   */
  detail?: ReactNode;
  defaultOpen?: boolean;
  /**
   * If true, hides the wrench icon (useful when grouping by name elsewhere).
   */
  hideIcon?: boolean;
}

/**
 * ToolCall — collapsible row representing an agent tool invocation.
 *
 * Visual: subtle muted container, wrench icon, summary in body text,
 * chevron rotates on expand. Pairs with `<ToolResult>` for the rendered output.
 *
 * Typical usage inside a ChatMessage assistant body:
 *
 *   <ToolCall summary="Leu 18 arquivos" detail={<ToolResult>{output}</ToolResult>} />
 */
const ToolCall = forwardRef<HTMLDivElement, ToolCallProps>(
  ({ className, name, summary, detail, defaultOpen, hideIcon, ...props }, ref) => {
    const [open, setOpen] = useState(defaultOpen ?? false);
    const expandable = detail !== undefined;
    return (
      <div
        ref={ref}
        className={cn("rounded-md border border-border/40 bg-muted/30", className)}
        {...props}
      >
        <button
          type="button"
          onClick={() => expandable && setOpen((v) => !v)}
          aria-expanded={expandable ? open : undefined}
          disabled={!expandable}
          className={cn(
            "flex w-full items-center gap-2 px-3 py-2 text-left",
            "font-sans text-body-sm text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            expandable && "cursor-pointer hover:bg-muted/60",
          )}
        >
          {!hideIcon ? <Wrench className="size-3.5 shrink-0 text-primary" aria-hidden /> : null}
          {name ? (
            <span className="font-mono text-code-sm text-muted-foreground">{name}</span>
          ) : null}
          <span className="flex-1 truncate">{summary}</span>
          {expandable ? (
            <ChevronRight
              className={cn(
                "size-3.5 text-muted-foreground transition-transform",
                open && "rotate-90",
              )}
              aria-hidden
            />
          ) : null}
        </button>
        {expandable && open ? (
          <div className="border-border/40 border-t bg-card px-3 py-2">{detail}</div>
        ) : null}
      </div>
    );
  },
);
ToolCall.displayName = "ToolCall";

export { ToolCall };
