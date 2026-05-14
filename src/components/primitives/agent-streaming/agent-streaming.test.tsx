import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentStreaming } from "./agent-streaming.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
describe("AgentStreaming", () => {
  it("renders the default thinking placeholder", () => {
    render(<AgentStreaming />);
    expect(screen.getByText("thinking…")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders the partial text when provided", () => {
    render(<AgentStreaming partial="On it. I'll inspect the…" />);
    expect(screen.getByText(/On it. I'll inspect/)).toBeInTheDocument();
    expect(screen.queryByText("thinking…")).toBeNull();
  });

  it("renders the model chip when provided", () => {
    render(<AgentStreaming model="Opus 4.7" />);
    expect(screen.getByText("Opus 4.7")).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<AgentStreaming />);
  });
});
