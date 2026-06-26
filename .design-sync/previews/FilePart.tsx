import { ChatMessage, type UIMessage } from "@theokit/ui";

const msg: UIMessage = {
  id: "f1",
  role: "assistant",
  parts: [
    { type: "text", text: "Found this image in the results:" },
    {
      type: "file",
      mediaType: "image/svg+xml",
      url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'><rect width='200' height='100' fill='%237C3AED'/><text x='100' y='55' text-anchor='middle' fill='white' font-family='monospace'>theo</text></svg>",
      filename: "logo.svg",
    },
  ],
};

export const InMessage = () => <ChatMessage message={msg} />;
