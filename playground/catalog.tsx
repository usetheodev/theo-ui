/**
 * Catalog — playground page that mounts a curated subset of public components
 * from `@usetheo/ui`, grouped by category. Imports come exclusively from the
 * package's public barrel — no relative paths into `src/` — so the playground
 * proves that a consumer can build a real surface using only the published API.
 *
 * For the exhaustive component reference, run Ladle (`pnpm dev`) — every
 * primitive and composite has its own `*.stories.tsx`. This page focuses on
 * the high-traffic surfaces a real consumer would assemble first.
 */
import {
  // Agent transparency (verified subset)
  AgentEvent,
  // Types
  type AgentEventModel,
  // Composites (verified)
  AgentTimeline,
  // Foundations
  Avatar,
  Badge,
  // Code workspace
  BuildLogStream,
  Button,
  type Capability,
  CapabilityIndicator,
  Card,
  ChatComposer,
  // Chat
  ChatMessage,
  ChatThread,
  Checkbox,
  type CommandItem,
  CommandPalette,
  ContextWindowBar,
  type Deployment,
  DeploymentRow,
  Dialog,
  DiffViewer,
  EmptyState,
  FormField,
  Input,
  Label,
  type LogLine,
  type Metric,
  MetricsPanel,
  ModelSelector,
  PermissionModal,
  QuickActionChips,
  RadioGroup,
  RunStats,
  ScrollArea,
  Select,
  // App chrome
  Sheet,
  Sidebar,
  Skeleton,
  Switch,
  Tabs,
  TerminalPanel,
  Textarea,
  // Theme
  ThemeSwitcher,
  TokenUsageChart,
  type TokenUsagePoint,
  Tooltip,
  TopNav,
  type UIMessage,
} from "@usetheo/ui";
import {
  Bot,
  Cloud,
  Code,
  FileText,
  Folder,
  Layers,
  type LucideIcon,
  Search,
  Settings,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";

/* ─────────────────────────────────────────────────────────────────────────
 * Mock data (typed to match real public exports)
 * ───────────────────────────────────────────────────────────────────────── */

const mockMessages: UIMessage[] = [
  {
    id: "m1",
    role: "user",
    parts: [{ type: "text", text: "Refactor the auth module to use JWT." }],
  },
  {
    id: "m2",
    role: "assistant",
    parts: [{ type: "text", text: "Plan: swap cookie middleware for bearer + add refresh flow." }],
  },
];

const mockEvents: AgentEventModel[] = [
  { id: "e1", type: "command", label: "pnpm install", status: "success", timestamp: "09:15:00" },
  {
    id: "e2",
    type: "edit",
    label: "Edit auth.ts",
    path: "src/auth/auth.ts",
    diff: { added: 42, removed: 18 },
    status: "success",
    timestamp: "09:15:30",
  },
  { id: "e3", type: "lint", label: "Lint", status: "running" },
  { id: "e4", type: "build", label: "Build", status: "pending" },
];

const mockCapabilities: Capability[] = [
  { id: "fs-read", label: "Read files", state: "enabled", icon: FileText },
  { id: "shell", label: "Run shell", state: "disabled" },
];

const mockTokenUsage: TokenUsagePoint[] = Array.from({ length: 14 }, (_, i) => ({
  label: `D${i + 1}`,
  input: 40_000 + i * 1_500,
  output: 18_000 + i * 700,
}));

const mockMetrics: Metric[] = [
  { label: "Requests/s", value: "1.2k", delta: "+8%", deltaGood: true },
  { label: "p95 latency", value: "182", unit: "ms", delta: "-3ms", deltaGood: true },
  { label: "Error rate", value: "0.03%", delta: "+0.01pp", deltaGood: false },
  {
    label: "Active deploys",
    value: "7",
    sparkline: [0.2, 0.3, 0.6, 0.9, 0.7, 0.5, 0.4, 0.6, 0.8, 1.0],
  },
];

const mockLogs: LogLine[] = Array.from({ length: 12 }, (_, i) => ({
  id: `log-${i}`,
  timestamp: `09:1${i % 10}:0${i % 10}`,
  level: (["info", "warn", "error", "success", "debug"] as const)[i % 5] ?? "info",
  message: `Step ${i + 1} completed`,
  source: i % 3 === 0 ? "build" : undefined,
}));

const mockDeployment: Deployment = {
  id: "d1",
  status: "live",
  environment: "production",
  branch: "main",
  commitSha: "a1b2c3d",
  commitMessage: "fix: refresh token rotation",
  author: { name: "you" },
  duration: "1m 24s",
  timeAgo: "2m ago",
};

const mockCommandItems: CommandItem[] = [
  { id: "open-files", label: "Open file…", group: "Navigate", icon: Folder },
  { id: "search", label: "Search project", group: "Navigate", icon: Search },
  { id: "deploy", label: "Deploy production", group: "Actions", icon: Cloud },
  { id: "rollback", label: "Rollback last", group: "Actions", icon: Shield },
];

/* ─────────────────────────────────────────────────────────────────────────
 * Section wrapper
 * ───────────────────────────────────────────────────────────────────────── */

interface SectionProps {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

function Section({ id, title, description, icon: Icon, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-20">
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2 font-display">
            {Icon ? <Icon className="size-5 text-primary" aria-hidden="true" /> : null}
            {title}
          </Card.Title>
          {description ? <Card.Description>{description}</Card.Description> : null}
        </Card.Header>
        <Card.Body className="grid gap-6">{children}</Card.Body>
      </Card>
    </section>
  );
}

interface ExampleProps {
  label: string;
  children: React.ReactNode;
}

function Example({ label, children }: ExampleProps) {
  return (
    <div className="grid gap-2">
      <Label className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      <div className="rounded-lg border border-border/40 bg-muted/20 p-4">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Section demos
 * ───────────────────────────────────────────────────────────────────────── */

function FormsDemo() {
  const [check, setCheck] = useState(false);
  const [radio, setRadio] = useState("a");
  const [sw, setSw] = useState(true);
  const [select, setSelect] = useState("medium");
  return (
    <>
      <Example label="Button variants">
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </Example>
      <Example label="Inputs (FormField compound)">
        <div className="grid gap-3 md:grid-cols-2">
          <FormField>
            <FormField.Label>Project name</FormField.Label>
            <FormField.Control>
              <Input placeholder="my-project" />
            </FormField.Control>
          </FormField>
          <FormField>
            <FormField.Label>Description</FormField.Label>
            <FormField.Control>
              <Textarea placeholder="A short description…" rows={2} />
            </FormField.Control>
            <FormField.Hint>One sentence.</FormField.Hint>
          </FormField>
        </div>
      </Example>
      <Example label="Toggles">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox id="cb" checked={check} onCheckedChange={(v) => setCheck(v === true)} />
            <Label htmlFor="cb">Subscribe</Label>
          </div>
          <Switch checked={sw} onCheckedChange={setSw} />
          <RadioGroup value={radio} onValueChange={setRadio} className="flex gap-3">
            <div className="flex items-center gap-1">
              <RadioGroup.Item value="a" id="ra" /> <Label htmlFor="ra">A</Label>
            </div>
            <div className="flex items-center gap-1">
              <RadioGroup.Item value="b" id="rb" /> <Label htmlFor="rb">B</Label>
            </div>
          </RadioGroup>
          <Select value={select} onValueChange={setSelect}>
            <Select.Trigger className="w-32">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="small">Small</Select.Item>
              <Select.Item value="medium">Medium</Select.Item>
              <Select.Item value="large">Large</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </Example>
    </>
  );
}

function SurfaceDemo() {
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  return (
    <>
      <Example label="Badge variants">
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="success">Live</Badge>
          <Badge variant="warning">Building</Badge>
          <Badge variant="destructive">Failed</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </Example>
      <Example label="Avatar / Skeleton / EmptyState">
        <div className="grid grid-cols-3 gap-4">
          <Avatar>
            <Avatar.Image src="https://i.pravatar.cc/64?u=1" alt="Alice" />
            <Avatar.Fallback>AL</Avatar.Fallback>
          </Avatar>
          <div className="grid gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <EmptyState
            icon={Folder}
            title="No projects"
            description="Create your first project to get started."
          />
        </div>
      </Example>
      <Example label="Dialog + Sheet">
        <div className="flex gap-2">
          <Button onClick={() => setDialog(true)}>Open dialog</Button>
          <Button variant="secondary" onClick={() => setSheet(true)}>
            Open sheet
          </Button>
        </div>
        <Dialog open={dialog} onOpenChange={setDialog}>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Confirm deploy</Dialog.Title>
              <Dialog.Description>This will roll changes into production.</Dialog.Description>
            </Dialog.Header>
            <Dialog.Footer>
              <Button variant="secondary" onClick={() => setDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setDialog(false)}>Deploy</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
        <Sheet open={sheet} onOpenChange={setSheet}>
          <div className="grid gap-3 p-6">
            <h3 className="font-display text-title-md">Side panel</h3>
            <p className="text-body-sm text-muted-foreground">
              Sheets are great for settings and contextual editors.
            </p>
            <Button onClick={() => setSheet(false)}>Close</Button>
          </div>
        </Sheet>
      </Example>
      <Example label="Tabs + Tooltip + ScrollArea">
        <Tabs defaultValue="overview">
          <Tabs.List>
            <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
            <Tabs.Trigger value="logs">Logs</Tabs.Trigger>
            <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="overview">
            <Tooltip label="Tooltip works">
              <Button variant="ghost">Hover me</Button>
            </Tooltip>
          </Tabs.Content>
          <Tabs.Content value="logs">
            <ScrollArea className="h-32 rounded-md border border-border/40 p-2">
              <ul className="grid gap-1 font-mono text-code-sm">
                {Array.from({ length: 20 }, (_, i) => `line-${i}`).map((id, i) => (
                  <li key={id}>line {i}</li>
                ))}
              </ul>
            </ScrollArea>
          </Tabs.Content>
          <Tabs.Content value="settings">Settings tab content.</Tabs.Content>
        </Tabs>
      </Example>
    </>
  );
}

function ChromeDemo() {
  return (
    <>
      <Example label="TopNav (Breadcrumbs + ModeSwitcher as radiogroup)">
        <div className="overflow-hidden rounded-xl border border-border/40">
          <TopNav>
            <TopNav.Left>
              <TopNav.Breadcrumbs
                items={[
                  { label: "acme", href: "#" },
                  { label: "api", href: "#" },
                  { label: "deployments" },
                ]}
              />
            </TopNav.Left>
            <TopNav.Center>
              <TopNav.ModeSwitcher
                value="code"
                options={[
                  { value: "chat", label: "Chat" },
                  { value: "code", label: "Code" },
                  { value: "infra", label: "Infra" },
                ]}
              />
            </TopNav.Center>
            <TopNav.Right>
              <Button size="sm" variant="ghost">
                main
              </Button>
            </TopNav.Right>
          </TopNav>
        </div>
      </Example>
      <Example label="Sidebar (sessions + sections + items + footer)">
        <div className="h-72 overflow-hidden rounded-xl border border-border/40">
          <Sidebar className="h-full w-64">
            <Sidebar.Header>theo-ui</Sidebar.Header>
            <Sidebar.Section title="Sessions">
              <Sidebar.Item icon={Bot} active>
                Refactor auth
              </Sidebar.Item>
              <Sidebar.Item icon={Code}>Fix flaky test</Sidebar.Item>
            </Sidebar.Section>
            <Sidebar.Section title="Workspace">
              <Sidebar.Item icon={Layers}>Memory</Sidebar.Item>
            </Sidebar.Section>
            <Sidebar.Footer>
              <ThemeSwitcher />
            </Sidebar.Footer>
          </Sidebar>
        </div>
      </Example>
    </>
  );
}

function AgentTransparencyDemo() {
  return (
    <>
      <Example label="AgentTimeline + AgentEvent (single)">
        <div className="grid gap-3">
          <AgentTimeline events={mockEvents} collapsible />
          {mockEvents[1] ? <AgentEvent event={mockEvents[1]} /> : null}
        </div>
      </Example>
      <Example label="ContextWindowBar / RunStats / TokenUsageChart / CapabilityIndicator">
        <div className="grid gap-3 md:grid-cols-2">
          <ContextWindowBar used={62_000} total={200_000} />
          <RunStats duration="24s" tokens="41.9k" filesChanged={3} />
          <TokenUsageChart points={mockTokenUsage} />
          <CapabilityIndicator capabilities={mockCapabilities} />
        </div>
      </Example>
    </>
  );
}

function ChatDemo() {
  const [value, setValue] = useState("");
  return (
    <>
      <Example label="ChatThread + ChatMessage">
        <ChatThread>
          {mockMessages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
        </ChatThread>
      </Example>
      <Example label="ChatComposer (mic/attach opt-in)">
        <ChatComposer
          mode="chat"
          value={value}
          onValueChange={setValue}
          onSubmit={() => setValue("")}
          onAttach={() => undefined}
          onVoiceInput={() => undefined}
          trailingActions={
            <ModelSelector
              value="opus-4-7"
              options={[
                { id: "opus-4-7", label: "Opus 4.7" },
                { id: "sonnet-4-6", label: "Sonnet 4.6" },
              ]}
              onChange={() => undefined}
            />
          }
        />
      </Example>
      <Example label="QuickActionChips">
        <QuickActionChips
          actions={[
            { id: "write", label: "Write" },
            { id: "review", label: "Review" },
            { id: "fix", label: "Fix tests" },
          ]}
        />
      </Example>
    </>
  );
}

function CodeWorkspaceDemo() {
  return (
    <>
      <Example label="DiffViewer">
        <DiffViewer
          path="src/auth/auth.ts"
          stats={{ added: 42, removed: 18 }}
          hunks={[
            {
              id: "h1",
              header: "@@ -10,4 +10,5 @@",
              lines: [
                { kind: "unchanged", oldNumber: 10, newNumber: 10, content: "function login()" },
                { kind: "removed", oldNumber: 11, content: "  return cookieFlow();" },
                { kind: "added", newNumber: 11, content: "  return jwtFlow();" },
                { kind: "added", newNumber: 12, content: "  // emits refresh token" },
              ],
            },
          ]}
        />
      </Example>
      <Example label="TerminalPanel + BuildLogStream">
        <div className="grid gap-3 md:grid-cols-2">
          <TerminalPanel
            lines={[
              { id: "1", kind: "command", content: "pnpm test" },
              { id: "2", kind: "stdout", content: "Test Files 101 passed" },
              { id: "3", kind: "ok", content: "Tests 402 passed (402)" },
            ]}
          />
          <BuildLogStream lines={mockLogs} height={180} />
        </div>
      </Example>
      <Example label="MetricsPanel">
        <MetricsPanel title="Service health" metrics={mockMetrics} />
      </Example>
    </>
  );
}

function PaasDemo() {
  return (
    <Example label="DeploymentRow">
      <DeploymentRow deployment={mockDeployment} />
    </Example>
  );
}

function GlobalsDemo() {
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState(false);
  return (
    <>
      <Example label="CommandPalette (cmdk + keyboard nav)">
        <div className="flex flex-col items-start gap-2">
          <Button onClick={() => setOpen(true)}>Open ⌘K</Button>
          <CommandPalette
            open={open}
            onOpenChange={setOpen}
            items={mockCommandItems}
            onSelect={() => setOpen(false)}
          />
        </div>
      </Example>
      <Example label="PermissionModal">
        <div className="flex items-start gap-2">
          <Button onClick={() => setPerm(true)}>Request file access</Button>
          <PermissionModal
            open={perm}
            onOpenChange={setPerm}
            request={{ path: "/home/me/projects/acme-api", operations: ["read", "write"] }}
            onDecide={() => setPerm(false)}
          />
        </div>
      </Example>
    </>
  );
}

export function Catalog() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-6 md:p-10">
      <header className="grid gap-2 border-border/40 border-b pb-6">
        <h1 className="font-display text-display-md tracking-tight">
          @usetheo/ui — Component Catalog
        </h1>
        <p className="text-body-md text-muted-foreground">
          A curated subset of public components, imported exclusively from <code>@usetheo/ui</code>.
          For the full reference, run <code>pnpm dev</code> (Ladle) — every primitive and composite
          has a dedicated story.
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="primary">live demo</Badge>
          <Badge variant="success">99 components shipped</Badge>
          <Badge variant="outline">Geist + Vercel grayscale</Badge>
          <ThemeSwitcher />
        </div>
      </header>

      <Section id="forms" title="Forms & input" icon={FileText}>
        <FormsDemo />
      </Section>
      <Section id="surfaces" title="Surfaces" icon={Layers}>
        <SurfaceDemo />
      </Section>
      <Section id="chrome" title="App chrome" icon={Settings}>
        <ChromeDemo />
      </Section>
      <Section id="agent" title="Agent transparency" icon={Bot}>
        <AgentTransparencyDemo />
      </Section>
      <Section id="chat" title="Chat & cowork" icon={Sparkles}>
        <ChatDemo />
      </Section>
      <Section id="code" title="Code workspace" icon={Code}>
        <CodeWorkspaceDemo />
      </Section>
      <Section id="paas" title="PaaS composites" icon={Cloud}>
        <PaasDemo />
      </Section>
      <Section id="globals" title="Globals" icon={Zap}>
        <GlobalsDemo />
      </Section>
    </main>
  );
}
