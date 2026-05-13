import type { Story } from "@ladle/react";
import { BookOpen, Code2, Folder, Lightbulb, Palette, Search, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { ChatComposer } from "../components/chat-composer/chat-composer.js";
import { FolderSelector } from "../components/folder-selector/folder-selector.js";
import { ModelSelector } from "../components/model-selector/model-selector.js";
import { QuickActionChips } from "../components/quick-action-chips/quick-action-chips.js";
import { Sidebar } from "../components/sidebar/sidebar.js";
import { StepsRail } from "../components/steps-rail/steps-rail.js";
import { TopNav } from "../components/topnav/topnav.js";

/**
 * Cowork Home — composição matching referencia/stitch/cowork_home_theo_style.
 *
 * Layout: TopNav + Sidebar + Hero center (greeting + composer with folder)
 * + Right StepsRail (1..5).
 */
export default { title: "Screens / Cowork Home" };

export const Default: Story = () => {
  const [mode, setMode] = useState("cowork");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("sonnet-4-6");
  const path = "C:\\Users\\AlfredoAraujo\\Downloads\\capturas";
  return (
    <div className="-m-12 flex h-[820px] overflow-hidden bg-background bg-dotted-violet">
      <Sidebar className="h-full">
        <Sidebar.Header>
          <span className="grid size-8 place-items-center rounded-lg bg-primary font-black font-display text-primary-foreground">
            T
          </span>
          <span className="font-display text-title-md">theo</span>
        </Sidebar.Header>
        <Sidebar.Section title="Cowork">
          <Sidebar.Item icon={Sparkles} active>
            Nova tarefa
          </Sidebar.Item>
          <Sidebar.Item icon={Search}>Procurar</Sidebar.Item>
          <Sidebar.Item icon={Lightbulb}>Ideias</Sidebar.Item>
        </Sidebar.Section>
        <Sidebar.Section title="Recentes">
          <Sidebar.Item icon={Folder}>Organize computer screenshots</Sidebar.Item>
          <Sidebar.Item icon={Folder}>Organize page screenshots into sub-folders</Sidebar.Item>
        </Sidebar.Section>
        <Sidebar.Footer>
          <p className="mb-3 text-body-sm text-muted-foreground">
            Essas tarefas são executadas localmente e não são sincronizadas entre dispositivos.
          </p>
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-accent font-bold text-accent-foreground text-label-caps">
              AA
            </span>
            <div className="grid">
              <span className="font-medium text-body-sm">Alfredo Araujo</span>
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
                { value: "cowork", label: "Cowork" },
                { value: "code", label: "Código" },
              ]}
            />
          </TopNav.Center>
          <TopNav.Right />
        </TopNav>
        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6">
          <header className="grid gap-3 text-center">
            <span className="font-mono text-label-caps text-primary uppercase tracking-wider">
              cowork · local-first
            </span>
            <h1 className="text-balance font-display text-display-xl tracking-tight">
              Vamos riscar algo da sua <span className="text-accent">lista</span>.
            </h1>
            <p className="mx-auto max-w-md text-body-md text-muted-foreground">
              Suas ações são processadas localmente. O Theo nunca lê nem grava sem sua permissão.
            </p>
          </header>
          <ChatComposer
            mode="cowork"
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={(v) => console.log("submit", v)}
            contextSlot={<FolderSelector path={path} className="w-full" />}
            trailingActions={
              <ModelSelector
                value={model}
                onChange={setModel}
                options={[
                  { id: "opus-4-7", label: "Opus 4.7", tag: "smart" },
                  { id: "sonnet-4-6", label: "Sonnet 4.6", tag: "default" },
                ]}
              />
            }
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
      <StepsRail
        title="Steps"
        steps={[
          { id: 1, state: "current" },
          { id: 2, state: "pending" },
          { id: 3, state: "pending" },
          { id: 4, state: "pending" },
          { id: 5, state: "pending" },
        ]}
      />
    </div>
  );
};
