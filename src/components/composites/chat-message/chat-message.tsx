"use client";

/**
 * `<ChatMessage>` — render a chat turn from a `UIMessage` (Vercel AI SDK
 * `parts: UIMessagePart[]` shape).
 *
 * Forked structural shell from `vercel/ai-elements` `<Message>` +
 * `<MessageContent>` (Apache-2.0, see NOTICE). The role-discriminated
 * styling (user-aligned right with secondary bubble, assistant-aligned
 * left with primary accent border) preserves TheoUI's Violet Forge look.
 *
 * Two consumption shapes:
 *
 *   1. **Convenience** — pass a full `UIMessage`, parts are dispatched to
 *      their built-in renderers automatically:
 *
 *        <ChatMessage message={msg} />
 *
 *   2. **Composable** — render children explicitly when you need to
 *      compose actions/branching/custom parts:
 *
 *        <ChatMessage.Root from="assistant">
 *          <ChatMessage.Content>
 *            <ChatMessageResponse text="Hello **world**" />
 *          </ChatMessage.Content>
 *          <ChatMessageToolbar>
 *            <ChatMessageActions>
 *              <ChatMessageAction tooltip="Copy"><CopyIcon /></ChatMessageAction>
 *            </ChatMessageActions>
 *          </ChatMessageToolbar>
 *        </ChatMessage.Root>
 */
import type { HTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "../../../lib/cn.js";
import {
  type DataUIPart,
  type FileUIPart,
  type MessageRole,
  type ReasoningFileUIPart,
  type ReasoningUIPart,
  type SourceDocumentUIPart,
  type SourceUrlUIPart,
  type TextUIPart,
  type ToolUIPart,
  type UIMessage,
  type UIMessagePart,
  isDataUIPart,
  isFileUIPart,
  isReasoningFileUIPart,
  isReasoningUIPart,
  isSourceDocumentUIPart,
  isSourceUrlUIPart,
  isStepStartUIPart,
  isTextUIPart,
  isToolUIPart,
} from "../../../types/chat.js";
import { DataPart, type DataRendererMap } from "./parts/data-part.js";
import { FilePart } from "./parts/file-part.js";
import { ReasoningPart } from "./parts/reasoning-part.js";
import { SourceDocumentPart, SourceUrlPart } from "./parts/source-part.js";
import { TextPart } from "./parts/text-part.js";
import { ToolCallPart } from "./parts/tool-call-part.js";

/* ─── <ChatMessage.Root> ─────────────────────────────────────────────── */

export type ChatMessageRootProps = HTMLAttributes<HTMLDivElement> & {
  /** Sender role — controls layout (right-aligned bubble for `user`, left for `assistant`/`system`). */
  from: MessageRole;
};

export const ChatMessageRoot = forwardRef<HTMLDivElement, ChatMessageRootProps>(
  ({ className, from, children, ...props }, ref) => (
    <div
      data-slot="chat-message-root"
      ref={ref}
      className={cn(
        "group flex w-full max-w-[95%] flex-col gap-2",
        from === "user"
          ? "is-user ml-auto justify-end"
          : from === "assistant"
            ? "is-assistant"
            : "is-system",
        className,
      )}
      data-theo-chat-message={from}
      {...props}
    >
      {children}
    </div>
  ),
);
ChatMessageRoot.displayName = "ChatMessageRoot";

/* ─── <ChatMessage.Content> ──────────────────────────────────────────── */

export type ChatMessageContentVariant = "contained" | "flat";

export interface ChatMessageContentProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * `contained` (default) — bubble surface (background + padding + radius).
   * Applied to user role automatically. Assistant defaults to `flat`.
   *
   * `flat` — no bubble, content flows directly. Use for assistant or system.
   */
  variant?: ChatMessageContentVariant;
}

export const ChatMessageContent = forwardRef<HTMLDivElement, ChatMessageContentProps>(
  ({ className, variant, children, ...props }, ref) => (
    <div
      data-slot="chat-message-content"
      ref={ref}
      className={cn(
        "flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden text-body-md",
        // User bubble — secondary surface, right-aligned (within the `is-user` group)
        "group-[.is-user]:ml-auto",
        variant !== "flat" &&
          "group-[.is-user]:rounded-2xl group-[.is-user]:rounded-tr-md group-[.is-user]:border group-[.is-user]:border-border/40 group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3",
        // Assistant card — primary accent border-left
        variant === "contained" &&
          "group-[.is-assistant]:rounded-2xl group-[.is-assistant]:rounded-tl-md group-[.is-assistant]:border group-[.is-assistant]:border-border/40 group-[.is-assistant]:border-l-2 group-[.is-assistant]:border-l-primary group-[.is-assistant]:bg-card group-[.is-assistant]:px-5 group-[.is-assistant]:py-4 group-[.is-assistant]:shadow-sm",
        // System callout — accent-deep border
        "group-[.is-system]:rounded-lg group-[.is-system]:border group-[.is-system]:border-accent-deep/40 group-[.is-system]:border-l-4 group-[.is-system]:bg-accent/10 group-[.is-system]:px-4 group-[.is-system]:py-2 group-[.is-system]:text-body-sm",
        "group-[.is-assistant]:text-foreground group-[.is-user]:text-secondary-foreground",
        className,
      )}
      data-theo-chat-content=""
      {...props}
    >
      {children}
    </div>
  ),
);
ChatMessageContent.displayName = "ChatMessageContent";

