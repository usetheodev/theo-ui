import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AgentEvent } from "../../types/agent.js";
import { AgentTimeline } from "./agent-timeline.js";

const events: AgentEvent[] = [
  {
    id: "1",
    type: "command",
    label: "Start dev server",
    status: "success",
    timestamp: "9:58:14 PM",
  },
  {
    id: "2",
    type: "edit",
    label: "Edit AlignmentGrid.tsx",
    path: "src/components/AlignmentGrid.tsx",
    diff: { added: 142, removed: 38 },
    status: "success",
    timestamp: "9:58:42 PM",
  },
  { id: "3", type: "lint", label: "Lint", status: "running" },
  { id: "4", type: "build", label: "Build", status: "pending" },
  { id: "5", type: "tool", label: "Read file failed", status: "failed" },
];

describe("AgentTimeline", () => {
  it("renders every event label", () => {
    render(<AgentTimeline events={events} />);
    expect(screen.getByText("Start dev server")).toBeInTheDocument();
    expect(screen.getByText("Edit AlignmentGrid.tsx")).toBeInTheDocument();
    expect(screen.getByText("Lint")).toBeInTheDocument();
    expect(screen.getByText("Build")).toBeInTheDocument();
  });

  it("renders diff stats with +/- counters", () => {
    render(<AgentTimeline events={events} />);
    expect(screen.getByText("+142")).toBeInTheDocument();
    expect(screen.getByText("-38")).toBeInTheDocument();
  });

  it("shows path when provided", () => {
    render(<AgentTimeline events={events} />);
    expect(screen.getByText("src/components/AlignmentGrid.tsx")).toBeInTheDocument();
  });

  it("annotates each event with status icon aria-label", () => {
    render(<AgentTimeline events={events} />);
    expect(screen.getAllByLabelText("success").length).toBe(2);
    expect(screen.getAllByLabelText("running").length).toBe(1);
    expect(screen.getAllByLabelText("pending").length).toBe(1);
    expect(screen.getAllByLabelText("failed").length).toBe(1);
  });
});
