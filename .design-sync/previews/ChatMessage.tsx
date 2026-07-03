import { ChatMessage, type UIMessage } from "@theokit/ui";

export const UserPlainText = () => {
  const msg: UIMessage = {
    id: "1",
    role: "user",
    parts: [{ type: "text", text: "Which files are in the project?" }],
  };
  return <ChatMessage message={msg} />;
};

export const AssistantMarkdownGFM = () => {
  const msg: UIMessage = {
    id: "2",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: `## Answer

The project has **3 main files**:

- \`src/index.ts\`
- \`src/server.ts\`
- \`README.md\`

| File | LOC | Type |
|---|---|---|
| index.ts | 142 | source |
| server.ts | 89 | source |
| README.md | 38 | docs |

> ~~Old~~ versioning via SemVer.

[Full documentation](https://example.com)`,
      },
    ],
  };
  return <ChatMessage message={msg} />;
};

export const AssistantWithCodeBlock = () => {
  const msg: UIMessage = {
    id: "3",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: `Here is the snippet in TypeScript:

\`\`\`typescript
export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const result = greet("world");
console.log(result);
\`\`\``,
      },
    ],
  };
  return <ChatMessage message={msg} />;
};
