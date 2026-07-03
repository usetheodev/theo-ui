// @vitest-environment node
/**
 * Full-stack demo — proves ALL 9 ecosystem milestones (M0–M8) live, on real
 * infrastructure (OpenRouter), with your own key. Each endpoint maps to a
 * milestone; the dashboard (index.html) drives them.
 *
 *   M0 security floor      → /api/redact       (Security.redact scrubs secrets)
 *   M1 correctness (abort) → /api/chat + close (run.cancel on client disconnect)
 *   M2 resilience          → /api/fail         (typed error, fail-fast, no hang)
 *   M3 state+observability → /api/history       (non-lossy session resume + metrics)
 *   M4 Skills↔Harness      → /api/chat          (sk-or- key routes to OpenRouter)
 *   M5 UI↔Harness          → /api/chat (SSE)    (live token streaming via onDelta)
 *   M6 cluster (plugins)   → create_artifact    (published @theokit/plugin-canvas tool)
 *   M7 Runtime (cloud)     → /api/cloud         (cloudPayload contract + bc- + pre-release guard)
 *   M8 GA readiness        → /api/chat meta     (north-star time-to-first-working-agent)
 *
 * Run: OPENROUTER_API_KEY=… node --experimental-strip-types server.ts  → http://localhost:8788
 */
import { readFileSync } from "node:fs";
import { createServer, type ServerResponse } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Agent, InMemoryConversationStorage, Security } from "@theokit/sdk";
import { defineArtifactTool } from "@theokit/plugin-canvas";
import {
  agentStreamReducer,
  initialAgentStreamState,
} from "../../src/hooks/use-agent-stream/agent-stream-reducer.ts";
import type { SdkStreamMessage } from "../../src/hooks/use-agent-stream/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 8788);
const MODEL = process.env.DEMO_MODEL ?? "openai/gpt-4o-mini";
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error("Set OPENROUTER_API_KEY before running the demo.");
  process.exit(2);
}

// ── M3: one shared conversation store + one agent id → history survives across
// requests (non-lossy resume). ─────────────────────────────────────────────
const conversationStorage = new InMemoryConversationStorage();
const AGENT_ID = "full-stack-demo-agent";

// ── M6: a REAL published @theokit/plugin-canvas artifact tool. The plugin
// (from npm, 0.3.1) validates + security-sanitizes every artifact. ──────────
const artifacts = new Map<string, unknown>();
let artifactSeq = 0;
const canvasTool = defineArtifactTool({
  allowedKinds: ["markdown", "code"],
  // The plugin reads `stored.id` / `stored.version` off this return, so onPublish
  // returns the persisted ARTIFACT (not a wrapper). This is what makes the plugin
  // do the real work (schema validation + CSP-safe sanitization) before we store it.
  onPublish: async (a) => {
    const artifact = a as { id?: string; version?: number };
    const id = artifact.id ?? `art-${Date.now()}`;
    const stored = { ...(a as object), id, version: artifact.version ?? 1 };
    artifacts.set(id, stored);
    return stored as never;
  },
});
const createArtifactTool = {
  name: "create_artifact",
  description:
    "Render an artifact (markdown or code) in the canvas panel. Use for code snippets, formatted docs, or anything worth showing as a card.",
  inputSchema: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["markdown", "code"] },
      title: { type: "string" },
      content: { type: "string" },
      language: { type: "string", description: "language for code artifacts" },
    },
    required: ["kind", "title", "content"],
  },
  handler: async (input: { kind: string; title: string; content: string; language?: string }) => {
    const artifact = {
      // Monotonic id — two artifacts created in the same millisecond must NOT collide
      // (a shared `Date.now()` would overwrite the first in the Map, losing it).
      id: `art-${Date.now()}-${++artifactSeq}`,
      title: input.title,
      version: 1,
      createdAt: Date.now(),
      kind: input.kind,
      content: input.content,
      ...(input.kind === "code" ? { language: input.language ?? "text" } : {}),
    };
    const res = await canvasTool.handler({ artifact }); // published plugin validates + sanitizes
    return `Artifact published via @theokit/plugin-canvas: ${res.artifactId} (${input.kind}, v${res.version}).`;
  },
};

// Skills: a couple of plain tools too (tool-use mechanism).
const clockTool = {
  name: "get_current_time",
  description: "Returns the current UTC time as an ISO 8601 string.",
  inputSchema: { type: "object", properties: {}, required: [] },
  handler: () => new Date().toISOString(),
};
const diceTool = {
  name: "roll_dice",
  description: "Rolls an N-sided dice (default 6) and returns the result as a number.",
  inputSchema: {
    type: "object",
    properties: { sides: { type: "number", description: "number of sides (default 6)" } },
    required: [],
  },
  handler: (input: { sides?: number }) => {
    const sides = typeof input?.sides === "number" && input.sides > 1 ? Math.floor(input.sides) : 6;
    return String(1 + Math.floor(Math.random() * sides));
  },
};
// biome-ignore lint/suspicious/noExplicitAny: raw JSON-schema tools.
const tools: any[] = [clockTool, diceTool, createArtifactTool];

