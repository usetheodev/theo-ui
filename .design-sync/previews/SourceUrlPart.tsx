import { ChatMessage, type UIMessage } from "@theokit/ui";

const msg: UIMessage = {
  id: "su",
  role: "assistant",
  parts: [
    { type: "text", text: "Per the docs, the correct pattern is compose-pattern:" },
    { type: "source-url", sourceId: "s1", url: "https://react.dev/reference/react/Fragment", title: "React Fragment" },
  ],
};

export const InMessage = () => <ChatMessage message={msg} />;
