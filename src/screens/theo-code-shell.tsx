import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { DeploymentRow } from "@usetheo/ui";
import { DomainConfig } from "@usetheo/ui";
import { EnvVarEditor } from "@usetheo/ui";
import { RollbackUI } from "@usetheo/ui";
import { Button } from "@usetheo/ui";
import { MetricsPanel } from "@usetheo/ui";
import { Sheet } from "@usetheo/ui";
import { Sidebar } from "@usetheo/ui";
import { TopNav } from "@usetheo/ui";
import {
  Bot,
  Check,
  Cog,
  Eye,
  GitBranch,
  Layers,
  ListChecks,
  Moon,
  Palette,
  Pencil,
  PlusCircle,
  RotateCcw,
  ScrollText,
  Sparkles,
  Sun,
  ThumbsUp,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AgentComposer } from "../components/composites/agent-composer/agent-composer.js";
import {
  type AgentDraft,
  AgentEditor,
} from "../components/composites/agent-editor/agent-editor.js";
import { AgentStream } from "../components/composites/agent-stream/agent-stream.js";
import { ChatMessage } from "../components/composites/chat-message/chat-message.js";
import { RuleEditor } from "../components/composites/rule-editor/rule-editor.js";
import { SkillEditor } from "../components/composites/skill-editor/skill-editor.js";
import { AgentProfile } from "../components/primitives/agent-profile/agent-profile.js";
import { AuditLogEntry } from "../components/primitives/audit-log-entry/audit-log-entry.js";
import { BuildLogStream } from "../components/primitives/build-log-stream/build-log-stream.js";
import { ChatThread } from "../components/primitives/chat-thread/chat-thread.js";
import { ContextWindowBar } from "../components/primitives/context-window-bar/context-window-bar.js";
import { DiffViewer } from "../components/primitives/diff-viewer/diff-viewer.js";
import { IntentSelector } from "../components/primitives/intent-selector/intent-selector.js";
import { LaneBoard } from "../components/primitives/lane-board/lane-board.js";
import { ModelSelector } from "../components/primitives/model-selector/model-selector.js";
import { ProjectSwitcher } from "../components/primitives/project-switcher/project-switcher.js";
import { RuleCard } from "../components/primitives/rule-card/rule-card.js";
import { RunStats } from "../components/primitives/run-stats/run-stats.js";
import { SessionListItem } from "../components/primitives/session-list-item/session-list-item.js";
import { type Skill, SkillCard } from "../components/primitives/skill-card/skill-card.js";
import { SystemPromptEditor } from "../components/primitives/system-prompt-editor/system-prompt-editor.js";
import { TokenUsageChart } from "../components/primitives/token-usage-chart/token-usage-chart.js";
import { cn } from "../lib/cn.js";
import { useTheme } from "../themes/theme-provider.js";
import { MODE_LABEL, type Mode } from "../types/mode.js";
import type { Rule } from "../types/rule.js";

/**
 * TheoCodeShell — the canonical reference shell for the desktop app.
 *
 * Single composed component containing the full app chrome (Sidebar + TopNav
 * + mode-aware main pane + workspace overlay Sheets). The ModeSwitcher in
 * TopNav.Center swaps the main pane composition between chat/code/infra
 * without unmounting the sidebar or topnav. Mode = view-state of the active
 * session.
 *
 * The component is mock-data only (sessions/messages/events are local
 * constants below). Port target: theo-code/apps/theo-ui — wire the same
 * structure to real Tauri commands.
 */

type Intent = "edit" | "plan" | "review";

// Mock data + non-exported helper types live in a sibling module so the main
// composition file stays under ~1300 LoC. The screen itself is a Ladle story
// (not part of the public API), so this internal split has zero impact on
// consumers — `import { TheoCodeShell }` continues to work from outside.
import {
  AGENTS_LIB,
  AGENT_EVENTS,
  AUDIT_LIB,
  CODE_STREAM,
  DEFAULT_SYSTEM_PROMPT,
  DOMAINS_LIB,
  ENVIRONMENTS_LIB,
  FILE_CHANGES,
  FILE_MENTIONS,
  INFRA_LOGS,
  INFRA_MESSAGES,
  INTENTS,
  MEMORY_MENTIONS,
  MESSAGES,
  MODELS,
  RECENT_DEPLOYS,
  ROLLBACK_HISTORY,
  RULES_LIB,
  SECRETS_LIB,
  SESSIONS,
  SKILLS_LIB,
  SLASH_COMMANDS,
  TOOL_PILL,
  WORKSPACE_BY_MODE,
  type WorkspaceItemId,
} from "./theo-code-shell.data.js";

interface TheoCodeShellProps {
  /** Override the outer wrapper className. Default fills the parent box. */
  className?: string;
  /** Initial mode. Default "code". */
  initialMode?: Mode;
}

