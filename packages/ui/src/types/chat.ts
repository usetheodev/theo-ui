/**
 * Chat message types — structurally compatible with `vercel/ai` `UIMessage`.
 *
 * Verbatim of the part-type shape from `packages/ai/src/ui/ui-messages.ts`
 * (Apache-2.0, copyright Vercel Inc., see NOTICE). Re-declared standalone so
 * `@theokit/ui` does not take `ai` as a direct dependency — the goal is
 * interop without coupling.
 *
 * Consumer code using `useChat()` from `@ai-sdk/react`:
 *
 *   const { messages } = useChat();
 *   return messages.map((m) => <ChatMessage message={m} />);
 *
 * Works because the Vercel `UIMessage` shape is structurally assignable to
 * the types declared here.
 */

export type MessageRole = "system" | "user" | "assistant";

/**
 * Orthogonal attachment shape used by `<AttachmentChip>` and chat composer
 * primitives. Distinct from `FileUIPart` (which is part of the message
 * payload) — `Attachment` is the consumer's pending-upload state.
 */
export interface Attachment {
  id: string;
  name: string;
  size?: string;
  type?: string;
}

/* ─── Provider metadata (opaque structural slot) ─────────────────────── */

export type ProviderMetadata = Record<string, Record<string, unknown>>;

/* ─── Part types — 11 discriminated kinds ────────────────────────────── */

/**
 * A text part of a message.
 */
export interface TextUIPart {
  type: "text";
  text: string;
  /** "streaming" while tokens arrive; "done" when complete. */
  state?: "streaming" | "done";
  providerMetadata?: ProviderMetadata;
}

/**
 * A reasoning ("thinking") part of a message — typically rendered as a
 * collapsible panel.
 */
export interface ReasoningUIPart {
  type: "reasoning";
  text: string;
  state?: "streaming" | "done";
  providerMetadata?: ProviderMetadata;
}

/**
 * A file part of a message (image, document, audio, video).
 */
export interface FileUIPart {
  type: "file";
  /**
   * IANA media type (e.g. `image/png`) or top-level segment (e.g. `image`).
   */
  mediaType: string;
  filename?: string;
  /** URL or data: URL. */
  url: string;
  providerMetadata?: ProviderMetadata;
}

/**
 * A file emitted as part of a reasoning trace (e.g. internal scratchpad).
 */
export interface ReasoningFileUIPart {
  type: "reasoning-file";
  mediaType: string;
  url: string;
  providerMetadata?: ProviderMetadata;
}

/**
 * A URL source citation.
 */
export interface SourceUrlUIPart {
  type: "source-url";
  sourceId: string;
  url: string;
  title?: string;
  providerMetadata?: ProviderMetadata;
}

/**
 * A document source citation.
 */
export interface SourceDocumentUIPart {
  type: "source-document";
  sourceId: string;
  mediaType: string;
  title: string;
  filename?: string;
  providerMetadata?: ProviderMetadata;
}

/**
 * A step boundary marker — used to delimit multi-step agent responses.
 */
export interface StepStartUIPart {
  type: "step-start";
}

/**
 * A provider-specific custom content part.
 */
export interface CustomContentUIPart {
  type: "custom";
  /** Format: `${provider}.${providerType}`. */
  kind: `${string}.${string}`;
  providerMetadata?: ProviderMetadata;
}

/* ─── Tool invocation states (mirrors Vercel) ────────────────────────── */

export type ToolInvocationState =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-error"
  | "output-denied";

/**
 * A tool invocation part — covers both static (typed) and dynamic tools via
 * the `dynamic-tool` discriminator. The `type` field follows the Vercel
 * convention: `tool-${toolName}` for static, `dynamic-tool` for runtime.
 */
export interface ToolUIPart {
  /** `tool-${toolName}` (static) or `dynamic-tool` (runtime). */
  type: `tool-${string}` | "dynamic-tool";
  toolCallId: string;
  toolName?: string;
  title?: string;
  state: ToolInvocationState;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  providerExecuted?: boolean;
  callProviderMetadata?: ProviderMetadata;
  resultProviderMetadata?: ProviderMetadata;
  approval?: {
    id: string;
    approved?: boolean;
    reason?: string;
    isAutomatic?: boolean;
  };
}

/**
 * A data part — typed custom application state. The `type` field follows
 * `data-${name}` and `data` carries the payload. Consumers register a
 * renderer per `data-${name}` via the `<ChatMessage>` `dataRenderers` prop.
 */
export interface DataUIPart {
  /** `data-${name}` */
  type: `data-${string}`;
  id?: string;
  data: unknown;
}

/* ─── The discriminated union ────────────────────────────────────────── */

export type UIMessagePart =
  | TextUIPart
  | ReasoningUIPart
  | FileUIPart
  | ReasoningFileUIPart
  | SourceUrlUIPart
  | SourceDocumentUIPart
  | StepStartUIPart
  | CustomContentUIPart
  | ToolUIPart
  | DataUIPart;

/* ─── Type guards ────────────────────────────────────────────────────── */

export function isTextUIPart(part: UIMessagePart): part is TextUIPart {
  return part.type === "text";
}

export function isReasoningUIPart(part: UIMessagePart): part is ReasoningUIPart {
  return part.type === "reasoning";
}

export function isFileUIPart(part: UIMessagePart): part is FileUIPart {
  return part.type === "file";
}

export function isReasoningFileUIPart(part: UIMessagePart): part is ReasoningFileUIPart {
  return part.type === "reasoning-file";
}

export function isSourceUrlUIPart(part: UIMessagePart): part is SourceUrlUIPart {
  return part.type === "source-url";
}

export function isSourceDocumentUIPart(part: UIMessagePart): part is SourceDocumentUIPart {
  return part.type === "source-document";
}

export function isStepStartUIPart(part: UIMessagePart): part is StepStartUIPart {
  return part.type === "step-start";
}

export function isCustomContentUIPart(part: UIMessagePart): part is CustomContentUIPart {
  return part.type === "custom";
}

export function isToolUIPart(part: UIMessagePart): part is ToolUIPart {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

export function isDataUIPart(part: UIMessagePart): part is DataUIPart {
  return part.type.startsWith("data-");
}

/* ─── Top-level message ──────────────────────────────────────────────── */

/**
 * A chat message in UI form.
 *
 * Field-for-field compatible with `UIMessage` from `vercel/ai` (the AI SDK's
 * `useChat()` return type) — a consumer's `useChat()` messages flow into
 * `<ChatMessage message={msg} />` with zero adapter.
 *
 * `metadata` is opaque (`unknown`) so consumers can attach arbitrary fields
 * (timestamps, model identifiers, request IDs, …) without our type
 * dictating shape.
 */
export interface UIMessage {
  id: string;
  role: MessageRole;
  parts: UIMessagePart[];
  metadata?: unknown;
}
