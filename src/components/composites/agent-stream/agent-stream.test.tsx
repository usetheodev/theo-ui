import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentStream, type AgentStreamItem } from "./agent-stream.js";

describe("AgentStream", () => {
  it("renders a heterogeneous stream of items in order", () => {
    const items: AgentStreamItem[] = [
      {
        kind: "message",
        id: "m1",
        message: { id: "m1", role: "user", content: "Hello agent" },
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
    expect(screen.getByText("Hello agent")).toBeInTheDocument();
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
