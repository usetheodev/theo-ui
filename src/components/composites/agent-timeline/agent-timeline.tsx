import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import type { AgentEvent as AgentEventModel } from "../../../types/agent.js";
import { AgentEvent } from "../../primitives/agent-event/index.js";

interface AgentTimelineProps extends HTMLAttributes<HTMLOListElement> {
  events: AgentEventModel[];
  /**
   * If true, events with `detail` are collapsible.
   */
  collapsible?: boolean;
  /**
   * Renders a vertical line connecting events. Default true.
   */
  showLine?: boolean;
}

/**
 * AgentTimeline — vertical list of agent events.
 *
 * Visual: optional thin border-left running through the column, with each
 * AgentEvent slightly indented from the line. Events animate in via fade-in-up
 * when first mounted.
 */
const AgentTimeline = forwardRef<HTMLOListElement, AgentTimelineProps>(
  ({ className, events, collapsible = true, showLine = true, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(
        "grid gap-1",
        showLine &&
          "relative pl-4 before:absolute before:top-1 before:bottom-1 before:left-[11px] before:w-px before:bg-border/60",
        className,
      )}
      {...props}
      data-slot="agent-timeline"
    >
      {events.map((event) => (
        <li key={event.id} className="animate-fade-in-up">
          <AgentEvent event={event} collapsible={collapsible} />
        </li>
      ))}
    </ol>
  ),
);
AgentTimeline.displayName = "AgentTimeline";

export { AgentTimeline };
