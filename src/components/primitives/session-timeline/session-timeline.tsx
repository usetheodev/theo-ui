import { ChevronRight, Clock, Coins, MessageSquare, Sparkles } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

export type SessionStatus = "active" | "completed" | "failed" | "aborted";

export interface SessionSummary {
  id: string;
  /** Friendly title (often the first user message). */
  title: string;
  /** ISO timestamp / friendly date label. */
  startedAt: string;
  duration?: string;
  status: SessionStatus;
  /** Agent/model that ran the session. */
  model?: string;
  /** Total tokens consumed (formatted, e.g. "35.7k"). */
  tokens?: string;
  /** Total cost (USD). */
  cost?: number;
  /** Number of messages in the session. */
  messageCount?: number;
}

interface SessionTimelineProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  sessions: SessionSummary[];
  /** Title above the list. */
  title?: ReactNode;
  /** Fires when a row is clicked. */
  onOpen?: (id: string) => void;
}

const STATUS_CLASS: Record<SessionStatus, string> = {
  active: "border-primary/40 bg-primary/15 text-primary",
  completed: "border-success/40 bg-success/15 text-success",
  failed: "border-destructive/40 bg-destructive/15 text-destructive",
  aborted: "border-border/40 bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<SessionStatus, string> = {
  active: "Active",
  completed: "Completed",
  failed: "Failed",
  aborted: "Aborted",
};

/**
 * SessionTimeline — historical view of past agent sessions with per-row
 * tokens / cost / duration / status. Click a row to open the full session.
 */
const SessionTimeline = forwardRef<HTMLDivElement, SessionTimelineProps>(
  ({ className, sessions, title = "Recent sessions", onOpen, ...props }, ref) => (
    <section
      ref={ref}
      className={cn("rounded-xl border bg-card", className)}
      aria-label="Session history"
      {...props}
      data-slot="session-timeline"
    >
      {title ? (
        <header className="flex items-baseline justify-between border-border/40 border-b px-4 py-3">
          <h3 className="font-display text-title-md tracking-tight">{title}</h3>
          <span className="font-mono text-label text-muted-foreground">
            {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
          </span>
        </header>
      ) : null}
      <ul className="divide-y divide-border/30">
        {sessions.map((s) => {
          const RowTag = onOpen ? "button" : "div";
          return (
            <li key={s.id}>
              <RowTag
                type={onOpen ? "button" : undefined}
                onClick={onOpen ? () => onOpen(s.id) : undefined}
                className={cn(
                  "grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-left",
                  onOpen &&
                    "hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none",
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-body-sm text-foreground">{s.title}</p>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5",
                        "font-mono text-label uppercase tracking-wider",
                        STATUS_CLASS[s.status],
                      )}
                    >
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-label text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" aria-hidden="true" /> {s.startedAt}
                      {s.duration ? <> · {s.duration}</> : null}
                    </span>
                    {s.model ? (
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="size-3" aria-hidden="true" /> {s.model}
                      </span>
                    ) : null}
                    {s.tokens ? (
                      <span className="inline-flex items-center gap-1">
                        <Coins className="size-3" aria-hidden="true" /> {s.tokens} tok
                      </span>
                    ) : null}
                    {s.cost !== undefined ? (
                      <span className="tabular-nums">${s.cost.toFixed(2)}</span>
                    ) : null}
                    {s.messageCount !== undefined ? (
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="size-3" aria-hidden="true" /> {s.messageCount}
                      </span>
                    ) : null}
                  </div>
                </div>
                {onOpen ? (
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : null}
              </RowTag>
            </li>
          );
        })}
        {sessions.length === 0 ? (
          <li className="px-4 py-8 text-center font-sans text-body-sm text-muted-foreground">
            No sessions yet.
          </li>
        ) : null}
      </ul>
    </section>
  ),
);
SessionTimeline.displayName = "SessionTimeline";

export { SessionTimeline };
