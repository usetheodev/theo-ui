import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type TerminalLine, TerminalPanel } from "./terminal-panel.js";

const lines: TerminalLine[] = [
  { id: "1", kind: "command", content: "pnpm test" },
  { id: "2", kind: "stdout", content: "running 12 tests" },
  { id: "3", kind: "ok", content: "All passed" },
  { id: "4", kind: "stderr", content: "warning: deprecated api" },
];

describe("TerminalPanel", () => {
  it("renders the default title and all lines", () => {
    render(<TerminalPanel lines={lines} />);
    expect(screen.getByText(/Terminal/i)).toBeInTheDocument();
    expect(screen.getByText("pnpm test")).toBeInTheDocument();
    expect(screen.getByText("running 12 tests")).toBeInTheDocument();
    expect(screen.getByText("All passed")).toBeInTheDocument();
    expect(screen.getByText(/deprecated api/)).toBeInTheDocument();
  });

  it("renders custom prompt prefix on command lines", () => {
    render(<TerminalPanel lines={lines} promptPrefix=">" />);
    expect(screen.getByText(">", { exact: false })).toBeInTheDocument();
  });

  it("supports a custom title", () => {
    render(<TerminalPanel title="Build output" lines={[]} />);
    expect(screen.getByText("Build output")).toBeInTheDocument();
  });
});
