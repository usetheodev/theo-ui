import { Sparkles, X } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { useInLiveRegion } from "../../../lib/live-region-context.js";

interface AutoCompactNoticeProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Optional custom title. */
  title?: ReactNode;
  /**
   * How many turns until the next auto-compaction. Used to render an inline
   * countdown chip.
   */
  turnsRemaining?: number;
  /** Approx tokens that will be removed/summarized. */
  tokensToCompact?: number;
  onCompactNow?: () => void;
  onDismiss?: () => void;
}

const formatTokens = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
};

/**
 * AutoCompactNotice — inline banner warning the user that the agent is
 * about to summarize / compact older context. Lets them act early (compact
 * now) or dismiss.
 *
 * Critical for transparency: a user must not be surprised by silent context
 * loss. This component announces it before it happens.
 */
const AutoCompactNotice = forwardRef<HTMLElement, AutoCompactNoticeProps>(
  (
    {
      className,
      title = "Auto-compaction soon",
      turnsRemaining,
      tokensToCompact,
      onCompactNow,
      onDismiss,
      ...props
    },
    ref,
  ) => {
    // T4.1 (MF-4): omit aria-live when nested inside a container live region.
    const inLiveRegion = useInLiveRegion();
    return (
      <aside
        ref={ref}
        aria-live={inLiveRegion ? undefined : "polite"}
        className={cn(
          "grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3",
          className,
        )}
        {...props}
      >
        <Sparkles className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
        <div className="grid gap-1">
          <p className="flex items-baseline gap-2 font-medium text-body-sm text-foreground">
            {title}
            {turnsRemaining !== undefined ? (
              <span className="inline-flex items-center rounded-full bg-warning/20 px-2 py-0.5 font-mono text-label text-warning tabular-nums">
                {turnsRemaining} {turnsRemaining === 1 ? "turn" : "turns"} left
              </span>
            ) : null}
          </p>
          <p className="text-body-sm text-muted-foreground">
            Older context will be summarized to make room.
            {tokensToCompact !== undefined ? (
              <>
                {" "}
                About{" "}
                <span className="font-mono tabular-nums">
                  {formatTokens(tokensToCompact)} tokens
                </span>{" "}
                will be replaced by a recap.
              </>
            ) : null}
          </p>
          {onCompactNow ? (
            <button
              type="button"
              onClick={onCompactNow}
              className="mt-1 inline-flex w-fit items-center rounded-md border border-warning/40 bg-card px-2.5 py-1 font-mono text-label text-warning hover:bg-warning/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Compact now
            </button>
          ) : null}
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="rounded-md p-1 text-warning hover:bg-warning/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </aside>
    );
  },
);
AutoCompactNotice.displayName = "AutoCompactNotice";

export { AutoCompactNotice };
