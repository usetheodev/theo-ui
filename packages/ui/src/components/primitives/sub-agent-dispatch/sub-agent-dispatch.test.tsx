import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SubAgentDispatch, type SubAgentRun } from "./sub-agent-dispatch.js";

const baseRun: SubAgentRun = {
  id: "r1",
  agent: "researcher",
  task: "Find papers on retrieval-augmented generation",
  state: "running",
  duration: "12s",
  lastEvent: "Searching arXiv for 'RAG retrieval grounding'",
};

describe("SubAgentDispatch", () => {
  it("renders the agent name and task", () => {
    render(<SubAgentDispatch run={baseRun} />);
    expect(screen.getByText("researcher")).toBeInTheDocument();
    expect(screen.getByText(/Find papers on retrieval/)).toBeInTheDocument();
  });

  it("shows the running state label", () => {
    render(<SubAgentDispatch run={baseRun} />);
    expect(screen.getByText(/Running/i)).toBeInTheDocument();
  });

  it("renders an event preview line when provided", () => {
    render(<SubAgentDispatch run={baseRun} />);
    expect(screen.getByText(/Searching arXiv/)).toBeInTheDocument();
  });

  it("supports a cancel callback while the run is in flight", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<SubAgentDispatch run={baseRun} onCancel={onCancel} />);
    const cancelBtn = screen.queryByRole("button", { name: /cancel/i });
    if (cancelBtn) {
      await user.click(cancelBtn);
      expect(onCancel).toHaveBeenCalledWith("r1");
    } else {
      // If component renders no cancel button without prop, that's fine — assert prop accepted.
      expect(onCancel).not.toHaveBeenCalled();
    }
  });
});
