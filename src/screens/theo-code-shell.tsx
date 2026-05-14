import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Activity,
  Bookmark,
  Bot,
  Check,
  Cog,
  Eye,
  FileEdit,
  FileSearch,
  FileText,
  GitBranch,
  Globe,
  Hammer,
  History,
  KeyRound,
  Layers,
  ListChecks,
  type LucideIcon,
  MessageSquare,
  Moon,
  Palette,
  Pencil,
  PlusCircle,
  Rocket,
  RotateCcw,
  ScrollText,
  Search,
  Sparkles,
  Sun,
  Terminal,
  ThumbsUp,
  Webhook,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AgentComposer } from "../components/composites/agent-composer/agent-composer.js";
import {
  AgentStream,
  type AgentStreamItem,
} from "../components/composites/agent-stream/agent-stream.js";
import {
  type Deployment,
  DeploymentRow,
} from "../components/composites/deployment-row/deployment-row.js";
import { type Domain, DomainConfig } from "../components/composites/domain-config/domain-config.js";
import {
  type EnvVar,
  EnvVarEditor,
} from "../components/composites/env-var-editor/env-var-editor.js";
import {
  type RollbackTarget,
  RollbackUI,
} from "../components/composites/rollback-ui/rollback-ui.js";
import {
  type AgentDraft,
  AgentEditor,
} from "../components/primitives/agent-editor/agent-editor.js";
import { AgentProfile } from "../components/primitives/agent-profile/agent-profile.js";
import { AuditLogEntry } from "../components/primitives/audit-log-entry/audit-log-entry.js";
import {
  BuildLogStream,
  type LogLine,
} from "../components/primitives/build-log-stream/build-log-stream.js";
import { Button } from "../components/primitives/button/button.js";
import { ChatMessage } from "../components/primitives/chat-message/chat-message.js";
import { ChatThread } from "../components/primitives/chat-thread/chat-thread.js";
import { ContextWindowBar } from "../components/primitives/context-window-bar/context-window-bar.js";
import { DiffViewer } from "../components/primitives/diff-viewer/diff-viewer.js";
import { IntentSelector } from "../components/primitives/intent-selector/intent-selector.js";
import { LaneBoard } from "../components/primitives/lane-board/lane-board.js";
import type { MentionItem } from "../components/primitives/mention-menu/mention-menu.js";
import { MetricsPanel } from "../components/primitives/metrics-panel/metrics-panel.js";
import { ModelSelector } from "../components/primitives/model-selector/model-selector.js";
import { ProjectSwitcher } from "../components/primitives/project-switcher/project-switcher.js";
import { RuleCard } from "../components/primitives/rule-card/rule-card.js";
import { RuleEditor } from "../components/primitives/rule-editor/rule-editor.js";
import { RunStats } from "../components/primitives/run-stats/run-stats.js";
import {
  SessionListItem,
  type SessionRunStatus,
} from "../components/primitives/session-list-item/session-list-item.js";
import { Sheet } from "../components/primitives/sheet/sheet.js";
import { Sidebar } from "../components/primitives/sidebar/sidebar.js";
import { type Skill, SkillCard } from "../components/primitives/skill-card/skill-card.js";
import { SkillEditor } from "../components/primitives/skill-editor/skill-editor.js";
import { SystemPromptEditor } from "../components/primitives/system-prompt-editor/system-prompt-editor.js";
import { TokenUsageChart } from "../components/primitives/token-usage-chart/token-usage-chart.js";
import { TopNav } from "../components/primitives/topnav/topnav.js";
import { cn } from "../lib/cn.js";
import { useTheme } from "../themes/theme-provider.js";
import type { AgentEvent } from "../types/agent.js";
import type { Message } from "../types/chat.js";
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

