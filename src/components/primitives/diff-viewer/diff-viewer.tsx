import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

export type DiffLineKind = "added" | "removed" | "unchanged" | "meta";

export interface DiffLine {
  kind: DiffLineKind;
  /** Original line number (left side); undefined for added lines. */
  oldNumber?: number;
  /** New line number (right side); undefined for removed lines. */
  newNumber?: number;
  content: string;
}

export interface DiffHunk {
  id: string;
  /**
   * Optional header (e.g. "@@ -42,7 +42,12 @@"). Caller usually formats this.
   */
  header?: string;
  lines: DiffLine[];
  /**
   * If true, the hunk is rendered as a collapsed "N unmodified lines" placeholder.
   */
  collapsed?: boolean;
}

interface DiffViewerProps extends HTMLAttributes<HTMLDivElement> {
  /** Path of the file being diffed. */
  path: string;
  /** Diff stats summary. */
  stats?: { added: number; removed: number };
  hunks: DiffHunk[];
}

const lineBg: Record<DiffLineKind, string> = {
  added: "bg-success/10",
  removed: "bg-destructive/10",
  unchanged: "",
  meta: "bg-muted/60 text-primary",
};

const sign: Record<DiffLineKind, string> = {
  added: "+",
  removed: "-",
  unchanged: " ",
  meta: "@",
};

/**
 * DiffViewer — unified diff rendering, no external dep.
 *
 * Visual: two gutter columns (old/new line numbers) + sign + monospaced content.
 * Added/removed rows tinted in success/destructive. Collapsed hunks render as
 * a single muted row "N unmodified lines".
 *
 * For syntax highlighting, the consumer can render `content` via their own
 * highlighter and pass `unchanged` lines with already-highlighted strings (not
 * common; usually plain text is enough for the brutalist console aesthetic).
 */
const DiffViewer = forwardRef<HTMLDivElement, DiffViewerProps>(
  ({ className, path, stats, hunks, ...props }, ref) => (
    <div
      data-slot="diff-viewer"
      ref={ref}
      className={cn("overflow-hidden rounded-xl border border-border bg-card font-mono", className)}
      {...props}
    >
      <header className="flex items-center justify-between gap-3 border-border/40 border-b bg-muted/30 px-3 py-2">
        <span className="truncate text-code-sm text-foreground">{path}</span>
        {stats ? (
          <span className="font-mono text-code-sm">
            <span className="text-success">+{stats.added}</span>{" "}
            <span className="text-destructive">-{stats.removed}</span>
          </span>
        ) : null}
      </header>
      <ol className="text-code-sm">
        {hunks.map((hunk) => (
          <li key={hunk.id}>
            {hunk.collapsed ? (
              <div className="px-3 py-1 text-muted-foreground italic">
                {hunk.lines.length} unmodified lines
              </div>
            ) : (
              <>
                {hunk.header ? (
                  <div className="bg-muted/60 px-3 py-1 text-primary">{hunk.header}</div>
                ) : null}
                <table className="w-full border-collapse" aria-label={`Diff hunk for ${path}`}>
                  <tbody>
                    {hunk.lines.map((line, idx) => (
                      <tr key={`${hunk.id}-${idx}`} className={lineBg[line.kind]}>
                        <td className="select-none px-2 text-right text-muted-foreground/60 tabular-nums">
                          {line.oldNumber ?? ""}
                        </td>
                        <td className="select-none px-2 text-right text-muted-foreground/60 tabular-nums">
                          {line.newNumber ?? ""}
                        </td>
                        <td
                          className={cn(
                            "select-none pr-1 pl-2",
                            line.kind === "added" && "text-success",
                            line.kind === "removed" && "text-destructive",
                            line.kind === "meta" && "text-primary",
                          )}
                        >
                          {sign[line.kind]}
                        </td>
                        <td
                          className={cn(
                            "w-full whitespace-pre",
                            line.kind === "added" && "text-success",
                            line.kind === "removed" && "text-destructive",
                          )}
                        >
                          {line.content}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </li>
        ))}
      </ol>
    </div>
  ),
);
DiffViewer.displayName = "DiffViewer";

export { DiffViewer };
