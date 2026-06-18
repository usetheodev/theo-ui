/**
 * `<TextPart>` — renders a `TextUIPart`.
 *
 * Delegates to `<ChatMessageResponse>` which handles markdown + streaming
 * preprocess + code-block highlight + memoization.
 */
import type { TextUIPart } from "../../../../types/chat.js";
import { ChatMessageResponse } from "../chat-message-response.js";

export interface TextPartProps {
  part: TextUIPart;
}

export function TextPart({ part }: TextPartProps): JSX.Element {
  return (
    <ChatMessageResponse
      text={part.text}
      isStreaming={part.state === "streaming"}
      data-slot="text-part"
    />
  );
}