const SESSIONS: Array<{
  id: string;
  title: string;
  status: SessionRunStatus;
  mode: Mode;
  timestamp: string;
  unread?: number;
}> = [
  {
    id: "s1",
    title: "Build the alignment grid demo",
    status: "running",
    mode: "code",
    timestamp: "now",
  },
  {
    id: "s2",
    title: "Rollback deploy after 5xx spike",
    status: "completed",
    mode: "infra",
    timestamp: "14m ago",
  },
  {
    id: "s3",
    title: "Race condition in upload queue",
    status: "failed",
    mode: "code",
    timestamp: "1h ago",
  },
  {
    id: "s4",
    title: "Add keyboard shortcuts to command palette",
    status: "queued",
    mode: "chat",
    timestamp: "yesterday",
  },
  {
    id: "s5",
    title: "Explain Tree-Sitter integration",
    status: "completed",
    mode: "chat",
    timestamp: "2d ago",
    unread: 3,
  },
];

const MESSAGES: Message[] = [
  {
    id: "m1",
    role: "user",
    content: "Build a CSS alignment grid demo at src/components/AlignmentGrid.tsx",
    timestamp: "9:58 PM",
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "On it. I'll scaffold the component, wire it up, and run the typechecker. Starting the dev server in parallel.",
    timestamp: "9:58 PM",
    model: "Opus 4.7",
  },
  {
    id: "m3",
    role: "user",
    content: "Use snap={true} on the select primitive, not stiffness.",
    timestamp: "9:59 PM",
  },
  {
    id: "m4",
    role: "assistant",
    content: "Got it — patching now and re-running typecheck.",
    timestamp: "9:59 PM",
    model: "Opus 4.7",
  },
];

