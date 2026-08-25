import { Eye, Lock, Settings2 } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";

export type ToolEnablement = "enabled" | "ask" | "denied";

export interface ToolEntry {
  id: string;
  name: string;
  description?: ReactNode;
  icon?: IconComponent;
  enablement?: ToolEnablement;
  /**
   * Source of the tool: built-in, plugin/skill, or MCP server name.
   */
  source?: string;
  /** Optional badge text (e.g. "destructive", "experimental"). */
  badge?: ReactNode;
}

interface ToolsListProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "onChange"> {
  tools: ToolEntry[];
  /** Title above the list. */
  title?: ReactNode;
  /**
   * Fires when the consumer toggles a tool's enablement state.
   * Cycle: enabled → ask → denied → enabled.
   */
  onEnablementChange?: (id: string, next: ToolEnablement) => void;
}

const ENABLEMENT_LABEL: Record<ToolEnablement, string> = {
  enabled: "Allowed",
  ask: "Ask before use",
  denied: "Denied",
};

const ENABLEMENT_CLASS: Record<ToolEnablement, string> = {
  enabled: "bg-success/15 text-success border-success/40",
  ask: "bg-warning/15 text-warning border-warning/40",
  denied: "bg-destructive/15 text-destructive border-destructive/40",
};

const cycle = (cur: ToolEnablement): ToolEnablement =>
  cur === "enabled" ? "ask" : cur === "ask" ? "denied" : "enabled";

/**
 * ToolsList — surface every tool the agent could call, with its enablement
 * state. Click the chip to cycle: Allowed → Ask → Denied.
 */
const ToolsList = forwardRef<HTMLDivElement, ToolsListProps>(
  ({ className, tools, title = "Tools", onEnablementChange, ...props }, ref) => (
    <section
      data-slot="tools-list"
      ref={ref}
      className={cn("rounded-xl border border-border bg-card", className)}
      {...props}
    >
      {title ? (
        <header className="flex items-center justify-between border-border/40 border-b px-4 py-3">
          <h3 className="font-display text-title-md tracking-tight">{title}</h3>
          <span className="font-mono text-label text-muted-foreground">
            {tools.length} {tools.length === 1 ? "tool" : "tools"}
          </span>
        </header>
      ) : null}
      <ul className="divide-y divide-border/30">
        {tools.map((tool) => {
          const Icon = tool.icon ?? Settings2;
          const state = tool.enablement ?? "enabled";
          return (
            <li
              key={tool.id}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 px-4 py-3"
            >
              <span className="mt-0.5 grid size-8 place-items-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                {/*
                  The enablement chip lives in this wrapping row rather than in a third grid
                  column. As its own `auto` column it never yielded width: in a 300px panel it
                  held 104px while the tool name and description shared 63px, so the name
                  overlapped the chip and the description wrapped a word per line. Here it takes
                  the line when there is room and drops to the next one when there is not, and
                  the description always spans the full content column.
                */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 break-all font-medium font-mono text-body-sm text-foreground">
                    {tool.name}
                  </span>
                  {tool.source ? (
                    <span className="font-mono text-label text-muted-foreground uppercase tracking-wider">
                      {tool.source}
                    </span>
                  ) : null}
                  {tool.badge ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 font-mono text-accent text-label uppercase">
                      {tool.badge}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onEnablementChange?.(tool.id, cycle(state))}
                    className={cn(
                      "ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1",
                      "font-mono text-label uppercase tracking-wider transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      ENABLEMENT_CLASS[state],
                      !onEnablementChange && "pointer-events-none",
                    )}
                    aria-label={`Cycle enablement for ${tool.name}`}
                  >
                    {state === "enabled" ? (
                      <Eye className="size-3" aria-hidden="true" />
                    ) : state === "ask" ? (
                      <Settings2 className="size-3" aria-hidden="true" />
                    ) : (
                      <Lock className="size-3" aria-hidden="true" />
                    )}
                    {ENABLEMENT_LABEL[state]}
                  </button>
                </div>
                {tool.description ? (
                  <p className="mt-0.5 text-body-sm text-muted-foreground">{tool.description}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  ),
);
ToolsList.displayName = "ToolsList";

export { ToolsList };
