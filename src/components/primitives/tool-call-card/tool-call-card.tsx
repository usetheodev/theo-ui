"use client";

import { Check, ChevronRight, Loader2, X } from "lucide-react";
import { useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";

/**
 * ToolCallCard — single agent tool invocation rendered inside the stream.
 *
 * Visual: row with tool icon + tool name + target/command (mono) + status +
 * optional chevron. Expandable: when `output` is provided the row becomes a
 * `<details>` whose body renders the stdout/stderr/result block.
 *
 * Distinct from `AgentEvent` in the existing AgentTimeline by being a
 * stand-alone card that lives inside an AgentStream alongside chat messages.
 */

export type ToolCallStatus = "running" | "success" | "failed" | "queued" | "skipped";

const STATUS_ICON: Record<ToolCallStatus, ReactNode> = {
  running: <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden="true" />,
  success: <Check className="size-3.5 text-success" aria-hidden="true" />,
  failed: <X className="size-3.5 text-destructive" aria-hidden="true" />,
  queued: <span className="size-2 rounded-full bg-warning" aria-hidden="true" />,
  skipped: <span className="size-2 rounded-full bg-muted-foreground" aria-hidden="true" />,
};

const STATUS_LABEL: Record<ToolCallStatus, string> = {
  running: "Running",
  success: "Completed",
  failed: "Failed",
  queued: "Queued",
  skipped: "Skipped",
};

interface ToolCallCardProps extends HTMLAttributes<HTMLElement> {
  /** Tool name (matches Theo Code / Claude Code tool registry: Bash, Edit, Read, …). */
  tool: ReactNode;
  /** Optional icon for the tool. */
  icon?: IconComponent;
  /** Target / command shown in monospace next to the tool name. */
  target?: ReactNode;
  status: ToolCallStatus;
  /** Optional stdout/stderr/result body. When present, the card becomes expandable. */
  output?: ReactNode;
  /** Default expanded state. Default: false (collapsed). */
  defaultExpanded?: boolean;
  /** Timestamp shown on the right. */
  timestamp?: ReactNode;
}

export function ToolCallCard({
  className,
  tool,
  icon: Icon,
  target,
  status,
  output,
  defaultExpanded = false,
  timestamp,
  ...props
}: ToolCallCardProps) {
  const [open, setOpen] = useState(defaultExpanded);
  const expandable = !!output;

  return (
    <article
      data-slot="tool-call-card"
      className={cn(
        "overflow-hidden rounded-lg border border-border/40 bg-card/40 text-card-foreground",
        className,
      )}
      {...props}
    >
      {/* T5.4: <header role="button"> previously failed axe's
       * aria-prohibited-attr + semantic-landmark guidance. Replaced by
       * <div> for the layout container and a separate <button> for the
       * expand affordance (when expandable). Status icon span now carries
       * role="img" to make aria-label valid. */}
      <div className={cn("flex items-center gap-2 px-3 py-2")}>
        {expandable ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? `Collapse ${tool} details` : `Expand ${tool} details`}
            className="-m-1 inline-flex size-6 shrink-0 items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight
              className={cn("size-3.5 transition-transform duration-base", open && "rotate-90")}
              aria-hidden="true"
            />
          </button>
        ) : null}
        {Icon ? (
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : null}
        <span className="shrink-0 font-medium font-mono text-code-sm text-foreground">{tool}</span>
        {target ? (
          <span className="truncate font-mono text-code-sm text-muted-foreground">{target}</span>
        ) : null}
        <span
          role="img"
          aria-label={STATUS_LABEL[status]}
          className="ml-auto inline-flex shrink-0 items-center gap-1.5"
        >
          {STATUS_ICON[status]}
        </span>
        {timestamp ? (
          <span className="shrink-0 font-mono text-label text-muted-foreground tabular-nums">
            {timestamp}
          </span>
        ) : null}
      </div>
      {expandable && open ? (
        <div className="border-border/40 border-t bg-muted/20 px-3 py-2 font-mono text-code-sm">
          {output}
        </div>
      ) : null}
    </article>
  );
}
