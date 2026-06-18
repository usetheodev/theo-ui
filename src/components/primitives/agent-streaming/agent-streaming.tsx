import { Sparkles } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { useInLiveRegion } from "../../../lib/live-region-context.js";

/**
 * AgentStreaming — inline "agent is thinking / typing" indicator.
 *
 * Renders inside an agent stream while the model is producing a response.
 * Default visual is 3 violet dots pulsing. If `partial` is provided, renders
 * the streamed-so-far text with a caret. Optional `model` label on the right.
 */

interface AgentStreamingProps extends HTMLAttributes<HTMLDivElement> {
  /** Streamed-so-far text. When present, replaces the dots animation. */
  partial?: ReactNode;
  /** Optional model name shown as a chip. */
  model?: ReactNode;
}

const AgentStreaming = forwardRef<HTMLDivElement, AgentStreamingProps>(
  ({ className, partial, model, ...props }, ref) => {
    // T4.1 (MF-4): when nested inside a live region container (AgentStream,
    // ChatThread, etc.), omit our own aria-live to prevent double-announcement.
    // Standalone usage keeps the live region intact.
    const inLiveRegion = useInLiveRegion();
    return (
      <div
        ref={ref}
        role={inLiveRegion ? undefined : "status"}
        aria-live={inLiveRegion ? undefined : "polite"}
        aria-label="Agent is responding"
        className={cn(
          "flex w-full items-start gap-3 rounded-xl border border-border/40 bg-card/40 px-4 py-3",
          className,
        )}
        {...props}
        data-slot="agent-streaming"
      >
        <span
          className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"
          aria-hidden="true"
        >
          <Sparkles className="size-3.5" />
        </span>
        <div className="grid min-w-0 flex-1 gap-1">
          {model ? (
            <span className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
              {model}
            </span>
          ) : null}
          {partial ? (
            <span className="break-words text-body-md text-foreground">
              {partial}
              <span
                className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-primary align-middle"
                aria-hidden="true"
              />
            </span>
          ) : (
            <span className="flex items-center gap-1.5" aria-hidden="true">
              <Dot delay={0} />
              <Dot delay={120} />
              <Dot delay={240} />
              <span className="ml-1 text-body-sm text-muted-foreground">thinking…</span>
            </span>
          )}
        </div>
      </div>
    );
  },
);
AgentStreaming.displayName = "AgentStreaming";

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="size-1.5 animate-pulse rounded-full bg-primary"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

export { AgentStreaming };
