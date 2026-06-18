"use client";

import { ArrowDownLeft, Clock, GitCommit, RotateCcw } from "lucide-react";
import { forwardRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import { Badge } from "../../primitives/badge/index.js";
import { Button } from "../../primitives/button/index.js";

export interface RollbackTarget {
  id: string;
  version: string;
  commitSha: string;
  commitMessage: string;
  deployedAt: string;
  isCurrent?: boolean;
  /**
   * Optional duration of the deploy (e.g. "24s") for context.
   */
  duration?: string;
}

interface RollbackUIProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Deployment history, newest first. The current deploy should have `isCurrent: true`.
   */
  history: RollbackTarget[];
  /**
   * Fires when user confirms rollback to a specific target.
   */
  onRollback?: (targetId: string) => void | Promise<void>;
}

/**
 * RollbackUI — instant rollback selector showing recent versions.
 *
 * The current deploy is marked, every other version offers a "Roll back" button.
 * On select, the row enters confirm state (Confirm / Cancel buttons inline) before
 * firing onRollback. This protects against accidental rollbacks while still being one click.
 */
const RollbackUI = forwardRef<HTMLDivElement, RollbackUIProps>(
  ({ className, history, onRollback, ...props }, ref) => {
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [pendingId, setPendingId] = useState<string | null>(null);

    const trigger = async (id: string) => {
      setPendingId(id);
      try {
        await onRollback?.(id);
      } finally {
        setPendingId(null);
        setConfirmId(null);
      }
    };

    return (
      <div
        ref={ref}
        className={cn("rounded-xl border bg-card p-5 shadow-sm", className)}
        {...props}
        data-slot="rollback-ui"
      >
        <header className="mb-4 flex items-baseline justify-between gap-3">
          <div>
            <h3 className="font-display text-title-md tracking-tight">Rollback</h3>
            <p className="text-body-sm text-muted-foreground">
              Instant rollback to a previous version. Verified in under 5 seconds.
            </p>
          </div>
        </header>

        <ol className="grid gap-2">
          {history.map((target, idx) => {
            const isCurrent = target.isCurrent ?? idx === 0;
            const isConfirming = confirmId === target.id;
            const isPending = pendingId === target.id;
            return (
              <li
                key={target.id}
                className={cn(
                  "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border p-3",
                  isCurrent ? "border-primary/40 bg-primary/5" : "border-border/40 bg-card",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-md",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                  aria-hidden="true"
                >
                  {isCurrent ? <Clock className="size-4" /> : <GitCommit className="size-4" />}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-code-sm text-foreground">{target.version}</span>
                    {isCurrent ? <Badge variant="success">Current</Badge> : null}
                    {target.duration ? (
                      <span className="font-mono text-code-sm text-muted-foreground">
                        · {target.duration}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-body-sm text-muted-foreground">
                    <span className="font-mono">{target.commitSha.slice(0, 7)}</span> ·{" "}
                    {target.commitMessage} · {target.deployedAt}
                  </p>
                </div>
                <div>
                  {isCurrent ? null : isConfirming ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmId(null)}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => trigger(target.id)} disabled={isPending}>
                        <RotateCcw /> Confirm rollback
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setConfirmId(target.id)}>
                      <ArrowDownLeft /> Roll back
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  },
);
RollbackUI.displayName = "RollbackUI";

export { RollbackUI };
