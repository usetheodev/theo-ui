import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Edit3,
  FilePlus,
  FileSearch,
  Hammer,
  Loader2,
  ShieldCheck,
  Terminal,
  Wrench,
} from "lucide-react";
import { forwardRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";
import type {
  AgentEvent as AgentEventModel,
  AgentEventStatus,
  AgentEventType,
} from "../../../types/agent.js";

const typeIcon: Record<AgentEventType, IconComponent> = {
  command: Terminal,
  file_read: FileSearch,
  file_write: FilePlus,
  edit: Edit3,
  lint: ShieldCheck,
  typecheck: ShieldCheck,
  build: Hammer,
  tool: Wrench,
};

const statusIcon: Record<AgentEventStatus, IconComponent> = {
  pending: CircleDot,
  running: Loader2,
  success: CheckCircle2,
  failed: AlertTriangle,
};

const statusColor: Record<AgentEventStatus, string> = {
  pending: "text-muted-foreground",
  running: "text-primary",
  success: "text-success",
  failed: "text-destructive",
};

interface AgentEventProps extends HTMLAttributes<HTMLDivElement> {
  event: AgentEventModel;
  /**
   * If true, clicking the row toggles `event.detail` visibility.
   */
  collapsible?: boolean;
  /**
   * Force the collapsible state (for controlled scenarios).
   */
  defaultOpen?: boolean;
}

/**
 * AgentEvent — single event row in the agent timeline.
 *
 * Composition: type icon + label + path + diff stats + status icon + (optional) chevron.
 * Running events show a spinner via animate-spin; failed events flash red.
 */
const AgentEvent = forwardRef<HTMLDivElement, AgentEventProps>(
  ({ className, event, collapsible, defaultOpen, ...props }, ref) => {
    const [open, setOpen] = useState(defaultOpen ?? false);
    const TypeIcon = typeIcon[event.type];
    const StatusIcon = statusIcon[event.status];
    const isExpandable = collapsible && event.detail !== undefined;

    const handleToggle = () => {
      if (isExpandable) setOpen((v) => !v);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-md border border-transparent",
          isExpandable && "hover:border-border/40 hover:bg-muted/40",
          className,
        )}
        {...props}
      >
        <div
          role={isExpandable ? "button" : undefined}
          tabIndex={isExpandable ? 0 : undefined}
          onClick={handleToggle}
          onKeyDown={(e) => {
            if (isExpandable && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              handleToggle();
            }
          }}
          aria-expanded={isExpandable ? open : undefined}
          className={cn(
            "grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2",
            isExpandable && "cursor-pointer",
          )}
        >
          <span className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground">
            <TypeIcon className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="truncate font-medium text-body-sm text-foreground">
                {event.label}
              </span>
              {event.path ? (
                <span className="truncate font-mono text-code-sm text-muted-foreground">
                  {event.path}
                </span>
              ) : null}
              {event.diff ? (
                <span className="font-mono text-code-sm">
                  <span className="text-success">+{event.diff.added}</span>{" "}
                  <span className="text-destructive">-{event.diff.removed}</span>
                </span>
              ) : null}
            </p>
            {event.timestamp ? (
              <p className="font-mono text-label text-muted-foreground">{event.timestamp}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5">
            <StatusIcon
              className={cn(
                "size-4",
                statusColor[event.status],
                event.status === "running" && "animate-spin",
              )}
              aria-label={event.status}
            />
            {isExpandable ? (
              <ChevronRight
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  open && "rotate-90",
                )}
                aria-hidden
              />
            ) : null}
          </div>
        </div>
        {isExpandable && open ? (
          <div className="border-border/40 border-t bg-muted/20 px-3 py-2 font-mono text-code-sm text-muted-foreground">
            {event.detail}
          </div>
        ) : null}
      </div>
    );
  },
);
AgentEvent.displayName = "AgentEvent";

export { AgentEvent };
