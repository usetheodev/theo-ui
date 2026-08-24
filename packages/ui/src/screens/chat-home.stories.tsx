import type { Story } from "@ladle/react";
import { Sidebar } from "@usetheo/ui";
import { TopNav } from "@usetheo/ui";
import { BookOpen, Code2, Palette, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { ChatComposer } from "../components/composites/chat-composer/chat-composer.js";
import { ModelSelector } from "../components/primitives/model-selector/model-selector.js";
import { QuickActionChips } from "../components/primitives/quick-action-chips/quick-action-chips.js";

/**
 * Chat Home — composição.
 *
 * Layout: TopNav (ModeSwitcher) + Sidebar (conversations) + Hero (greeting +
 * large composer + QuickActionChips).
 */
export default { title: "Screens / Chat Home" };

const recentConversations = [
  "Identificar conteúdo de vídeo",
  "Gerar nota fiscal mais realista",
  "NFs pdf de vendas",
  "Estruturar dados de OCR de notas",
  "Cachorro no parque",
  "Comparativo de IAs: ChatGPT, Gemini, Claude",
  "Contagem de linhas da planilha",
  "Descoberta do Brasil",
  "Base de dados de vendas",
  "Fictional cash flow export to Excel",
];

const models = [
  { id: "opus-4-7", label: "Opus 4.7", vendor: "Anthropic", tag: "smart" },
  { id: "sonnet-4-6", label: "Sonnet 4.6", vendor: "Anthropic", tag: "default" },
  { id: "haiku-4-5", label: "Haiku 4.5", vendor: "Anthropic", tag: "fast" },
  { id: "gpt-5-4", label: "GPT 5.4", vendor: "OpenAI" },
];

export const Default: Story = () => {
  const [mode, setMode] = useState("chat");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("sonnet-4-6");
  return (
    <div className="-m-12 flex h-[820px] overflow-hidden bg-background bg-dotted-violet">
      <Sidebar className="h-full">
        <Sidebar.Header>
          <span className="grid size-8 place-items-center rounded-lg bg-primary font-black font-display text-primary-foreground">
            T
          </span>
          <span className="font-display text-title-md">theo</span>
        </Sidebar.Header>
        <Sidebar.Section title="Workspace">
          <Sidebar.Item icon={Sparkles} active>
            Novo bate-papo
          </Sidebar.Item>
          <Sidebar.Item icon={BookOpen}>Procurar</Sidebar.Item>
        </Sidebar.Section>
        <Sidebar.Section title="Library">
          <Sidebar.Item>Conversas</Sidebar.Item>
          <Sidebar.Item>Projetos</Sidebar.Item>
          <Sidebar.Item>Artefatos</Sidebar.Item>
        </Sidebar.Section>
        <Sidebar.Section title="Recentes">
          {recentConversations.map((c) => (
            <Sidebar.Item key={c}>{c}</Sidebar.Item>
          ))}
        </Sidebar.Section>
        <Sidebar.Footer>
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-accent font-bold text-accent-foreground text-label-caps">
              AA
            </span>
            <div className="grid">
              <span className="font-medium text-body-sm">Jane Doe</span>
              <span className="font-mono text-label text-muted-foreground">Plano Pro</span>
            </div>
          </div>
        </Sidebar.Footer>
      </Sidebar>

      <main className="flex flex-1 flex-col bg-hero-glow">
        <TopNav>
          <TopNav.Left />
          <TopNav.Center>
            <TopNav.ModeSwitcher
              value={mode}
              onChange={setMode}
              options={[
                { value: "chat", label: "Chat" },
                { value: "infra", label: "Infra" },
                { value: "code", label: "Code" },
              ]}
            />
          </TopNav.Center>
          <TopNav.Right />
        </TopNav>
        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6">
          <header className="grid gap-3 text-center">
            <span className="font-mono text-label-caps text-primary uppercase tracking-wider">
              @theokit · welcome back
            </span>
            <h1 className="text-balance font-display text-display-xl tracking-tight">
              De volta ao trabalho, <span className="text-accent">Jane</span>?
            </h1>
          </header>
          <ChatComposer
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={(v) => console.log("submit", v)}
            trailingActions={<ModelSelector value={model} onChange={setModel} options={models} />}
          />
          <QuickActionChips
            actions={[
              { id: "write", label: "Escrever", icon: BookOpen },
              { id: "learn", label: "Aprender", icon: BookOpen },
              { id: "code", label: "Código", icon: Code2 },
              { id: "design", label: "Design", icon: Palette },
              { id: "personal", label: "Assuntos pessoais", icon: User },
              { id: "auto", label: "Escolha do Theo", icon: Sparkles, primary: true },
            ]}
          />
        </section>
      </main>
    </div>
  );
};
