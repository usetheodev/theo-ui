# Full-stack demo — all 9 milestones, live

A single browser app that **proves every ecosystem milestone (M0–M8) live**, on
real infrastructure (OpenRouter), with your own key — the open stack end to end.

## Run

```bash
cd theo-ui   # @theokit/sdk + @theokit/plugin-canvas are devDependencies
OPENROUTER_API_KEY=sk-or-… node --experimental-strip-types examples/full-stack-demo/server.ts
# open http://localhost:8788
```

Left: a real streaming chat + a canvas for artifacts. Right: the **9-milestone
dashboard** — cards light up as each milestone is exercised, with "prove it" buttons
for the ones that aren't hit by chatting.

## What proves each milestone

| Milestone | How the demo proves it | Where |
| --- | --- | --- |
| **M0** Security floor | `Security.redact()` scrubs a secret key/token from text | **Redact a secret** button |
| **M1** Correctness · abort | Click **Stop** mid-reply → the run is cancelled (AbortSignal threaded into the loop) | Stop button |
| **M2** Resilience | A bad request surfaces a **typed error** (`invalid_request`, fail-fast) — no hang, no crash | **Trigger a failure** button |
| **M3** State + observability | Non-lossy **session resume** (turns survive across requests) + live token/usage metrics | **Show persisted session** + footer |
| **M4** Skills ↔ Harness | The explicit `sk-or-` key **routes to OpenRouter** (the M4 fix) | chat footer `provider: openrouter` |
| **M5** UI ↔ Harness | **Live token streaming** through theo-ui's real `agentStreamReducer` (via `onDelta`) | reply types out live |
| **M6** Cluster · real plugin | A **published `@theokit/plugin-canvas`** (npm 0.3.1) validates + renders artifacts via a tool | ask for a code/markdown artifact → canvas |
| **M7** Runtime · cloud | Contract-only: the `cloudPayload` contract, a **`bc-` cloud id**, and the **pre-release guard** | **Inspect cloud contract** button |
| **M8** GA readiness | North-star **time-to-first-working-agent**, measured per reply | chat footer `first token …ms` |

Cloud (M7) is intentionally **pre-release** — the demo shows the contract + the
honest guard, it does not call a live PaaS (none exists yet).

## Try it

- `What time is it?` → tool card + streamed answer (M4/M5 + Skills tool-use).
- `Write a Python function to reverse a string as a code artifact.` → the published
  canvas plugin validates + renders a code artifact (M6).
- Chat a few turns, then **Show persisted session** → the transcript survives (M3).
- **Trigger a failure** / **Redact a secret** / **Inspect cloud contract** → M2 / M0 / M7.
- Start a long reply and hit **Stop** → the run aborts (M1).

## How it works

`server.ts` (Node, real `@theokit/sdk` local runtime) runs the agent and maps each
milestone to an endpoint; `run.stream()` + `onDelta` are folded through the same
`agentStreamReducer` theo-ui ships, streamed to the browser as SSE. `index.html`
renders it — no build step, pure `EventSource`.
