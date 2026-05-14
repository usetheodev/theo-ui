import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type AuditEntry, AuditLogEntry } from "./audit-log-entry.js";

const baseEntry: AuditEntry = {
  id: "1",
  actor: { kind: "agent", name: "coder" },
  action: "wrote file",
  target: "src/index.ts",
  timestamp: "12:42",
};

describe("AuditLogEntry", () => {
  it("renders actor, action, target, and timestamp", () => {
    render(<AuditLogEntry entry={baseEntry} />);
    expect(screen.getByText("coder")).toBeInTheDocument();
    expect(screen.getByText("wrote file")).toBeInTheDocument();
    expect(screen.getByText("src/index.ts")).toBeInTheDocument();
    expect(screen.getByText("12:42")).toBeInTheDocument();
  });

  it("renders optional detail block", () => {
    render(<AuditLogEntry entry={{ ...baseEntry, detail: "+ 32 lines, -4 lines" }} />);
    expect(screen.getByText(/\+ 32 lines/)).toBeInTheDocument();
  });

  it("renders different severities without crashing", () => {
    render(<AuditLogEntry entry={{ ...baseEntry, id: "2", severity: "warning" }} />);
    render(<AuditLogEntry entry={{ ...baseEntry, id: "3", severity: "error" }} />);
    expect(screen.getAllByText("coder")).toHaveLength(2);
  });
});