const html = readFileSync(join(HERE, "index.html"), "utf8");
const sendEvent = (res: ServerResponse, event: string, data: unknown) =>
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
const json = (res: ServerResponse, code: number, data: unknown) => {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const p = url.pathname;

  if (p === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  // ── M0: secret redaction ─────────────────────────────────────────────────
  if (p === "/api/redact") {
    const text = url.searchParams.get("text") ?? "";
    json(res, 200, { input: text, redacted: Security.redact(text) });
    return;
  }

  // ── M2: fail-fast typed error (resilience) ───────────────────────────────
  if (p === "/api/fail") {
    const agent = await Agent.create({ apiKey, model: { id: "nonexistent-provider/does-not-exist" } });
    try {
      const run = await agent.send("hello");
      for await (const _ of run.stream()) { /* drain */ }
      const final = await run.wait();
      json(res, 200, { status: final.status, error: final.error ?? null, note: "typed error surfaced — no hang, no crash" });
    } catch (err) {
      json(res, 200, { status: "error", error: { message: err instanceof Error ? err.message : String(err) }, note: "typed error thrown at the boundary" });
    } finally {
      await agent.dispose();
    }
    return;
  }

  // ── M7: cloud contract (pre-release, contract-only) ──────────────────────
  if (p === "/api/cloud") {
    // No THEOKIT_API_BASE_URL → local CloudAgent object; exposes the serialized
    // cloudPayload contract + a bc- id, and the pre-release guard on artifacts.
    const agent = await Agent.create({
      apiKey, // non-fixture key → the pre-release guard fires on cloud-only ops
      model: { id: MODEL },
      cloud: {
        repos: [{ url: "https://github.com/usetheo/example", startingRef: "main" }],
        autoCreatePR: true,
        envVars: { STAGING_TOKEN: "would-be-encrypted-at-rest" },
      },
    });
    let guard = "";
    try {
      // biome-ignore lint/suspicious/noExplicitAny: cloud-only surface.
      await (agent as any).listArtifacts();
    } catch (err) {
      guard = err instanceof Error ? err.message : String(err);
    }
    json(res, 200, {
      agentId: agent.agentId, // bc-…
      isCloudId: agent.agentId.startsWith("bc-"),
      // biome-ignore lint/suspicious/noExplicitAny: cloud-only surface.
      cloudPayload: (agent as any).cloudPayload ?? null,
      prereleaseGuard: guard,
    });
    await agent.dispose();
    return;
  }

  // ── M3: session resume — the persisted transcript ────────────────────────
  if (p === "/api/history") {
    const messages = await conversationStorage.getMessages(AGENT_ID).catch(() => []);
    json(res, 200, { agentId: AGENT_ID, turns: messages.length, messages });
    return;
  }

  // ── M4 + M5 + M6 + M8 + M1: the live chat ────────────────────────────────
  if (p === "/api/chat") {
    const message = url.searchParams.get("q")?.trim();
    if (!message) {
      res.writeHead(400).end("missing q");
      return;
    }
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });

    artifacts.clear(); // canvas shows only THIS prompt's artifacts (not stale ones from prior runs)
    const t0 = Date.now();
    let firstTokenMs = 0;
    // M3: getOrCreate + shared store → this turn sees prior turns; history grows.
    const agent = await Agent.getOrCreate(AGENT_ID, { apiKey, model: { id: MODEL }, tools, conversationStorage });
    let state = initialAgentStreamState;
    const push = () => sendEvent(res, "state", { items: state.items, streamingText: state.streamingText, status: state.status });

    // M1: cancel the run if the client disconnects (SSE closed).
    let run: Awaited<ReturnType<typeof agent.send>> | undefined;
    let cancelled = false;
    req.on("close", () => {
      cancelled = true;
      void run?.cancel?.();
    });

    // M5: live token streaming via onDelta.
    const onDelta = ({ update }: { update: { type: string; text?: string } }) => {
      if (update.type === "text-delta" && typeof update.text === "string") {
        if (firstTokenMs === 0) firstTokenMs = Date.now() - t0;
        state = agentStreamReducer(state, { type: "text_delta", text: update.text });
        push();
      }
    };

    try {
      // biome-ignore lint/suspicious/noExplicitAny: onDelta option shape.
      run = await agent.send(message, { onDelta } as any);
      for await (const ev of run.stream()) {
        if (cancelled) break;
        const msg = ev as unknown as SdkStreamMessage;
        if (firstTokenMs === 0 && (msg.type === "assistant" || msg.type === "text_delta")) firstTokenMs = Date.now() - t0;
        state = agentStreamReducer(state, msg);
        push();
      }
      state = agentStreamReducer(state, { type: "done" });
      push();
      const final = await run.wait();
      const history = await conversationStorage.getMessages(AGENT_ID).catch(() => []);
      sendEvent(res, "meta", {
        model: MODEL,
        provider: apiKey.startsWith("sk-or-") ? "openrouter" : "auto", // M4
        status: final.status,
        time_to_first_token_ms: firstTokenMs, // M8 north-star
        total_ms: Date.now() - t0,
        usage: final.usage ?? null, // M3 observability
        session_turns: history.length, // M3 resume
        artifacts: [...artifacts.values()], // M6
      });
    } catch (err) {
      sendEvent(res, "error", { message: err instanceof Error ? err.message : String(err) });
    } finally {
      await agent.dispose();
      res.end();
    }
    return;
  }

  res.writeHead(404).end("not found");
});

server.listen(PORT, () => {
  console.log(`\n  Full-stack demo (all 9 milestones) — http://localhost:${PORT}`);
  console.log(`  Model: ${MODEL} via OpenRouter · own key · open stack\n`);
});
