import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

export interface RailStep {
  id: string | number;
  label?: ReactNode;
  /**
   * Visual state: "complete", "current", "pending".
   */
  state?: "complete" | "current" | "pending";
}

interface StepsRailProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  steps: RailStep[];
  /**
   * Optional label rendered at the top of the rail (e.g. "STEPS").
   */
  title?: ReactNode;
}

/**
 * StepsRail — vertical numbered rail with connecting line.
 *
 * Mirrors the wiremock `cowork_home` right rail: 5 numbered dots, current
 * highlighted, line connecting them.
 */
const StepsRail = forwardRef<HTMLElement, StepsRailProps>(
  ({ className, steps, title, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(
        "flex w-14 flex-col items-center gap-6 border-border/40 border-l py-6",
        className,
      )}
      aria-label="Task steps"
      {...props}
    >
      {title ? (
        <span className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
      ) : null}
      <ol className="before:-translate-x-1/2 relative grid place-items-center gap-6 before:absolute before:top-3 before:bottom-3 before:left-1/2 before:w-px before:bg-border/60">
        {steps.map((step, idx) => {
          const state = step.state ?? (idx === 0 ? "current" : "pending");
          return (
            <li key={step.id} className="relative z-10">
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full border-2 font-bold font-mono text-code-sm",
                  state === "complete" && "border-primary bg-primary text-primary-foreground",
                  state === "current" && "border-foreground bg-foreground text-background",
                  state === "pending" && "border-border bg-card text-muted-foreground",
                )}
                aria-current={state === "current" ? "step" : undefined}
              >
                {step.label ?? idx + 1}
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  ),
);
StepsRail.displayName = "StepsRail";

export { StepsRail };
