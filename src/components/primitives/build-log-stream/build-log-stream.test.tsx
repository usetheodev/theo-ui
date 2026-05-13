import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BuildLogStream, type LogLine } from "./build-log-stream.js";

const lines: LogLine[] = [
  { id: "1", timestamp: "10:01:32", level: "info", message: "starting build" },
  { id: "2", timestamp: "10:01:34", level: "debug", message: "loading dependencies" },
  { id: "3", timestamp: "10:01:40", level: "warn", message: "deprecated API used" },
  { id: "4", timestamp: "10:01:44", level: "success", message: "types ok" },
  { id: "5", timestamp: "10:01:58", level: "error", message: "failed to start" },
];

describe("BuildLogStream", () => {
  it("renders every line by default", () => {
    render(<BuildLogStream lines={lines} />);
    expect(screen.getByText("starting build")).toBeInTheDocument();
    expect(screen.getByText("loading dependencies")).toBeInTheDocument();
    expect(screen.getByText("deprecated API used")).toBeInTheDocument();
    expect(screen.getByText("types ok")).toBeInTheDocument();
    expect(screen.getByText("failed to start")).toBeInTheDocument();
  });

  it("renders empty state when no lines", () => {
    render(<BuildLogStream lines={[]} />);
    expect(screen.getByText("No log lines.")).toBeInTheDocument();
  });

  it("filters lines when a single level is toggled active", async () => {
    const user = userEvent.setup();
    render(<BuildLogStream lines={lines} />);
    // Initial state: all active (empty Set = show all)
    expect(screen.getByText("loading dependencies")).toBeInTheDocument();
    // Click 'error' — this puts only 'error' in the visibleLevels set
    await user.click(screen.getByRole("button", { name: "error" }));
    expect(screen.getByText("failed to start")).toBeInTheDocument();
    expect(screen.queryByText("loading dependencies")).not.toBeInTheDocument();
    expect(screen.queryByText("starting build")).not.toBeInTheDocument();
  });

  it("renders source prefix when provided", () => {
    render(
      <BuildLogStream
        lines={[
          { id: "1", timestamp: "10:01", level: "info", message: "compiling", source: "tsc" },
        ]}
      />,
    );
    expect(screen.getByText("tsc:")).toBeInTheDocument();
    expect(screen.getByText("compiling")).toBeInTheDocument();
  });

  it("hides filter UI when filterable=false", () => {
    render(<BuildLogStream lines={lines} filterable={false} />);
    expect(screen.queryByRole("button", { name: "info" })).not.toBeInTheDocument();
  });
});
