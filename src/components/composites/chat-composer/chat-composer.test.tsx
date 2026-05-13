import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ChatComposer } from "./chat-composer.js";

function Harness({ onSubmit }: { onSubmit?: (v: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <ChatComposer value={value} onValueChange={setValue} {...(onSubmit ? { onSubmit } : {})} />
  );
}

describe("ChatComposer", () => {
  it("renders placeholder for default chat mode", () => {
    render(<Harness />);
    expect(screen.getByPlaceholderText("Como posso ajudar você hoje?")).toBeInTheDocument();
  });

  it("renders Send disabled when empty", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("enables Send when value is non-empty", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByPlaceholderText("Como posso ajudar você hoje?"), "hi");
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });

  it("fires onSubmit when Send is clicked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    await user.type(screen.getByPlaceholderText("Como posso ajudar você hoje?"), "build it");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSubmit).toHaveBeenCalledWith("build it");
  });

  it("submits on Enter (without shift)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    const textarea = screen.getByPlaceholderText("Como posso ajudar você hoje?");
    await user.type(textarea, "hello{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("hello");
  });

  it("does NOT submit on shift+Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    const textarea = screen.getByPlaceholderText("Como posso ajudar você hoje?");
    await user.type(textarea, "line1{Shift>}{Enter}{/Shift}line2");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(textarea).toHaveValue("line1\nline2");
  });

  it("replaces Send with Stop when running=true", () => {
    render(
      <ChatComposer value="x" onValueChange={() => undefined} running onStop={() => undefined} />,
    );
    expect(screen.getByRole("button", { name: "Stop generation" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send message" })).not.toBeInTheDocument();
  });

  it("uses code mode placeholder when mode='code'", () => {
    render(<ChatComposer mode="code" value="" onValueChange={() => undefined} />);
    expect(screen.getByPlaceholderText("Type / for commands")).toBeInTheDocument();
  });
});
