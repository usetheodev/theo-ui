/**
 * `<InlineCode>` — styled inline `<code>` for markdown rendering.
 *
 * Differentiates inline code from fenced code-blocks (which use `<CodeBlock>`)
 * via subtle surface treatment. Per Violet Forge: muted background, mono
 * font, slight horizontal padding.
 */
import type { HTMLAttributes } from "react";
import { cn } from "../cn.js";

export type InlineCodeProps = HTMLAttributes<HTMLElement>;

export function InlineCode({ className, children, ...props }: InlineCodeProps): JSX.Element {
  return (
    <code
      className={cn(
        "rounded bg-muted px-1.5 py-0.5 font-mono text-code-sm text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
}
