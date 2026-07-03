import { ChatMessage, type UIMessage } from "@theokit/ui";

const msg: UIMessage = {
  id: "tc",
  role: "assistant",
  parts: [
    { type: "text", text: "Running the command now:" },
    {
      type: "tool-bash",
      toolCallId: "tc1",
      toolName: "bash",
      state: "output-available",
      input: { command: "ls -la src/" },
      output: "total 48\n-rw-r--r-- 1 user user 142 Mar 12 10:00 index.ts\n-rw-r--r-- 1 user user  89 Mar 12 10:00 server.ts",
    },
    { type: "text", text: "There are **2 files** in \`src/\`." },
  ],
};

export const InMessage = () => <ChatMessage message={msg} />;
