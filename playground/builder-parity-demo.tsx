// Builder parity demo — a side-by-side reconstruction of the theokit-studio
// "Agent Builder" surface, built ALMOST ENTIRELY from @theokit/ui public
// components (M2 + M3, v1.1.0). Compare against the studio original (which
// hand-rolls every surface with @usetheo/ui primitives).
//
// The studio Builder reimplements: composer, model+effort picker, approval
// selector, build-intent tiles, work log, edited-files card, and a multi-file
// review panel. Here each of those is a single @theokit/ui component:
//
//   composer            → <AgentComposer> (+ trailingActions slots)
//   model + effort       → <ModelEffortPicker>
//   approval mode        → <ApprovalModeSelector>
//   build intents        → <IntentSelector layout="tiles">
//   work log             → <WorkLog>
//   edited files         → <CreatedFilesCard variant="edited">
//   review panel         → <CodeReviewPanel>
//   session list         → <SessionListItem>
//   message thread       → <ChatMessageRoot> + <ChatMessageContent>
//
// Fixtures mirror the studio Builder's scripted session for a fair comparison.

import {
  AgentComposer,
  type ApprovalMode,
  ApprovalModeSelector,
  ChatMessageContent,
  ChatMessageRoot,
  CodeReviewPanel,
  CreatedFilesCard,
  IntentSelector,
  ModelEffortPicker,
  type ReviewFile,
  SessionListItem,
  WorkLog,
} from "@theokit/ui";
import { Bot, Bug, ShieldCheck, Wrench } from "lucide-react";
import { useState } from "react";

const INTENTS = [
  { id: "new-agent", label: "Create a new agent from scratch", icon: Bot },
  { id: "add-tools", label: "Add tools to an existing agent", icon: Wrench },
  { id: "guardrails", label: "Tune instructions and guardrails", icon: ShieldCheck },
  { id: "diagnose", label: "Diagnose a failing run", icon: Bug },
];

const MODELS = [
  { id: "claude-fable-5", name: "Fable 5", blurb: "Deepest reasoning for complex builds" },
  { id: "claude-opus-4-8", name: "Opus 4.8", blurb: "Strong all-round builder" },
  { id: "claude-sonnet-4-6", name: "Sonnet 4.6", blurb: "Fast and balanced" },
  { id: "claude-haiku-4-5", name: "Haiku 4.5", blurb: "Snappy for quick edits" },
];

const SESSIONS = [
  {
    id: "1",
    title: "Add a refund tool to Support Agent",
    status: "completed" as const,
    timestamp: "2m",
  },
  { id: "2", title: "Tighten PII guardrails", status: "running" as const, timestamp: "18m" },
  {
    id: "3",
    title: "Diagnose the nightly eval regression",
    status: "completed" as const,
    timestamp: "1h",
  },
];

const WORK_STEPS = [
  "Read the agent registry and the Support Agent definition",
  "Added a `refund` tool with a Zod schema",
  "Wired the tool into the agent's tool list",
  "Ran the test suite — 14 passing",
];

const EDITED_FILES = [
  { id: "1", name: "agents/support-agent.ts", additions: 12, deletions: 3 },
  { id: "2", name: "agents/tools/refund.ts", additions: 41, deletions: 0 },
];

const REVIEW_FILES: ReviewFile[] = [
  {
    path: "agents/support-agent.ts",
    additions: 12,
    deletions: 3,
    diff: `--- a/agents/support-agent.ts
+++ b/agents/support-agent.ts
 import { defineAgent } from "@theokit/agents";
+import { refundTool } from "./tools/refund";
 export default defineAgent({
-  model: "openai/gpt-4o-mini",
+  model: "anthropic/claude-sonnet-4-6",
+  tools: [refundTool],
   system: "You are a helpful support agent.",
 });`,
  },
  {
    path: "agents/tools/refund.ts",
    additions: 41,
    deletions: 0,
    diff: `+++ b/agents/tools/refund.ts
+import { z } from "zod";
+export const refundTool = defineTool({
+  input: z.object({ orderId: z.string(), amount: z.number() }),
+  handler: async ({ orderId, amount }) => issueRefund(orderId, amount),
+});`,
  },
];

