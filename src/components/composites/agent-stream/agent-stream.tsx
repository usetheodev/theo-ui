import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";
import type { Message } from "../../../types/chat.js";
import { AgentErrorCard, type AgentErrorKind } from "../../primitives/agent-error-card/index.js";
import { AgentStreaming } from "../../primitives/agent-streaming/index.js";
import { ChatMessage } from "../../primitives/chat-message/index.js";
import { ToolCallCard, type ToolCallStatus } from "../../primitives/tool-call-card/index.js";
import { ApprovalCard, type ApprovalSeverity } from "../approval-card/index.js";

/**
 * AgentStream — the canonical conversation surface for a code agent.
 *
 * Interleaves chat messages (user + assistant), tool invocations, approval
 * gates, errors, and the live streaming indicator. Mirrors how Claude Code
 * presents work to the user: conversation-centric, tool calls embedded,
 * approvals pause the flow inline, errors surface where they happen.
 *
 * Items are rendered in array order. The consumer fully controls the data;
 * AgentStream is a pure presentational composite over its child primitives.
 */

interface ToolCallStreamItem {
  kind: "tool-call";
  id: string;
  tool: ReactNode;
  icon?: IconComponent;
  target?: ReactNode;
  status: ToolCallStatus;
  output?: ReactNode;
  defaultExpanded?: boolean;
  timestamp?: ReactNode;
}

interface ApprovalStreamItem {
  kind: "approval";
  id: string;
  severity?: ApprovalSeverity;
  title: ReactNode;
  request: ReactNode;
  description?: ReactNode;
  details?: ReactNode;
  onApprove?: () => void;
  onDeny?: () => void;
  onAlways?: () => void;
}

interface ErrorStreamItem {
  kind: "error";
  id: string;
  errorKind?: AgentErrorKind;
  title: ReactNode;
  detail?: ReactNode;
  actions?: ReactNode;
  timestamp?: ReactNode;
}

interface StreamingStreamItem {
  kind: "streaming";
  id: string;
  model?: ReactNode;
  partial?: ReactNode;
}

interface MessageStreamItem {
  kind: "message";
  id: string;
  message: Message;
}

interface CustomStreamItem {
  kind: "custom";
  id: string;
  /** Arbitrary node — escape hatch for inline diff cards, etc. */
  node: ReactNode;
}

export type AgentStreamItem =
  | MessageStreamItem
  | ToolCallStreamItem
  | ApprovalStreamItem
  | ErrorStreamItem
  | StreamingStreamItem
  | CustomStreamItem;

interface AgentStreamProps extends HTMLAttributes<HTMLDivElement> {
  items: AgentStreamItem[];
}

const AgentStream = forwardRef<HTMLDivElement, AgentStreamProps>(
  ({ className, items, ...props }, ref) => (
    <div
      ref={ref}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      // MEDIUM-001: explicit aria-atomic="false" so VoiceOver/macOS doesn't
      // reannounce the entire stream on each new item.
      aria-atomic="false"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      {items.map((item) => {
        if (item.kind === "message") return <ChatMessage key={item.id} message={item.message} />;
        if (item.kind === "tool-call")
          return (
            <ToolCallCard
              key={item.id}
              tool={item.tool}
              icon={item.icon}
              target={item.target}
              status={item.status}
              output={item.output}
              defaultExpanded={item.defaultExpanded}
              timestamp={item.timestamp}
            />
          );
        if (item.kind === "approval")
          return (
            <ApprovalCard
              key={item.id}
              severity={item.severity}
              title={item.title}
              request={item.request}
              description={item.description}
              details={item.details}
              onApprove={item.onApprove}
              onDeny={item.onDeny}
              onAlways={item.onAlways}
            />
          );
        if (item.kind === "error")
          return (
            <AgentErrorCard
              key={item.id}
              kind={item.errorKind}
              title={item.title}
              detail={item.detail}
              actions={item.actions}
              timestamp={item.timestamp}
            />
          );
        if (item.kind === "streaming")
          return <AgentStreaming key={item.id} model={item.model} partial={item.partial} />;
        if (item.kind === "custom") return <div key={item.id}>{item.node}</div>;
        return null;
      })}
    </div>
  ),
);
AgentStream.displayName = "AgentStream";

export { AgentStream };
