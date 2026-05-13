import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Message } from "../../../types/chat.js";
import { ChatMessage } from "./chat-message.js";

const user: Message = {
  id: "u1",
  role: "user",
  content: "Build the alignment grid demo",
  timestamp: "10:01",
};

const assistant: Message = {
  id: "a1",
  role: "assistant",
  content: "Swapping the back-out curve for a hard-stop snap.",
  timestamp: "10:02",
  model: "Opus 4.6",
};

const system: Message = {
  id: "s1",
  role: "system",
  content: "Tarefa executada localmente. Não é sincronizada entre dispositivos.",
};

describe("ChatMessage", () => {
  it("renders user content with role aria-label", () => {
    render(<ChatMessage message={user} />);
    expect(screen.getByLabelText("user message")).toBeInTheDocument();
    expect(screen.getByText("Build the alignment grid demo")).toBeInTheDocument();
    expect(screen.getByText("10:01")).toBeInTheDocument();
  });

  it("renders assistant with model badge", () => {
    render(<ChatMessage message={assistant} />);
    expect(screen.getByLabelText("assistant message")).toBeInTheDocument();
    expect(screen.getByText("Opus 4.6")).toBeInTheDocument();
    expect(
      screen.getByText("Swapping the back-out curve for a hard-stop snap."),
    ).toBeInTheDocument();
  });

  it("falls back to 'Assistant' label when model missing", () => {
    const { model: _model, ...rest } = assistant;
    render(<ChatMessage message={rest} />);
    expect(screen.getByText("Assistant")).toBeInTheDocument();
  });

  it("renders system message as callout", () => {
    render(<ChatMessage message={system} />);
    expect(screen.getByLabelText("system message")).toBeInTheDocument();
    expect(screen.getByText(system.content as string)).toBeInTheDocument();
  });
});
