import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type Skill, SkillCard } from "./skill-card.js";

const skill: Skill = {
  id: "sk1",
  name: "diff-explainer",
  description: "Explain diffs in English.",
  source: "user",
  state: "enabled",
  allowedTools: ["Read", "Grep"],
  triggers: ["explain"],
};

describe("SkillCard", () => {
  it("renders name, description and source badge", () => {
    render(<SkillCard skill={skill} />);
    expect(screen.getByText("diff-explainer")).toBeInTheDocument();
    expect(screen.getByText(/Explain diffs/)).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
  });

  it("toggles state when the toggle button is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<SkillCard skill={skill} onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: /enabled/i }));
    expect(onToggle).toHaveBeenCalledWith("sk1", "disabled");
  });
});
