"use client";

import { forwardRef, useId, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { Badge } from "../../primitives/badge/index.js";
import { Button } from "../../primitives/button/index.js";
import { Input } from "../../primitives/input/index.js";
import { Label } from "../../primitives/label/index.js";
import { Textarea } from "../../primitives/textarea/index.js";

/**
 * TextPrompt — free-text "ask the user" card for agent surfaces.
 *
 * The open-ended sibling of `ChoicePrompt`: a question with an optional header
 * chip and a single-line (`Input`) or multi-line (`Textarea`) field. Equivalent
 * to the "Other" affordance promoted to a question of its own.
 *
 * Renders one question at a time — sequencing is the consumer's responsibility.
 * Controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`).
 */

/** Payload handed to `onConfirm`. */
export interface TextPromptResult {
  /** The typed text. */
  text: string;
}

export interface TextPromptProps extends Omit<HTMLAttributes<HTMLElement>, "onSelect"> {
  /** The question being asked. */
  question: ReactNode;
  /** Optional secondary line under the question. */
  description?: ReactNode;
  /** Optional short header chip (rendered as a Badge). */
  badge?: ReactNode;
  /** Controlled text value. */
  value?: string;
  /** Initial text when uncontrolled. */
  defaultValue?: string;
  /** Fired with the text on every keystroke. */
  onValueChange?: (text: string) => void;
  /** Field placeholder. */
  placeholder?: string;
  /** Render a multi-line Textarea instead of a single-line Input. */
  multiline?: boolean;
  /** Rows for the Textarea when `multiline`. Default 3. */
  rows?: number;
  /** Require non-empty text before Confirm enables. */
  required?: boolean;
  /** Confirm button label. Defaults to "Confirm". Omit `onConfirm` to hide it. */
  confirmLabel?: ReactNode;
  /** Cancel button label. Defaults to "Cancel". Omit `onCancel` to hide it. */
  cancelLabel?: ReactNode;
  /** Pressing Confirm. Receives the typed text. */
  onConfirm?: (result: TextPromptResult) => void;
  /** Pressing Cancel. */
  onCancel?: () => void;
}

const TextPrompt = forwardRef<HTMLElement, TextPromptProps>(
  (
    {
      className,
      question,
      description,
      badge,
      value,
      defaultValue,
      onValueChange,
      placeholder,
      multiline = false,
      rows = 3,
      required = false,
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
    const fieldId = `${baseId}-field`;

    const [internalValue, setInternalValue] = useState(defaultValue ?? "");
    const text = value !== undefined ? value : internalValue;

    const setText = (next: string): void => {
      if (value === undefined) setInternalValue(next);
      onValueChange?.(next);
    };

    const confirmDisabled = required && text.trim().length === 0;

    const confirm = (): void => {
      if (confirmDisabled) return;
      onConfirm?.({ text });
    };

    return (
      <section
        ref={ref}
        aria-labelledby={questionId}
        className={cn(
          "grid w-full gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-md",
          "transition-shadow duration-base ease-out-soft",
          className,
        )}
        {...props}
        data-slot="text-prompt"
      >
        <header className="flex items-start justify-between gap-3">
          <Label
            htmlFor={fieldId}
            id={questionId}
            required={required}
            className="font-display text-foreground text-title-md tracking-tight"
          >
            {question}
          </Label>
          {badge != null ? (
            <Badge variant="primary" size="sm" className="shrink-0">
              {badge}
            </Badge>
          ) : null}
        </header>
        {description != null ? (
          <p className="text-body-sm text-muted-foreground">{description}</p>
        ) : null}

        {multiline ? (
          <Textarea
            id={fieldId}
            rows={rows}
            placeholder={placeholder}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        ) : (
          <Input
            id={fieldId}
            placeholder={placeholder}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        )}

        {onConfirm || onCancel ? (
          <footer className="flex items-center justify-end gap-2">
            {onCancel ? (
              <Button size="sm" variant="secondary" onClick={onCancel}>
                {cancelLabel}
              </Button>
            ) : null}
            {onConfirm ? (
              <Button size="sm" variant="primary" disabled={confirmDisabled} onClick={confirm}>
                {confirmLabel}
              </Button>
            ) : null}
          </footer>
        ) : null}
      </section>
    );
  },
);
TextPrompt.displayName = "TextPrompt";

export { TextPrompt };
