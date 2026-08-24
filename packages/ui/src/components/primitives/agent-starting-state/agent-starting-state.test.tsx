import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentStartingState } from "./agent-starting-state.js";

describe("AgentStartingState", () => {
  it("renders the default label and announces politely", () => {
    const { container } = render(<AgentStartingState />);
    expect(screen.getByText(/Starting up/)).toBeInTheDocument();
    const output = container.querySelector("output");
    expect(output?.getAttribute("aria-live")).toBe("polite");
  });

  it("renders custom label and hint", () => {
    render(<AgentStartingState label="Connecting" hint="Loading MCP servers…" />);
    expect(screen.getByText("Connecting")).toBeInTheDocument();
    expect(screen.getByText("Loading MCP servers…")).toBeInTheDocument();
  });
});