export function TheoCodeShell({ className, initialMode = "code" }: TheoCodeShellProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [intent, setIntent] = useState<Intent>("edit");
  const [activeSessionId, setActiveSessionId] = useState("s1");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("opus-4-7");
  const [openPanel, setOpenPanel] = useState<
    null | WorkspaceItemId | "settings" | "system-prompt" | "skills" | "agents" | "rules"
  >(null);

  const activeSession = useMemo(
    () => SESSIONS.find((s) => s.id === activeSessionId) ?? SESSIONS[0],
    [activeSessionId],
  );
  if (!activeSession) return null;

  return (
    <div className={cn("flex h-full overflow-hidden bg-background text-foreground", className)}>
      {/* ───────── SIDEBAR ───────── */}
      <Sidebar className="h-full">
        <Sidebar.Header className="p-0">
          <ProjectSwitcher
            workspace="acme-web"
            branch="claude/alignment-grid"
            status="running"
            onClick={() => undefined}
          />
        </Sidebar.Header>

        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Mode context badge — shows what's being filtered */}
          <div className="flex items-center gap-2 px-5 py-2 font-mono text-label text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            Filtering by <span className="font-medium text-foreground">{MODE_LABEL[mode]}</span>
          </div>
          <Sidebar.Section title={`${MODE_LABEL[mode]} sessions`}>
            <button
              type="button"
              className="mb-1 flex items-center gap-2 rounded-md px-2 py-2 text-left text-body-sm text-primary hover:bg-primary/10"
            >
              <PlusCircle className="size-4" /> New session
            </button>
            {SESSIONS.filter((s) => s.mode === mode).length === 0 ? (
              <p className="px-2 py-2 text-body-sm text-muted-foreground">
                No {MODE_LABEL[mode].toLowerCase()} sessions yet.
              </p>
            ) : null}
            {SESSIONS.filter((s) => s.mode === mode).map((s) => (
              <SessionListItem
                key={s.id}
                title={s.title}
                status={s.status}
                mode={s.mode}
                timestamp={s.timestamp}
                unread={s.unread}
                active={s.id === activeSessionId}
                onClick={() => setActiveSessionId(s.id)}
              />
            ))}
          </Sidebar.Section>

          <Sidebar.Section title={`${MODE_LABEL[mode]} workspace`}>
            {WORKSPACE_BY_MODE[mode].map((w) => (
              <Sidebar.Item key={w.id} icon={w.icon} onClick={() => setOpenPanel(w.id)}>
                {w.label}
              </Sidebar.Item>
            ))}
          </Sidebar.Section>

          <Sidebar.Section title="Customize">
            <Sidebar.Item icon={ScrollText} onClick={() => setOpenPanel("system-prompt")}>
              System Prompt
            </Sidebar.Item>
            <Sidebar.Item icon={Sparkles} onClick={() => setOpenPanel("skills")}>
              Skills
            </Sidebar.Item>
            <Sidebar.Item icon={Bot} onClick={() => setOpenPanel("agents")}>
              Agents
            </Sidebar.Item>
            <Sidebar.Item icon={ListChecks} onClick={() => setOpenPanel("rules")}>
              Rules
            </Sidebar.Item>
          </Sidebar.Section>
        </div>

        <Sidebar.Footer className="grid gap-3">
          <div className="flex items-center gap-3">
            <span
              className="grid size-8 place-items-center rounded-full bg-accent font-bold text-accent-foreground text-label-caps"
              aria-hidden="true"
            >
              AA
            </span>
            <div className="grid">
              <span className="font-medium text-body-sm">Alfredo Araujo</span>
              <span className="font-mono text-label text-muted-foreground">Plano Pro</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <ThemeIconPicker />
              <DarkModeToggle />
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOpenPanel("settings")}
              aria-label="Open settings"
            >
              <Cog className="size-4" />
            </Button>
          </div>
        </Sidebar.Footer>
      </Sidebar>

      {/* ───────── MAIN COLUMN ───────── */}
      <main className="flex min-w-0 flex-1 flex-col">
        <TopNav>
          <TopNav.Left>
            <TopNav.Breadcrumbs
              items={[{ label: "acme-web", href: "#" }, { label: activeSession.title }]}
            />
          </TopNav.Left>
          <TopNav.Center>
            <TopNav.ModeSwitcher
              value={mode}
              onChange={(v) => setMode(v as Mode)}
              options={[
                { value: "chat", label: "Chat" },
                { value: "code", label: "Code" },
                { value: "infra", label: "Infra" },
              ]}
            />
          </TopNav.Center>
          <TopNav.Right>
            <Button size="sm" variant="secondary">
              <GitBranch className="size-4" /> main ← claude/alignment-grid
            </Button>
          </TopNav.Right>
        </TopNav>

        {mode === "chat" && (
          <ChatMode
            prompt={prompt}
            setPrompt={setPrompt}
            intent={intent}
            setIntent={setIntent}
            model={model}
            setModel={setModel}
          />
        )}
        {mode === "code" && (
          <CodeMode
            prompt={prompt}
            setPrompt={setPrompt}
            intent={intent}
            setIntent={setIntent}
            model={model}
            setModel={setModel}
          />
        )}
        {mode === "infra" && (
          <InfraMode
            prompt={prompt}
            setPrompt={setPrompt}
            intent={intent}
            setIntent={setIntent}
            model={model}
            setModel={setModel}
          />
        )}
      </main>

      {/* ───────── OVERLAY SHEETS ───────── */}
      <Sheet open={openPanel === "memory"} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <Sheet.Content side="right" className="w-[480px] max-w-none">
          <Sheet.Header>
            <Sheet.Title>Memory</Sheet.Title>
            <Sheet.Description>
              Durable knowledge the agent has accumulated about this workspace.
            </Sheet.Description>
          </Sheet.Header>
          <Sheet.Body className="grid gap-4">
            <TokenUsageChart
              points={[
                { label: "Mon", input: 120_000, output: 32_000 },
                { label: "Tue", input: 84_000, output: 18_000 },
                { label: "Wed", input: 192_000, output: 56_000 },
                { label: "Thu", input: 142_000, output: 41_000 },
                { label: "Fri", input: 220_000, output: 72_000 },
              ]}
            />
            <div className="grid gap-2">
              <p className="font-display text-title-md">Recent episodes</p>
              <AuditLogEntry
                entry={{
                  id: "a1",
                  actor: { kind: "agent", name: "Theo" },
                  action: "store_memory",
                  target: "alignment-grid uses snap, not stiffness",
                  timestamp: "9:59 PM",
                }}
              />
              <AuditLogEntry
                entry={{
                  id: "a2",
                  actor: { kind: "agent", name: "Theo" },
                  action: "recall_memory",
                  target: "3 hits for query 'alignment grid'",
                  timestamp: "9:58 PM",
                }}
              />
            </div>
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>

      <Sheet open={openPanel === "observability"} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <Sheet.Content side="right" className="w-[520px] max-w-none">
          <Sheet.Header>
            <Sheet.Title>Observability</Sheet.Title>
            <Sheet.Description>Live agent runs, trajectories, metrics.</Sheet.Description>
          </Sheet.Header>
          <Sheet.Body className="grid gap-2">
            {AGENT_EVENTS.map((e) => (
              <AuditLogEntry
                key={e.id}
                entry={{
                  id: e.id,
                  actor: { kind: "agent", name: "Theo" },
                  action: e.type,
                  target: e.label,
                  timestamp: e.timestamp ?? "",
                }}
              />
            ))}
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>

      <Sheet open={openPanel === "subagents"} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <Sheet.Content side="right" className="w-[640px] max-w-none">
          <Sheet.Header>
            <Sheet.Title>Sub-agents</Sheet.Title>
            <Sheet.Description>Parallel agent fan-out for this session.</Sheet.Description>
          </Sheet.Header>
          <Sheet.Body>
            <LaneBoard
              lanes={[
                {
                  state: "started",
                  cards: [
                    {
                      id: "t2",
                      title: "Audit alignment APIs",
                      description: "Find every call site that passes stiffness.",
                    },
                  ],
                },
                {
                  state: "blocked",
                  cards: [
                    {
                      id: "t3",
                      title: "Refactor select primitive",
                      description: "Waiting on approval for breaking change.",
                    },
                  ],
                },
                {
                  state: "finished",
                  cards: [{ id: "t1", title: "Find call sites of stiffness" }],
                },
              ]}
            />
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>

      {/* ───────── CUSTOMIZE SHEETS ───────── */}
      <SystemPromptSheet
        open={openPanel === "system-prompt"}
        onClose={() => setOpenPanel(null)}
        currentMode={mode}
      />
      <SkillsSheet
        open={openPanel === "skills"}
        onClose={() => setOpenPanel(null)}
        currentMode={mode}
      />
      <AgentsSheet
        open={openPanel === "agents"}
        onClose={() => setOpenPanel(null)}
        currentMode={mode}
      />
      <RulesSheet
        open={openPanel === "rules"}
        onClose={() => setOpenPanel(null)}
        currentMode={mode}
      />

      {/* ───────── INFRA WORKSPACE SHEETS ───────── */}
      <Sheet open={openPanel === "deployments"} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <Sheet.Content side="right" className="w-[680px] max-w-none">
          <Sheet.Header>
            <Sheet.Title>Deployments</Sheet.Title>
            <Sheet.Description>
              Recent deploys across all environments. Source: <code>GET /api/v1/deploys</code>.
            </Sheet.Description>
          </Sheet.Header>
          <Sheet.Body className="grid gap-2">
            {RECENT_DEPLOYS.map((d) => (
              <DeploymentRow key={d.id} deployment={d} />
            ))}
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>

      <Sheet open={openPanel === "builds"} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <Sheet.Content side="right" className="w-[760px] max-w-none">
          <Sheet.Header>
            <Sheet.Title>Builds</Sheet.Title>
            <Sheet.Description>
              Live build stream for the active deploy. Source:{" "}
              <code>GET /api/v1/builds/{"{id}"}/logs/stream</code>.
            </Sheet.Description>
          </Sheet.Header>
          <Sheet.Body>
            <BuildLogStream lines={INFRA_LOGS} filterable />
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>

      <Sheet open={openPanel === "environments"} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <Sheet.Content side="right" className="w-[560px] max-w-none">
          <Sheet.Header>
            <Sheet.Title>Environments</Sheet.Title>
            <Sheet.Description>
              Active environments per project. Source: <code>GET /api/v1/environments</code>.
            </Sheet.Description>
          </Sheet.Header>
          <Sheet.Body className="grid gap-2">
            {ENVIRONMENTS_LIB.map((e) => (
              <article
                key={e.name}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-card/40 p-3"
              >
                <div className="flex items-center gap-3">
                  <Layers className="size-4 text-muted-foreground" aria-hidden="true" />
                  <div className="grid">
                    <span className="font-medium font-mono text-body-sm uppercase tracking-wider">
                      {e.name}
                    </span>
                    <span className="font-mono text-label text-muted-foreground">
                      {e.projectCount} projects · {e.region}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex h-5 items-center rounded-md px-2 font-medium font-mono text-label tracking-tight",
                    e.status === "live"
                      ? "bg-success/15 text-success"
                      : "bg-warning/15 text-warning",
                  )}
                >
                  {e.status}
                </span>
              </article>
            ))}
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>

      <Sheet open={openPanel === "domains"} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <Sheet.Content side="right" className="w-[720px] max-w-none">
          <Sheet.Header>
            <Sheet.Title>Domains</Sheet.Title>
            <Sheet.Description>
              Custom domains + DNS verification. Source: <code>GET /api/v1/domains</code>.
            </Sheet.Description>
          </Sheet.Header>
          <Sheet.Body>
            <DomainConfig
              domains={DOMAINS_LIB}
              onAdd={() => undefined}
              onRemove={() => undefined}
              onSetPrimary={() => undefined}
            />
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>

      <Sheet open={openPanel === "secrets"} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <Sheet.Content side="right" className="w-[760px] max-w-none">
          <Sheet.Header>
            <Sheet.Title>Secrets</Sheet.Title>
            <Sheet.Description>
              Environment variables per scope. Source: <code>GET /api/v1/secrets</code>.
            </Sheet.Description>
          </Sheet.Header>
          <Sheet.Body>
            <EnvVarEditor vars={SECRETS_LIB} onAdd={() => undefined} onRemove={() => undefined} />
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>

      <Sheet open={openPanel === "audit"} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <Sheet.Content side="right" className="w-[640px] max-w-none">
          <Sheet.Header>
            <Sheet.Title>Audit log</Sheet.Title>
            <Sheet.Description>
              Privileged actions (rollback, secret writes, scale, evict). Source:{" "}
              <code>GET /api/v1/audit</code>.
            </Sheet.Description>
          </Sheet.Header>
          <Sheet.Body className="grid gap-2">
            {AUDIT_LIB.map((entry) => (
              <AuditLogEntry key={entry.id} entry={entry} />
            ))}
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>

      {/* ───────── CHAT WORKSPACE SHEET ───────── */}
      <Sheet open={openPanel === "conversations"} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <Sheet.Content side="right" className="w-[520px] max-w-none">
          <Sheet.Header>
            <Sheet.Title>Conversations</Sheet.Title>
            <Sheet.Description>Archived chats — restore or branch from any one.</Sheet.Description>
          </Sheet.Header>
          <Sheet.Body className="grid gap-2">
            {SESSIONS.filter((s) => s.mode === "chat").map((s) => (
              <article
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-card/40 p-3"
              >
                <div className="grid">
                  <span className="font-medium text-body-sm">{s.title}</span>
                  <span className="font-mono text-label text-muted-foreground">
                    {s.timestamp} · {s.status}
                  </span>
                </div>
                <Button size="sm" variant="ghost">
                  Open
                </Button>
              </article>
            ))}
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>

      {/* ───────── CODE WORKSPACE SHEET — Hooks ───────── */}
      <Sheet open={openPanel === "hooks"} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <Sheet.Content side="right" className="w-[560px] max-w-none">
          <Sheet.Header>
            <Sheet.Title>Hooks</Sheet.Title>
            <Sheet.Description>
              Pre/post-action hooks (pre-commit, post-edit, on-error, …).
            </Sheet.Description>
          </Sheet.Header>
          <Sheet.Body>
            <p className="text-body-sm text-muted-foreground">
              No hooks configured yet. Hooks let you run commands at specific points in the agent
              loop — e.g. <code>format on file_write</code>, <code>notify on error</code>.
            </p>
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>

      <Sheet open={openPanel === "settings"} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <Sheet.Content side="left" className="w-[420px] max-w-none">
          <Sheet.Header>
            <Sheet.Title>Settings</Sheet.Title>
            <Sheet.Description>Workspace, providers, theme, sandbox.</Sheet.Description>
          </Sheet.Header>
          <Sheet.Body>
            <p className="text-body-sm text-muted-foreground">
              Settings panels (project dir, auth providers, sandbox profile, model defaults) live
              here. Each section is a FormField group fed by Tauri commands.
            </p>
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>
    </div>
  );
}

