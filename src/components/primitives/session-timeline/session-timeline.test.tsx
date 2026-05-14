import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type SessionSummary, SessionTimeline } from "./session-timeline.js";

const sessions: SessionSummary[] = [
  {
    id: "s1",
    title: "Refactor build pipeline",
    startedAt: "2026-05-13 10:00",
    duration: "45m",
    status: "completed",
    model: "Opus 4.7",
    tokens: "120k",
    cost: 4.8,
    messageCount: 24,
  },
  {
    id: "s2",
    title: "Debug deploy",
    startedAt: "2026-05-13 12:00",
    status: "active",
    model: "Sonnet 4.6",
  },
];

describe("SessionTimeline", () => {
  it("renders each session title", () => {
    render(<SessionTimeline sessions={sessions} />);
    expect(screen.getByText("Refactor build pipeline")).toBeInTheDocument();
    expect(screen.getByText("Debug deploy")).toBeInTheDocument();
  });

  it("renders the status labels", () => {
    render(<SessionTimeline sessions={sessions} />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("calls onOpen with the session id when a row is clicked", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<SessionTimeline sessions={sessions} onOpen={onOpen} />);
    await user.click(screen.getByText("Refactor build pipeline"));
    expect(onOpen).toHaveBeenCalledWith("s1");
  });
});
