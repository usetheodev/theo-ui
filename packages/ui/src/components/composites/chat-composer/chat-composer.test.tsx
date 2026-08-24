import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
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
    expect(screen.getByPlaceholderText("How can I help you today?")).toBeInTheDocument();
  });

  it("renders Send disabled when empty", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("enables Send when value is non-empty", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByPlaceholderText("How can I help you today?"), "hi");
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });

  it("fires onSubmit when Send is clicked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    await user.type(screen.getByPlaceholderText("How can I help you today?"), "build it");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSubmit).toHaveBeenCalledWith("build it");
  });

  it("submits on Enter (without shift)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    const textarea = screen.getByPlaceholderText("How can I help you today?");
    await user.type(textarea, "hello{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("hello");
  });

  it("does NOT submit on shift+Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    const textarea = screen.getByPlaceholderText("How can I help you today?");
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

  it("does NOT render mic button by default (no fake affordance)", () => {
    render(<ChatComposer value="" onValueChange={() => undefined} />);
    expect(screen.queryByRole("button", { name: "Voice input" })).not.toBeInTheDocument();
  });

  it("does NOT render attach button by default", () => {
    render(<ChatComposer value="" onValueChange={() => undefined} />);
    expect(screen.queryByRole("button", { name: "Attach file" })).not.toBeInTheDocument();
  });

  it("renders mic button when onVoiceInput is provided", async () => {
    const user = userEvent.setup();
    const onVoiceInput = vi.fn();
    render(<ChatComposer value="" onValueChange={() => undefined} onVoiceInput={onVoiceInput} />);
    const mic = screen.getByRole("button", { name: "Voice input" });
    await user.click(mic);
    expect(onVoiceInput).toHaveBeenCalledTimes(1);
  });

  it("renders attach button when onAttach is provided", async () => {
    const user = userEvent.setup();
    const onAttach = vi.fn();
    render(<ChatComposer value="" onValueChange={() => undefined} onAttach={onAttach} />);
    const attach = screen.getByRole("button", { name: "Attach file" });
    await user.click(attach);
    expect(onAttach).toHaveBeenCalledTimes(1);
  });

  it("exposes accessible name on the textarea", () => {
    render(<ChatComposer value="" onValueChange={() => undefined} />);
    expect(screen.getByRole("textbox", { name: "Chat message" })).toBeInTheDocument();
  });

  it("has no axe accessibility violations", async () => {
    const { container } = render(<ChatComposer value="" onValueChange={() => undefined} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  // 1.2.0: submit affordance overrides (host apps with their own send verb/icon).
  it("overrides the submit button's accessible name with submitLabel", () => {
    render(
      <ChatComposer value="go" onValueChange={() => undefined} submitLabel="Start build session" />,
    );
    expect(screen.getByRole("button", { name: "Start build session" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send message" })).not.toBeInTheDocument();
  });

  it("renders a custom submit icon when submitIcon is provided", () => {
    const CustomIcon = (props: { className?: string }) => (
      <svg {...props} data-testid="custom-submit-icon" aria-hidden="true" />
    );
    render(<ChatComposer value="go" onValueChange={() => undefined} submitIcon={CustomIcon} />);
    expect(screen.getByTestId("custom-submit-icon")).toBeInTheDocument();
  });

  it("defaults the submit button to 'Send message' when no submitLabel", () => {
    render(<ChatComposer value="go" onValueChange={() => undefined} />);
    expect(screen.getByRole("button", { name: "Send message" })).toBeInTheDocument();
  });
});
