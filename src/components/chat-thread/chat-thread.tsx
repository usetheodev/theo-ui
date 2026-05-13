import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

/**
 * ChatThread — simple vertical container that applies spacing + scroll.
 *
 * No virtualization or stickiness. Wrap with your own scroller for long threads.
 */
const ChatThread = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      className={cn("flex flex-col gap-6", className)}
      {...props}
    />
  ),
);
ChatThread.displayName = "ChatThread";

export { ChatThread };
