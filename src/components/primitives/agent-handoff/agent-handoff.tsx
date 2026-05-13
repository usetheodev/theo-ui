import { ArrowRight } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

export interface HandoffParty {
  /** Display name, e.g. "planner". */
  name: string;
  /** Optional avatar initials (max 2 chars). */
  initials?: string;
  /** Identity tone matching AgentProfile. */
  tone?: "primary" | "accent" | "success" | "warning" | "info" | "muted";
}

interface AgentHandoffProps extends HTMLAttributes<HTMLElement> {
  from: HandoffParty;
  to: HandoffParty;
  /** What is being handed off — short reason / payload preview. */
  reason: ReactNode;
  /** Optional metadata footer (e.g. timestamp, token budget). */
  footer?: ReactNode;
}

const TONE_CLASS: Record<NonNullable<HandoffParty["tone"]>, string> = {
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  info: "bg-info text-info-foreground",
  muted: "bg-muted text-foreground",
};

function Avatar({ party }: { party: HandoffParty }) {
  const inits = party.initials ?? party.name.slice(0, 2).toUpperCase();
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "grid size-7 place-items-center rounded-full font-bold font-mono text-label",
          TONE_CLASS[party.tone ?? "primary"],
        )}
        aria-hidden
      >
        {inits}
      </span>
      <span className="font-medium font-mono text-code-sm text-foreground">{party.name}</span>
    </span>
  );
}

/**
 * AgentHandoff — visual marker of one agent delegating to another. Pairs
 * with AgentProfile for the identity tones; place it in the timeline so the
 * user sees the baton being passed.
 */
const AgentHandoff = forwardRef<HTMLElement, AgentHandoffProps>(
  ({ className, from, to, reason, footer, ...props }, ref) => (
    <article
      ref={ref}
      className={cn(
        "grid gap-2 rounded-lg border border-primary/30 border-dashed bg-primary/5 px-4 py-3",
        className,
      )}
      {...props}
    >
      <header className="flex items-center gap-2">
        <Avatar party={from} />
        <ArrowRight className="size-4 text-primary" aria-hidden />
        <Avatar party={to} />
        <span className="ml-auto font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
          handoff
        </span>
      </header>
      <p className="text-body-sm text-foreground">{reason}</p>
      {footer ? <p className="font-mono text-label text-muted-foreground">{footer}</p> : null}
    </article>
  ),
);
AgentHandoff.displayName = "AgentHandoff";

export { AgentHandoff };
