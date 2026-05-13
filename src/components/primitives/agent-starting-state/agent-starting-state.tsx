import { Loader2 } from "lucide-react";
import { forwardRef } from "react";
import type { OutputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

interface AgentStartingStateProps extends OutputHTMLAttributes<HTMLOutputElement> {
  /** Title shown next to the spinner. Default "Starting up…". */
  label?: ReactNode;
  /** Optional secondary copy explaining the bootstrap step. */
  hint?: ReactNode;
}

/**
 * AgentStartingState — full-width skeleton shown while the agent boots.
 *
 * Visual: violet spinner + label, optional hint below. Wrapped in a soft card.
 * Uses semantic `<output aria-live="polite">` so screen readers announce the state.
 */
const AgentStartingState = forwardRef<HTMLOutputElement, AgentStartingStateProps>(
  ({ className, label = "Starting up…", hint, ...props }, ref) => (
    <output
      ref={ref}
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 rounded-xl border border-primary/30 border-dashed bg-primary/5 px-4 py-3",
        className,
      )}
      {...props}
    >
      <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
      <div className="grid">
        <span className="font-medium text-body-sm text-foreground">{label}</span>
        {hint ? <span className="text-body-sm text-muted-foreground">{hint}</span> : null}
      </div>
    </output>
  ),
);
AgentStartingState.displayName = "AgentStartingState";

export { AgentStartingState };
