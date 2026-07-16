"use client";

import { ChevronDown, GitCommitHorizontal, X } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

export interface ReviewFile {
  /** File path, e.g. "agents/support-agent.ts". */
  path: string;
  additions: number;
  deletions: number;
  /** Unified diff string (`+`/`-`/context lines, optional `+++`/`---` headers). */
  diff: string;
}

interface CodeReviewPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  files: ReviewFile[];
  /** When set, only that file's diff is shown; null/undefined shows all. */
  selectedPath?: string | null;
  onSelect?: (path: string | null) => void;
  onClose?: () => void;
  /** Provide to enable the Commit action; omit to leave it disabled (fake-door). */
  onCommit?: () => void;
}

interface DiffRow {
  kind: "add" | "del" | "ctx" | "meta";
  oldNo?: number;
  newNo?: number;
  text: string;
}

function parseDiff(diff: string): DiffRow[] {
  const rows: DiffRow[] = [];
  let oldNo = 1;
  let newNo = 1;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++") || line.startsWith("---")) {
      rows.push({ kind: "meta", text: line });
      continue;
    }
    if (line.startsWith("+")) {
      rows.push({ kind: "add", newNo: newNo++, text: line });
      continue;
    }
    if (line.startsWith("-")) {
      rows.push({ kind: "del", oldNo: oldNo++, text: line });
      continue;
    }
    rows.push({ kind: "ctx", oldNo: oldNo++, newNo: newNo++, text: line });
  }
  return rows;
}

const DIFF_ROW_CLASS: Record<DiffRow["kind"], string> = {
  add: "bg-success/10 text-success",
  del: "bg-destructive/10 text-destructive",
  ctx: "text-foreground",
  meta: "text-muted-foreground",
};

function FileDiff({ file }: { file: ReviewFile }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border/40"
      data-testid="review-file-diff"
      data-path={file.path}
    >
      <div className="flex items-center gap-2 border-border/40 border-b bg-card/80 px-3 py-1.5 font-mono text-xs">
        <span className="truncate text-foreground">{file.path}</span>
        <span className="ml-auto shrink-0 text-success">+{file.additions}</span>
        <span className="shrink-0 text-destructive">-{file.deletions}</span>
      </div>
      <pre className="overflow-auto font-mono text-xs leading-relaxed">
        {parseDiff(file.diff).map((row) => (
          <span
            key={`${row.kind}:${row.oldNo ?? ""}:${row.newNo ?? ""}:${row.text}`}
            data-testid={`diff-line-${row.kind}`}
            className={cn("flex", DIFF_ROW_CLASS[row.kind])}
          >
            <span className="w-10 shrink-0 select-none border-border/30 border-r px-1 text-right text-muted-foreground/60">
              {row.kind === "meta" ? "" : (row.newNo ?? row.oldNo)}
            </span>
            <span className="min-w-0 flex-1 whitespace-pre px-2">{row.text || " "}</span>
          </span>
        ))}
      </pre>
    </div>
  );
}

/**
 * CodeReviewPanel — a code-agent review surface: a toolbar with aggregate change counters
 * and a Commit action, a column of per-file unified diffs, and an "All files" tree to filter
 * to one file. Controlled selection via `selectedPath` + `onSelect`.
 */
const CodeReviewPanel = forwardRef<HTMLDivElement, CodeReviewPanelProps>(
  ({ className, files, selectedPath, onSelect, onClose, onCommit, ...props }, ref) => {
    const additions = files.reduce((a, f) => a + f.additions, 0);
    const deletions = files.reduce((a, f) => a + f.deletions, 0);
    const shown = selectedPath ? files.filter((f) => f.path === selectedPath) : files;

    return (
      <div
        data-slot="code-review-panel"
        ref={ref}
        className={cn(
          "flex min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border/40",
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-1 border-border/40 border-b bg-card/80 px-3 py-2">
          <span className="flex items-center gap-1 rounded-full bg-muted/50 px-3 py-0.5 font-medium text-foreground text-xs">
            Review
            {onClose ? (
              <button
                type="button"
                aria-label="Close review"
                onClick={onClose}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            ) : null}
          </span>
          <span className="ml-auto flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">
              Unstaged <span className="text-success">+{additions}</span>{" "}
              <span className="text-destructive">-{deletions}</span>
            </span>
            <button
              type="button"
              onClick={onCommit}
              disabled={!onCommit}
              className="flex h-6 items-center gap-1 rounded-md bg-muted/60 px-2 text-foreground text-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GitCommitHorizontal className="size-3.5" aria-hidden="true" />
              Commit
            </button>
          </span>
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-auto p-3">
            {shown.map((file) => (
              <FileDiff key={file.path} file={file} />
            ))}
          </div>
          <div className="w-36 shrink-0 overflow-auto border-border/40 border-l px-2 py-2.5">
            <button
              type="button"
              onClick={() => onSelect?.(null)}
              className={cn(
                "flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-left text-xs transition-colors hover:bg-muted/40",
                selectedPath == null ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <ChevronDown className="size-3" aria-hidden="true" />
              All files
            </button>
            <ul className="mt-1 space-y-0.5">
              {files.map((file) => {
                const name = file.path.split("/").at(-1) ?? file.path;
                const active = selectedPath === file.path;
                return (
                  <li key={file.path}>
                    <button
                      type="button"
                      onClick={() => onSelect?.(file.path)}
                      className={cn(
                        "w-full truncate rounded-md px-1.5 py-1 text-left font-mono text-xs transition-colors hover:bg-muted/40",
                        active ? "bg-muted/50 text-foreground" : "text-muted-foreground",
                      )}
                      title={file.path}
                    >
                      {name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    );
  },
);
CodeReviewPanel.displayName = "CodeReviewPanel";

export { CodeReviewPanel };
export type { CodeReviewPanelProps };
