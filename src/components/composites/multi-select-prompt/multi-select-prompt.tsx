"use client";

import { forwardRef, useId, useState } from "react";
import type { HTMLAttributes, KeyboardEvent, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { OTHER_OPTION_VALUE, type PromptOption, digitKeyToIndex } from "../../../lib/prompt.js";
import { Badge } from "../../primitives/badge/index.js";
import { Button } from "../../primitives/button/index.js";
import { Checkbox } from "../../primitives/checkbox/index.js";
import { Input } from "../../primitives/input/index.js";
import { Label } from "../../primitives/label/index.js";

/**
 * MultiSelectPrompt — multi-select "ask the user" card for agent surfaces.
 *
 * The checkbox sibling of `ChoicePrompt`: same question + header chip + option
 * shape + `1`..`9` number-key toggles + injectable free-text "Other" +
 * side-by-side preview, but the user may select any number of options.
 *
 * Renders one question at a time — sequencing is the consumer's responsibility.
 * Controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`).
 */

/** Payload handed to `onConfirm`. */
export interface MultiSelectPromptResult {
  /** The selected option values (includes the reserved Other value when checked). */
  values: string[];
  /** Present only when the Other option is among the selected values. */
  otherText?: string;
}

export interface MultiSelectPromptProps extends Omit<HTMLAttributes<HTMLElement>, "onSelect"> {
  /** The question being asked. */
  question: ReactNode;
  /** Optional secondary line under the question. */
  description?: ReactNode;
  /** Optional short header chip (rendered as a Badge). */
  badge?: ReactNode;
  /** The selectable options. */
  options: PromptOption[];
  /** Controlled selected values. */
  value?: string[];
  /** Initial selected values when uncontrolled. */
  defaultValue?: string[];
  /** Fired with the full value array whenever the selection changes. */
  onValueChange?: (values: string[]) => void;
  /** Inject a free-text "Other" option as the last row. */
  allowOther?: boolean;
  /** Label for the Other row. Defaults to "Other". */
  otherLabel?: ReactNode;
  /** Placeholder for the Other text field. */
  otherPlaceholder?: string;
  /** Controlled Other text. */
  otherText?: string;
  /** Fired with the Other text on every keystroke. */
  onOtherTextChange?: (text: string) => void;
  /** Enable `1`..`9` number-key toggling. Default true. */
  enableKeyboardShortcuts?: boolean;
  /** Show the `1`..`9` hint chips next to options. Defaults to the shortcut flag. */
  showNumbers?: boolean;
  /** Minimum selections required before Confirm enables. Default 1. */
  minSelected?: number;
  /** Confirm button label. Defaults to "Confirm". Omit `onConfirm` to hide it. */
  confirmLabel?: ReactNode;
  /** Cancel button label. Defaults to "Cancel". Omit `onCancel` to hide it. */
  cancelLabel?: ReactNode;
  /** Pressing Confirm. Receives the selection (and Other text when relevant). */
  onConfirm?: (result: MultiSelectPromptResult) => void;
  /** Pressing Cancel. */
  onCancel?: () => void;
}

const MultiSelectPrompt = forwardRef<HTMLElement, MultiSelectPromptProps>(
  (
    {
      className,
      question,
      description,
      badge,
      options,
      value,
      defaultValue,
      onValueChange,
      allowOther = false,
      otherLabel = "Other",
      otherPlaceholder = "Type your answer…",
      otherText,
      onOtherTextChange,
      enableKeyboardShortcuts = true,
      showNumbers,
      minSelected = 1,
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
    const optionId = (value_: string): string => `${baseId}-opt-${value_}`;

    const [internalValues, setInternalValues] = useState<string[]>(defaultValue ?? []);
    const values = value !== undefined ? value : internalValues;

    const [internalOther, setInternalOther] = useState("");
    const otherValue = otherText !== undefined ? otherText : internalOther;

    const numbersVisible = showNumbers ?? enableKeyboardShortcuts;
    const hasPreview = options.some((option) => option.preview != null);
    const selectedPreviews = options.filter(
      (option) => option.preview != null && values.includes(option.value),
    );

    const toggle = (next: string): void => {
      const updated = values.includes(next)
        ? values.filter((current) => current !== next)
        : [...values, next];
      if (value === undefined) setInternalValues(updated);
      onValueChange?.(updated);
    };

    const setOther = (next: string): void => {
      if (otherText === undefined) setInternalOther(next);
      onOtherTextChange?.(next);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
      if (!enableKeyboardShortcuts) return;
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      const index = digitKeyToIndex(event.key);
      if (index === null || index >= options.length) return;
      const option = options[index];
      if (!option || option.disabled) return;
      event.preventDefault();
      toggle(option.value);
    };

    const otherChecked = values.includes(OTHER_OPTION_VALUE);

    const confirm = (): void => {
      if (values.length < minSelected) return;
      onConfirm?.(otherChecked ? { values, otherText: otherValue } : { values });
    };

    return (
      <section
        ref={ref}
        aria-labelledby={questionId}
        onKeyDown={handleKeyDown}
        className={cn(
          "grid w-full gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-md",
          "transition-shadow duration-base ease-out-soft",
          className,
        )}
        {...props}
      >
        <header className="flex items-start justify-between gap-3">
          <h3 id={questionId} className="font-display text-foreground text-title-md tracking-tight">
            {question}
          </h3>
          {badge != null ? (
            <Badge variant="primary" size="sm" className="shrink-0">
              {badge}
            </Badge>
          ) : null}
        </header>
        {description != null ? (
          <p className="text-body-sm text-muted-foreground">{description}</p>
        ) : null}

        <div className={cn("grid gap-5", hasPreview && "md:grid-cols-2")}>
          <fieldset className="m-0 grid min-w-0 gap-2 border-0 p-0" aria-labelledby={questionId}>
            {options.map((option, index) => (
              <div key={option.value} className="flex items-start gap-3">
                <Checkbox
                  id={optionId(option.value)}
                  checked={values.includes(option.value)}
                  disabled={option.disabled}
                  onCheckedChange={() => toggle(option.value)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={optionId(option.value)}
                  className="flex flex-1 cursor-pointer flex-col items-start gap-0.5"
                >
                  <span className="text-body-md text-foreground">{option.label}</span>
                  {option.description != null ? (
                    <span className="text-body-sm text-muted-foreground">{option.description}</span>
                  ) : null}
                </Label>
                {numbersVisible && index < 9 ? (
                  <span
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 rounded border border-border bg-muted px-1.5 font-mono text-label text-muted-foreground"
                  >
                    {index + 1}
                  </span>
                ) : null}
              </div>
            ))}

            {allowOther ? (
              <div className="flex flex-col gap-2 border-border/40 border-t pt-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={optionId(OTHER_OPTION_VALUE)}
                    checked={otherChecked}
                    onCheckedChange={() => toggle(OTHER_OPTION_VALUE)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={optionId(OTHER_OPTION_VALUE)}
                    className="flex-1 cursor-pointer text-body-md"
                  >
                    {otherLabel}
                  </Label>
                </div>
                {otherChecked ? (
                  <Input
                    size="sm"
                    aria-label={typeof otherLabel === "string" ? otherLabel : "Other"}
                    placeholder={otherPlaceholder}
                    value={otherValue}
                    onChange={(event) => setOther(event.target.value)}
                    className="ml-7"
                  />
                ) : null}
              </div>
            ) : null}
          </fieldset>

          {hasPreview ? (
            <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
              <p className="mb-2 font-sans text-label-caps text-muted-foreground uppercase tracking-wider">
                Preview
              </p>
              {selectedPreviews.length > 0 ? (
                <div className="grid gap-3">
                  {selectedPreviews.map((option) => (
                    <div
                      key={option.value}
                      className="whitespace-pre-wrap break-words font-mono text-code-sm text-foreground"
                    >
                      {option.preview}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-muted-foreground">Select an option to preview.</p>
              )}
            </div>
          ) : null}
        </div>

        {onConfirm || onCancel ? (
          <footer className="flex items-center justify-end gap-2">
            {onCancel ? (
              <Button size="sm" variant="secondary" onClick={onCancel}>
                {cancelLabel}
              </Button>
            ) : null}
            {onConfirm ? (
              <Button
                size="sm"
                variant="primary"
                disabled={values.length < minSelected}
                onClick={confirm}
              >
                {confirmLabel}
              </Button>
            ) : null}
          </footer>
        ) : null}
      </section>
    );
  },
);
MultiSelectPrompt.displayName = "MultiSelectPrompt";

export { MultiSelectPrompt };
