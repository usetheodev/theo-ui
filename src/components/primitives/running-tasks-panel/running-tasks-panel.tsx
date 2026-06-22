import { Bot, CheckCircle2, Loader2, Terminal } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

export type TaskSource = "agent" | "bash" | "tool";
export type RunningTaskStatus = "running" | "completed" | "failed";

export interface RunningTaskItem {
  id: string;
  label: ReactNode;
  source: TaskSource;
  status: RunningTaskStatus;
}

interface RunningTasksPanelProps extends HTMLAttributes<HTMLElement> {
  tasks: RunningTaskItem[];
}

const sourceIcon = {
  agent: Bot,
  bash: Terminal,
  tool: Bot,
} as const;
const sourceLabel: Record<TaskSource, string> = {
  agent: "Agent",
  bash: "Bash",
  tool: "Tool",
};

/**
 * RunningTasksPanel — split list of Running vs Completed tasks.
 *
 * Used in the Code workspace right rail to give operational visibility into
 * what the agent is executing (foreground/background) vs what already finished.
 */
const RunningTasksPanel = forwardRef<HTMLElement, RunningTasksPanelProps>(
  ({ className, tasks, ...props }, ref) => {
    const running = tasks.filter((t) => t.status === "running");
    const completed = tasks.filter((t) => t.status !== "running");
    return (
      <section
        data-slot="running-tasks-panel"
        ref={ref}
        className={cn("rounded-xl border border-border bg-card p-4", className)}
        {...props}
      >
        <Group title="Running" empty="Nothing running" items={running} />
        {completed.length > 0 ? (
          <div className="mt-4">
            <Group title="Completed" empty="—" items={completed} />
          </div>
        ) : null}
      </section>
    );
  },
);
RunningTasksPanel.displayName = "RunningTasksPanel";

function Group({
  title,
  empty,
  items,
}: {
  title: string;
  empty: ReactNode;
  items: RunningTaskItem[];
}) {
  return (
    <div>
      <h4 className="mb-2 font-sans text-label-caps text-muted-foreground uppercase tracking-wider">
        {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="grid gap-1">
          {items.map((task) => {
            const SourceIcon = sourceIcon[task.source];
            return (
              <li
                key={task.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-body-sm"
              >
                {task.status === "running" ? (
                  <Loader2 className="size-3.5 animate-spin text-primary" aria-label="running" />
                ) : task.status === "completed" ? (
                  <CheckCircle2 className="size-3.5 text-success" aria-label="completed" />
                ) : (
                  <span className="size-2 rounded-full bg-destructive" aria-label="failed" />
                )}
                <SourceIcon
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="flex-1 truncate">{task.label}</span>
                <span className="font-mono text-label text-muted-foreground uppercase">
                  {sourceLabel[task.source]}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export { RunningTasksPanel };
