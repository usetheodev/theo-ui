/**
 * Pure mapping core for {@link useAgentStream}: folds an SDK stream message into
 * the render state consumed by `<AgentStream items={…} />`. No React, no I/O, no
 * `@theokit/sdk` import — exhaustively unit-testable (M5 T1.1).
 *
 * Handles both stream granularities:
 * - `text_delta` — append to the live buffer (fine-grained token stream),
 * - `assistant` — finalize the complete turn into a message item,
 * - `tool_call` — upsert a tool-call item keyed by `call_id`,
 * - `error` — surface an error item,
 * - `done` — finalize any trailing streamed text and mark the stream complete.
 *
 * Any other `type` (system/user/thinking/status/task/request/object_delta) is
 * ignored without throwing — forward-compatible with new SDK message types.
 */
import type {
  AgentStreamItem,
  MessageStreamItem,
  ToolCallStreamItem,
} from "../../components/composites/agent-stream/agent-stream.js";
import type { ToolCallStatus } from "../../components/primitives/tool-call-card/index.js";
import type { UIMessage } from "../../types/chat.js";
import type { AgentStreamStatus, SdkStreamMessage } from "./types.js";

export interface AgentStreamState {
  readonly items: AgentStreamItem[];
  readonly streamingText: string;
  readonly status: AgentStreamStatus;
  readonly error?: Error;
  /** Monotonic finalized-message counter — kept in state so the reducer stays pure. */
  readonly seq: number;
}

export const initialAgentStreamState: AgentStreamState = {
  items: [],
  streamingText: "",
  status: "idle",
  seq: 0,
};

const STREAMING_ID = "__streaming__";

function mapToolStatus(status: string | undefined): ToolCallStatus {
  if (status === "completed") return "success";
  if (status === "error") return "failed";
  return "running";
}

function errorToMessage(error: SdkStreamMessage["error"]): string {
  if (typeof error === "string") return error;
  return error?.message ?? "Agent stream error";
}

/** Drop the transient streaming item (rebuilt from `streamingText` each step). */
function withoutStreaming(items: AgentStreamItem[]): AgentStreamItem[] {
  return items.filter((i) => !(i.kind === "streaming" && i.id === STREAMING_ID));
}

/**
 * Finalize buffered text into a message item (dropping the streaming item).
 * Returns the new items + the next `seq`; pure — the id derives from `seq`.
 */
function finalizeText(
  items: AgentStreamItem[],
  text: string,
  seq: number,
): { items: AgentStreamItem[]; seq: number } {
  const base = withoutStreaming(items);
  if (text.length === 0) return { items: base, seq };
  const id = `msg-${seq + 1}`;
  const message: UIMessage = {
    id,
    role: "assistant",
    parts: [{ type: "text", text, state: "done" }],
  };
  const item: MessageStreamItem = { kind: "message", id, message };
  return { items: [...base, item], seq: seq + 1 };
}

/** Upsert a tool-call item by `call_id` (running → success/failed same slot). */
function upsertToolCall(items: AgentStreamItem[], msg: SdkStreamMessage): AgentStreamItem[] {
  const id = msg.call_id ?? "tool";
  const item: ToolCallStreamItem = {
    kind: "tool-call",
    id,
    tool: msg.name ?? "tool",
    status: mapToolStatus(msg.status),
    ...(msg.result !== undefined ? { output: String(msg.result) } : {}),
  };
  const idx = items.findIndex((i) => i.kind === "tool-call" && i.id === id);
  if (idx === -1) return [...items, item];
  const next = items.slice();
  next[idx] = item;
  return next;
}

/** Extract the concatenated text of an assistant turn's `content` blocks. */
function assistantText(msg: SdkStreamMessage): string {
  const content = msg.message?.content ?? [];
  return content
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text ?? "")
    .join("");
}

export function agentStreamReducer(
  state: AgentStreamState,
  msg: SdkStreamMessage,
): AgentStreamState {
  switch (msg.type) {
    case "text_delta": {
      const streamingText = state.streamingText + (msg.text ?? "");
      const item: AgentStreamItem = { kind: "streaming", id: STREAMING_ID, partial: streamingText };
      return {
        ...state,
        streamingText,
        status: "streaming",
        items: [...withoutStreaming(state.items), item],
      };
    }
    case "assistant": {
      const text = assistantText(msg) || state.streamingText;
      const next = finalizeText(state.items, text, state.seq);
      return { ...state, streamingText: "", status: "streaming", items: next.items, seq: next.seq };
    }
    case "tool_call": {
      return {
        ...state,
        status: "streaming",
        items: upsertToolCall(withoutStreaming(state.items), msg),
      };
    }
    case "error": {
      const message = errorToMessage(msg.error);
      const item: AgentStreamItem = {
        kind: "error",
        id: `err-${state.items.length}`,
        title: message,
      };
      return {
        ...state,
        status: "error",
        error: new Error(message),
        items: [...withoutStreaming(state.items), item],
      };
    }
    case "done": {
      const next = finalizeText(state.items, state.streamingText, state.seq);
      return { ...state, streamingText: "", status: "done", items: next.items, seq: next.seq };
    }
    default:
      return state;
  }
}
