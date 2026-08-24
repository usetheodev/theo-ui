import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type HookEventEntry, HookEventLog } from "./hook-event-log.js";

const events: HookEventEntry[] = [
  {
    id: "e1",
    event: "PreToolUse",
    matcher: "Bash",
    command: "echo before",
    result: "ok",
    timestamp: "12:42",
  },
  {
    id: "e2",
    event: "PreToolUse",
    matcher: "Bash",
    command: "block",
    result: "blocked",
    timestamp: "12:43",
    output: "policy denied rm -rf",
  },
];

describe("HookEventLog", () => {
  it("renders the default title and event count", () => {
    render(<HookEventLog events={events} />);
    expect(screen.getByRole("heading", { name: /Hook log/i })).toBeInTheDocument();
    expect(screen.getByText(/2 events/)).toBeInTheDocument();
  });

  it("renders each event command and timestamp", () => {
    render(<HookEventLog events={events} />);
    expect(screen.getByText("echo before")).toBeInTheDocument();
    expect(screen.getByText("block")).toBeInTheDocument();
    expect(screen.getByText("12:42")).toBeInTheDocument();
    expect(screen.getByText("12:43")).toBeInTheDocument();
  });

  it("renders blocked output snippet when provided", () => {
    render(<HookEventLog events={events} />);
    expect(screen.getByText(/policy denied/)).toBeInTheDocument();
  });
});
