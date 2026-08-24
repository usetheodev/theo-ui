import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentHandoff } from "./agent-handoff.js";

describe("AgentHandoff", () => {
  it("renders both parties and the reason", () => {
    render(
      <AgentHandoff
        from={{ name: "planner", initials: "PL" }}
        to={{ name: "coder", initials: "CD", tone: "accent" }}
        reason="Pass full implementation plan to coder."
      />,
    );
    expect(screen.getByText("planner")).toBeInTheDocument();
    expect(screen.getByText("coder")).toBeInTheDocument();
    expect(screen.getByText(/Pass full implementation plan/)).toBeInTheDocument();
    expect(screen.getByText(/handoff/i)).toBeInTheDocument();
  });

  it("derives initials from name when none provided", () => {
    render(
      <AgentHandoff
        from={{ name: "reviewer" }}
        to={{ name: "auditor" }}
        reason="Review and sign off"
      />,
    );
    expect(screen.getByText("RE")).toBeInTheDocument();
    expect(screen.getByText("AU")).toBeInTheDocument();
  });

  it("renders optional footer", () => {
    render(
      <AgentHandoff
        from={{ name: "a" }}
        to={{ name: "b" }}
        reason="x"
        footer="2026-05-13 18:42 · 1.2k tokens"
      />,
    );
    expect(screen.getByText(/2026-05-13/)).toBeInTheDocument();
  });
});
