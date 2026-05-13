import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SystemPromptEditor } from "./system-prompt-editor.js";

describe("SystemPromptEditor", () => {
  it("renders the title and 'Vendor default' badge when no override", () => {
    render(
      <SystemPromptEditor
        defaultPrompt="You are Theo."
        override=""
        onOverrideChange={() => undefined}
      />,
    );
    expect(screen.getByText("System prompt")).toBeInTheDocument();
    expect(screen.getByText(/Vendor default/i)).toBeInTheDocument();
  });

  it("flips to 'Override active' when override is set", () => {
    render(
      <SystemPromptEditor
        defaultPrompt="You are Theo."
        override="Custom"
        onOverrideChange={() => undefined}
      />,
    );
    expect(screen.getByText(/Override active/i)).toBeInTheDocument();
  });

  it("calls onOverrideChange when the textarea is edited", async () => {
    const user = userEvent.setup();
    const onOverrideChange = vi.fn();
    render(
      <SystemPromptEditor
        defaultPrompt="You are Theo."
        override="Custom"
        onOverrideChange={onOverrideChange}
      />,
    );
    await user.type(screen.getByRole("textbox"), " extra");
    expect(onOverrideChange).toHaveBeenCalled();
  });

  it("formats the token estimate with locale separators", () => {
    render(
      <SystemPromptEditor
        defaultPrompt="x"
        override=""
        onOverrideChange={() => undefined}
        tokenEstimate={1234}
      />,
    );
    expect(screen.getByText(/1,234\s*tokens/)).toBeInTheDocument();
  });
});
