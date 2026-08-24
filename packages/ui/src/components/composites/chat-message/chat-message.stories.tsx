import type { Story } from "@ladle/react";
import { CopyIcon, RefreshCcwIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import type { UIMessage } from "../../../types/chat.js";
import { ChatMessageAction, ChatMessageActions } from "./chat-message-actions.js";
import {
  ChatMessageBranch,
  ChatMessageBranchContent,
  ChatMessageBranchNext,
  ChatMessageBranchPage,
  ChatMessageBranchPrevious,
  ChatMessageBranchSelector,
} from "./chat-message-branch.js";
import { ChatMessageResponse } from "./chat-message-response.js";
import { ChatMessageToolbar } from "./chat-message-toolbar.js";
import { ChatMessage } from "./chat-message.js";

export const UserPlainText: Story = () => {
  const msg: UIMessage = {
    id: "1",
    role: "user",
    parts: [{ type: "text", text: "Quais arquivos do projeto?" }],
  };
  return <ChatMessage message={msg} />;
};

export const AssistantMarkdownGFM: Story = () => {
  const msg: UIMessage = {
    id: "2",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: `## Resposta

O projeto tem **3 arquivos principais**:

- \`src/index.ts\`
- \`src/server.ts\`
- \`README.md\`

| Arquivo | LOC | Tipo |
|---|---|---|
| index.ts | 142 | source |
| server.ts | 89 | source |
| README.md | 38 | docs |

> ~~Antigo~~ versionamento via SemVer.

[Documentação completa](https://example.com)`,
      },
    ],
  };
  return <ChatMessage message={msg} />;
};

export const AssistantWithCodeBlock: Story = () => {
  const msg: UIMessage = {
    id: "3",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: `Aqui está o snippet em TypeScript:

\`\`\`typescript
export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const result = greet("world");
console.log(result);
\`\`\`

E em Python equivalente:

\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("world"))
\`\`\``,
      },
    ],
  };
  return <ChatMessage message={msg} />;
};

export const AssistantWithReasoning: Story = () => {
  const msg: UIMessage = {
    id: "4",
    role: "assistant",
    parts: [
      {
        type: "reasoning",
        text: "Vou listar os arquivos primeiro, depois resumir.\n\n1. Chamar `ls -la`\n2. Filtrar arquivos `.ts`\n3. Contar linhas",
      },
      {
        type: "text",
        text: "Encontrei **12 arquivos TypeScript** no projeto.",
      },
    ],
  };
  return <ChatMessage message={msg} />;
};

export const AssistantWithToolCall: Story = () => {
  const msg: UIMessage = {
    id: "5",
    role: "assistant",
    parts: [
      { type: "text", text: "Vou rodar o comando agora:" },
      {
        type: "tool-bash",
        toolCallId: "tc1",
        toolName: "bash",
        state: "output-available",
        input: { command: "ls -la src/" },
        output:
          "total 48\n-rw-r--r-- 1 user user  142 Mar 12 10:00 index.ts\n-rw-r--r-- 1 user user   89 Mar 12 10:00 server.ts",
      },
      { type: "text", text: "Tem **2 arquivos** na pasta `src/`." },
    ],
  };
  return <ChatMessage message={msg} />;
};

export const AssistantWithImageAttachment: Story = () => {
  const msg: UIMessage = {
    id: "6",
    role: "assistant",
    parts: [
      { type: "text", text: "Encontrei esta imagem nos resultados:" },
      {
        type: "file",
        mediaType: "image/svg+xml",
        url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'><rect width='200' height='100' fill='%237C3AED'/><text x='100' y='55' text-anchor='middle' fill='white' font-family='monospace'>theo</text></svg>",
        filename: "logo.svg",
      },
    ],
  };
  return <ChatMessage message={msg} />;
};

export const AssistantWithSources: Story = () => {
  const msg: UIMessage = {
    id: "7",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Segundo a documentação, o pattern correto é compose-pattern. Veja:",
      },
      {
        type: "source-url",
        sourceId: "s1",
        url: "https://react.dev/reference/react/Fragment",
        title: "React Fragment",
      },
      {
        type: "source-document",
        sourceId: "s2",
        mediaType: "application/pdf",
        title: "Design system whitepaper",
      },
    ],
  };
  return <ChatMessage message={msg} />;
};

export const AssistantWithActions: Story = () => {
  const msg: UIMessage = {
    id: "8",
    role: "assistant",
    parts: [{ type: "text", text: "Esta é uma resposta com ações no rodapé." }],
  };
  return (
    <ChatMessage
      message={msg}
      actions={
        <ChatMessageToolbar>
          <ChatMessageActions>
            <ChatMessageAction tooltip="Copy" label="Copy">
              <CopyIcon className="size-3.5" aria-hidden="true" />
            </ChatMessageAction>
            <ChatMessageAction tooltip="Regenerate" label="Regenerate">
              <RefreshCcwIcon className="size-3.5" aria-hidden="true" />
            </ChatMessageAction>
            <ChatMessageAction tooltip="Good response" label="Thumbs up">
              <ThumbsUpIcon className="size-3.5" aria-hidden="true" />
            </ChatMessageAction>
            <ChatMessageAction tooltip="Bad response" label="Thumbs down">
              <ThumbsDownIcon className="size-3.5" aria-hidden="true" />
            </ChatMessageAction>
          </ChatMessageActions>
        </ChatMessageToolbar>
      }
    />
  );
};

export const ComposableWithBranching: Story = () => (
  <ChatMessageBranch>
    <ChatMessageBranchContent>
      <ChatMessageResponse text="Versão **1** da resposta: vou usar React state." />
      <ChatMessageResponse text="Versão **2** da resposta: vou usar Zustand para state global." />
      <ChatMessageResponse text="Versão **3** da resposta: server components + React Query." />
    </ChatMessageBranchContent>
    <ChatMessageBranchSelector>
      <ChatMessageBranchPrevious />
      <ChatMessageBranchPage />
      <ChatMessageBranchNext />
    </ChatMessageBranchSelector>
  </ChatMessageBranch>
);

export const SystemMessage: Story = () => {
  const msg: UIMessage = {
    id: "9",
    role: "system",
    parts: [{ type: "text", text: "Você é um assistente especializado em TypeScript." }],
  };
  return <ChatMessage message={msg} />;
};

export const StreamingText: Story = () => {
  const msg: UIMessage = {
    id: "10",
    role: "assistant",
    parts: [
      {
        type: "text",
        state: "streaming",
        // Intentionally unclosed `**bold` and `` `code `` to show streaming-safe preprocess
        text: "Estou pensando aqui... Vou explicar **com detalhe e exemplos em `tsx",
      },
    ],
  };
  return <ChatMessage message={msg} />;
};
