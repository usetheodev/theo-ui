import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn.js";
import type { Message } from "../../types/chat.js";

interface ChatMessageProps extends HTMLAttributes<HTMLElement> {
  message: Message;
  /**
   * Optional avatar slot rendered before assistant/user content.
   */
  avatar?: ReactNode;
  /**
   * Optional toolbar (copy, regenerate, etc.) rendered after the content.
   */
  actions?: ReactNode;
}

/**
 * ChatMessage — single chat turn.
 *
 * Visual:
 *   - user      → soft surface bubble aligned right, max-width 70%
 *   - assistant → card with violet accent border-left + Boska title for model + body
 *   - system    → muted callout with accent-deep border
 */
const ChatMessage = forwardRef<HTMLElement, ChatMessageProps>(
  ({ className, message, avatar, actions, ...props }, ref) => {
    if (message.role === "user") {
      return (
        <article
          ref={ref}
          className={cn("flex justify-end gap-3", className)}
          aria-label="user message"
          {...props}
        >
          <div
            className={cn(
              "max-w-[70%] rounded-2xl rounded-tr-md border border-border/40 bg-secondary",
              "px-4 py-3 text-body-md text-secondary-foreground",
            )}
          >
            {message.content}
            {message.timestamp ? (
              <p className="mt-1 text-right font-mono text-label text-muted-foreground">
                {message.timestamp}
              </p>
            ) : null}
          </div>
          {avatar ? <div className="shrink-0">{avatar}</div> : null}
        </article>
      );
    }

    if (message.role === "system") {
      return (
        <article
          ref={ref}
          className={cn(
            "rounded-lg border border-accent-deep/40 border-l-4 bg-accent/10 px-4 py-2",
            "text-body-sm text-foreground",
            className,
          )}
          aria-label="system message"
          {...props}
        >
          {message.content}
        </article>
      );
    }

    return (
      <article
        ref={ref}
        className={cn("flex gap-3", className)}
        aria-label="assistant message"
        {...props}
      >
        {avatar ? <div className="shrink-0">{avatar}</div> : null}
        <div
          className={cn(
            "min-w-0 flex-1 rounded-2xl rounded-tl-md border border-border/40 border-l-2 border-l-primary",
            "bg-card px-5 py-4 shadow-sm",
          )}
        >
          <header className="mb-2 flex items-center justify-between gap-3">
            {message.model ? (
              <span className="font-mono text-label-caps text-primary uppercase tracking-wider">
                {message.model}
              </span>
            ) : (
              <span className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
                Assistant
              </span>
            )}
            {message.timestamp ? (
              <span className="font-mono text-label text-muted-foreground">
                {message.timestamp}
              </span>
            ) : null}
          </header>
          <div className="text-body-md leading-relaxed text-foreground">{message.content}</div>
          {actions ? <div className="mt-3 flex items-center gap-1">{actions}</div> : null}
        </div>
      </article>
    );
  },
);
ChatMessage.displayName = "ChatMessage";

export { ChatMessage };
