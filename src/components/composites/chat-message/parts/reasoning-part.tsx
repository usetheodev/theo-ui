/**
 * `<ReasoningPart>` — renders a `ReasoningUIPart` as a native `<details>`
 * collapsible. The summary shows "Show reasoning" / "Hide reasoning";
 * expanded content is rendered as markdown via `<ChatMessageResponse>`.
 *
 * Native `<details>` (vs a JS-driven Collapsible) — zero JS for the toggle,
 * keyboard accessible by default, persists state via the DOM.
 */
import { BrainCircuitIcon } from "lucide-react";
import type { JSX } from "react";
import { cn } from "../../../../lib/cn.js";
import type { ReasoningUIPart } from "../../../../types/chat.js";
import { ChatMessageResponse } from "../chat-message-response.js";

export interface ReasoningPartProps {
  part: ReasoningUIPart;
  /** Open by default. Useful while the model is still streaming reasoning. */
  defaultOpen?: boolean;
}

export function ReasoningPart({ part, defaultOpen }: ReasoningPartProps): JSX.Element {
  const isStreaming = part.state === "streaming";
  const open = defaultOpen ?? isStreaming;
  return (
    <details
      data-slot="reasoning-part"
      className={cn(
        "my-2 rounded-md border border-border bg-muted/20 px-3 py-2",
        "[&[open]]:bg-muted/40",
      )}
      open={open}
      data-theo-reasoning=""
    >
      <summary
        className={cn(
          "cursor-pointer list-none font-mono text-label-caps text-muted-foreground uppercase tracking-wider",
          "flex items-center gap-1.5 marker:hidden",
          "transition-colors hover:text-foreground",
        )}
      >
        <BrainCircuitIcon className="size-3.5" aria-hidden="true" />
        <span>Reasoning</span>
        {isStreaming ? <span className="text-primary/80">…</span> : null}
      </summary>
      <div className="mt-2 border-border border-t pt-2">
        <ChatMessageResponse text={part.text} isStreaming={isStreaming} />
      </div>
    </details>
  );
}
