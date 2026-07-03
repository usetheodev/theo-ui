/**
 * Live open-stack chat demo — server.
 *
 * Exercises the whole open stack end-to-end on real infrastructure:
 *   Harness (@theokit/sdk local runtime) runs a real agent against OpenRouter,
 *   with a real tool (Skills extension mechanism), and every `Run.stream()`
 *   SDKMessage is folded through theo-ui's ACTUAL `agentStreamReducer` (the UI
 *   pillar's mapping) — the reduced render state is streamed to the browser via
 *   Server-Sent Events. Zero dependency on Theo's backend; your own key only.
 *
 * Run:
 *   OPENROUTER_API_KEY=… node --experimental-strip-types server.ts
 *   → open http://localhost:8787
 */
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Agent } from "@theokit/sdk";
import {
  agentStreamReducer,
  initialAgentStreamState,
} from "../../src/hooks/use-agent-stream/agent-stream-reducer.ts";
import type { SdkStreamMessage } from "../../src/hooks/use-agent-stream/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 8787);
const MODEL = process.env.DEMO_MODEL ?? "openai/gpt-4o-mini";
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error("Set OPENROUTER_API_KEY before running the demo.");
  process.exit(2);
}

// Skills: a real JSON-schema tool the agent can call — the same tool-use path the
// published @theokit/* plugins ride on.
const tools = [
  {
    name: "get_current_time",
    description: "Returns the current UTC time as an ISO 8601 string.",
    inputSchema: { type: "object", properties: {}, required: [] },
    handler: () => new Date().toISOString(),
  },
  {
    name: "roll_dice",
    description: "Rolls an N-sided dice and returns the result.",
    inputSchema: {
      type: "object",
      properties: { sides: { type: "number", description: "number of sides (default 6)" } },
      required: [],
    },
    handler: (input: { sides?: number }) => {
      const sides = typeof input?.sides === "number" && input.sides > 1 ? Math.floor(input.sides) : 6;
      return String(1 + Math.floor(Math.random() * sides));
    },
  },
];

const html = readFileSync(join(HERE, "index.html"), "utf8");

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  if (url.pathname === "/api/chat") {
    const message = url.searchParams.get("q")?.trim();
    if (!message) {
      res.writeHead(400).end("missing q");
      return;
    }
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });
    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const t0 = Date.now();
    let firstTokenMs = 0;
    // biome-ignore lint/suspicious/noExplicitAny: raw JSON-schema tools.
    const agent = await Agent.create({ apiKey, model: { id: MODEL }, tools: tools as any });
    try {
      let state = initialAgentStreamState;
      const push = () =>
        send("state", { items: state.items, streamingText: state.streamingText, status: state.status });

      // LIVE token streaming: the SDK's `onDelta` fires a `text-delta` per token as
      // the LLM produces it — fold each into the reducer (as `text_delta`) so the
      // browser renders the answer typing out in real time. `run.stream()` below
      // supplies the structural events (tool cards) + the finalized message.
      const onDelta = ({ update }: { update: { type: string; text?: string } }) => {
        if (update.type === "text-delta" && typeof update.text === "string") {
          if (firstTokenMs === 0) firstTokenMs = Date.now() - t0;
          state = agentStreamReducer(state, { type: "text_delta", text: update.text });
          push();
        }
      };

      // biome-ignore lint/suspicious/noExplicitAny: onDelta option shape.
      const run = await agent.send(message, { onDelta } as any);
      for await (const ev of run.stream()) {
        const msg = ev as unknown as SdkStreamMessage;
        if (firstTokenMs === 0 && (msg.type === "assistant" || msg.type === "text_delta")) {
          firstTokenMs = Date.now() - t0;
        }
        // Tool lifecycle + the finalized assistant message (which folds the streamed
        // text into a message bubble). Plain text_delta from stream (if any) also folds.
        state = agentStreamReducer(state, msg);
        push();
      }
      state = agentStreamReducer(state, { type: "done" });
      const final = await run.wait();
      send("state", { items: state.items, streamingText: "", status: "done" });
      send("meta", {
        model: MODEL,
        status: final.status,
        time_to_first_token_ms: firstTokenMs,
        total_ms: Date.now() - t0,
        usage: final.usage ?? null,
      });
    } catch (err) {
      send("error", { message: err instanceof Error ? err.message : String(err) });
    } finally {
      await agent.dispose();
      res.end();
    }
    return;
  }

  res.writeHead(404).end("not found");
});

server.listen(PORT, () => {
  console.log(`\n  Live open-stack chat demo — http://localhost:${PORT}`);
  console.log(`  Model: ${MODEL} (via OpenRouter) · Harness + Skills(tools) + UI(useAgentStream reducer)\n`);
});