// ───────────────────────── MODE PANES ─────────────────────────

interface ModeProps {
  prompt: string;
  setPrompt: (v: string) => void;
  intent: Intent;
  setIntent: (v: Intent) => void;
  model: string;
  setModel: (v: string) => void;
}

function ChatMode({ prompt, setPrompt, intent, setIntent, model, setModel }: ModeProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <ChatThread className="mx-auto max-w-3xl">
          {MESSAGES.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
        </ChatThread>
      </div>
      <div className="border-border/40 border-t px-6 py-3">
        <div className="mx-auto max-w-3xl">
          <AgentComposer
            mode="chat"
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={() => setPrompt("")}
            leadingActions={
              <IntentSelector
                value={intent}
                onChange={(v) => setIntent(v as Intent)}
                options={INTENTS}
              />
            }
            commands={SLASH_COMMANDS}
            files={FILE_MENTIONS}
            memories={MEMORY_MENTIONS}
            trailingActions={<ModelSelector value={model} onChange={setModel} options={MODELS} />}
          />
        </div>
      </div>
    </div>
  );
}

function InfraMode({ prompt, setPrompt, intent, setIntent, model, setModel }: ModeProps) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[1fr_1fr] overflow-hidden">
      {/* Left: agent interaction column */}
      <section className="flex min-w-0 flex-col overflow-hidden border-border/40 border-r">
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <ChatThread>
            {INFRA_MESSAGES.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
          </ChatThread>
        </div>
        <div className="grid gap-3 border-border/40 border-t px-4 py-3">
          <AgentComposer
            mode="infra"
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={() => setPrompt("")}
            leadingActions={
              <IntentSelector
                value={intent}
                onChange={(v) => setIntent(v as Intent)}
                options={INTENTS}
              />
            }
            commands={SLASH_COMMANDS}
            files={FILE_MENTIONS}
            memories={MEMORY_MENTIONS}
            trailingActions={<ModelSelector value={model} onChange={setModel} options={MODELS} />}
          />
        </div>
      </section>

      {/* Right: infra workbench — metrics, deployments, build logs, rollback */}
      <section className="flex min-w-0 flex-col gap-4 overflow-y-auto p-4">
        <MetricsPanel
          title="Live service · acme-web (prod)"
          description="Last 5 minutes"
          metrics={[
            { label: "Requests/s", value: "1.2", unit: "k" },
            { label: "p95 latency", value: "182", unit: "ms" },
            { label: "Error rate", value: "0.03", unit: "%" },
            { label: "CPU", value: "42", unit: "%" },
          ]}
          columns={4}
        />

        <div className="grid gap-2">
          <header className="flex items-baseline justify-between">
            <h3 className="font-display text-title-md tracking-tight">Recent deployments</h3>
            <button
              type="button"
              className="font-mono text-label text-muted-foreground hover:text-foreground"
            >
              View all →
            </button>
          </header>
          <div className="grid gap-2">
            {RECENT_DEPLOYS.map((d) => (
              <DeploymentRow key={d.id} deployment={d} />
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <header className="flex items-baseline justify-between">
            <h3 className="font-display text-title-md tracking-tight">Live build · main</h3>
            <span className="font-mono text-label text-success">deploying</span>
          </header>
          <BuildLogStream lines={INFRA_LOGS} />
        </div>

        <div className="grid gap-2">
          <h3 className="font-display text-title-md tracking-tight">Rollback target</h3>
          <RollbackUI history={ROLLBACK_HISTORY} onRollback={() => undefined} />
        </div>
      </section>
    </div>
  );
}

function CodeMode({ prompt, setPrompt, intent, setIntent, model, setModel }: ModeProps) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[1fr_1fr] overflow-hidden">
      {/* Left: agent interaction column — conversation stream + pinned composer */}
      <section className="flex min-w-0 flex-col overflow-hidden border-border/40 border-r">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <AgentStream items={CODE_STREAM} />
        </div>
        <div className="grid gap-3 border-border/40 border-t px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <RunStats duration="24s" tokens="35.7k" filesChanged={3} />
          </div>
          <ContextWindowBar compact used={156_400} total={200_000} label="Context · Opus 4.7" />
          <AgentComposer
            mode="code"
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={() => setPrompt("")}
            leadingActions={
              <IntentSelector
                value={intent}
                onChange={(v) => setIntent(v as Intent)}
                options={INTENTS}
              />
            }
            commands={SLASH_COMMANDS}
            files={FILE_MENTIONS}
            memories={MEMORY_MENTIONS}
            trailingActions={<ModelSelector value={model} onChange={setModel} options={MODELS} />}
          />
        </div>
      </section>

      {/* Right: diff feed — one card per file the agent touched */}
      <section className="flex min-w-0 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-border/40 border-b px-4 py-3">
          <div className="flex items-baseline gap-3">
            <h3 className="font-display text-title-md tracking-tight">Changes</h3>
            <span className="font-mono text-label text-muted-foreground tabular-nums">
              {FILE_CHANGES.length} files ·{" "}
              <span className="text-success">
                +{FILE_CHANGES.reduce((acc, f) => acc + f.stats.added, 0)}
              </span>{" "}
              <span className="text-destructive">
                −{FILE_CHANGES.reduce((acc, f) => acc + f.stats.removed, 0)}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost">
              Revert all
            </Button>
            <Button size="sm">
              <ThumbsUp className="size-3.5" /> Approve all
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {FILE_CHANGES.map((file) => (
            <div key={file.id} className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex h-5 w-fit items-center rounded-md px-2 font-medium font-mono text-label tracking-tight",
                    TOOL_PILL[file.tool],
                  )}
                >
                  {file.tool}
                </span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" aria-label="Explain this change">
                    <Eye className="size-3.5" /> Explain
                  </Button>
                  <Button size="sm" variant="ghost" aria-label="Revert this change">
                    <RotateCcw className="size-3.5" /> Revert
                  </Button>
                  <Button size="sm" variant="secondary" aria-label="Approve this change">
                    <ThumbsUp className="size-3.5" /> Approve
                  </Button>
                </div>
              </div>
              <DiffViewer path={file.path} stats={file.stats} hunks={file.hunks} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─────────────────────── CUSTOMIZE SHEETS ───────────────────────

interface PanelSheetProps {
  open: boolean;
  onClose: () => void;
  currentMode: Mode;
}

/** Whether a resource with `modes?: Mode[]` is visible in the current mode. */
function matchesMode(modes: Mode[] | undefined, current: Mode): boolean {
  if (!modes || modes.length === 0) return true;
  return modes.includes(current);
}

function SystemPromptSheet({ open, onClose, currentMode }: PanelSheetProps) {
  // Per-mode overrides. Empty string for a mode = "inherit the base".
  const [overrides, setOverrides] = useState<Record<Mode, string>>({
    chat: "",
    code: "",
    infra: "",
  });
  const [activeMode, setActiveMode] = useState<Mode>(currentMode);

  useEffect(() => {
    setActiveMode(currentMode);
  }, [currentMode]);

  const override = overrides[activeMode];
  const setOverride = (next: string) => setOverrides((prev) => ({ ...prev, [activeMode]: next }));

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <Sheet.Content side="right" className="w-[640px] max-w-none">
        <Sheet.Header>
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <Sheet.Title>System Prompt</Sheet.Title>
              <Sheet.Description>Base identity + optional per-mode override.</Sheet.Description>
            </div>
          </div>
        </Sheet.Header>
        <Sheet.Body className="grid gap-4">
          <div
            role="tablist"
            aria-label="Override per mode"
            className="inline-flex items-center gap-0.5 self-start rounded-md border border-border/40 bg-muted/30 p-0.5 font-mono text-label"
          >
            {(["chat", "code", "infra"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={activeMode === m}
                onClick={() => setActiveMode(m)}
                className={cn(
                  "rounded px-3 py-1",
                  activeMode === m
                    ? "bg-card font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {MODE_LABEL[m]}
                {overrides[m] ? <span className="ml-1 text-primary">•</span> : null}
              </button>
            ))}
          </div>
          <SystemPromptEditor
            defaultPrompt={DEFAULT_SYSTEM_PROMPT}
            override={override}
            onOverrideChange={setOverride}
            tokenEstimate={Math.ceil((override || DEFAULT_SYSTEM_PROMPT).length / 4)}
            title={`System prompt · ${MODE_LABEL[activeMode]}`}
          />
        </Sheet.Body>
      </Sheet.Content>
    </Sheet>
  );
}

type CrudView<T> = { mode: "list" } | { mode: "edit"; item: T } | { mode: "new" };

function SkillsSheet({ open, onClose, currentMode }: PanelSheetProps) {
  const [items, setItems] = useState(SKILLS_LIB);
  const [view, setView] = useState<CrudView<Skill>>({ mode: "list" });

  const visible = items.filter((s) => matchesMode(s.modes, currentMode));
  const hiddenCount = items.length - visible.length;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <Sheet.Content hideCloseButton side="right" className="w-[640px] max-w-none">
        <Sheet.Header>
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <Sheet.Title>Skills</Sheet.Title>
              <Sheet.Description>
                Reusable capabilities for <strong>{MODE_LABEL[currentMode]}</strong> mode.
                {hiddenCount > 0 ? (
                  <span className="ml-1 font-mono text-label text-muted-foreground">
                    · {hiddenCount} hidden in other modes
                  </span>
                ) : null}
              </Sheet.Description>
            </div>
            <div className="flex items-center gap-2">
              {view.mode === "list" ? (
                <Button size="sm" onClick={() => setView({ mode: "new" })}>
                  <PlusCircle className="size-3.5" /> New skill
                </Button>
              ) : null}
              <Sheet.Close
                aria-label="Close"
                className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </Sheet.Close>
            </div>
          </div>
        </Sheet.Header>
        <Sheet.Body>
          {view.mode === "list" ? (
            <div className="grid gap-2">
              {visible.length === 0 ? (
                <p className="text-body-sm text-muted-foreground">
                  No skills active in {MODE_LABEL[currentMode]} mode yet. Create one above.
                </p>
              ) : null}
              {visible.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setView({ mode: "edit", item: s })}
                  className="text-left"
                >
                  <SkillCard
                    skill={s}
                    onToggle={(id, next) =>
                      setItems((prev) =>
                        prev.map((it) => (it.id === id ? { ...it, state: next } : it)),
                      )
                    }
                  />
                </button>
              ))}
            </div>
          ) : (
            <SkillEditor
              initial={
                view.mode === "edit"
                  ? view.item
                  : { modes: [currentMode], state: "enabled", source: "user" }
              }
              onSave={(draft) => {
                if (view.mode === "edit") {
                  setItems((prev) =>
                    prev.map((it) =>
                      it.id === view.item.id ? ({ ...it, ...draft, id: it.id } as Skill) : it,
                    ),
                  );
                } else {
                  setItems((prev) => [...prev, { ...draft, id: `sk_${Date.now()}` } as Skill]);
                }
                setView({ mode: "list" });
              }}
              onCancel={() => setView({ mode: "list" })}
              onDelete={
                view.mode === "edit"
                  ? () => {
                      setItems((prev) => prev.filter((it) => it.id !== view.item.id));
                      setView({ mode: "list" });
                    }
                  : undefined
              }
            />
          )}
        </Sheet.Body>
      </Sheet.Content>
    </Sheet>
  );
}

