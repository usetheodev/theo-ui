import type { JSX } from "react";
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
      data-slot="text-part"
      text={part.text}
      isStreaming={part.state === "streaming"}
    />
  );
}
