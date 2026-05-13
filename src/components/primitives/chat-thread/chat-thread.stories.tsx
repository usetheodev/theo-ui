import type { Story } from "@ladle/react";
import { ChatMessage } from "../chat-message/chat-message.js";
import { ChatThread } from "./chat-thread.js";

export default { title: "Primitives / Chat / ChatThread" };

export const Default: Story = () => (
  <ChatThread className="max-w-2xl">
    <ChatMessage
      message={{
        id: "u1",
        role: "user",
        content: "What's the status of the deploy?",
        timestamp: "10:00",
      }}
    />
    <ChatMessage
      message={{
        id: "a1",
        role: "assistant",
        model: "Sonnet 4.6",
        content: "Build is running. Should be live in ~12s.",
        timestamp: "10:00",
      }}
    />
    <ChatMessage
      message={{
        id: "u2",
        role: "user",
        content: "Cool. Show me logs.",
        timestamp: "10:00",
      }}
    />
    <ChatMessage
      message={{
        id: "a2",
        role: "assistant",
        model: "Sonnet 4.6",
        content: "Opening the build log stream now.",
        timestamp: "10:01",
      }}
    />
  </ChatThread>
);
