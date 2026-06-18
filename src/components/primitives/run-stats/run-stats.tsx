import { Clock, Coins, FileEdit } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

interface RunStatsProps extends HTMLAttributes<HTMLDivElement> {
  duration?: string;
  /** Formatted token count, e.g. "35.7k". */
  tokens?: string;
  /** Number of files changed in the run. */
  filesChanged?: number;
}

/**
 * RunStats — inline metric row shown after an agent run.
 *
 * Visual: muted bullet-separated row with clock + tokens + files-changed icons.
 * All optional — the component skips entries that aren't provided.
 */
const RunStats = forwardRef<HTMLDivElement, RunStatsProps>(
  ({ className, duration, tokens, filesChanged, ...props }, ref) => (
    <div
      data-slot="run-stats"
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-3 font-mono text-code-sm text-muted-foreground",
        className,
      )}
      {...props}
    >
      {duration ? (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3" aria-hidden="true" /> {duration}
        </span>
      ) : null}
      {tokens ? (
        <span className="inline-flex items-center gap-1.5">
          <Coins className="size-3" aria-hidden="true" /> {tokens} tokens
        </span>
      ) : null}
      {filesChanged !== undefined ? (
        <span className="inline-flex items-center gap-1.5">
          <FileEdit className="size-3" aria-hidden="true" /> {filesChanged} files
        </span>
      ) : null}
    </div>
  ),
);
RunStats.displayName = "RunStats";

export { RunStats };
