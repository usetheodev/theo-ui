import type { Story } from "@ladle/react";
import { ChatMessage } from "./chat-message.js";

export default { title: "Primitives / Chat / ChatMessage" };

export const Roles: Story = () => (
  <div className="grid max-w-2xl gap-6">
    <ChatMessage
      message={{
        id: "u1",
        role: "user",
        content: "Build the alignment grid demo and run the tests.",
        timestamp: "10:01",
      }}
    />
    <ChatMessage
      message={{
        id: "a1",
        role: "assistant",
        model: "Opus 4.7",
        timestamp: "10:02",
        content:
          "Swapping the back-out curve for a hard-stop snap. I'll re-run tests after the edit.",
      }}
    />
    <ChatMessage
      message={{
        id: "s1",
        role: "system",
        content: "Tarefa executada localmente. Conteúdo não é sincronizado entre dispositivos.",
      }}
    />
  </div>
);
