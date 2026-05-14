import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { AgentEvent as AgentEventModel } from "../../../types/agent.js";
import { AgentEvent } from "./agent-event.js";

const baseEvent: AgentEventModel = {
  id: "e1",
  label: "Read src/index.ts",
  type: "file_read",
  status: "success",
  path: "src/index.ts",
};

describe("AgentEvent", () => {
  it("renders the event label and path", () => {
    render(<AgentEvent event={baseEvent} />);
    expect(screen.getByText("Read src/index.ts")).toBeInTheDocument();
    expect(screen.getByText("src/index.ts")).toBeInTheDocument();
  });

  it("renders diff stats when provided", () => {
    render(<AgentEvent event={{ ...baseEvent, diff: { added: 12, removed: 3 } }} />);
    expect(screen.getByText("+12")).toBeInTheDocument();
    expect(screen.getByText("-3")).toBeInTheDocument();
  });

  it("toggles detail when collapsible and clicked", async () => {
    const user = userEvent.setup();
    render(<AgentEvent event={{ ...baseEvent, detail: "extra payload" }} collapsible />);
    expect(screen.queryByText("extra payload")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(screen.getByText("extra payload")).toBeInTheDocument();
  });

  it("renders without expand affordance when not collapsible", () => {
    render(<AgentEvent event={baseEvent} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
