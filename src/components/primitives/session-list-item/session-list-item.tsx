import { Pin } from "lucide-react";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * SessionListItem — single row in the sidebar's Sessions list for a code agent
 * app. Richer than the generic `Sidebar.Item`: shows a status dot, the agent
 * mode last used (chat/code/infra), and a relative timestamp.
 *
 *   <SessionListItem
 *     title="Build the alignment grid demo"
 *     status="running"
 *     mode="code"
 *     timestamp="2m ago"
 *     active
 *     onClick={() => navigate(`/session/${id}`)}
 *   />
 *
 * The status dot maps to the agent run state and animates while running.
 */

export type SessionRunStatus = "running" | "queued" | "completed" | "failed" | "cancelled";
export type SessionMode = "chat" | "code" | "infra";

const STATUS_CLASS: Record<SessionRunStatus, string> = {
  running: "bg-success animate-pulse",
  queued: "bg-warning",
  completed: "bg-muted-foreground/50",
  failed: "bg-destructive",
  cancelled: "bg-muted-foreground/30",
};

const STATUS_LABEL: Record<SessionRunStatus, string> = {
  running: "Running",
  queued: "Queued",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

const MODE_CLASS: Record<SessionMode, string> = {
  chat: "bg-primary/15 text-primary",
  code: "bg-success/15 text-success",
  infra: "bg-accent/15 text-accent",
};

interface SessionListItemProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children" | "title"> {
  /** Session title (truncated). */
  title: ReactNode;
  /** Agent run state. Drives the status dot. Omit for sessions with no run-state model. */
  status?: SessionRunStatus;
  /** Whether this session is pinned — shows a pin indicator in the leading column. */
  pinned?: boolean;
  /** Last mode the user was viewing this session in. Optional pill. */
  mode?: SessionMode;
  /** Relative timestamp string ("2m ago", "yesterday"). */
  timestamp?: ReactNode;
  /** Optional unread count (pending agent events, new outputs). */
  unread?: number;
  /** Whether this is the currently selected session. */
  active?: boolean;
}

const SessionListItem = forwardRef<HTMLButtonElement, SessionListItemProps>(
  (
    {
      className,
      title,
      status,
      pinned,
      mode,
      timestamp,
      unread,
      active,
      onClick,
      disabled,
      ...props
    },
    ref,
  ) => (
    <button
      data-slot="session-list-item"
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "true" : undefined}
      className={cn(
        "group grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 rounded-md px-2 py-2 text-left",
        "transition-colors duration-base ease-out-soft",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {pinned ? (
        <Pin className="size-3.5 shrink-0 text-muted-foreground" aria-label="Pinned" role="img" />
      ) : status ? (
        <span
          className={cn("size-2 shrink-0 rounded-full", STATUS_CLASS[status])}
          aria-label={STATUS_LABEL[status]}
          role="img"
        />
      ) : (
        <span aria-hidden="true" />
      )}
      <span className="grid min-w-0">
        <span className="truncate font-medium text-body-sm">{title}</span>
        {(mode || timestamp) && (
          <span className="mt-0.5 flex items-center gap-1.5 font-mono text-label text-muted-foreground">
            {mode ? (
              <span
                className={cn(
                  "inline-flex h-3.5 items-center rounded px-1 font-medium text-label-caps uppercase tracking-wider",
                  MODE_CLASS[mode],
                )}
              >
                {mode}
              </span>
            ) : null}
            {timestamp ? <span className="truncate">{timestamp}</span> : null}
          </span>
        )}
      </span>
      {unread && unread > 0 ? (
        <span className="inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-label text-primary-foreground tabular-nums">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </button>
  ),
);
SessionListItem.displayName = "SessionListItem";

export { SessionListItem };