const AGENT_EVENTS: AgentEvent[] = [
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
    label: "Write src/components/AlignmentGrid.tsx",
    path: "src/components/AlignmentGrid.tsx",
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

const MODELS = [
  { id: "opus-4-7", label: "Opus 4.7", tag: "smart" as const },
  { id: "sonnet-4-6", label: "Sonnet 4.6", tag: "default" as const },
  { id: "haiku-4-5", label: "Haiku 4.5", tag: "fast" as const },
];

const INTENTS = [
  {
    id: "edit",
    label: "Edit",
    description: "Apply code changes directly.",
    icon: Pencil,
  },
  {
    id: "plan",
    label: "Plan",
    description: "Plan the change without executing.",
    icon: ListChecks,
  },
  {
    id: "review",
    label: "Review",
    description: "Analyze code and suggest improvements.",
    icon: FileSearch,
  },
];

const SLASH_COMMANDS: MentionItem[] = [
  { id: "clear", label: "/clear", description: "Reset the current session", icon: Terminal },
  { id: "checkpoint", label: "/checkpoint", description: "Save state to disk", icon: Terminal },
  { id: "undo", label: "/undo", description: "Undo the last agent action", icon: Terminal },
  { id: "model", label: "/model", description: "Switch the active model", icon: Terminal },
  { id: "auth", label: "/auth", description: "Manage provider auth", icon: Terminal },
  { id: "help", label: "/help", description: "Show available commands", icon: Terminal },
];

const FILE_MENTIONS: MentionItem[] = [
  {
    id: "1",
    label: "src/components/AlignmentGrid.tsx",
    description: "modified · +85 −12",
    icon: FileText,
  },
  { id: "2", label: "src/components/PanelGrid.tsx", description: "new", icon: FileText },
  {
    id: "3",
    label: "src/components/__tests__/AlignmentGrid.test.tsx",
    description: "new",
    icon: FileText,
  },
  { id: "4", label: "src/styles/tokens.css", description: "modified · +2 −1", icon: FileText },
  { id: "5", label: "src/lib/cn.ts", description: "unchanged", icon: FileText },
];

const MEMORY_MENTIONS: MentionItem[] = [
  {
    id: "1",
    label: "#alignment-grid",
    description: "uses snap, not stiffness",
    icon: Bookmark,
  },
  { id: "2", label: "#auth-flow", description: "OAuth device flow + PKCE", icon: Bookmark },
  {
    id: "3",
    label: "#typescript-imports",
    description: "all .js extensions under ESM",
    icon: Bookmark,
  },
];

/** Per-mode workspace items rendered in the Sidebar "Workspace" section. */
type WorkspaceItemId =
  | "memory"
  | "conversations"
  | "observability"
  | "subagents"
  | "hooks"
  | "deployments"
  | "builds"
  | "environments"
  | "domains"
  | "secrets"
  | "audit";

interface WorkspaceItem {
  id: WorkspaceItemId;
  label: string;
  icon: LucideIcon;
}

const WORKSPACE_BY_MODE: Record<Mode, WorkspaceItem[]> = {
  chat: [
    { id: "memory", label: "Memory", icon: History },
    { id: "conversations", label: "Conversations", icon: MessageSquare },
  ],
  code: [
    { id: "memory", label: "Memory", icon: History },
    { id: "observability", label: "Observability", icon: Activity },
    { id: "subagents", label: "Sub-agents", icon: Bot },
    { id: "hooks", label: "Hooks", icon: Webhook },
  ],
  infra: [
    { id: "deployments", label: "Deployments", icon: Rocket },
    { id: "builds", label: "Builds", icon: Hammer },
    { id: "environments", label: "Environments", icon: Layers },
    { id: "domains", label: "Domains", icon: Globe },
    { id: "secrets", label: "Secrets", icon: KeyRound },
    { id: "audit", label: "Audit log", icon: ScrollText },
  ],
};

// ───────── Mocks for PaaS workspaces (driven by theo/api domain types) ─────────

const DOMAINS_LIB: Domain[] = [
  {
    id: "d1",
    hostname: "acme-web.usetheo.app",
    status: "verified",
    primary: true,
    tls: true,
  },
  {
    id: "d2",
    hostname: "www.acme.com",
    status: "verified",
    tls: true,
  },
  {
    id: "d3",
    hostname: "preview.acme.com",
    status: "pending",
    tls: false,
    verificationRecord: {
      type: "CNAME",
      name: "_theo-verify.preview",
      value: "verify.usetheo.app",
    },
  },
];

const SECRETS_LIB: EnvVar[] = [
  {
    id: "e1",
    key: "DATABASE_URL",
    value: "postgres://acme:hunter2@db.usetheo.dev:5432/acme",
    masked: true,
    scope: "production",
  },
  { id: "e2", key: "LOG_LEVEL", value: "info", scope: "all" },
  {
    id: "e3",
    key: "STRIPE_SECRET_KEY",
    value: "sk_test_redacted_demo_placeholder",
    masked: true,
    scope: "production",
  },
  {
    id: "e4",
    key: "REDIS_URL",
    value: "redis://default:hunter3@redis.usetheo.dev:6379",
    masked: true,
    scope: "staging",
  },
  {
    id: "e5",
    key: "THEO_DEPLOY_ID",
    value: "dpl_8f3jka9dfsdfasdf",
    readonly: true,
    scope: "production",
  },
];

const ENVIRONMENTS_LIB = [
  { name: "production", status: "live", projectCount: 3, region: "iad1" },
  { name: "staging", status: "live", projectCount: 3, region: "iad1" },
  { name: "preview", status: "transient", projectCount: 7, region: "iad1" },
];

const AUDIT_LIB = [
  {
    id: "a1",
    actor: { kind: "user" as const, name: "alfredo@usetheo.dev" },
    action: "rollback",
    target: "acme-web → v1.2.3",
    timestamp: "9:51 PM",
    severity: "warning" as const,
  },
  {
    id: "a2",
    actor: { kind: "agent" as const, name: "Theo Operator" },
    action: "deploy",
    target: "acme-web → 8f3jka9",
    timestamp: "9:48 PM",
  },
  {
    id: "a3",
    actor: { kind: "system" as const, name: "theo-api" },
    action: "auto_scale",
    target: "ledger-svc · 2 → 4 replicas",
    timestamp: "8:30 PM",
  },
  {
    id: "a4",
    actor: { kind: "user" as const, name: "alfredo@usetheo.dev" },
    action: "secret.set",
    target: "STRIPE_SECRET_KEY · production",
    timestamp: "yesterday",
  },
];

const INFRA_MESSAGES: Message[] = [
  {
    id: "im1",
    role: "user",
    content: "Why did p95 latency spike at 21:48?",
    timestamp: "9:50 PM",
  },
  {
    id: "im2",
    role: "assistant",
    content:
      "Looking at the metrics now. The spike correlates with deploy dpl_8f3 going live (commit 8f3jka9). I'll fetch the build log and compare to the previous green deploy.",
    timestamp: "9:50 PM",
    model: "Opus 4.7",
  },
  {
    id: "im3",
    role: "user",
    content: "Rollback to last green if confirmed.",
    timestamp: "9:51 PM",
  },
  {
    id: "im4",
    role: "assistant",
    content:
      "On it — preparing rollback to v1.2.3 (commit 7d2bca). I'll ask you to confirm before flipping traffic.",
    timestamp: "9:51 PM",
    model: "Opus 4.7",
  },
];

const RECENT_DEPLOYS: Deployment[] = [
  {
    id: "d1",
    status: "live",
    environment: "production",
    branch: "main",
    commitSha: "8f3jka9",
    commitMessage: "feat(api): batch payments endpoint",
    author: { name: "claude" },
    duration: "1m 22s",
    timeAgo: "12m ago",
  },
  {
    id: "d2",
    status: "live",
    environment: "preview",
    branch: "claude/alignment-grid",
    commitSha: "a2b1cd4",
    commitMessage: "feat: alignment grid demo",
    author: { name: "claude" },
    duration: "58s",
    timeAgo: "1h ago",
  },
  {
    id: "d3",
    status: "failed",
    environment: "production",
    branch: "main",
    commitSha: "8f3jka9",
    commitMessage: "feat(api): batch payments endpoint",
    author: { name: "claude" },
    duration: "23s",
    timeAgo: "2h ago",
  },
];

const INFRA_LOGS: LogLine[] = [
  {
    id: "l1",
    timestamp: "21:48:14",
    level: "info",
    message: "Build started · main@8f3jka9",
    source: "build",
  },
  {
    id: "l2",
    timestamp: "21:48:42",
    level: "success",
    message: "pnpm install · ok (24s)",
    source: "build",
  },
  {
    id: "l3",
    timestamp: "21:49:05",
    level: "success",
    message: "pnpm build · ok (38s)",
    source: "build",
  },
  {
    id: "l4",
    timestamp: "21:49:18",
    level: "info",
    message: "Deploying to prod · region iad1",
    source: "deploy",
  },
  {
    id: "l5",
    timestamp: "21:49:42",
    level: "warn",
    message: "p95 latency 320ms (baseline 180ms)",
    source: "monitor",
  },
  {
    id: "l6",
    timestamp: "21:50:08",
    level: "error",
    message: "Error rate 0.42% — threshold 0.1% breached",
    source: "monitor",
  },
];

const ROLLBACK_HISTORY: RollbackTarget[] = [
  {
    id: "rb1",
    version: "v1.3.0",
    commitSha: "8f3jka9",
    commitMessage: "feat(api): batch payments endpoint",
    deployedAt: "12m ago",
    isCurrent: true,
  },
  {
    id: "rb2",
    version: "v1.2.3",
    commitSha: "7d2bca1",
    commitMessage: "fix(auth): refresh token expiry",
    deployedAt: "3h ago",
  },
  {
    id: "rb3",
    version: "v1.2.2",
    commitSha: "5e1ab09",
    commitMessage: "chore(deps): bump react",
    deployedAt: "1d ago",
  },
];

const DEFAULT_SYSTEM_PROMPT = `You are Theo Code, an autonomous coding agent.

Operate inside the active workspace. Use the available tools to read, plan, edit, and verify code changes. Always run typecheck and tests after substantive edits.

When uncertain, ask before destructive actions.`;

const SKILLS_LIB: Skill[] = [
  {
    id: "sk1",
    name: "diff-explainer",
    description: "Explain a diff in plain English with intent + risk.",
    source: "user",
    state: "enabled",
    allowedTools: ["Read", "Grep"],
    triggers: ["explain diff", "summarize change"],
    modes: ["code"],
  },
  {
    id: "sk2",
    name: "test-runner",
    description: "Run the test suite and summarise failures.",
    source: "project",
    state: "enabled",
    allowedTools: ["Bash"],
    triggers: ["run tests", "verify"],
    modes: ["code", "infra"],
  },
  {
    id: "sk3",
    name: "security-audit",
    description: "OWASP-style sweep over the changed files.",
    source: "plugin",
    state: "disabled",
    allowedTools: ["Read", "Grep"],
    triggers: ["audit", "scan"],
    modes: ["code"],
  },
  {
    id: "sk4",
    name: "incident-summarizer",
    description: "Build a postmortem skeleton from a deploy + log window.",
    source: "user",
    state: "enabled",
    allowedTools: ["Read"],
    triggers: ["summarize incident", "postmortem"],
    modes: ["infra"],
  },
  {
    id: "sk5",
    name: "deploy-status",
    description: "Show recent deploys per environment with health.",
    source: "builtin",
    state: "enabled",
    allowedTools: ["Bash"],
    triggers: ["deploy status"],
    modes: ["infra"],
  },
  {
    id: "sk6",
    name: "web-search",
    description: "Look up docs / Stack Overflow.",
    source: "builtin",
    state: "enabled",
    triggers: ["search the web", "look up"],
  },
];

const AGENTS_LIB: AgentDraft[] = [
  {
    id: "ag1",
    name: "Coder",
    initials: "CO",
    description: "Writes code, edits files, runs verification.",
    tone: "primary",
    model: "opus-4-7",
    allowedTools: ["Read", "Edit", "Write", "Bash", "Grep"],
    skillIds: ["sk2"],
    modes: ["code"],
  },
  {
    id: "ag2",
    name: "Planner",
    initials: "PL",
    description: "Plans the change without executing.",
    tone: "info",
    model: "sonnet-4-6",
    allowedTools: ["Read", "Grep"],
    modes: ["code"],
  },
  {
    id: "ag3",
    name: "Reviewer",
    initials: "RV",
    description: "Spots bugs and writes failing tests before any fix.",
    tone: "success",
    model: "sonnet-4-6",
    allowedTools: ["Read", "Grep"],
    skillIds: ["sk1", "sk2"],
    modes: ["code"],
  },
  {
    id: "ag4",
    name: "Operator",
    initials: "OP",
    description: "Watches metrics, rolls back, manages env + secrets.",
    tone: "accent",
    model: "opus-4-7",
    allowedTools: ["Bash", "Read"],
    skillIds: ["sk4", "sk5"],
    modes: ["infra"],
  },
  {
    id: "ag5",
    name: "Researcher",
    initials: "RS",
    description: "Q&A and exploration. Reads, never edits.",
    tone: "muted",
    model: "haiku-4-5",
    allowedTools: ["Read", "Grep"],
    skillIds: ["sk6"],
    modes: ["chat"],
  },
];

const RULES_LIB: Rule[] = [
  {
    id: "r1",
    title: "Always write tests before fixes",
    body: "When fixing a bug, first write a failing regression test, then the fix. Commit the test in its own commit so the bisect history stays clean.",
    scope: "global",
    state: "enabled",
    tags: ["testing", "process"],
    updatedAt: "2d ago",
  },
  {
    id: "r2",
    title: "Prefer composition over inheritance",
    body: "When designing components, lean on composition + props rather than class hierarchies. Inheritance only for clear is-a relationships.",
    scope: "project",
    state: "enabled",
    tags: ["style"],
    modes: ["code"],
    updatedAt: "1w ago",
  },
  {
    id: "r3",
    title: "Imports must use .js extensions",
    body: "Under ESM, all relative imports must include the .js extension even for TypeScript files.",
    scope: "project",
    state: "enabled",
    tags: ["typescript"],
    modes: ["code"],
    updatedAt: "3w ago",
  },
  {
    id: "r4",
    title: "Never push to prod without staging deploy",
    body: "Every production deploy must be preceded by a staging deploy that passes its smoke tests. No exceptions.",
    scope: "global",
    state: "enabled",
    tags: ["safety"],
    modes: ["infra"],
    updatedAt: "1mo ago",
  },
  {
    id: "r5",
    title: "Rollback before debug",
    body: "If error rate breaches 0.1% threshold, roll back first, investigate second.",
    scope: "global",
    state: "enabled",
    tags: ["incident"],
    modes: ["infra"],
    updatedAt: "2mo ago",
  },
  {
    id: "r6",
    title: "Never modify migrations after merge",
    body: "Once a migration is in main, treat it as immutable. New changes go in a new migration.",
    scope: "global",
    state: "disabled",
    tags: ["database"],
    modes: ["code", "infra"],
    updatedAt: "1mo ago",
  },
];

const CODE_STREAM: AgentStreamItem[] = [
  {
    kind: "message",
    id: "u1",
    message: {
      id: "u1",
      role: "user",
      content: "Find every call site of stiffness and refactor to snap.",
      timestamp: "9:58 PM",
    },
  },
  {
    kind: "message",
    id: "a1",
    message: {
      id: "a1",
      role: "assistant",
      content: "I'll start by grepping the codebase for stiffness call sites.",
      timestamp: "9:58 PM",
      model: "Opus 4.7",
    },
  },
  {
    kind: "tool-call",
    id: "t1",
    tool: "Grep",
    icon: Search,
    target: "stiffness",
    status: "success",
    timestamp: "9:58:14 PM",
    output: (
      <pre className="whitespace-pre-wrap text-muted-foreground">
        src/components/AlignmentGrid.tsx:424: stiffness={"{"}0.8{"}"}
        {"\n"}src/components/PanelGrid.tsx:88: stiffness: 1{"\n"}src/styles/tokens.css:85:
        --align-stiffness: 0.8;
      </pre>
    ),
  },
  {
    kind: "message",
    id: "a2",
    message: {
      id: "a2",
      role: "assistant",
      content: "Found 3 call sites. Patching AlignmentGrid first; tokens.css next.",
      timestamp: "9:58 PM",
      model: "Opus 4.7",
    },
  },
  {
    kind: "tool-call",
    id: "t2",
    tool: "MultiEdit",
    icon: FileEdit,
    target: "src/components/AlignmentGrid.tsx",
    status: "success",
    timestamp: "9:58:42 PM",
  },
  {
    kind: "approval",
    id: "p1",
    severity: "warning",
    title: "Edit outside default sandbox?",
    request: "Edit · ~/.config/theo/tokens.css",
    description: "This file lives outside the project workspace.",
  },
  {
    kind: "tool-call",
    id: "t3",
    tool: "Bash",
    icon: Terminal,
    target: "tsc --noEmit",
    status: "success",
    timestamp: "9:58:55 PM",
    output: <pre className="whitespace-pre-wrap text-success">[vite] error resolved</pre>,
  },
  {
    kind: "tool-call",
    id: "t4",
    tool: "Bash",
    icon: Terminal,
    target: "pnpm test",
    status: "failed",
    timestamp: "9:59 PM",
    defaultExpanded: true,
    output: (
      <pre className="whitespace-pre-wrap text-destructive">
        FAIL src/components/AlignmentGrid.test.tsx{"\n"}× renders snap mode (12ms){"\n"}
        Expected: "snap" / Received: "stiffness"
      </pre>
    ),
  },
  {
    kind: "error",
    id: "e1",
    errorKind: "rate-limit",
    title: "Rate limit hit",
    detail: "anthropic: 429 — retry after 60s",
    timestamp: "9:59 PM",
  },
  {
    kind: "streaming",
    id: "s1",
    model: "Opus 4.7",
    partial: "Resuming. Let me re-run the failing test with verbose output…",
  },
];

/** Tool the agent used to produce this change. Matches Theo Code / Claude Code tool names. */
type AgentTool = "Write" | "Edit" | "MultiEdit" | "NotebookEdit" | "Bash";

interface FileChange {
  id: string;
  path: string;
  /** Which agent tool produced this change. */
  tool: AgentTool;
  stats: { added: number; removed: number };
  hunks: Array<{
    id: string;
    header?: string;
    collapsed?: boolean;
    lines: Array<{
      kind: "added" | "removed" | "unchanged" | "meta";
      oldNumber?: number;
      newNumber?: number;
      content: string;
    }>;
  }>;
}

const FILE_CHANGES: FileChange[] = [
  {
    id: "fc1",
    path: "src/components/AlignmentGrid.tsx",
    tool: "MultiEdit",
    stats: { added: 85, removed: 12 },
    hunks: [
      {
        id: "h1",
        header: "@@ -424,5 +424,5 @@",
        lines: [
          { kind: "removed", oldNumber: 424, content: "<select stiffness={0.8}" },
          { kind: "added", newNumber: 424, content: "<select snap={true}" },
          { kind: "added", newNumber: 425, content: "  bounce={false}" },
          { kind: "unchanged", oldNumber: 426, newNumber: 426, content: "  align='center'" },
          { kind: "unchanged", oldNumber: 427, newNumber: 427, content: ">" },
        ],
      },
      {
        id: "h2",
        header: "@@ -512,8 +512,11 @@",
        lines: [
          {
            kind: "unchanged",
            oldNumber: 512,
            newNumber: 512,
            content: "function compute(node) {",
          },
          { kind: "removed", oldNumber: 513, content: "  return node.weight * 0.8;" },
          { kind: "added", newNumber: 513, content: "  if (node.snap) return node.weight;" },
          {
            kind: "added",
            newNumber: 514,
            content: "  return node.weight * (node.bounce ? 0.8 : 1);",
          },
          { kind: "unchanged", oldNumber: 514, newNumber: 515, content: "}" },
        ],
      },
    ],
  },
  {
    id: "fc2",
    path: "src/components/PanelGrid.tsx",
    tool: "Write",
    stats: { added: 62, removed: 0 },
    hunks: [
      {
        id: "h1",
        lines: [
          { kind: "added", newNumber: 1, content: 'import { forwardRef } from "react";' },
          { kind: "added", newNumber: 2, content: 'import { cn } from "../../lib/cn";' },
          { kind: "added", newNumber: 3, content: "" },
          { kind: "added", newNumber: 4, content: "interface PanelGridProps {" },
          { kind: "added", newNumber: 5, content: "  cols?: 2 | 3 | 4;" },
          { kind: "added", newNumber: 6, content: "  gap?: number;" },
          { kind: "added", newNumber: 7, content: "}" },
        ],
      },
      { id: "h2", collapsed: true, lines: new Array(55).fill({ kind: "unchanged" }) as never },
    ],
  },
  {
    id: "fc3",
    path: "src/components/__tests__/AlignmentGrid.test.tsx",
    tool: "Write",
    stats: { added: 38, removed: 0 },
    hunks: [
      {
        id: "h1",
        lines: [
          {
            kind: "added",
            newNumber: 1,
            content: 'import { render, screen } from "@testing-library/react";',
          },
          {
            kind: "added",
            newNumber: 2,
            content: 'import { describe, expect, it } from "vitest";',
          },
          {
            kind: "added",
            newNumber: 3,
            content: 'import { AlignmentGrid } from "../AlignmentGrid";',
          },
          { kind: "added", newNumber: 4, content: "" },
          { kind: "added", newNumber: 5, content: 'describe("AlignmentGrid", () => {' },
        ],
      },
      { id: "h2", collapsed: true, lines: new Array(33).fill({ kind: "unchanged" }) as never },
    ],
  },
  {
    id: "fc4",
    path: "src/styles/tokens.css",
    tool: "Edit",
    stats: { added: 2, removed: 1 },
    hunks: [
      {
        id: "h1",
        header: "@@ -84,3 +84,4 @@",
        lines: [
          { kind: "unchanged", oldNumber: 84, newNumber: 84, content: '  --align-snap: "true";' },
          { kind: "removed", oldNumber: 85, content: "  --align-stiffness: 0.8;" },
          { kind: "added", newNumber: 85, content: "  --align-bounce: false;" },
          { kind: "added", newNumber: 86, content: "  --align-strict: true;" },
        ],
      },
    ],
  },
];

/** Visual treatment for each tool pill — colour signals intent at a glance. */
const TOOL_PILL: Record<AgentTool, string> = {
  Write: "bg-success/15 text-success",
  Edit: "bg-primary/15 text-primary",
  MultiEdit: "bg-primary/15 text-primary",
  NotebookEdit: "bg-info/15 text-info",
  Bash: "bg-warning/15 text-warning",
};

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
