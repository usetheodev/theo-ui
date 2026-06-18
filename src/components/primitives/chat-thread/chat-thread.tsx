import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import { LiveRegionProvider } from "../../../lib/live-region-context.js";

/**
 * ChatThread — simple vertical container that applies spacing + scroll.
 *
 * No virtualization or stickiness. Wrap with your own scroller for long threads.
 *
 * T4.1 (MF-4): declares the outer live region and wraps children in
 * LiveRegionProvider so nested AgentStreaming / AgentErrorCard / Skeleton
 * don't add their own aria-live (double-announcement avoided).
 */
const ChatThread = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <LiveRegionProvider value={true}>
      <div
        data-slot="chat-thread"
        ref={ref}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className={cn("flex flex-col gap-6", className)}
        {...props}
      />
    </LiveRegionProvider>
  ),
);
ChatThread.displayName = "ChatThread";

export { ChatThread };
