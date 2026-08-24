import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HookConfig, type HookEntry } from "./hook-config.js";

const hooks: HookEntry[] = [
  { id: "h1", event: "PreToolUse", matcher: "Bash", command: "echo before", enabled: true },
  { id: "h2", event: "Stop", matcher: "*", command: "say done", enabled: false },
];

describe("HookConfig", () => {
  it("renders the existing hooks", () => {
    render(<HookConfig hooks={hooks} />);
    expect(screen.getByText("echo before")).toBeInTheDocument();
    expect(screen.getByText("say done")).toBeInTheDocument();
  });

  it("does not fire onAdd with an empty command", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<HookConfig hooks={hooks} onAdd={onAdd} />);
    const addBtn = screen.getByRole("button", { name: /^Add$/i });
    await user.click(addBtn);
    expect(onAdd).not.toHaveBeenCalled();
  });
});
