import { Bot, ShieldAlert, User } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";

export type AuditActorKind = "user" | "agent" | "system";

export type AuditSeverity = "info" | "warning" | "error";

export interface AuditEntry {
  id: string;
  /** Who triggered the action. */
  actor: { kind: AuditActorKind; name: string };
  /** Verb / action label, e.g. "wrote file", "ran command". */
  action: string;
  /** Target of the action (file path, command, etc). */
  target?: ReactNode;
  /** ISO timestamp / friendly label. */
  timestamp: string;
  severity?: AuditSeverity;
  /** Optional detail block (multi-line). */
  detail?: ReactNode;
}

interface AuditLogEntryProps extends HTMLAttributes<HTMLElement> {
  entry: AuditEntry;
}

const ACTOR_ICON: Record<AuditActorKind, IconComponent> = {
  user: User,
  agent: Bot,
  system: ShieldAlert,
};

const SEVERITY_CLASS: Record<AuditSeverity, string> = {
  info: "text-muted-foreground",
  warning: "text-warning",
  error: "text-destructive",
};

/**
 * AuditLogEntry — one row in the agent audit log. Tells the user exactly
 * who did what and when. Severity colors the timestamp and target.
 */
const AuditLogEntry = forwardRef<HTMLElement, AuditLogEntryProps>(
  ({ className, entry, ...props }, ref) => {
    const Icon = ACTOR_ICON[entry.actor.kind];
    const sev = entry.severity ?? "info";
    return (
      <article
        ref={ref}
        className={cn(
          "grid grid-cols-[auto_1fr_auto] items-start gap-3 border-border/30 border-b px-3 py-2",
          "last:border-b-0",
          className,
        )}
        {...props}
        data-slot="audit-log-entry"
      >
        <span
          className={cn(
            "mt-0.5 grid size-7 place-items-center rounded-md bg-muted text-muted-foreground",
            sev === "warning" && "text-warning",
            sev === "error" && "text-destructive",
          )}
          aria-hidden="true"
        >
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-2 text-body-sm">
            <span className="font-medium font-mono text-code-sm text-foreground">
              {entry.actor.name}
            </span>
            <span className={cn("font-mono text-code-sm", SEVERITY_CLASS[sev])}>
              {entry.action}
            </span>
            {entry.target ? (
              <span className="truncate font-mono text-code-sm text-foreground/80">
                {entry.target}
              </span>
            ) : null}
          </p>
          {entry.detail ? (
            <div className="mt-1 rounded-md bg-muted/40 px-2.5 py-1.5 font-mono text-code-sm text-muted-foreground">
              {entry.detail}
            </div>
          ) : null}
        </div>
        <span className="shrink-0 font-mono text-label text-muted-foreground tabular-nums">
          {entry.timestamp}
        </span>
      </article>
    );
  },
);
AuditLogEntry.displayName = "AuditLogEntry";

export { AuditLogEntry };
