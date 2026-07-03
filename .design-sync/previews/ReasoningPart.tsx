import { ChatMessage, type UIMessage } from "@theokit/ui";

const msg: UIMessage = {
  id: "r1",
  role: "assistant",
  parts: [
    { type: "reasoning", text: "I'll list the files first, then summarize.\n\n1. Call \`ls -la\`\n2. Filter \`.ts\` files\n3. Count lines" },
    { type: "text", text: "Found **12 TypeScript files** in the project." },
  ],
};

export const InMessage = () => <ChatMessage message={msg} />;
