import { CheckCircle2, Circle, CircleDashed, CircleX, Loader2 } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

export type PlanNodeStatus = "pending" | "running" | "done" | "skipped" | "failed";

export interface PlanNode {
  id: string;
  label: string;
  status: PlanNodeStatus;
  /** Optional details / sub-explanation. */
  detail?: string;
  /** Sub-nodes (rendered indented). */
  children?: PlanNode[];
}

const STATUS_ICON = {
  pending: CircleDashed,
  running: Loader2,
  done: CheckCircle2,
  skipped: Circle,
  failed: CircleX,
} as const;

const STATUS_COLOR: Record<PlanNodeStatus, string> = {
  pending: "text-muted-foreground",
  running: "text-primary",
  done: "text-success",
  skipped: "text-muted-foreground/60",
  failed: "text-destructive",
};

const LABEL_STYLE: Record<PlanNodeStatus, string> = {
  pending: "text-foreground",
  running: "text-foreground",
  done: "text-foreground line-through decoration-muted-foreground/40",
  skipped: "text-muted-foreground line-through",
  failed: "text-destructive",
};

interface TaskNodeProps extends HTMLAttributes<HTMLLIElement> {
  node: PlanNode;
  depth?: number;
}

/**
 * TaskNode — single row in a task plan. Renders its own children recursively
 * with increasing indentation.
 */
const TaskNode = forwardRef<HTMLLIElement, TaskNodeProps>(
  ({ className, node, depth = 0, ...props }, ref) => {
    const Icon = STATUS_ICON[node.status];
    return (
      <li
        ref={ref}
        className={cn("grid gap-1", className)}
        style={{ marginLeft: `${depth * 1.25}rem` }}
        {...props}
      >
        <div className="grid grid-cols-[auto_1fr] items-baseline gap-2">
          <Icon
            aria-hidden="true"
            className={cn(
              "mt-0.5 size-3.5 shrink-0",
              STATUS_COLOR[node.status],
              node.status === "running" && "animate-spin",
            )}
          />
          <div className="min-w-0">
            <p className={cn("text-body-sm", LABEL_STYLE[node.status])}>{node.label}</p>
            {node.detail ? (
              <p className="text-body-sm text-muted-foreground">{node.detail}</p>
            ) : null}
          </div>
        </div>
        {node.children && node.children.length > 0 ? (
          <ul className="grid gap-1 border-border/30 border-l pl-2">
            {node.children.map((child) => (
              <TaskNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </ul>
        ) : null}
      </li>
    );
  },
);
TaskNode.displayName = "TaskNode";

interface TaskPlanProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  nodes: PlanNode[];
  /** Header title. */
  title?: ReactNode;
  /** Summary line shown next to the title (e.g. "3 of 7 done"). */
  summary?: ReactNode;
}

/**
 * TaskPlan — hierarchical task plan, à la Claude "plan mode".
 *
 * The agent emits a structured plan; the user sees each step progress from
 * pending → running → done (or failed/skipped). Children render with one
 * extra indent level and a left border to suggest hierarchy.
 */
const TaskPlan = forwardRef<HTMLElement, TaskPlanProps>(
  ({ className, nodes, title = "Plan", summary, ...props }, ref) => {
    const auto = nodes.length;
    const done = nodes.filter((n) => n.status === "done").length;
    const computedSummary = summary ?? (auto > 0 ? `${done} of ${auto} done` : "no steps");
    return (
      <section ref={ref} className={cn("rounded-xl border bg-card p-4", className)} {...props}>
        <header className="mb-3 flex items-baseline justify-between gap-3">
          {title ? (
            <h3 className="font-display text-title-md tracking-tight">{title}</h3>
          ) : (
            <span />
          )}
          <span className="font-mono text-label text-muted-foreground tabular-nums">
            {computedSummary}
          </span>
        </header>
        <ul className="grid gap-1.5">
          {nodes.map((node) => (
            <TaskNode key={node.id} node={node} />
          ))}
        </ul>
      </section>
    );
  },
);
TaskPlan.displayName = "TaskPlan";

export { TaskNode, TaskPlan };
