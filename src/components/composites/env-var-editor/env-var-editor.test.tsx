import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type EnvVar, EnvVarEditor } from "./env-var-editor.js";

const vars: EnvVar[] = [
  { id: "1", key: "DATABASE_URL", value: "postgres://u:p@h/db", masked: true, scope: "production" },
  { id: "2", key: "LOG_LEVEL", value: "info", scope: "all" },
  { id: "3", key: "THEO_DEPLOY_ID", value: "dpl_abcdef", readonly: true, scope: "production" },
];

describe("EnvVarEditor", () => {
  it("renders all variables", () => {
    render(<EnvVarEditor vars={vars} />);
    expect(screen.getByText("DATABASE_URL")).toBeInTheDocument();
    expect(screen.getByText("LOG_LEVEL")).toBeInTheDocument();
    expect(screen.getByText("THEO_DEPLOY_ID")).toBeInTheDocument();
  });

  it("masks secret values by default", () => {
    render(<EnvVarEditor vars={vars} />);
    expect(screen.queryByText("postgres://u:p@h/db")).not.toBeInTheDocument();
    expect(screen.getByText(/•+/)).toBeInTheDocument();
  });

  it("reveals masked value on toggle", async () => {
    const user = userEvent.setup();
    render(<EnvVarEditor vars={vars} />);
    await user.click(screen.getByRole("button", { name: "Reveal value" }));
    expect(screen.getByText("postgres://u:p@h/db")).toBeInTheDocument();
  });

  it("calls onRemove with the variable id", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<EnvVarEditor vars={vars} onRemove={onRemove} />);
    await user.click(screen.getByRole("button", { name: "Remove LOG_LEVEL" }));
    expect(onRemove).toHaveBeenCalledWith("2");
  });

  it("does not show remove button for readonly entries", () => {
    render(<EnvVarEditor vars={vars} onRemove={() => undefined} />);
    expect(screen.queryByRole("button", { name: "Remove THEO_DEPLOY_ID" })).not.toBeInTheDocument();
  });

  it("submits new variable via the add form", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<EnvVarEditor vars={vars} onAdd={onAdd} />);
    await user.type(screen.getByLabelText("Variable name"), "API_KEY");
    await user.type(screen.getByLabelText("Variable value"), "sk_live_xxx");
    await user.click(screen.getByRole("button", { name: /Add/ }));
    expect(onAdd).toHaveBeenCalledWith({
      key: "API_KEY",
      value: "sk_live_xxx",
      scope: "production",
      masked: true,
    });
  });

  it("ignores submission with empty key", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<EnvVarEditor vars={vars} onAdd={onAdd} />);
    await user.click(screen.getByRole("button", { name: /Add/ }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("renders empty state when no vars", () => {
    render(<EnvVarEditor vars={[]} />);
    expect(screen.getByText("No environment variables yet.")).toBeInTheDocument();
  });
});
