/**
 * M5 real-LLM demo (DoD #3) — runs a REAL SDK agent against OpenRouter, folds
 * `Run.stream()` through the exact `agentStreamReducer` that `useAgentStream`
 * uses, and prints the rendered `AgentStreamItem[]`. Proves the live streaming
 * seam end-to-end on real model output in a plain-Node environment (theo-ui's
 * vitest env stubs/truncates the streaming fetch; plain Node — which mirrors a
 * real SSR/server consumer — streams correctly).
 *
 * Run: OPENROUTER_API_KEY=… node --experimental-strip-types scripts/m5-real-llm-demo.ts
 * `@theokit/sdk` is a devDependency only (M5 ADR-1 — zero runtime coupling).
 */
import { Agent } from "@theokit/sdk";
import {
  agentStreamReducer,
  initialAgentStreamState,
} from "../src/hooks/use-agent-stream/agent-stream-reducer.ts";
import type { SdkStreamMessage } from "../src/hooks/use-agent-stream/types.ts";

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error("SKIP: OPENROUTER_API_KEY not set");
  process.exit(2);
}

async function foldRun(prompt: string, tools?: unknown[]) {
  const agent = await Agent.create({
    apiKey: apiKey as string,
    model: { id: "openai/gpt-4o-mini" },
    ...(tools ? { tools: tools as never } : {}),
  });
  try {
    const run = await agent.send(prompt);
    let state = initialAgentStreamState;
    const events: string[] = [];
    for await (const ev of run.stream()) {
      events.push((ev as { type: string }).type);
      state = agentStreamReducer(state, ev as unknown as SdkStreamMessage);
    }
    state = agentStreamReducer(state, { type: "done" });
    const final = await run.wait();
    return { state, events, final };
  } finally {
    await agent.dispose();
  }
}

// 1) Text turn.
const text = await foldRun("Reply with exactly one word: hello");
const msg = text.state.items.find((i) => i.kind === "message") as
  | { message: { parts: Array<{ text?: string }> } }
  | undefined;
console.log("=== M5 real-LLM demo — TEXT ===");
console.log("events:", text.events.join(","), "| status:", text.final.status);
console.log("rendered message item text:", JSON.stringify(msg?.message.parts[0]?.text));

// 2) Tool turn (raw JSON-schema CustomTool — no zod/defineTool).
const timeTool = {
  name: "get_current_time",
  description: "Returns the current UTC time as an ISO string.",
  inputSchema: { type: "object", properties: {}, required: [] },
  handler: () => new Date().toISOString(),
};
const tool = await foldRun("What is the current time? You MUST call the get_current_time tool.", [
  timeTool,
]);
const toolItems = tool.state.items.filter((i) => i.kind === "tool-call");
console.log("=== M5 real-LLM demo — TOOL ===");
console.log("events:", tool.events.join(","), "| status:", tool.final.status);
console.log(
  "tool-call items:",
  toolItems.length,
  JSON.stringify(toolItems.map((t) => (t as { status: string }).status)),
);

const ok = (msg?.message.parts[0]?.text ?? "").length > 0;
console.log(ok ? "\nDEMO_OK" : "\nDEMO_FAILED");
process.exit(ok ? 0 : 1);
