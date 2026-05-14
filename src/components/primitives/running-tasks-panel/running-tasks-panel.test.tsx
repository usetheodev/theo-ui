import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type RunningTaskItem, RunningTasksPanel } from "./running-tasks-panel.js";

const tasks: RunningTaskItem[] = [
  { id: "1", label: "pnpm test", source: "bash", status: "running" },
  { id: "2", label: "format check", source: "bash", status: "completed" },
];

describe("RunningTasksPanel", () => {
  it("renders both Running and Completed sections when applicable", () => {
    render(<RunningTasksPanel tasks={tasks} />);
    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("pnpm test")).toBeInTheDocument();
    expect(screen.getByText("format check")).toBeInTheDocument();
  });

  it("hides the Completed group when no completed tasks", () => {
    render(<RunningTasksPanel tasks={[tasks[0] as RunningTaskItem]} />);
    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.queryByText("Completed")).not.toBeInTheDocument();
  });

  it("renders an empty hint when nothing is running", () => {
    render(<RunningTasksPanel tasks={[tasks[1] as RunningTaskItem]} />);
    expect(screen.getByText("Nothing running")).toBeInTheDocument();
  });
});
