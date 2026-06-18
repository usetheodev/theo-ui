import { CheckCircle2, CircleX, ShieldAlert } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

export type HookEventResult = "ok" | "blocked" | "error";

export interface HookEventEntry {
  id: string;
  /** Hook event (e.g. PreToolUse). */
  event: string;
  /** Hook matcher (e.g. Bash). */
  matcher: string;
  /** What the hook command was. */
  command: string;
  result: HookEventResult;
  timestamp: string;
  /** Optional stderr/stdout snippet. */
  output?: string;
  /** Optional duration label, e.g. "120ms". */
  duration?: string;
}

interface HookEventLogProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  events: HookEventEntry[];
  title?: ReactNode;
}

const RESULT_CONFIG = {
  ok: { icon: CheckCircle2, color: "text-success" },
  blocked: { icon: ShieldAlert, color: "text-warning" },
  error: { icon: CircleX, color: "text-destructive" },
} as const;

/**
 * HookEventLog — chronological list of hook firings, with result tone, the
 * command that ran, and an optional output preview.
 */
const HookEventLog = forwardRef<HTMLDivElement, HookEventLogProps>(
  ({ className, events, title = "Hook log", ...props }, ref) => (
    <section
      ref={ref}
      className={cn("rounded-xl border bg-card", className)}
      {...props}
      data-slot="hook-event-log"
    >
      <header className="flex items-baseline justify-between border-border/40 border-b px-4 py-3">
        <h3 className="font-display text-title-md tracking-tight">{title}</h3>
        <span className="font-mono text-label text-muted-foreground">
          {events.length} {events.length === 1 ? "event" : "events"}
        </span>
      </header>
      <ol className="divide-y divide-border/30">
        {events.map((evt) => {
          const cfg = RESULT_CONFIG[evt.result];
          const Icon = cfg.icon;
          return (
            <li
              key={evt.id}
              className="grid grid-cols-[auto_1fr_auto] items-start gap-3 px-4 py-2.5"
            >
              <Icon aria-hidden="true" className={cn("mt-0.5 size-3.5 shrink-0", cfg.color)} />
              <div className="min-w-0">
                <p className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-code-sm text-primary">{evt.event}</span>
                  <span className="font-mono text-code-sm text-muted-foreground">
                    matcher={evt.matcher}
                  </span>
                  {evt.duration ? (
                    <span className="font-mono text-label text-muted-foreground tabular-nums">
                      {evt.duration}
                    </span>
                  ) : null}
                </p>
                <p className="truncate font-mono text-code-sm text-foreground">{evt.command}</p>
                {evt.output ? (
                  <pre className="mt-1 max-h-24 overflow-auto rounded-md bg-muted/60 px-2 py-1 font-mono text-code-sm text-muted-foreground">
                    {evt.output}
                  </pre>
                ) : null}
              </div>
              <span className="font-mono text-label text-muted-foreground tabular-nums">
                {evt.timestamp}
              </span>
            </li>
          );
        })}
        {events.length === 0 ? (
          <li className="px-4 py-8 text-center font-sans text-body-sm text-muted-foreground">
            No hooks have fired yet.
          </li>
        ) : null}
      </ol>
    </section>
  ),
);
HookEventLog.displayName = "HookEventLog";

export { HookEventLog };
