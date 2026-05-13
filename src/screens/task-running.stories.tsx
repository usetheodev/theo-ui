import type { Story } from "@ladle/react";
import { Folder, Search, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/button/button.js";
import { ChatComposer } from "../components/chat-composer/chat-composer.js";
import { ChatMessage } from "../components/chat-message/chat-message.js";
import { ChatThread } from "../components/chat-thread/chat-thread.js";
import { ContextCard } from "../components/context-card/context-card.js";
import { FolderContextCard } from "../components/folder-context-card/folder-context-card.js";
import { ProgressChecklist } from "../components/progress-checklist/progress-checklist.js";
import { Sidebar } from "../components/sidebar/sidebar.js";
import { TaskHeader } from "../components/task-header/task-header.js";
import { ToolCall } from "../components/tool-call/tool-call.js";
import { ToolResult } from "../components/tool-result/tool-result.js";
import { TopNav } from "../components/topnav/topnav.js";

export default { title: "Screens / Task Running" };

export const Default: Story = () => {
  const [mode, setMode] = useState("cowork");
  const [prompt, setPrompt] = useState("");
  return (
    <div className="-m-12 flex h-[820px] overflow-hidden bg-background">
      <Sidebar className="h-full">
        <Sidebar.Header>
          <span className="grid size-8 place-items-center rounded-lg bg-primary font-black font-display text-primary-foreground">
            T
          </span>
          <span className="font-display text-title-md">theo</span>
        </Sidebar.Header>
        <Sidebar.Section>
          <Sidebar.Item icon={Sparkles}>+ Nova tarefa</Sidebar.Item>
          <Sidebar.Item icon={Search}>Procurar</Sidebar.Item>
        </Sidebar.Section>
        <Sidebar.Section title="Recentes">
          <Sidebar.Item active>Organize as capturas…</Sidebar.Item>
          <Sidebar.Item>Identificar conteúdo de…</Sidebar.Item>
        </Sidebar.Section>
        <Sidebar.Footer>
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-accent font-bold text-accent-foreground text-label-caps">
              AA
            </span>
            <span className="font-medium text-body-sm">Alfredo Araujo</span>
          </div>
        </Sidebar.Footer>
      </Sidebar>

      <main className="flex flex-1 flex-col">
        <TopNav>
          <TopNav.Left />
          <TopNav.Center>
            <TopNav.ModeSwitcher
              value={mode}
              onChange={setMode}
              options={[
                { value: "chat", label: "Chat" },
                { value: "cowork", label: "Cowork" },
                { value: "code", label: "Código" },
              ]}
            />
          </TopNav.Center>
          <TopNav.Right />
        </TopNav>

        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
          <TaskHeader
            title="Organize as capturas de tela do meu computador em pastas por projeto e data."
            status="running"
            onToggle={() => undefined}
            actions={
              <Button size="icon" variant="ghost" aria-label="Close">
                <X />
              </Button>
            }
          />
          <ChatThread>
            <ChatMessage
              message={{
                id: "u1",
                role: "user",
                content:
                  "Organize a pasta capturas do meu computador. Nela há diversos prints, imagens. Eu quero que você divida esses prints em sub-pastas de acordo com seu conteúdo.",
              }}
            />
            <ToolCall
              name="bash"
              summary="Executou 2 comandos"
              detail={
                <ToolResult variant="code">
                  $ ls -la ~/Downloads/capturas{"\n"}$ identify ~/Downloads/capturas/*.png
                </ToolResult>
              }
            />
            <ChatMessage
              message={{
                id: "a1",
                role: "assistant",
                model: "Sonnet 4.6",
                content: "São 18 imagens! Vou analisar o conteúdo de cada uma e categorizar.",
              }}
            />
            <ToolCall name="read_file" summary="Leu 18 arquivos" />
            <ChatMessage
              message={{
                id: "a2",
                role: "assistant",
                model: "Sonnet 4.6",
                content: (
                  <div className="grid gap-2">
                    <p>Analisei todas as 18 imagens! Vou organizá-las nas seguintes subpastas:</p>
                    <ul className="ml-4 list-disc text-body-sm">
                      <li>
                        <strong>Dashboards-Hashbot</strong> — 4 prints
                      </li>
                      <li>
                        <strong>Videos-YouTube-Copilot</strong> — 4 thumbnails
                      </li>
                      <li>
                        <strong>Plataforma-de-Cursos</strong> — 3 prints
                      </li>
                      <li>
                        <strong>Noticias-IA</strong> — 6 notícias
                      </li>
                      <li>
                        <strong>Outros</strong> — 1 print
                      </li>
                    </ul>
                  </div>
                ),
              }}
            />
          </ChatThread>
          <ChatComposer
            mode="cowork"
            value={prompt}
            onValueChange={setPrompt}
            running
            onStop={() => undefined}
          />
        </section>
      </main>

      <aside className="grid w-80 gap-4 border-border/40 border-l bg-card p-4">
        <ProgressChecklist
          title="Progresso"
          steps={[
            { id: "1", label: "Criar subpastas na pasta capturas", status: "done" },
            {
              id: "2",
              label: "Mover imagens para subpastas corretas",
              status: "running",
              progress: 0.4,
            },
            { id: "3", label: "Verificar resultado final", status: "pending" },
          ]}
        />
        <FolderContextCard
          title="capturas"
          entries={[
            {
              id: "folder",
              name: "capturas",
              kind: "folder",
              open: true,
              children: [
                { id: "claude", name: "Instruções · CLAUDE.md", kind: "file" },
                { id: "draft", name: "Rascunho", kind: "folder" },
              ],
            },
          ]}
        />
        <ContextCard
          title="Contexto"
          description="Acompanhe ferramentas e arquivos referenciados usados nesta tarefa."
          icon={Folder}
        />
      </aside>
    </div>
  );
};
