import { forwardRef, useMemo, useState } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

export type LogLevel = "info" | "warn" | "error" | "success" | "debug";

export interface LogLine {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source?: string;
}

const levelClasses: Record<LogLevel, string> = {
  info: "text-foreground",
  warn: "text-warning",
  error: "text-destructive",
  success: "text-success",
  debug: "text-muted-foreground",
};

const levelLabels: Record<LogLevel, string> = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
  success: " OK ",
  debug: "DBG ",
};

interface BuildLogStreamProps extends HTMLAttributes<HTMLDivElement> {
  lines: LogLine[];
  /**
   * If true, shows level filter chips above the stream.
   */
  filterable?: boolean;
  /**
   * Controlled filter — which levels are visible. Empty Set = show all.
   */
  visibleLevels?: Set<LogLevel>;
  onVisibleLevelsChange?: (levels: Set<LogLevel>) => void;
  /**
   * Height of the scrollable region.
   */
  height?: string | number;
}

const ALL_LEVELS: LogLevel[] = ["info", "warn", "error", "success", "debug"];

/**
 * BuildLogStream — terminal-like log viewer with timestamps + level coloring.
 *
 * Used in Code workspace and PaaS deployment views. JetBrains Mono throughout.
 * Lines fade in via animate-fade-in-up on mount; new lines (when prepended/appended)
 * are not animated to avoid feedback noise (consumer's responsibility to render
 * incrementally if needed).
 */
const BuildLogStream = forwardRef<HTMLDivElement, BuildLogStreamProps>(
  (
    {
      className,
      lines,
      filterable = true,
      visibleLevels,
      onVisibleLevelsChange,
      height = "320px",
      ...props
    },
    ref,
  ) => {
    const [internalLevels, setInternalLevels] = useState<Set<LogLevel>>(new Set());
    const levels = visibleLevels ?? internalLevels;
    const updateLevels = onVisibleLevelsChange ?? setInternalLevels;

    const visible = useMemo(() => {
      if (levels.size === 0) return lines;
      return lines.filter((l) => levels.has(l.level));
    }, [lines, levels]);

    const toggle = (level: LogLevel) => {
      const next = new Set(levels);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      updateLevels(next);
    };

    return (
      <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
        {filterable ? (
          <div className="flex flex-wrap gap-1.5">
            {ALL_LEVELS.map((level) => {
              const active = levels.size === 0 || levels.has(level);
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggle(level)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-md border px-2 py-1 font-mono text-label uppercase tracking-wider",
                    "transition-colors duration-base ease-out-soft",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active
                      ? cn("border-border/60 bg-muted", levelClasses[level])
                      : "border-border/30 text-muted-foreground/50 hover:text-muted-foreground",
                  )}
                >
                  {level}
                </button>
              );
            })}
          </div>
        ) : null}
        <div
          className={cn("overflow-y-auto rounded-lg border bg-card", "font-mono text-code-sm")}
          style={{ height }}
        >
          {visible.length === 0 ? (
            <p className="px-4 py-3 text-muted-foreground">No log lines.</p>
          ) : (
            <ol className="divide-y divide-border/30">
              {visible.map((line) => (
                <li
                  key={line.id}
                  className="grid grid-cols-[auto_auto_1fr] gap-3 px-4 py-1.5 leading-relaxed hover:bg-muted/30"
                >
                  <span className="select-none text-muted-foreground">{line.timestamp}</span>
                  <span className={cn("select-none font-bold", levelClasses[line.level])}>
                    [{levelLabels[line.level]}]
                  </span>
                  <span className={levelClasses[line.level]}>
                    {line.source ? (
                      <span className="mr-2 text-muted-foreground">{line.source}:</span>
                    ) : null}
                    {line.message}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    );
  },
);
BuildLogStream.displayName = "BuildLogStream";

export { BuildLogStream };
