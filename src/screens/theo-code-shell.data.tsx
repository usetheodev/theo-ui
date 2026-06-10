/**
 * theo-code-shell.data.ts — extracted mock data for the TheoCodeShell screen.
 *
 * The screen is a non-exported Ladle story (it lives in `src/screens/` but is
 * never re-exported from `src/index.ts`). The split keeps the orchestrating
 * component under a manageable size while leaving the ~900 lines of mock
 * fixtures in one focused module.
 */

import {
  Activity,
  Bookmark,
  Bot,
  FileEdit,
  FileSearch,
  FileText,
  Globe,
  Hammer,
  History,
  KeyRound,
  Layers,
  ListChecks,
  type LucideIcon,
  MessageSquare,
  Pencil,
  Rocket,
  ScrollText,
  Search,
  Terminal,
  Webhook,
} from "lucide-react";
import type { AgentDraft } from "../components/composites/agent-editor/agent-editor.js";
import type { AgentStreamItem } from "../components/composites/agent-stream/agent-stream.js";
import type { Deployment } from "../components/composites/deployment-row/deployment-row.js";
import type { Domain } from "../components/composites/domain-config/domain-config.js";
import type { EnvVar } from "../components/composites/env-var-editor/env-var-editor.js";
import type { RollbackTarget } from "../components/composites/rollback-ui/rollback-ui.js";
import type { LogLine } from "../components/primitives/build-log-stream/build-log-stream.js";
import type { MentionItem } from "../components/primitives/mention-menu/mention-menu.js";
import type { SessionRunStatus } from "../components/primitives/session-list-item/session-list-item.js";
import type { Skill } from "../components/primitives/skill-card/skill-card.js";
import type { AgentEvent } from "../types/agent.js";
import type { UIMessage } from "../types/chat.js";
import type { Mode } from "../types/mode.js";
import type { Rule } from "../types/rule.js";

export const SESSIONS: Array<{
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

export const MESSAGES: UIMessage[] = [
  {
    id: "m1",
    role: "user",
    parts: [
      { type: "text", text: "Build a CSS alignment grid demo at src/components/AlignmentGrid.tsx" },
    ],
  },
  {
    id: "m2",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "On it. I'll scaffold the component, wire it up, and run the typechecker. Starting the dev server in parallel.",
      },
    ],
  },
  {
    id: "m3",
    role: "user",
    parts: [{ type: "text", text: "Use snap={true} on the select primitive, not stiffness." }],
  },
  {
    id: "m4",
    role: "assistant",
    parts: [{ type: "text", text: "Got it — patching now and re-running typecheck." }],
  },
];

export const AGENT_EVENTS: AgentEvent[] = [
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

export const MODELS = [
  { id: "opus-4-7", label: "Opus 4.7", tag: "smart" as const },
  { id: "sonnet-4-6", label: "Sonnet 4.6", tag: "default" as const },
  { id: "haiku-4-5", label: "Haiku 4.5", tag: "fast" as const },
];

export const INTENTS = [
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

export const SLASH_COMMANDS: MentionItem[] = [
  { id: "clear", label: "/clear", description: "Reset the current session", icon: Terminal },
  { id: "checkpoint", label: "/checkpoint", description: "Save state to disk", icon: Terminal },
  { id: "undo", label: "/undo", description: "Undo the last agent action", icon: Terminal },
  { id: "model", label: "/model", description: "Switch the active model", icon: Terminal },
  { id: "auth", label: "/auth", description: "Manage provider auth", icon: Terminal },
  { id: "help", label: "/help", description: "Show available commands", icon: Terminal },
];

export const FILE_MENTIONS: MentionItem[] = [
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

export const MEMORY_MENTIONS: MentionItem[] = [
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
export type WorkspaceItemId =
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

export interface WorkspaceItem {
  id: WorkspaceItemId;
  label: string;
  icon: LucideIcon;
}

export const WORKSPACE_BY_MODE: Record<Mode, WorkspaceItem[]> = {
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

export const DOMAINS_LIB: Domain[] = [
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

export const SECRETS_LIB: EnvVar[] = [
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

export const ENVIRONMENTS_LIB = [
  { name: "production", status: "live", projectCount: 3, region: "iad1" },
  { name: "staging", status: "live", projectCount: 3, region: "iad1" },
  { name: "preview", status: "transient", projectCount: 7, region: "iad1" },
];

export const AUDIT_LIB = [
  {
    id: "a1",
    actor: { kind: "user" as const, name: "alfredo@theokit.dev" },
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
    actor: { kind: "user" as const, name: "alfredo@theokit.dev" },
    action: "secret.set",
    target: "STRIPE_SECRET_KEY · production",
    timestamp: "yesterday",
  },
];

export const INFRA_MESSAGES: UIMessage[] = [
  {
    id: "im1",
    role: "user",
    parts: [{ type: "text", text: "Why did p95 latency spike at 21:48?" }],
  },
  {
    id: "im2",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Looking at the metrics now. The spike correlates with deploy dpl_8f3 going live (commit 8f3jka9). I'll fetch the build log and compare to the previous green deploy.",
      },
    ],
  },
  {
    id: "im3",
    role: "user",
    parts: [{ type: "text", text: "Rollback to last green if confirmed." }],
  },
  {
    id: "im4",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "On it — preparing rollback to v1.2.3 (commit 7d2bca). I'll ask you to confirm before flipping traffic.",
      },
    ],
  },
];

export const RECENT_DEPLOYS: Deployment[] = [
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

export const INFRA_LOGS: LogLine[] = [
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

export const ROLLBACK_HISTORY: RollbackTarget[] = [
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

export const DEFAULT_SYSTEM_PROMPT = `You are Theo Code, an autonomous coding agent.

Operate inside the active workspace. Use the available tools to read, plan, edit, and verify code changes. Always run typecheck and tests after substantive edits.

When uncertain, ask before destructive actions.`;

export const SKILLS_LIB: Skill[] = [
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

export const AGENTS_LIB: AgentDraft[] = [
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

export const RULES_LIB: Rule[] = [
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

export const CODE_STREAM: AgentStreamItem[] = [
  {
    kind: "message",
    id: "u1",
    message: {
      id: "u1",
      role: "user",
      parts: [{ type: "text", text: "Find every call site of stiffness and refactor to snap." }],
    },
  },
  {
    kind: "message",
    id: "a1",
    message: {
      id: "a1",
      role: "assistant",
      parts: [
        { type: "text", text: "I'll start by grepping the codebase for stiffness call sites." },
      ],
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
      parts: [
        {
          type: "text",
          text: "Found 3 call sites. Patching AlignmentGrid first; tokens.css next.",
        },
      ],
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
export type AgentTool = "Write" | "Edit" | "MultiEdit" | "NotebookEdit" | "Bash";

export interface FileChange {
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

export const FILE_CHANGES: FileChange[] = [
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
export const TOOL_PILL: Record<AgentTool, string> = {
  Write: "bg-success/15 text-success",
  Edit: "bg-primary/15 text-primary",
  MultiEdit: "bg-primary/15 text-primary",
  NotebookEdit: "bg-info/15 text-info",
  Bash: "bg-warning/15 text-warning",
};
