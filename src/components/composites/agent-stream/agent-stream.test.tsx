import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentStream, type AgentStreamItem } from "./agent-stream.js";

describe("AgentStream", () => {
  it("renders a heterogeneous stream of items in order", async () => {
    const items: AgentStreamItem[] = [
      {
        kind: "message",
        id: "m1",
        message: { id: "m1", role: "user", parts: [{ type: "text", text: "Hello agent" }] },
      },
      {
        kind: "tool-call",
        id: "t1",
        tool: "Bash",
        target: "ls",
        status: "success",
      },
      {
        kind: "approval",
        id: "a1",
        title: "Run command?",
        request: "rm -rf node_modules",
        onApprove: () => undefined,
        onDeny: () => undefined,
      },
      {
        kind: "error",
        id: "e1",
        title: "Rate limit hit",
      },
      { kind: "streaming", id: "s1", model: "Opus 4.7" },
    ];
    render(<AgentStream items={items} />);
    // `ChatMessage` renders text via async markdown pipeline; wait for it.
    // ChatMessage v2 renders text via the async markdown pipeline.
    // Under heavy parallel test load (vitest's pool), the default 1s
    // findByText timeout can race with the dynamic-import settle. Give
    // it more headroom so the suite is robust on slower machines.
    expect(
      await screen.findByText("Hello agent", undefined, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Bash")).toBeInTheDocument();
    expect(screen.getByText("Run command?")).toBeInTheDocument();
    expect(screen.getByText("Rate limit hit")).toBeInTheDocument();
    expect(screen.getByText("thinking…")).toBeInTheDocument();
  });

  it("renders the log role for screen readers", () => {
    render(<AgentStream items={[]} />);
    expect(screen.getByRole("log")).toBeInTheDocument();
  });

  it("renders custom escape-hatch nodes", () => {
    render(
      <AgentStream items={[{ kind: "custom", id: "c1", node: <span>diff card here</span> }]} />,
    );
    expect(screen.getByText("diff card here")).toBeInTheDocument();
  });
});
