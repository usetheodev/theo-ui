import { describe, expect, it } from "vitest";
import type { AgentEvent } from "../../../types/agent.js";
import type { UIMessage } from "../../../types/chat.js";
import { mapAgentEventStatus, toAgentStreamItems } from "./to-agent-stream-items.js";

/* ─── T1.1 — status mapping ──────────────────────────────────────────── */

describe("mapAgentEventStatus (M5-6)", () => {
  it("maps pending → queued and passes the rest through", () => {
    expect(mapAgentEventStatus("pending")).toBe("queued");
    expect(mapAgentEventStatus("running")).toBe("running");
    expect(mapAgentEventStatus("success")).toBe("success");
    expect(mapAgentEventStatus("failed")).toBe("failed");
  });
});

/* ─── T2.1 — the builder ─────────────────────────────────────────────── */

const history: UIMessage[] = [{ id: "m1", role: "user", parts: [{ type: "text", text: "hi" }] }];
const live: AgentEvent[] = [
  { id: "e1", type: "command", label: "npm test", status: "running" },
  { id: "e2", type: "edit", label: "edit a.ts", path: "a.ts", status: "success", detail: "ok" },
];

describe("toAgentStreamItems (M5-6)", () => {
  it("merges history then live, preserving order", () => {
    const items = toAgentStreamItems({ history, live });
    expect(items.map((i) => i.kind)).toEqual(["message", "tool-call", "tool-call"]);
    expect(items[0]).toMatchObject({ kind: "message", id: "m1" });
    expect(items[1]).toMatchObject({
      kind: "tool-call",
      id: "e1",
      tool: "npm test",
      status: "running",
    });
    expect(items[2]).toMatchObject({
      kind: "tool-call",
      id: "e2",
      target: "a.ts",
      output: "ok",
      status: "success",
    });
  });

  it("returns [] for empty/omitted inputs", () => {
    expect(toAgentStreamItems({})).toEqual([]);
    expect(toAgentStreamItems({ history: [] })).toEqual([]);
  });

  it("renders only history when live is omitted, and vice-versa", () => {
    expect(toAgentStreamItems({ history }).map((i) => i.kind)).toEqual(["message"]);
    expect(toAgentStreamItems({ live }).map((i) => i.kind)).toEqual(["tool-call", "tool-call"]);
  });

  it("shallow-merges classifyTool over the default tool-call fields", () => {
    const out = toAgentStreamItems({ live }, { classifyTool: (e) => ({ tool: `T:${e.label}` }) });
    expect(out[0]).toMatchObject({ tool: "T:npm test", id: "e1", status: "running" });
  });

  it("classifyTool can override output/target without corrupting kind/id/status", () => {
    const out = toAgentStreamItems(
      { live: [live[0] as AgentEvent] },
      { classifyTool: () => ({ output: "custom", target: "x" }) },
    );
    expect(out[0]).toMatchObject({
      kind: "tool-call",
      id: "e1",
      status: "running",
      output: "custom",
      target: "x",
    });
  });
});

/* ─── T3.1 — barrel wiring ───────────────────────────────────────────── */

describe("agent-stream barrel (M5-6 wiring)", () => {
  it("exposes toAgentStreamItems + mapAgentEventStatus", async () => {
    const mod = await import("./index.js");
    expect(typeof mod.toAgentStreamItems).toBe("function");
    expect(typeof mod.mapAgentEventStatus).toBe("function");
  });
});
