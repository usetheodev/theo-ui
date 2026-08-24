/**
 * `<ChatMessageToolbar>` — bottom-of-message bar holding actions + branch nav.
 * Forked from `vercel/ai-elements` `<MessageToolbar>` (Apache-2.0, NOTICE).
 */
import type { HTMLAttributes } from "react";
import type { JSX } from "react";
import { cn } from "../../../lib/cn.js";

export type ChatMessageToolbarProps = HTMLAttributes<HTMLDivElement>;

export function ChatMessageToolbar({
  className,
  children,
  ...props
}: ChatMessageToolbarProps): JSX.Element {
  return (
    <div
      data-slot="chat-message-toolbar"
      className={cn("mt-3 flex w-full items-center justify-between gap-3", className)}
      data-theo-chat-toolbar=""
      {...props}
    >
      {children}
    </div>
  );
}