function Composer() {
  const [value, setValue] = useState("");
  const [approval, setApproval] = useState<ApprovalMode>("ask");
  const [model, setModel] = useState("claude-fable-5");
  const [effort, setEffort] = useState("Medium");
  return (
    <AgentComposer
      value={value}
      onValueChange={setValue}
      onSubmit={() => setValue("")}
      onAttach={() => undefined}
      onVoiceInput={() => undefined}
      placeholder="Do anything — @ to reference skills"
      files={[
        { id: "clear", label: "clear", description: "Reset session" },
        { id: "checkpoint", label: "checkpoint", description: "Save state" },
      ]}
      leadingActions={<ApprovalModeSelector value={approval} onChange={setApproval} />}
      trailingActions={
        <ModelEffortPicker
          models={MODELS}
          model={model}
          onModelChange={setModel}
          effort={effort}
          onEffortChange={setEffort}
        />
      }
    />
  );
}

export function BuilderParityDemo() {
  const [intent, setIntent] = useState("new-agent");
  const [rightPane, setRightPane] = useState<"none" | "review">("review");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 p-6">
      <header>
        <h1 className="font-semibold text-2xl text-foreground tracking-tight">
          Agent Builder — rebuilt with @theokit/ui
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Same surface as the theokit-studio Builder, but every agent component comes from{" "}
          <code className="text-primary">@theokit/ui@1.1.0</code> (M2 + M3). Compare against the
          hand-rolled studio original.
        </p>
      </header>

      {/* ── Home: intents + composer ── */}
      <section className="rounded-2xl border border-border/40 bg-card/40 p-6">
        <h2 className="mb-4 text-center font-semibold text-foreground text-xl tracking-tight">
          What should we build?
        </h2>
        <div className="mx-auto max-w-2xl">
          <IntentSelector layout="tiles" value={intent} onChange={setIntent} options={INTENTS} />
          <div className="mt-6">
            <Composer />
          </div>
        </div>
      </section>

      {/* ── Session: sidebar + thread + review panel ── */}
      <section className="grid grid-cols-[16rem_1fr] gap-4">
        <aside className="flex flex-col gap-1 rounded-xl border border-border/40 bg-card/40 p-3">
          <h3 className="mb-1 px-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Sessions
          </h3>
          {SESSIONS.map((s, i) => (
            <SessionListItem
              key={s.id}
              title={s.title}
              status={s.status}
              timestamp={s.timestamp}
              active={i === 0}
              onClick={() => undefined}
            />
          ))}
        </aside>

        <div className="grid min-h-0 grid-cols-2 gap-4">
          {/* chat pane */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/40 p-4">
            <ChatMessageRoot from="user">
              <ChatMessageContent>Add a refund tool to the Support Agent.</ChatMessageContent>
            </ChatMessageRoot>
            <WorkLog workedFor="2m 30s" steps={WORK_STEPS} defaultOpen />
            <ChatMessageRoot from="assistant">
              <ChatMessageContent variant="flat">
                Done — I added a `refund` tool with a typed schema and wired it into the Support
                Agent. The review panel on the right shows the change.
              </ChatMessageContent>
            </ChatMessageRoot>
            <CreatedFilesCard variant="edited" files={EDITED_FILES} />
            <div className="mt-auto pt-2">
              <Composer />
            </div>
          </div>

          {/* review pane */}
          <div className="min-h-0">
            {rightPane === "review" ? (
              <CodeReviewPanel files={REVIEW_FILES} onClose={() => setRightPane("none")} />
            ) : (
              <button
                type="button"
                onClick={() => setRightPane("review")}
                className="h-full w-full rounded-xl border border-border/40 border-dashed text-muted-foreground text-sm hover:border-primary/40"
              >
                Open review
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