function AgentsSheet({ open, onClose, currentMode }: PanelSheetProps) {
  const [items, setItems] = useState(AGENTS_LIB);
  const [view, setView] = useState<CrudView<AgentDraft>>({ mode: "list" });

  const visible = items.filter((a) => matchesMode(a.modes, currentMode));
  const hiddenCount = items.length - visible.length;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <Sheet.Content hideCloseButton side="right" className="w-[720px] max-w-none">
        <Sheet.Header>
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <Sheet.Title>Agents</Sheet.Title>
              <Sheet.Description>
                Personas active in <strong>{MODE_LABEL[currentMode]}</strong> mode.
                {hiddenCount > 0 ? (
                  <span className="ml-1 font-mono text-label text-muted-foreground">
                    · {hiddenCount} hidden in other modes
                  </span>
                ) : null}
              </Sheet.Description>
            </div>
            <div className="flex items-center gap-2">
              {view.mode === "list" ? (
                <Button size="sm" onClick={() => setView({ mode: "new" })}>
                  <PlusCircle className="size-3.5" /> New agent
                </Button>
              ) : null}
              <Sheet.Close
                aria-label="Close"
                className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </Sheet.Close>
            </div>
          </div>
        </Sheet.Header>
        <Sheet.Body>
          {view.mode === "list" ? (
            <div className="grid gap-2">
              {visible.length === 0 ? (
                <p className="text-body-sm text-muted-foreground">
                  No agents active in {MODE_LABEL[currentMode]} mode. Create one above.
                </p>
              ) : null}
              {visible.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setView({ mode: "edit", item: a })}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-border/40 bg-card/40 p-3 text-left hover:border-border hover:bg-card/70"
                >
                  <AgentProfile
                    agents={[
                      {
                        id: a.id ?? "",
                        name: a.name,
                        initials: a.initials,
                        tone: a.tone,
                        description: a.description,
                      },
                    ]}
                    activeId={a.id ?? ""}
                  />
                  <div className="grid min-w-0">
                    <span className="truncate font-display text-title-md tracking-tight">
                      {a.name}
                    </span>
                    {a.description ? (
                      <span className="truncate text-body-sm text-muted-foreground">
                        {a.description}
                      </span>
                    ) : null}
                    {a.skillIds?.length ? (
                      <span className="mt-0.5 font-mono text-label text-muted-foreground">
                        {a.skillIds.length} skills · {a.allowedTools?.length ?? 0} tools
                      </span>
                    ) : null}
                  </div>
                  <Pencil className="size-3.5 text-muted-foreground" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <AgentEditor
              initial={view.mode === "edit" ? view.item : { modes: [currentMode], tone: "primary" }}
              models={MODELS}
              skills={SKILLS_LIB.filter((s) => matchesMode(s.modes, currentMode)).map((s) => ({
                id: s.id,
                label: s.name,
              }))}
              onSave={(draft) => {
                if (view.mode === "edit") {
                  setItems((prev) =>
                    prev.map((it) => (it.id === view.item.id ? { ...draft, id: it.id } : it)),
                  );
                } else {
                  setItems((prev) => [...prev, { ...draft, id: `ag_${Date.now()}` }]);
                }
                setView({ mode: "list" });
              }}
              onCancel={() => setView({ mode: "list" })}
              onDelete={
                view.mode === "edit"
                  ? () => {
                      setItems((prev) => prev.filter((it) => it.id !== view.item.id));
                      setView({ mode: "list" });
                    }
                  : undefined
              }
            />
          )}
        </Sheet.Body>
      </Sheet.Content>
    </Sheet>
  );
}

