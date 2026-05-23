/**
 * `<ChatMessage>` — composite-layer barrel.
 *
 * Public surface includes:
 *   - Convenience: `ChatMessage` (auto-dispatches parts)
 *   - Composable shell: `ChatMessageRoot`, `ChatMessageContent`,
 *     `ChatMessageResponse`, `ChatMessageActions`, `ChatMessageAction`,
 *     `ChatMessageToolbar`, branch components
 *   - Part renderers: `TextPart`, `ReasoningPart`, `ToolCallPart`,
 *     `FilePart`, `SourceUrlPart`, `SourceDocumentPart`, `DataPart`
 *   - Imperative helpers: `renderPart`, types for renderer maps
 */
export {
  ChatMessage,
  ChatMessageRoot,
  ChatMessageContent,
  type ChatMessageProps,
  type ChatMessageRootProps,
  type ChatMessageContentProps,
  type ChatMessageContentVariant,
  type PartRendererMap,
  type RenderPartOptions,
  renderPart,
} from "./chat-message.js";
export {
  ChatMessageResponse,
  type ChatMessageResponseProps,
} from "./chat-message-response.js";
export {
  ChatMessageActions,
  ChatMessageAction,
  type ChatMessageActionsProps,
  type ChatMessageActionProps,
} from "./chat-message-actions.js";
export {
  ChatMessageToolbar,
  type ChatMessageToolbarProps,
} from "./chat-message-toolbar.js";
export {
  ChatMessageBranch,
  ChatMessageBranchContent,
  ChatMessageBranchSelector,
  ChatMessageBranchPrevious,
  ChatMessageBranchNext,
  ChatMessageBranchPage,
  type ChatMessageBranchProps,
  type ChatMessageBranchContentProps,
  type ChatMessageBranchSelectorProps,
  type ChatMessageBranchPreviousProps,
  type ChatMessageBranchNextProps,
  type ChatMessageBranchPageProps,
} from "./chat-message-branch.js";
export { TextPart, type TextPartProps } from "./parts/text-part.js";
export { ReasoningPart, type ReasoningPartProps } from "./parts/reasoning-part.js";
export { ToolCallPart, type ToolCallPartProps } from "./parts/tool-call-part.js";
export { FilePart, type FilePartProps } from "./parts/file-part.js";
export {
  SourceUrlPart,
  SourceDocumentPart,
  type SourceUrlPartProps,
  type SourceDocumentPartProps,
} from "./parts/source-part.js";
export {
  DataPart,
  type DataPartProps,
  type DataRenderer,
  type DataRendererMap,
} from "./parts/data-part.js";
