import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

type Variant = "text" | "code" | "json";

interface ToolResultProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  /**
   * Pre-formatted content. For `code`/`json`, the component uses mono font
   * and preserves whitespace. For `text`, normal body font.
   */
  children: ReactNode;
}

/**
 * ToolResult — formatted output of a tool invocation.
 *
 * Three quick variants: plain text, code (monospace), json (monospace, tinted).
 * Always rendered as a `<div>` for predictable prop typing; code/json variants
 * wrap children in `<pre>` internally.
 */
const ToolResult = forwardRef<HTMLDivElement, ToolResultProps>(
  ({ className, variant = "text", children, ...props }, ref) => {
    if (variant === "text") {
      return (
        <div
          data-slot="tool-result"
          ref={ref}
          className={cn("text-body-sm text-muted-foreground", className)}
          {...props}
        >
          {children}
        </div>
      );
    }
    return (
      <div data-slot="tool-result" ref={ref} className={className} {...props}>
        <pre
          className={cn(
            "overflow-x-auto whitespace-pre-wrap font-mono text-code-sm",
            variant === "json" ? "text-primary-glow" : "text-foreground",
          )}
        >
          {children}
        </pre>
      </div>
    );
  },
);
ToolResult.displayName = "ToolResult";

export { ToolResult };
