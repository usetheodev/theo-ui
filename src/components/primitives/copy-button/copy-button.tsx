"use client";

import { Check, Copy, X } from "lucide-react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * CopyButton — click-to-copy primitive for PaaS surfaces.
 *
 * Wraps the Clipboard API behind a button that:
 *   - Calls `navigator.clipboard.writeText(value)` on click
 *   - Swaps the icon (Copy → Check on success, Copy → X on failure)
 *   - Optionally swaps the visible `label` to "Copied!" / "Failed"
 *   - Announces the state change via an `aria-live="polite"` sr-only region
 *   - Reverts to idle after `feedbackDuration` ms (default 1500)
 *
 * SSR-safe (guards `navigator?.clipboard?.writeText`). Debounces double-clicks
 * by ignoring clicks while not in the `idle` state. Cleans up the revert timer
 * on unmount so no `setState` happens on unmounted components.
 *
 * @example
 *   <CopyButton value={envVar.value} />               // icon-only ghost
 *   <CopyButton value={token} label="Copy token" variant="outline" />
 */
type CopyState = "idle" | "copied" | "failed";

export interface CopyButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick" | "children"> {
  /** String to copy when clicked. */
  value: string;
  /** Optional button label. Default: just the icon. */
  label?: ReactNode;
  /** Visual style. */
  variant?: "ghost" | "outline";
  /** Size. */
  size?: "sm" | "md";
  /** Callback after successful copy (e.g. analytics). */
  onCopied?: (value: string) => void;
  /** Duration of the feedback state in ms. Default 1500. */
  feedbackDuration?: number;
}

const VARIANT: Record<NonNullable<CopyButtonProps["variant"]>, string> = {
  ghost: "hover:bg-muted",
  outline: "border border-border/60 rounded-md",
};

const SIZE: Record<NonNullable<CopyButtonProps["size"]>, string> = {
  sm: "px-2 py-1 text-label",
  md: "px-2.5 py-1.5 text-body-sm",
};

const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      className,
      value,
      label,
      variant = "ghost",
      size = "sm",
      onCopied,
      feedbackDuration = 1500,
      ...props
    },
    ref,
  ) => {
    const [state, setState] = useState<CopyState>("idle");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      return () => {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
        }
      };
    }, []);

    const scheduleRevert = useCallback(() => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setState("idle");
        timerRef.current = null;
      }, feedbackDuration);
    }, [feedbackDuration]);

    const handleClick = useCallback(() => {
      if (state !== "idle") return;

      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        setState("failed");
        scheduleRevert();
        return;
      }

      navigator.clipboard.writeText(value).then(
        () => {
          setState("copied");
          onCopied?.(value);
          scheduleRevert();
        },
        () => {
          setState("failed");
          scheduleRevert();
        },
      );
    }, [state, value, onCopied, scheduleRevert]);

    const Icon = state === "copied" ? Check : state === "failed" ? X : Copy;
    const liveMessage =
      state === "copied" ? "Copied to clipboard" : state === "failed" ? "Copy failed" : "";

    const labelText =
      label !== undefined
        ? state === "copied"
          ? "Copied!"
          : state === "failed"
            ? "Failed"
            : label
        : null;

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        data-state={state}
        className={cn(
          "inline-flex items-center gap-1.5",
          "font-sans transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
          VARIANT[variant],
          SIZE[size],
          className,
        )}
        {...props}
      >
        <Icon
          aria-hidden="true"
          className={cn(
            "size-3.5 shrink-0 transition-opacity duration-200",
            state === "copied" && "text-success",
            state === "failed" && "text-destructive",
          )}
        />
        {labelText !== null ? <span>{labelText}</span> : null}
        <span className="sr-only" aria-live="polite">
          {liveMessage}
        </span>
      </button>
    );
  },
);
CopyButton.displayName = "CopyButton";

export { CopyButton };
