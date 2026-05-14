import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RuleEditor } from "./rule-editor.js";

describe("RuleEditor", () => {
  it("renders empty form for create flow", () => {
    render(<RuleEditor onSave={() => undefined} />);
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByRole("button", { name: /create rule/i })).toBeInTheDocument();
  });

  it("pre-fills fields when initial is provided", () => {
    render(
      <RuleEditor
        initial={{
          id: "r1",
          title: "Use snap",
          body: "Always pass snap, never stiffness.",
          scope: "project",
          state: "enabled",
          tags: ["style"],
        }}
        onSave={() => undefined}
      />,
    );
    expect(screen.getByLabelText("Title")).toHaveValue("Use snap");
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("disables save until title and body are filled", async () => {
    const user = userEvent.setup();
    render(<RuleEditor onSave={() => undefined} />);
    const save = screen.getByRole("button", { name: /create rule/i });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText("Title"), "x");
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText(/Body/i), "y");
    expect(save).not.toBeDisabled();
  });

  it("calls onSave with the trimmed draft", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<RuleEditor onSave={onSave} />);
    await user.type(screen.getByLabelText("Title"), "  My rule  ");
    await user.type(screen.getByLabelText(/Body/i), "  body  ");
    await user.type(screen.getByLabelText(/Tags/i), "  a, b ");
    await user.click(screen.getByRole("button", { name: /create rule/i }));
    expect(onSave).toHaveBeenCalledWith({
      id: undefined,
      title: "My rule",
      body: "body",
      scope: "global",
      state: "enabled",
      tags: ["a", "b"],
    });
  });

  it("calls onCancel and onDelete when their buttons are clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onDelete = vi.fn();
    render(
      <RuleEditor
        initial={{ id: "r1", title: "x", body: "y", scope: "global", state: "enabled" }}
        onSave={() => undefined}
        onCancel={onCancel}
        onDelete={onDelete}
      />,
    );
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