function RulesSheet({ open, onClose, currentMode }: PanelSheetProps) {
  const [items, setItems] = useState(RULES_LIB);
  const [view, setView] = useState<CrudView<Rule>>({ mode: "list" });

  const visible = items.filter((r) => matchesMode(r.modes, currentMode));
  const hiddenCount = items.length - visible.length;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <Sheet.Content hideCloseButton side="right" className="w-[640px] max-w-none">
        <Sheet.Header>
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <Sheet.Title>Rules</Sheet.Title>
              <Sheet.Description>
                Behavior instructions active in <strong>{MODE_LABEL[currentMode]}</strong> mode.
                {hiddenCount > 0 ? (
                  <span className="ml-1 font-mono text-label text-muted-foreground">
                    · {hiddenCount} hidden in other modes
                  </span>
                ) : null}
              </Sheet.Description>
            </div>
            <div className="flex items-center gap-2">
              {view.mode === "list" ? (
                <Button size="sm" onClick={() => setView({ mode: "new" })}>
                  <PlusCircle className="size-3.5" /> New rule
                </Button>
              ) : null}
              <Sheet.Close
                aria-label="Close"
                className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </Sheet.Close>
            </div>
          </div>
        </Sheet.Header>
        <Sheet.Body>
          {view.mode === "list" ? (
            <div className="grid gap-2">
              {visible.length === 0 ? (
                <p className="text-body-sm text-muted-foreground">
                  No rules active in {MODE_LABEL[currentMode]} mode. Create one above.
                </p>
              ) : null}
              {visible.map((r) => (
                <RuleCard
                  key={r.id}
                  rule={r}
                  onSelect={(id) => {
                    const item = items.find((x) => x.id === id);
                    if (item) setView({ mode: "edit", item });
                  }}
                  onToggle={(id, next) =>
                    setItems((prev) =>
                      prev.map((it) => (it.id === id ? { ...it, state: next } : it)),
                    )
                  }
                  onDelete={(id) => setItems((prev) => prev.filter((it) => it.id !== id))}
                />
              ))}
            </div>
          ) : (
            <RuleEditor
              initial={
                view.mode === "edit"
                  ? view.item
                  : { modes: [currentMode], scope: "global", state: "enabled" }
              }
              onSave={(draft) => {
                if (view.mode === "edit") {
                  setItems((prev) =>
                    prev.map((it) =>
                      it.id === view.item.id
                        ? { ...it, ...draft, id: it.id, updatedAt: "just now" }
                        : it,
                    ),
                  );
                } else {
                  setItems((prev) => [
                    ...prev,
                    { ...draft, id: `r_${Date.now()}`, updatedAt: "just now" } as Rule,
                  ]);
                }
                setView({ mode: "list" });
              }}
              onCancel={() => setView({ mode: "list" })}
              onDelete={
                view.mode === "edit"
                  ? () => {
                      setItems((prev) => prev.filter((it) => it.id !== view.item.id));
                      setView({ mode: "list" });
                    }
                  : undefined
              }
            />
          )}
        </Sheet.Body>
      </Sheet.Content>
    </Sheet>
  );
}

