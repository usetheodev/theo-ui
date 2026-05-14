import { Mic, Paperclip, Send, Square } from "lucide-react";
import { forwardRef } from "react";
import type {
  FormEvent,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "../../../lib/cn.js";
import { Button } from "../../primitives/button/index.js";

export type ComposerMode = "chat" | "code" | "infra";

interface ChatComposerProps extends Omit<HTMLAttributes<HTMLFormElement>, "onSubmit"> {
  mode?: ComposerMode;
  value: string;
  onValueChange: (next: string) => void;
  onSubmit?: (value: string) => void;
  /**
   * If true, the composer is in "agent running" state — Send becomes a Stop button.
   */
  running?: boolean;
  onStop?: () => void;
  /**
   * Slot above the textarea — used for the folder selector in Infra mode.
   */
  contextSlot?: ReactNode;
  /**
   * Slot above the textarea for attachments / chips.
   */
  attachmentsSlot?: ReactNode;
  /**
   * Slot on the bottom-left of the action row (e.g. custom toggles).
   * Overrides the default attach button entirely when provided.
   */
  leadingActions?: ReactNode;
  /**
   * Slot on the bottom-right (e.g. model selector). Send/stop is appended after this.
   */
  trailingActions?: ReactNode;
  /**
   * Optional attach-file callback. If omitted (and `leadingActions` is also
   * omitted), no attach button is rendered. This avoids fake affordances per
   * Quality Gate §7.
   */
  onAttach?: () => void;
  /**
   * Optional voice-input callback. If omitted, no mic button is rendered.
   * Same rationale as `onAttach`.
   */
  onVoiceInput?: () => void;
  /**
   * Accessible label for the textarea. Falls back to a mode-aware default.
   */
  textareaLabel?: string;
  /**
   * Textarea placeholder. Defaults change by mode.
   */
  placeholder?: string;
  /**
   * Extra textarea props (rows, maxLength…).
   */
  textareaProps?: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">;
}

const defaultPlaceholder: Record<ComposerMode, string> = {
  chat: "How can I help you today?",
  code: "Type / for commands",
  infra: "Ask about deploys, metrics, env, or rollback…",
};

const defaultTextareaLabel: Record<ComposerMode, string> = {
  chat: "Chat message",
  code: "Code prompt",
  infra: "Infra command",
};

/**
 * ChatComposer — message input area, shared by Chat / Code / Infra modes.
 *
 * Visual:
 *   - chat / infra → soft card with violet ring on focus, generous padding
 *   - code          → compact dense form with mono font, slash prefix hint
 *
 * Stateless: caller controls `value` + handles `onSubmit`. Submit fires on Enter
 * (without Shift). Shift+Enter inserts a newline.
 *
 * Optional affordances (mic, attach) are opt-in via `onVoiceInput` / `onAttach`
 * — Quality Gate §7 forbids rendering fake controls without behavior.
 */
const ChatComposer = forwardRef<HTMLFormElement, ChatComposerProps>(
  (
    {
      className,
      mode = "chat",
      value,
      onValueChange,
      onSubmit,
      running = false,
      onStop,
      contextSlot,
      attachmentsSlot,
      leadingActions,
      trailingActions,
      onAttach,
      onVoiceInput,
      textareaLabel,
      placeholder,
      textareaProps,
      ...props
    },
    ref,
  ) => {
    const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      if (running) return;
      if (!value.trim()) return;
      onSubmit?.(value);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (running) return;
        if (!value.trim()) return;
        onSubmit?.(value);
      }
    };

    const isCode = mode === "code";

    return (
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn(
          "rounded-2xl border bg-card text-card-foreground transition-shadow",
          "focus-within:border-primary/60 focus-within:shadow-glow",
          isCode && "rounded-xl shadow-sm",
          className,
        )}
        {...props}
      >
        {contextSlot ? (
          <div className="border-border/40 border-b px-3 pt-3">{contextSlot}</div>
        ) : null}

        {attachmentsSlot ? (
          <div className="flex flex-wrap gap-2 px-4 pt-3">{attachmentsSlot}</div>
        ) : null}

        <textarea
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? defaultPlaceholder[mode]}
          aria-label={textareaLabel ?? defaultTextareaLabel[mode]}
          rows={isCode ? 1 : 2}
          {...textareaProps}
          className={cn(
            "w-full resize-none bg-transparent px-4 py-3",
            "placeholder:text-muted-foreground",
            "focus:outline-none",
            isCode ? "font-mono text-code-md" : "min-h-[3.5rem] font-sans text-body-md",
            textareaProps?.className,
          )}
        />

        <div
          className={cn(
            "flex items-center justify-between gap-2 border-border/40 border-t px-3 py-2",
          )}
        >
          <div className="flex items-center gap-1">
            {leadingActions !== undefined ? (
              leadingActions
            ) : onAttach ? (
              <Button
                size="icon"
                variant="ghost"
                type="button"
                onClick={onAttach}
                aria-label="Attach file"
              >
                <Paperclip />
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {trailingActions}
            {onVoiceInput ? (
              <Button
                size="icon"
                variant="ghost"
                type="button"
                onClick={onVoiceInput}
                aria-label="Voice input"
              >
                <Mic />
              </Button>
            ) : null}
            {running ? (
              <Button
                type="button"
                onClick={onStop}
                size="icon"
                variant="destructive"
                aria-label="Stop generation"
              >
                <Square />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!value.trim()} aria-label="Send message">
                <Send />
              </Button>
            )}
          </div>
        </div>
      </form>
    );
  },
);
ChatComposer.displayName = "ChatComposer";

export { ChatComposer };
