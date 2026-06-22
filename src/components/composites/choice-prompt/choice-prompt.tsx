"use client";

import { forwardRef, useId, useState } from "react";
import type { HTMLAttributes, KeyboardEvent, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import {
  OTHER_OPTION_VALUE,
  type PromptOption,
  digitKeyToIndex,
  isOtherValue,
} from "../../../lib/prompt.js";
import { Badge } from "../../primitives/badge/index.js";
import { Button } from "../../primitives/button/index.js";
import { Input } from "../../primitives/input/index.js";
import { Label } from "../../primitives/label/index.js";
import { RadioGroup } from "../../primitives/radio-group/index.js";

/**
 * ChoicePrompt — single-select "ask the user" card for agent surfaces.
 *
 * Mirrors the UX of Claude Code's question card: a question with an optional
 * header chip, a list of options each carrying a label + description, optional
 * number-key shortcuts (terminal-style `1`..`9` selection), an injectable
 * free-text "Other" option, and a side-by-side preview pane when options carry
 * preview content.
 *
 * Renders one question at a time — sequencing across multiple questions is the
 * consumer's responsibility (there is no built-in flow orchestrator).
 *
 * Controlled or uncontrolled: pass `value` + `onValueChange` to control the
 * selection, or `defaultValue` to let the component own it. Same for the Other
 * text via `otherText` / `onOtherTextChange`.
 */

/** Payload handed to `onConfirm`. */
export interface ChoicePromptResult {
  /** The selected option value (or the reserved Other value). */
  value: string;
  /** Present only when the selected value is the synthesized Other option. */
  otherText?: string;
}

export interface ChoicePromptProps extends Omit<HTMLAttributes<HTMLElement>, "onSelect"> {
  /** The question being asked. */
  question: ReactNode;
  /** Optional secondary line under the question. */
  description?: ReactNode;
  /** Optional short header chip (rendered as a Badge), e.g. "Deploy". */
  badge?: ReactNode;
  /** The selectable options. */
  options: PromptOption[];
  /** Controlled selected value. */
  value?: string;
  /** Initial selected value when uncontrolled. */
  defaultValue?: string;
  /** Fired with the option value whenever the selection changes. */
  onValueChange?: (value: string) => void;
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
  /** Enable `1`..`9` number-key selection. Default true. */
  enableKeyboardShortcuts?: boolean;
  /** Show the `1`..`9` hint chips next to options. Defaults to the shortcut flag. */
  showNumbers?: boolean;
  /** Confirm button label. Defaults to "Confirm". Omit `onConfirm` to hide it. */
  confirmLabel?: ReactNode;
  /** Cancel button label. Defaults to "Cancel". Omit `onCancel` to hide it. */
  cancelLabel?: ReactNode;
  /** Pressing Confirm. Receives the selection (and Other text when relevant). */
  onConfirm?: (result: ChoicePromptResult) => void;
  /** Pressing Cancel. */
  onCancel?: () => void;
}

const ChoicePrompt = forwardRef<HTMLElement, ChoicePromptProps>(
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

    const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
    const selected = value !== undefined ? value : internalValue;

    const [internalOther, setInternalOther] = useState("");
    const otherValue = otherText !== undefined ? otherText : internalOther;

    const numbersVisible = showNumbers ?? enableKeyboardShortcuts;
    const hasPreview = options.some((option) => option.preview != null);
    const selectedPreview = options.find((option) => option.value === selected)?.preview;

    const select = (next: string): void => {
      if (value === undefined) setInternalValue(next);
      onValueChange?.(next);
    };

    const setOther = (next: string): void => {
      if (otherText === undefined) setInternalOther(next);
      onOtherTextChange?.(next);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
      if (!enableKeyboardShortcuts) return;
      const target = event.target as HTMLElement;
      // Never hijack digits typed into a form field (e.g. the Other input).
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      const index = digitKeyToIndex(event.key);
      if (index === null || index >= options.length) return;
      const option = options[index];
      if (!option || option.disabled) return;
      event.preventDefault();
      select(option.value);
    };

    const confirm = (): void => {
      if (!selected) return;
      onConfirm?.(
        isOtherValue(selected) ? { value: selected, otherText: otherValue } : { value: selected },
      );
    };

    return (
      <section
        data-slot="choice-prompt"
        ref={ref}
        aria-labelledby={questionId}
        onKeyDown={handleKeyDown}
        className={cn(
          "grid w-full gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-md",
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
          <RadioGroup
            aria-labelledby={questionId}
            value={selected ?? ""}
            onValueChange={select}
            className="gap-2"
          >
            {options.map((option, index) => (
              <div key={option.value} className="flex items-start gap-3">
                <RadioGroup.Item
                  value={option.value}
                  id={optionId(option.value)}
                  disabled={option.disabled}
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
                  <RadioGroup.Item
                    value={OTHER_OPTION_VALUE}
                    id={optionId(OTHER_OPTION_VALUE)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={optionId(OTHER_OPTION_VALUE)}
                    className="flex-1 cursor-pointer text-body-md"
                  >
                    {otherLabel}
                  </Label>
                </div>
                {isOtherValue(selected) ? (
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
          </RadioGroup>

          {hasPreview ? (
            <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
              <p className="mb-2 font-sans text-label-caps text-muted-foreground uppercase tracking-wider">
                Preview
              </p>
              {selectedPreview != null ? (
                <div className="whitespace-pre-wrap break-words font-mono text-code-sm text-foreground">
                  {selectedPreview}
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
              <Button size="sm" variant="primary" disabled={!selected} onClick={confirm}>
                {confirmLabel}
              </Button>
            ) : null}
          </footer>
        ) : null}
      </section>
    );
  },
);
ChoicePrompt.displayName = "ChoicePrompt";

export { ChoicePrompt };
