"use client";

import { forwardRef, useId } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { Badge } from "../../primitives/badge/index.js";
import { Button } from "../../primitives/button/index.js";

/**
 * ConfirmPrompt — binary yes/no "ask the user" card for agent surfaces.
 *
 * The simplest member of the prompt family: a question with an optional header
 * chip and two actions. Use `variant="destructive"` for dangerous confirmations
 * (delete, drop, force-push) — it tones the confirm button red and exposes the
 * card as an `alertdialog` so assistive tech announces the stakes.
 *
 * Renders one question at a time — sequencing is the consumer's responsibility.
 */

export interface ConfirmPromptProps extends Omit<HTMLAttributes<HTMLElement>, "onSelect"> {
  /** The question being asked. */
  question: ReactNode;
  /** Optional secondary line under the question. */
  description?: ReactNode;
  /** Optional short header chip (rendered as a Badge). */
  badge?: ReactNode;
  /** Tone of the confirm action. `destructive` also exposes role=alertdialog. */
  variant?: "primary" | "destructive";
  /** Confirm button label. Defaults to "Confirm". */
  confirmLabel?: ReactNode;
  /** Cancel button label. Defaults to "Cancel". Omit `onCancel` to hide it. */
  cancelLabel?: ReactNode;
  /** Pressing Confirm. */
  onConfirm?: () => void;
  /** Pressing Cancel. */
  onCancel?: () => void;
}

const ConfirmPrompt = forwardRef<HTMLElement, ConfirmPromptProps>(
  (
    {
      className,
      question,
      description,
      badge,
      variant = "primary",
      confirmLabel = "Confirm",
      cancelLabel = "Cancel",
      onConfirm,
      onCancel,
      ...props
    },
    ref,
  ) => {
    const baseId = useId();
    const questionId = `${baseId}-question`;
    const isDestructive = variant === "destructive";

    return (
      <section
        ref={ref}
        role={isDestructive ? "alertdialog" : undefined}
        aria-labelledby={questionId}
        className={cn(
          "grid w-full gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-md",
          "transition-shadow duration-base ease-out-soft",
          isDestructive && "border-destructive/40 bg-destructive/5",
          className,
        )}
        {...props}
        data-slot="confirm-prompt"
      >
        <header className="flex items-start justify-between gap-3">
          <h3 id={questionId} className="font-display text-foreground text-title-md tracking-tight">
            {question}
          </h3>
          {badge != null ? (
            <Badge
              variant={isDestructive ? "destructive" : "primary"}
              size="sm"
              className="shrink-0"
            >
              {badge}
            </Badge>
          ) : null}
        </header>
        {description != null ? (
          <p className="text-body-sm text-muted-foreground">{description}</p>
        ) : null}

        <footer className="flex items-center justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button size="sm" variant={isDestructive ? "destructive" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </footer>
      </section>
    );
  },
);
ConfirmPrompt.displayName = "ConfirmPrompt";

export { ConfirmPrompt };
