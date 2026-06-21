/**
 * `toAgentStreamItems` (M5-6) — a pure, order-aware builder that merges
 * historical `UIMessage`s with live `AgentEvent`s into the `AgentStreamItem[]`
 * that `<AgentStream>` renders.
 *
 * History (the conversation so far) becomes `message` items; live activity
 * (commands / file ops / lint / …) becomes `tool-call` items, in
 * history-then-live order (the caller owns chronology within each segment). A
 * `classifyTool` option customizes each tool-call item per event.
 *
 * Pure: no React, no hooks — imports types only.
 */
import type { AgentEvent, AgentEventStatus } from "../../../types/agent.js";
import type { UIMessage } from "../../../types/chat.js";
import type { ToolCallStatus } from "../../primitives/tool-call-card/index.js";
import type { AgentStreamItem, MessageStreamItem, ToolCallStreamItem } from "./agent-stream.js";

const STATUS_MAP: Record<AgentEventStatus, ToolCallStatus> = {
  pending: "queued",
  running: "running",
  success: "success",
  failed: "failed",
};

/** Map theo-ui's `AgentEventStatus` to the `ToolCallCard` `ToolCallStatus`. */
export function mapAgentEventStatus(status: AgentEventStatus): ToolCallStatus {
  return STATUS_MAP[status];
}

/** Fields of a tool-call item a `classifyTool` override may set (never the discriminant). */
export type ToolCallOverride = Partial<
  Pick<ToolCallStreamItem, "tool" | "icon" | "target" | "output" | "defaultExpanded" | "timestamp">
>;

export interface ToAgentStreamItemsInput {
  /** Completed conversation turns, rendered first. */
  history?: UIMessage[];
  /** In-flight agent activity, rendered after history. */
  live?: AgentEvent[];
}

export interface ToAgentStreamItemsOptions {
  /** Customize the tool-call item produced for each live event. */
  classifyTool?: (event: AgentEvent) => ToolCallOverride;
}

function toMessageItem(message: UIMessage): MessageStreamItem {
  return { kind: "message", id: message.id, message };
}

function toToolCallItem(
  event: AgentEvent,
  classifyTool?: (event: AgentEvent) => ToolCallOverride,
): ToolCallStreamItem {
  const base: ToolCallStreamItem = {
    kind: "tool-call",
    id: event.id,
    tool: event.label,
    target: event.path,
    output: event.detail,
    status: mapAgentEventStatus(event.status),
  };
  // Override may set presentational fields only; kind/id/status stay authoritative.
  return {
    ...base,
    ...classifyTool?.(event),
    kind: "tool-call",
    id: event.id,
    status: base.status,
  };
}

/** Build the ordered `AgentStreamItem[]` for `<AgentStream>`. Pure. */
export function toAgentStreamItems(
  input: ToAgentStreamItemsInput,
  options: ToAgentStreamItemsOptions = {},
): AgentStreamItem[] {
  const history = (input.history ?? []).map(toMessageItem);
  const live = (input.live ?? []).map((event) => toToolCallItem(event, options.classifyTool));
  return [...history, ...live];
}
