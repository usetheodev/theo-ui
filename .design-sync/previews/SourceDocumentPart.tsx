import { ChatMessage, type UIMessage } from "@theokit/ui";

const msg: UIMessage = {
  id: "sd",
  role: "assistant",
  parts: [
    { type: "text", text: "See the reference document:" },
    { type: "source-document", sourceId: "s2", mediaType: "application/pdf", title: "Design system whitepaper" },
  ],
};

export const InMessage = () => <ChatMessage message={msg} />;
