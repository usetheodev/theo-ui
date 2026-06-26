import { ChatMessage, type UIMessage } from "@theokit/ui";

const msg: UIMessage = {
  id: "t1",
  role: "assistant",
  parts: [{ type: "text", text: "Found **12 TypeScript files** in the project. The largest is \`src/index.ts\` at 142 lines." }],
};

export const InMessage = () => <ChatMessage message={msg} />;