// ─────────── ICON-ONLY THEME PICKER ───────────
// Inline implementation used in the sidebar footer where we want JUST the
// palette icon (no theme label), avoiding any CSS overrides on ThemeSwitcher.

function ThemeIconPicker() {
  const { theme, themes, setTheme } = useTheme();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Theme: ${theme.label}`}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-lg border border-border/60 bg-card text-foreground",
            "transition-colors hover:bg-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          <Palette className="size-4 text-primary" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className={cn(
            "z-50 min-w-[16rem] overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md",
            "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in",
            "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
          )}
        >
          {themes.map((t) => (
            <DropdownMenu.Item
              key={t.name}
              onSelect={() => setTheme(t.name)}
              className={cn(
                "flex cursor-pointer items-start justify-between gap-3 rounded-md px-2 py-2",
                "focus:bg-muted focus:outline-none data-[highlighted]:bg-muted",
              )}
            >
              <span className="flex min-w-0 flex-col">
                <span className="font-medium text-body-sm">{t.label}</span>
                {t.description ? (
                  <span className="text-body-sm text-muted-foreground">{t.description}</span>
                ) : null}
              </span>
              {t.name === theme.name ? (
                <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
              ) : null}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function DarkModeToggle() {
  const { mode, toggleMode } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg border border-border/60 bg-card text-foreground",
        "transition-colors hover:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      {mode === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}
