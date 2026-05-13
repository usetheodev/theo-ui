import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

export type LaneState = "started" | "blocked" | "failed" | "finished";

export interface LaneCard {
  id: string;
  /** Card title (e.g. task name). */
  title: ReactNode;
  /** Optional description / preview. */
  description?: ReactNode;
  /** Optional footer / metadata row. */
  footer?: ReactNode;
}

export interface Lane {
  state: LaneState;
  cards: LaneCard[];
}

interface LaneBoardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  lanes: Lane[];
  title?: ReactNode;
}

const LANE_META: Record<LaneState, { label: string; headerClass: string; cardClass: string }> = {
  started: {
    label: "Started",
    headerClass: "text-primary",
    cardClass: "border-primary/30 bg-primary/5",
  },
  blocked: {
    label: "Blocked",
    headerClass: "text-warning",
    cardClass: "border-warning/40 bg-warning/5",
  },
  failed: {
    label: "Failed",
    headerClass: "text-destructive",
    cardClass: "border-destructive/40 bg-destructive/5",
  },
  finished: {
    label: "Finished",
    headerClass: "text-success",
    cardClass: "border-success/40 bg-success/5",
  },
};

/**
 * LaneBoard — kanban-style task board with 4 lanes matching the claw-code
 * lane event schema (started/blocked/failed/finished). Each card is a
 * machine-readable task snapshot the agent emits.
 */
const LaneBoard = forwardRef<HTMLDivElement, LaneBoardProps>(
  ({ className, lanes, title, ...props }, ref) => (
    <section
      ref={ref}
      className={cn("grid gap-3", className)}
      aria-label="Agent lane board"
      {...props}
    >
      {title ? <h3 className="font-display text-title-md tracking-tight">{title}</h3> : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {lanes.map((lane) => {
          const meta = LANE_META[lane.state];
          return (
            <div
              key={lane.state}
              className="grid auto-rows-max gap-2 rounded-xl border border-border/40 bg-card p-3"
            >
              <header className="flex items-center justify-between px-1">
                <span
                  className={cn(
                    "font-mono text-label-caps uppercase tracking-wider",
                    meta.headerClass,
                  )}
                >
                  {meta.label}
                </span>
                <span className="font-mono text-label text-muted-foreground tabular-nums">
                  {lane.cards.length}
                </span>
              </header>
              {lane.cards.length === 0 ? (
                <p className="rounded-md border border-border/40 border-dashed px-3 py-4 text-center font-sans text-body-sm text-muted-foreground">
                  empty
                </p>
              ) : (
                <ul className="grid gap-2">
                  {lane.cards.map((card) => (
                    <li
                      key={card.id}
                      className={cn("grid gap-1 rounded-md border p-3", meta.cardClass)}
                    >
                      <p className="font-medium text-body-sm text-foreground">{card.title}</p>
                      {card.description ? (
                        <p className="text-body-sm text-muted-foreground">{card.description}</p>
                      ) : null}
                      {card.footer ? (
                        <p className="font-mono text-label text-muted-foreground">{card.footer}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  ),
);
LaneBoard.displayName = "LaneBoard";

export { LaneBoard };
