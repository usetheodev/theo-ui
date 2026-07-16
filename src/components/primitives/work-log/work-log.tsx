"use client";

import { ChevronDown, ChevronRight, Clock } from "lucide-react";
import { forwardRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

interface WorkLogProps extends HTMLAttributes<HTMLDivElement> {
  /** Human-formatted elapsed label, e.g. "2m 30s". Display-only. */
  workedFor: string;
  /** Ordered work steps revealed when expanded. */
  steps: string[];
  /** Start expanded. Defaults to collapsed. */
  defaultOpen?: boolean;
}

/**
 * WorkLog — a collapsible "Worked for {duration}" summary that reveals the ordered
 * steps an agent took. Mirrors the code-assistant work-log row: a dim toggle with a
 * clock + elapsed label + chevron, expanding to a left-ruled list of steps.
 *
 * Presentational: it holds only open/closed state; `workedFor` is formatted by the caller.
 */
const WorkLog = forwardRef<HTMLDivElement, WorkLogProps>(
  ({ className, workedFor, steps, defaultOpen = false, ...props }, ref) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
      <div data-slot="work-log" ref={ref} className={className} {...props}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
        >
          <Clock className="size-3.5" aria-hidden />
          Worked for {workedFor}
          {open ? (
            <ChevronDown className="size-3.5" aria-hidden />
          ) : (
            <ChevronRight className="size-3.5" aria-hidden />
          )}
        </button>
        {open ? (
          <ul className={cn("mt-2 space-y-1 border-border/40 border-l pl-3")}>
            {steps.map((step) => (
              <li key={step} className="text-muted-foreground text-xs">
                {step}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  },
);
WorkLog.displayName = "WorkLog";

export { WorkLog };
export type { WorkLogProps };
