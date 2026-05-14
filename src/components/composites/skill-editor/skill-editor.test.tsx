import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SkillEditor } from "./skill-editor.js";

describe("SkillEditor", () => {
  it("renders empty form for create flow", () => {
    render(<SkillEditor onSave={() => undefined} />);
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByRole("button", { name: /create skill/i })).toBeInTheDocument();
  });

  it("pre-fills name and description when editing", () => {
    render(
      <SkillEditor
        initial={{
          id: "s1",
          name: "diff-explainer",
          description: "Explain diffs in English",
          source: "user",
          state: "enabled",
        }}
        onSave={() => undefined}
      />,
    );
    expect(screen.getByLabelText("Name")).toHaveValue("diff-explainer");
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("disables save until name is filled", async () => {
    const user = userEvent.setup();
    render(<SkillEditor onSave={() => undefined} />);
    const save = screen.getByRole("button", { name: /create skill/i });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText("Name"), "n");
    expect(save).not.toBeDisabled();
  });

  it("saves with parsed allowedTools and triggers arrays", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<SkillEditor onSave={onSave} />);
    await user.type(screen.getByLabelText("Name"), "explainer");
    await user.type(screen.getByLabelText(/Allowed tools/i), "Read, Grep");
    await user.type(screen.getByLabelText(/Triggers/i), "explain, summarize");
    await user.click(screen.getByRole("button", { name: /create skill/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "explainer",
        allowedTools: ["Read", "Grep"],
        triggers: ["explain", "summarize"],
        source: "user",
        state: "enabled",
      }),
    );
  });
});
