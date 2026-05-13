import type { Story } from "@ladle/react";
import {
  Boxes,
  Brush,
  CheckCircle2,
  Flame,
  GitBranch,
  Layers,
  Library,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default { title: "Welcome" };

const STATS = [
  { value: "36", label: "Primitives" },
  { value: "12", label: "Composites" },
  { value: "07", label: "Screens" },
  { value: "03", label: "Themes" },
  { value: "21", label: "Registry items" },
  { value: "122", label: "Tests" },
];

const SECTIONS = [
  {
    icon: Palette,
    title: "Foundations",
    description: "Colors, typography, spacing, elevation, motion.",
    path: "?story=foundations-colors--palette",
    cta: "Open colors",
  },
  {
    icon: Brush,
    title: "Themes",
    description: "Switch between Violet Forge, Classic Paper, Aurora Terminal.",
    path: "?story=themes-themeswitcher--all-themes",
    cta: "Try themes",
  },
  {
    icon: Library,
    title: "Primitives",
    description: "Atomic components — Button, Badge, Card, ChatMessage, AgentEvent…",
    path: "?story=primitives-foundations-button--variants",
    cta: "Explore primitives",
  },
  {
    icon: Layers,
    title: "Composites",
    description: "Assembled blocks — DeploymentRow, ProjectCard, AgentTimeline…",
    path: "?story=composites-paas-deploymentrow--list",
    cta: "Explore composites",
  },
  {
    icon: Boxes,
    title: "Screens",
    description: "Full theokit compositions — Chat, Cowork, Code workspaces…",
    path: "?story=screens-chat-home--default",
    cta: "View screens",
  },
];

const HIGHLIGHTS = [
  {
    icon: Sparkles,
    title: "AI-agent first",
    body: "Built for tools that orchestrate LLM agents — chat messages, tool calls, agent timelines, permission modals.",
  },
  {
    icon: ShieldCheck,
    title: "TS strict + Radix",
    body: "Type-safe, accessible by default. Composables wrap Radix primitives; nothing reinvents the wheel.",
  },
  {
    icon: GitBranch,
    title: "Shadcn registry",
    body: "Each component ships as a registry item. Consumers copy code via `npx shadcn add`, no opaque runtime.",
  },
  {
    icon: Flame,
    title: "Violet Forge identity",
    body: "Theo violet primary + burnt sienna accent. Geist Sans/Mono by default. Three built-in themes, runtime-swappable.",
  },
];

export const Default: Story = () => (
  <div className="grid gap-12">
    {/* Hero */}
    <header className="relative grid gap-6 overflow-hidden rounded-3xl border bg-card bg-hero-glow px-10 py-12">
      <span className="font-mono text-label-caps text-primary uppercase tracking-wider">
        @usetheo/ui · 0.0.0
      </span>
      <h1 className="text-balance font-display text-display-2xl tracking-tight">
        Forged for <span className="text-accent">AI agents</span>.
      </h1>
      <p className="max-w-2xl text-balance text-body-lg text-muted-foreground">
        Framework-agnostic React component library with a dark-first violet palette, burnt-sienna
        accents, editorial typography, and a shadcn-compatible registry. Built to power{" "}
        <code className="font-mono text-primary">theo-code</code>,{" "}
        <code className="font-mono text-primary">theo-agents</code>, and any tool that needs to
        render an AI agent in production.
      </p>
      <dl className="mt-2 grid grid-cols-3 gap-6 md:grid-cols-6">
        {STATS.map((s) => (
          <div key={s.label} className="grid gap-0.5">
            <dt className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
              {s.label}
            </dt>
            <dd className="font-bold font-display text-display-md tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
    </header>

    {/* Sections */}
    <section className="grid gap-4">
      <h2 className="font-display text-headline tracking-tight">Start exploring</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <a
              key={s.title}
              href={s.path}
              className="group flex flex-col gap-3 rounded-2xl border bg-card p-6 transition-shadow duration-base ease-out-soft hover:border-primary/40 hover:shadow-glow"
            >
              <span className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
                <Icon className="size-5" />
              </span>
              <div className="grid gap-1">
                <h3 className="font-display text-title-lg">{s.title}</h3>
                <p className="text-body-sm text-muted-foreground">{s.description}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1.5 font-mono text-label-caps text-primary uppercase tracking-wider">
                {s.cta} →
              </span>
            </a>
          );
        })}
      </div>
    </section>

    {/* Highlights */}
    <section className="grid gap-4">
      <h2 className="font-display text-headline tracking-tight">What makes it tick</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {HIGHLIGHTS.map((h) => {
          const Icon = h.icon;
          return (
            <div
              key={h.title}
              className="grid grid-cols-[auto_1fr] items-start gap-4 rounded-2xl border bg-card p-5"
            >
              <span className="grid size-10 place-items-center rounded-lg bg-accent/15 text-accent">
                <Icon className="size-5" />
              </span>
              <div className="grid gap-1">
                <h3 className="font-display text-title-md">{h.title}</h3>
                <p className="text-body-sm text-muted-foreground">{h.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>

    {/* Quickstart */}
    <section className="grid gap-3">
      <h2 className="font-display text-headline tracking-tight">Quickstart</h2>
      <pre className="overflow-x-auto rounded-2xl border bg-card p-5 font-mono text-code-md">
        {`pnpm add @usetheo/ui

# in your app root
import { ThemeProvider, builtinThemes, Button } from "@usetheo/ui";
import "@usetheo/ui/tokens.css";
import "@usetheo/ui/styles.css";

<ThemeProvider themes={builtinThemes}>
  <Button><Rocket /> Deploy</Button>
</ThemeProvider>`}
      </pre>
    </section>

    <footer className="flex items-center justify-between gap-4 border-border/40 border-t pt-6">
      <p className="flex items-center gap-2 text-body-sm text-muted-foreground">
        <CheckCircle2 className="size-3.5 text-success" /> All checks green · typecheck · lint · 122
        tests
      </p>
      <p className="text-body-sm text-muted-foreground">
        <Rocket className="-mt-0.5 inline size-3.5" /> Forge violet · since 2026
      </p>
    </footer>
  </div>
);
