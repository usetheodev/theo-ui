/**
 * `<ChatMessageActions>` + `<ChatMessageAction>` — footer toolbar for a chat
 * message (copy, regenerate, thumbs up/down, share, edit, …).
 *
 * Forked from `vercel/ai-elements` `<MessageActions>` + `<MessageAction>`
 * (Apache-2.0, see NOTICE). Adapted to TheoUI primitives: `<Button>` from
 * `@theokit/ui` instead of shadcn, no Tooltip primitive yet (Vercel uses
 * one — we render the `tooltip` prop as a `title` attribute for now; a
 * proper Tooltip primitive lands in a follow-up RFC).
 */
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { Button } from "../../primitives/button/index.js";

export type ChatMessageActionsProps = HTMLAttributes<HTMLDivElement>;

export function ChatMessageActions({
  className,
  children,
  ...props
}: ChatMessageActionsProps): JSX.Element {
  return (
    <div
      data-slot="chat-message-actions"
      className={cn("flex items-center gap-1", className)}
      data-theo-chat-actions=""
      {...props}
    >
      {children}
    </div>
  );
}

export type ChatMessageActionProps = ComponentProps<typeof Button> & {
  /** Tooltip text — rendered as native `title` for now. */
  tooltip?: string;
  /** Accessible label (used by screen readers when only an icon is visible). */
  label?: string;
  children?: ReactNode;
};

export function ChatMessageAction({
  tooltip,
  label,
  variant = "ghost",
  size = "icon",
  className,
  children,
  ...props
}: ChatMessageActionProps): JSX.Element {
  return (
    <Button
      data-slot="chat-message-action"
      type="button"
      variant={variant}
      size={size}
      title={tooltip}
      className={cn(className)}
      {...props}
    >
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );
}
