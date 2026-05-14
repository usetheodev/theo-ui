import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { Skill } from "../../primitives/skill-card/index.js";
import { SkillsList } from "./skills-list.js";

const skills: Skill[] = [
  { id: "s1", name: "Code review", source: "builtin", description: "Review staged changes" },
  { id: "s2", name: "Database query", source: "project", description: "Run SQL through MCP" },
];

describe("SkillsList", () => {
  it("renders the title and every skill name", () => {
    render(<SkillsList skills={skills} />);
    expect(screen.getByRole("heading", { name: /Skills/ })).toBeInTheDocument();
    expect(screen.getByText("Code review")).toBeInTheDocument();
    expect(screen.getByText("Database query")).toBeInTheDocument();
  });

  it("filters skills based on the search input", async () => {
    const user = userEvent.setup();
    render(<SkillsList skills={skills} />);
    const search = screen.getByPlaceholderText(/filter/i);
    await user.type(search, "database");
    expect(screen.getByText("Database query")).toBeInTheDocument();
    expect(screen.queryByText("Code review")).not.toBeInTheDocument();
  });

  it("can hide the search input via searchable=false", () => {
    render(<SkillsList skills={skills} searchable={false} />);
    expect(screen.queryByPlaceholderText(/filter/i)).not.toBeInTheDocument();
  });
});