/* ─── Part dispatch ──────────────────────────────────────────────────── */

export interface RenderPartOptions {
  /** Consumer-defined renderers for `data-${name}` parts. */
  dataRenderers?: DataRendererMap;
  /** Override built-in renderers per part `type`. */
  partRenderers?: PartRendererMap;
}

export type PartRendererMap = Partial<{
  text: (part: TextUIPart) => ReactNode;
  reasoning: (part: ReasoningUIPart) => ReactNode;
  "reasoning-file": (part: ReasoningFileUIPart) => ReactNode;
  file: (part: FileUIPart) => ReactNode;
  "source-url": (part: SourceUrlUIPart) => ReactNode;
  "source-document": (part: SourceDocumentUIPart) => ReactNode;
  tool: (part: ToolUIPart) => ReactNode;
  data: (part: DataUIPart) => ReactNode;
  "step-start": () => ReactNode;
}>;

export function renderPart(part: UIMessagePart, opts: RenderPartOptions = {}): ReactNode {
  const overrides = opts.partRenderers ?? {};

  if (isTextUIPart(part)) {
    return overrides.text?.(part) ?? <TextPart part={part} />;
  }
  if (isReasoningUIPart(part)) {
    return overrides.reasoning?.(part) ?? <ReasoningPart part={part} />;
  }
  if (isReasoningFileUIPart(part)) {
    return overrides["reasoning-file"]?.(part) ?? null;
  }
  if (isFileUIPart(part)) {
    return overrides.file?.(part) ?? <FilePart part={part} />;
  }
  if (isSourceUrlUIPart(part)) {
    return overrides["source-url"]?.(part) ?? <SourceUrlPart part={part} />;
  }
  if (isSourceDocumentUIPart(part)) {
    return overrides["source-document"]?.(part) ?? <SourceDocumentPart part={part} />;
  }
  if (isToolUIPart(part)) {
    return overrides.tool?.(part) ?? <ToolCallPart part={part} />;
  }
  if (isDataUIPart(part)) {
    return overrides.data?.(part) ?? <DataPart part={part} renderers={opts.dataRenderers} />;
  }
  if (isStepStartUIPart(part)) {
    return (
      overrides["step-start"]?.() ?? (
        <hr className="my-3 border-border" aria-label="Step boundary" />
      )
    );
  }
  // CustomContentUIPart, or any unhandled future kind — render nothing.
  return null;
}

/* ─── <ChatMessage> convenience ──────────────────────────────────────── */

export interface ChatMessageProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** The UI message to render. Parts are dispatched automatically. */
  message: UIMessage;
  /** Optional avatar slot rendered before assistant/system content. */
  avatar?: ReactNode;
  /** Optional toolbar (copy / regenerate / branch nav) rendered below the content. */
  actions?: ReactNode;
  /** Variant of the content bubble. */
  variant?: ChatMessageContentVariant;
  /** Override built-in part renderers. */
  partRenderers?: PartRendererMap;
  /** Renderers for `data-${name}` parts. */
  dataRenderers?: DataRendererMap;
}

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  (
    { message, avatar, actions, variant, partRenderers, dataRenderers, className, ...props },
    ref,
  ) => {
    const inner = (
      <ChatMessageContent
        variant={variant ?? (message.role === "assistant" ? "contained" : undefined)}
      >
        {message.parts.map((part, idx) => (
          <div key={`${part.type}-${idx}`}>
            {renderPart(part, { dataRenderers, partRenderers })}
          </div>
        ))}
        {actions}
      </ChatMessageContent>
    );

    if (message.role === "user") {
      return (
        <ChatMessageRoot
          data-slot="chat-message"
          ref={ref}
          from="user"
          className={className}
          {...props}
        >
          {inner}
          {avatar ? <div className="shrink-0">{avatar}</div> : null}
        </ChatMessageRoot>
      );
    }

    return (
      <ChatMessageRoot
        data-slot="chat-message"
        ref={ref}
        from={message.role}
        className={className}
        {...props}
      >
        {avatar ? <div className="shrink-0">{avatar}</div> : null}
        {inner}
      </ChatMessageRoot>
    );
  },
);
ChatMessage.displayName = "ChatMessage";
