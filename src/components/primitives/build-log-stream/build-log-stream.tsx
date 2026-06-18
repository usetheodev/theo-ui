"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import { isDev } from "../../../lib/env.js";
import { useInLiveRegion } from "../../../lib/live-region-context.js";

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
   *
   * Pick one mode: either always pass `visibleLevels` + `onVisibleLevelsChange`
   * (controlled), or never (uncontrolled). Mixing the two between renders is
   * not supported and may produce surprising state.
   */
  visibleLevels?: Set<LogLevel>;
  onVisibleLevelsChange?: (levels: Set<LogLevel>) => void;
  /**
   * Height of the scrollable region.
   */
  height?: string | number;
  /**
   * Maximum number of lines rendered. When exceeded, only the tail is shown
   * and a banner indicates truncation. Defaults to 2000 — set higher with
   * caution; React reconciliation cost scales linearly.
   */
  maxLines?: number;
  /**
   * Screen-reader live-region politeness for newly appended lines. Defaults
   * to `"off"` because build-log streams can be high-volume; opt into
   * `"polite"` only when running the build in the foreground.
   */
  live?: "off" | "polite";
}

const ALL_LEVELS: LogLevel[] = ["info", "warn", "error", "success", "debug"];

/**
 * BuildLogStream — terminal-like log viewer with timestamps + level coloring.
 *
 * Used in Code workspace and PaaS deployment views. Geist Mono throughout.
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
      maxLines = 2000,
      live = "off",
      ...props
    },
    ref,
  ) => {
    // T4.1 (MF-4): suppress own aria-live when nested in container live region.
    const inLiveRegion = useInLiveRegion();
    const effectiveLive = inLiveRegion ? "off" : live;
    const [internalLevels, setInternalLevels] = useState<Set<LogLevel>>(new Set());
    const levels = visibleLevels ?? internalLevels;
    const updateLevels = onVisibleLevelsChange ?? setInternalLevels;

    // MEDIUM-002 / T6.5: warn (dev-only) when a consumer flips between
    // controlled and uncontrolled — React's own warning handles `value`/
    // `defaultValue` on form inputs but doesn't see our custom prop pair.
    const wasControlled = useRef<boolean | null>(null);
    useEffect(() => {
      if (!isDev()) return;
      const isControlled = visibleLevels !== undefined;
      if (wasControlled.current === null) {
        wasControlled.current = isControlled;
        return;
      }
      if (wasControlled.current !== isControlled) {
        // biome-ignore lint/suspicious/noConsole: dev-only diagnostic (MEDIUM-002)
        console.warn(
          `[@theokit/ui] BuildLogStream: \`visibleLevels\` prop switched between ${
            wasControlled.current ? "controlled" : "uncontrolled"
          } and ${isControlled ? "controlled" : "uncontrolled"} between renders. Pick one mode and keep it consistent.`,
        );
        wasControlled.current = isControlled;
      }
    }, [visibleLevels]);

    const filtered = useMemo(() => {
      if (levels.size === 0) return lines;
      return lines.filter((l) => levels.has(l.level));
    }, [lines, levels]);

    const truncated = filtered.length > maxLines;
    const visible = truncated ? filtered.slice(filtered.length - maxLines) : filtered;
    const hiddenCount = truncated ? filtered.length - maxLines : 0;

    const toggle = (level: LogLevel) => {
      const next = new Set(levels);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      updateLevels(next);
    };

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-2", className)}
        {...props}
        data-slot="build-log-stream"
      >
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
          {truncated ? (
            <output className="block border-border/30 border-b bg-muted/40 px-4 py-1.5 text-label text-muted-foreground">
              Showing last {maxLines.toLocaleString()} of {filtered.length.toLocaleString()} lines (
              {hiddenCount.toLocaleString()} earlier lines hidden)
            </output>
          ) : null}
          {visible.length === 0 ? (
            <p className="px-4 py-3 text-muted-foreground">No log lines.</p>
          ) : (
            <ol className="divide-y divide-border/30" aria-live={effectiveLive} aria-atomic="false">
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
