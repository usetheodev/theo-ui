import { ChatMessage, ChatMessageToolbar, ChatMessageActions, ChatMessageAction, type UIMessage } from "@theokit/ui";
import { CopyIcon, RefreshCcwIcon, ThumbsUpIcon, ThumbsDownIcon } from "lucide-react";

const msg: UIMessage = { id: "8", role: "assistant", parts: [{ type: "text", text: "This response has footer actions." }] };

export const WithActions = () => (
  <ChatMessage
    message={msg}
    actions={
      <ChatMessageToolbar>
        <ChatMessageActions>
          <ChatMessageAction tooltip="Copy" label="Copy"><CopyIcon className="size-3.5" aria-hidden="true" /></ChatMessageAction>
          <ChatMessageAction tooltip="Regenerate" label="Regenerate"><RefreshCcwIcon className="size-3.5" aria-hidden="true" /></ChatMessageAction>
          <ChatMessageAction tooltip="Good response" label="Thumbs up"><ThumbsUpIcon className="size-3.5" aria-hidden="true" /></ChatMessageAction>
          <ChatMessageAction tooltip="Bad response" label="Thumbs down"><ThumbsDownIcon className="size-3.5" aria-hidden="true" /></ChatMessageAction>
        </ChatMessageActions>
      </ChatMessageToolbar>
    }
  />
);
