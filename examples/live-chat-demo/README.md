# Live open-stack chat demo

A real, viewable browser chat that exercises the **open stack** end-to-end — the
proof that everything works together on real infrastructure, with your own key.

- **Harness** — `@theokit/sdk` runs a real agent on the **local runtime** (no Theo backend).
- **Skills** — the agent calls real **tools** (`get_current_time`, `roll_dice`) — the same tool-use mechanism the published `@theokit/*` plugins ride on.
- **UI** — every `Run.stream()` message is folded through theo-ui's actual **`agentStreamReducer`** (the `useAgentStream` mapping) and rendered live via SSE.
- **Runtime** — Theo PaaS cloud is **pre-release** (not exercised here; labeled in the header).

Everything against a real LLM via **OpenRouter** — your key, your machine, zero Theo dependency.

## Run

```bash
cd theo-ui   # (@theokit/sdk is already a devDependency)
OPENROUTER_API_KEY=sk-or-… node --experimental-strip-types examples/live-chat-demo/server.ts
# open http://localhost:8787
```

Optional env: `PORT` (default `8787`), `DEMO_MODEL` (default `openai/gpt-4o-mini`).

## Try it

- `What time is it?` → watch the `get_current_time` tool card go running → success, then the answer stream in.
- `Roll a 20-sided dice twice and add them.` → two `roll_dice` tool calls + the sum.
- Anything → live streaming text.

The footer shows the model, run status, **time-to-first-token** (the north-star
`time-to-first-working-agent`), total time, and token usage — measured live.

## How it works

`server.ts` (Node) runs the SDK agent and, for each `Run.stream()` `SDKMessage`,
calls the same `agentStreamReducer` theo-ui ships, then streams the reduced render
state to the browser as Server-Sent Events. `index.html` renders that state (message
bubbles, tool cards, a streaming indicator) — no build step, pure `EventSource`.
