import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentErrorCard } from "./agent-error-card.js";

describe("AgentErrorCard", () => {
  it("renders title with alert role", () => {
    render(<AgentErrorCard title="Rate limit hit" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Rate limit hit")).toBeInTheDocument();
  });

  it("renders detail and timestamp when provided", () => {
    render(
      <AgentErrorCard
        kind="rate-limit"
        title="Rate limit hit"
        detail="Retry after 60s"
        timestamp="9:59 PM"
      />,
    );
    expect(screen.getByText("Retry after 60s")).toBeInTheDocument();
    expect(screen.getByText("9:59 PM")).toBeInTheDocument();
  });

  it("renders actions slot when provided", () => {
    render(<AgentErrorCard title="Auth lost" actions={<button type="button">Re-auth</button>} />);
    expect(screen.getByRole("button", { name: "Re-auth" })).toBeInTheDocument();
  });
});
