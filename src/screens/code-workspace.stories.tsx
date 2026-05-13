import type { Story } from "@ladle/react";
import { GitBranch } from "lucide-react";
import { useState } from "react";
import { AgentTimeline } from "../components/composites/agent-timeline/agent-timeline.js";
import { ChatComposer } from "../components/composites/chat-composer/chat-composer.js";
import { PreviewPanel } from "../components/composites/preview-panel/preview-panel.js";
import { Button } from "../components/primitives/button/button.js";
import { DiffViewer } from "../components/primitives/diff-viewer/diff-viewer.js";
import { ModelSelector } from "../components/primitives/model-selector/model-selector.js";
import { RunStats } from "../components/primitives/run-stats/run-stats.js";
import { RunningTasksPanel } from "../components/primitives/running-tasks-panel/running-tasks-panel.js";
import { Sidebar } from "../components/primitives/sidebar/sidebar.js";
import { TerminalPanel } from "../components/primitives/terminal-panel/terminal-panel.js";
import { TopNav } from "../components/primitives/topnav/topnav.js";
import type { AgentEvent } from "../types/agent.js";

export default { title: "Screens / Code Workspace" };

const events: AgentEvent[] = [
  {
    id: "1",
    type: "command",
    label: "Start dev server",
    status: "success",
    timestamp: "9:58:14 PM",
  },
  {
    id: "2",
    type: "file_write",
    label: "Write src/components/PanelGrid.tsx",
    path: "src/components/PanelGrid.tsx",
    diff: { added: 62, removed: 0 },
    status: "success",
    timestamp: "9:58:24 PM",
  },
  {
    id: "3",
    type: "edit",
    label: "Edit AlignmentGrid.tsx",
    path: "src/components/AlignmentGrid.tsx",
    diff: { added: 142, removed: 38 },
    status: "success",
    timestamp: "9:58:42 PM",
  },
  { id: "4", type: "lint", label: "Lint", status: "success" },
  { id: "5", type: "typecheck", label: "Typecheck", status: "success" },
  { id: "6", type: "build", label: "Build", status: "running" },
];

export const Default: Story = () => {
  const [mode, setMode] = useState("code");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("opus-4-7");
  return (
    <div className="dark -m-12 flex h-[820px] overflow-hidden bg-background">
      <Sidebar className="h-full">
        <Sidebar.Header>
          <span className="grid size-8 place-items-center rounded-lg bg-primary font-black font-display text-primary-foreground">
            T
          </span>
          <div className="grid">
            <span className="font-display text-title-md leading-none">acme-web</span>
            <span className="font-mono text-label text-muted-foreground">
              claude/alignment-grid
            </span>
          </div>
        </Sidebar.Header>
        <Sidebar.Section title="Sessions">
          <Sidebar.Item active>Build the alignment grid demo</Sidebar.Item>
          <Sidebar.Item>Integrate API client with retries</Sidebar.Item>
          <Sidebar.Item>Race condition in upload queue</Sidebar.Item>
          <Sidebar.Item>Add keyboard shortcuts to command palette</Sidebar.Item>
        </Sidebar.Section>
        <Sidebar.Footer>
          <span className="font-mono text-label text-muted-foreground">Settings</span>
        </Sidebar.Footer>
      </Sidebar>

      <main className="flex flex-1 flex-col">
        <TopNav>
          <TopNav.Left>
            <TopNav.Breadcrumbs
              items={[{ label: "acme-web", href: "#" }, { label: "Build the alignment grid demo" }]}
            />
          </TopNav.Left>
          <TopNav.Center>
            <TopNav.ModeSwitcher
              value={mode}
              onChange={setMode}
              options={[
                { value: "chat", label: "Chat" },
                { value: "cowork", label: "Cowork" },
                { value: "code", label: "Code" },
              ]}
            />
          </TopNav.Center>
          <TopNav.Right>
            <Button size="sm" variant="secondary">
              <GitBranch /> main ← claude/alignment-grid
            </Button>
            <Button size="sm">Create PR</Button>
          </TopNav.Right>
        </TopNav>

        <div className="grid flex-1 grid-cols-[1fr_1fr] gap-0 overflow-hidden">
          {/* Left: agent timeline + composer */}
          <section className="flex flex-col gap-4 overflow-y-auto border-border/40 border-r px-4 py-4">
            <AgentTimeline events={events} />
            <RunStats duration="24s" tokens="35.7k" filesChanged={3} />
            <ChatComposer
              mode="code"
              value={prompt}
              onValueChange={setPrompt}
              onSubmit={() => undefined}
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
          </section>

          {/* Right: workbench */}
          <section className="grid grid-rows-[1fr_1fr_auto] gap-2 overflow-hidden p-2">
            <PreviewPanel
              url="http://localhost:5173/"
              onUrlChange={() => undefined}
              onReload={() => undefined}
              content={
                <div className="grid h-full place-items-center bg-muted/30 font-mono text-muted-foreground">
                  [preview iframe slot]
                </div>
              }
            />
            <DiffViewer
              path="src/components/AlignmentGrid.tsx"
              stats={{ added: 85, removed: 12 }}
              hunks={[
                {
                  id: "h1",
                  header: "@@ -424,5 +424,5 @@",
                  lines: [
                    { kind: "removed", oldNumber: 424, content: "<select stiffness={0.8}" },
                    { kind: "added", newNumber: 424, content: "<select snap={true}" },
                    { kind: "added", newNumber: 425, content: "  bounce={false}" },
                    {
                      kind: "unchanged",
                      oldNumber: 426,
                      newNumber: 426,
                      content: "  align='center'",
                    },
                  ],
                },
                {
                  id: "h2",
                  collapsed: true,
                  lines: new Array(38).fill({ kind: "unchanged" }) as never,
                },
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <TerminalPanel
                lines={[
                  { id: "1", kind: "command", content: "tsc --noEmit" },
                  {
                    id: "2",
                    kind: "stderr",
                    content: "AlignmentGrid.tsx(424,41): Property 'stiffness' is missing…",
                  },
                  { id: "3", kind: "ok", content: "[vite] error resolved" },
                ]}
              />
              <RunningTasksPanel
                tasks={[
                  {
                    id: "1",
                    source: "agent",
                    label: "Verify constraint solver convergence",
                    status: "running",
                  },
                  { id: "2", source: "bash", label: "npm run dev (background)", status: "running" },
                  { id: "3", source: "bash", label: "npx tsc --noEmit", status: "completed" },
                ]}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
