import {
  AlertOctagon,
  Database,
  KeyRound,
  type LucideIcon,
  Network,
  ShieldOff,
} from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { useInLiveRegion } from "../../../lib/live-region-context.js";

/**
 * AgentErrorCard — inline error / blocked-state card for an agent stream.
 *
 * Renders when the agent run hits a wall it can't recover from on its own:
 * rate limit, context overflow, auth lost, tool failure, network error.
 * Severity is always destructive; the `kind` drives the icon and helps the
 * consumer wire recovery actions in the footer slot.
 */

export type AgentErrorKind =
  | "rate-limit"
  | "context-overflow"
  | "auth"
  | "tool-failure"
  | "network"
  | "generic";

const ICON_FOR_KIND: Record<AgentErrorKind, LucideIcon> = {
  "rate-limit": Database,
  "context-overflow": ShieldOff,
  auth: KeyRound,
  "tool-failure": AlertOctagon,
  network: Network,
  generic: AlertOctagon,
};

interface AgentErrorCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  kind?: AgentErrorKind;
  title: ReactNode;
  detail?: ReactNode;
  /** Recovery action slot (Retry, Reset, Re-auth, etc.). */
  actions?: ReactNode;
  timestamp?: ReactNode;
}

const AgentErrorCard = forwardRef<HTMLElement, AgentErrorCardProps>(
  ({ className, kind = "generic", title, detail, actions, timestamp, ...props }, ref) => {
    const Icon = ICON_FOR_KIND[kind];
    // T4.1 (MF-4): omit own aria-live when nested in a container live region.
    // role="alert" stays — alerts should announce even via outer region —
    // but we drop the explicit aria-live="assertive" attribute so AT doesn't
    // see two competing live region declarations.
    const inLiveRegion = useInLiveRegion();
    return (
      <section
        ref={ref}
        role="alert"
        aria-live={inLiveRegion ? undefined : "assertive"}
        className={cn(
          "grid w-full gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4",
          className,
        )}
        {...props}
      >
        <header className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex shrink-0 text-destructive" aria-hidden="true">
            <Icon className="size-4" />
          </span>
          <div className="grid min-w-0 flex-1 gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="font-display text-foreground text-title-md tracking-tight">{title}</h4>
              {timestamp ? (
                <span className="shrink-0 font-mono text-label text-muted-foreground tabular-nums">
                  {timestamp}
                </span>
              ) : null}
            </div>
            {detail ? (
              <p className="break-words font-mono text-code-sm text-muted-foreground">{detail}</p>
            ) : null}
          </div>
        </header>
        {actions ? (
          <footer className="flex flex-wrap items-center justify-end gap-2">{actions}</footer>
        ) : null}
      </section>
    );
  },
);
AgentErrorCard.displayName = "AgentErrorCard";

export { AgentErrorCard };
