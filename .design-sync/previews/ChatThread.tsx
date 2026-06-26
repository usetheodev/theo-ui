import { ChatMessage, ChatThread } from "@theokit/ui";

export const Default = () => (
  <ChatThread className="max-w-2xl">
    <ChatMessage
      message={{
        id: "u1",
        role: "user",
        parts: [{ type: "text", text: "What's the status of the deploy?" }],
      }}
    />
    <ChatMessage
      message={{
        id: "a1",
        role: "assistant",
        parts: [{ type: "text", text: "Build is running. Should be live in ~12s." }],
      }}
    />
    <ChatMessage
      message={{
        id: "u2",
        role: "user",
        parts: [{ type: "text", text: "Cool. Show me logs." }],
      }}
    />
    <ChatMessage
      message={{
        id: "a2",
        role: "assistant",
        parts: [{ type: "text", text: "Opening the build log stream now." }],
      }}
    />
  </ChatThread>
);
