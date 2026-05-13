import { Mic, Paperclip, Send, Square } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import { Button } from "../../primitives/button/button.js";

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
   * Slot on the bottom-left of the action row (e.g. add-attachment button + custom toggles).
   * If omitted, defaults to a paperclip attach button (without behavior).
   */
  leadingActions?: ReactNode;
  /**
   * Slot on the bottom-right (e.g. model selector). Send/stop is appended after this.
   */
  trailingActions?: ReactNode;
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
  chat: "Como posso ajudar você hoje?",
  code: "Type / for commands",
  infra: "Ask about deploys, metrics, env, or rollback…",
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
      placeholder,
      textareaProps,
      ...props
    },
    ref,
  ) => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (running) return;
      if (!value.trim()) return;
      onSubmit?.(value);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
            {leadingActions ?? (
              <Button size="icon" variant="ghost" type="button" aria-label="Attach file">
                <Paperclip />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {trailingActions}
            <Button size="icon" variant="ghost" type="button" aria-label="Voice input">
              <Mic />
            </Button>
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
