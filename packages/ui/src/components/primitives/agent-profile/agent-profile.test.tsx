import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AgentProfile, type AgentProfileDescriptor } from "./agent-profile.js";

const agents: AgentProfileDescriptor[] = [
  { id: "coder", name: "Coder", initials: "CO", tone: "primary" },
  { id: "reviewer", name: "Reviewer", initials: "RV", tone: "info" },
];

describe("AgentProfile", () => {
  it("renders the active agent label", () => {
    render(<AgentProfile agents={agents} activeId="coder" />);
    expect(screen.getByRole("button", { name: /Coder/ })).toBeInTheDocument();
  });

  it("opens dropdown and calls onChange on selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AgentProfile agents={agents} activeId="coder" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /Coder/ }));
    await user.click(screen.getByRole("menuitem", { name: /Reviewer/ }));
    expect(onChange).toHaveBeenCalledWith("reviewer");
  });
});
