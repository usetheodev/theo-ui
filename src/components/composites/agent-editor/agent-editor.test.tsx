import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AgentEditor } from "./agent-editor.js";

const models = [
  { id: "opus-4-7", label: "Opus 4.7" },
  { id: "sonnet-4-6", label: "Sonnet 4.6" },
];

describe("AgentEditor", () => {
  it("renders empty form for create flow", () => {
    render(<AgentEditor onSave={() => undefined} />);
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByRole("button", { name: /create agent/i })).toBeInTheDocument();
  });

  it("pre-fills fields when editing", () => {
    render(
      <AgentEditor
        initial={{
          id: "a1",
          name: "Coder",
          initials: "CO",
          description: "Writes code",
          tone: "primary",
        }}
        onSave={() => undefined}
      />,
    );
    expect(screen.getByLabelText("Name")).toHaveValue("Coder");
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("disables save until name is filled", async () => {
    const user = userEvent.setup();
    render(<AgentEditor onSave={() => undefined} />);
    const save = screen.getByRole("button", { name: /create agent/i });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText("Name"), "n");
    expect(save).not.toBeDisabled();
  });

  it("uppercases initials and clips to 2 chars", async () => {
    const user = userEvent.setup();
    render(<AgentEditor onSave={() => undefined} />);
    await user.type(screen.getByLabelText("Initials"), "codr");
    expect(screen.getByLabelText("Initials")).toHaveValue("CO");
  });

  it("saves with parsed allowedTools and selected skills", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <AgentEditor
        onSave={onSave}
        models={models}
        skills={[
          { id: "sk1", label: "diff-explainer" },
          { id: "sk2", label: "test-runner" },
        ]}
      />,
    );
    await user.type(screen.getByLabelText("Name"), "Reviewer");
    await user.type(screen.getByLabelText(/Allowed tools/i), "Read, Grep");
    await user.click(screen.getByRole("button", { name: "test-runner", pressed: false }));
    await user.click(screen.getByRole("button", { name: /create agent/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Reviewer",
        allowedTools: ["Read", "Grep"],
        skillIds: ["sk2"],
        model: "opus-4-7",
      }),
    );
  });
});
