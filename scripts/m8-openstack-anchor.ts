// @vitest-environment node
/**
 * M8 open-stack dogfood anchor — exercises the shippable pillars end-to-end on
 * real infrastructure (OpenRouter), and measures the north-star
 * `time-to-first-working-agent` (wall-clock from process start to the first
 * rendered assistant token).
 *
 * - Harness (SDK): `Agent.create()` + `agent.send()` on the local runtime, real LLM.
 * - Skills (mechanism): a real custom tool the agent invokes — the same tool-use
 *   extension mechanism the published `@theokit/*` plugins ride on (Skills↔Harness
 *   is separately proven by M6: 10 plugins published, 661 tests green vs SDK 2.18.0).
 * - UI (theo-ui): every `Run.stream()` SDKMessage folded through the exact
 *   `agentStreamReducer` that `useAgentStream` uses → rendered AgentStreamItems.
 * - Runtime (cloud): pre-release (contract-only, M7) — NOT exercised live; documented.
 *
 * Run: OPENROUTER_API_KEY=… node --experimental-strip-types scripts/m8-openstack-anchor.ts
 */
import { Agent } from "@theokit/sdk";
import {
  agentStreamReducer,
  initialAgentStreamState,
} from "../src/hooks/use-agent-stream/agent-stream-reducer.ts";
import type { SdkStreamMessage } from "../src/hooks/use-agent-stream/types.ts";

const t0 = Date.now();
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error("SKIP: OPENROUTER_API_KEY not set");
  process.exit(2);
}

// Skills-mechanism: a real tool (JSON-schema CustomTool — the shape plugins use).
const clockTool = {
  name: "get_current_time",
  description: "Returns the current UTC time as an ISO string.",
  inputSchema: { type: "object", properties: {}, required: [] },
  handler: () => new Date().toISOString(),
};

const agent = await Agent.create({
  apiKey,
  model: { id: "openai/gpt-4o-mini" },
  // biome-ignore lint/suspicious/noExplicitAny: raw JSON-schema CustomTool.
  tools: [clockTool as any],
});

let firstTokenAt = 0;
let state = initialAgentStreamState;
const events: string[] = [];
try {
  const run = await agent.send("What is the current UTC time? Call get_current_time, then tell me.");
  for await (const ev of run.stream()) {
    events.push((ev as { type: string }).type);
    if (firstTokenAt === 0 && ((ev as { type: string }).type === "assistant")) {
      firstTokenAt = Date.now();
    }
    state = agentStreamReducer(state, ev as unknown as SdkStreamMessage);
  }
  state = agentStreamReducer(state, { type: "done" });
  const final = await run.wait();

  const ttfwa = (firstTokenAt || Date.now()) - t0;
  const msg = state.items.find((i) => i.kind === "message") as
    | { message: { parts: Array<{ text?: string }> } }
    | undefined;
  const toolItems = state.items.filter((i) => i.kind === "tool-call");

  console.log(JSON.stringify({
    north_star_time_to_first_working_agent_ms: ttfwa,
    total_wall_clock_ms: Date.now() - t0,
    pillars: {
      harness_status: final.status,
      skills_tool_calls: toolItems.length,
      skills_tool_status: toolItems.map((t) => (t as { status: string }).status),
      ui_rendered_items: state.items.length,
      ui_rendered_text: msg?.message.parts[0]?.text ?? "",
      runtime_cloud: "pre-release (contract-only, M7) — not exercised live",
    },
    events,
  }, null, 2));

  const ok = final.status === "finished" && (msg?.message.parts[0]?.text ?? "").length > 0 && toolItems.length >= 1;
  console.log(ok ? "\nANCHOR_OK" : "\nANCHOR_INCOMPLETE");
  await agent.dispose();
  process.exit(ok ? 0 : 1);
} catch (err) {
  console.error("ANCHOR_ERROR", err instanceof Error ? err.message : String(err));
  await agent.dispose();
  process.exit(1);
}
