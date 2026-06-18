import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { CopyButton } from "../../primitives/copy-button/index.js";

/**
 * CodeBlock — terminal command / code snippet surface.
 *
 * Pre-rendered code block with optional terminal "$ " prefix per line,
 * optional caption (file name), and optional CopyButton positioned top-right.
 * The CopyButton receives the RAW `code` (without the visual "$ " prefix),
 * so consumers paste only the executable command.
 *
 * @example
 *   <CodeBlock code="theo deploy" terminal copyable />
 *   <CodeBlock code={dotenv} caption=".env.local" copyable />
 *
 * `language` is reserved for future syntax highlighting (v1: ignored).
 */
export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Code content. Can be multiline. */
  code: string;
  /** Language hint (forward-compat; v1 ignored). */
  language?: string;
  /** When true, prefix each line with "$ " for shell commands. */
  terminal?: boolean;
  /** Show inline CopyButton in top-right. */
  copyable?: boolean;
  /** Optional caption above block (e.g. ".env.local"). */
  caption?: ReactNode;
}

const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(
  ({ className, code, language: _language, terminal, copyable, caption, ...props }, ref) => {
    const lines = code.split(/\r?\n/);

    return (
      <div
        data-slot="code-block"
        ref={ref}
        className={cn(
          "relative rounded-lg border border-border/40 bg-muted/40 font-mono text-body-sm",
          className,
        )}
        {...props}
      >
        {caption !== undefined ? (
          <div className="border-border/40 border-b px-3 py-1.5 font-sans text-label text-muted-foreground">
            {caption}
          </div>
        ) : null}
        {copyable ? (
          <CopyButton value={code} aria-label="Copy code" className="absolute top-2 right-2" />
        ) : null}
        <pre className="overflow-x-auto p-3 text-foreground">
          {terminal ? (
            <code>
              {lines.map((line, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: code lines are positional; reorder requires consumer recompute.
                <span key={i} className="block whitespace-pre">
                  <span className="select-none text-muted-foreground">$ </span>
                  {line}
                </span>
              ))}
            </code>
          ) : (
            <code>{code}</code>
          )}
        </pre>
      </div>
    );
  },
);
CodeBlock.displayName = "CodeBlock";

export { CodeBlock };
