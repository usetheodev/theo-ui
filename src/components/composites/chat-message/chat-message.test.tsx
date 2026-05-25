import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { UIMessage } from "../../../types/chat.js";
import { ChatMessage } from "./chat-message.js";

describe("ChatMessage — role-based layout", () => {
  it("renders a user message with 'is-user' marker class", () => {
    const msg: UIMessage = {
      id: "1",
      role: "user",
      parts: [{ type: "text", text: "hello" }],
    };
    const { container } = render(<ChatMessage message={msg} />);
    expect(container.firstChild).toHaveClass("is-user");
  });

  it("renders an assistant message with 'is-assistant' marker class", () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      parts: [{ type: "text", text: "hi" }],
    };
    const { container } = render(<ChatMessage message={msg} />);
    expect(container.firstChild).toHaveClass("is-assistant");
  });

  it("renders a system message with 'is-system' marker class", () => {
    const msg: UIMessage = {
      id: "1",
      role: "system",
      parts: [{ type: "text", text: "you are…" }],
    };
    const { container } = render(<ChatMessage message={msg} />);
    expect(container.firstChild).toHaveClass("is-system");
  });
});

describe("ChatMessage — part dispatch", () => {
  it("renders a text part via markdown", async () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      parts: [{ type: "text", text: "Hello **world**" }],
    };
    render(<ChatMessage message={msg} />);
    const strong = await screen.findByText("world");
    expect(strong.tagName).toBe("STRONG");
  });

  it("renders a reasoning part inside a <details>", () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      parts: [{ type: "reasoning", text: "step 1, step 2" }],
    };
    const { container } = render(<ChatMessage message={msg} />);
    expect(container.querySelector("details")).toBeInTheDocument();
    expect(screen.getByText(/reasoning/i)).toBeInTheDocument();
  });

  it("renders a tool-call part with tool name + state badge", () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      parts: [
        {
          type: "tool-bash",
          toolCallId: "1",
          toolName: "bash",
          state: "output-available",
          input: { command: "ls -la" },
          output: "drwxr-xr-x  README.md",
        },
      ],
    };
    const { container } = render(<ChatMessage message={msg} />);
    expect(container.querySelector('[data-theo-tool-call="output-available"]')).toBeInTheDocument();
    expect(screen.getByText(/bash/i)).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });

  it("renders a dynamic-tool part by its toolName", () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      parts: [
        {
          type: "dynamic-tool",
          toolCallId: "2",
          toolName: "web_search",
          state: "input-streaming",
        },
      ],
    };
    render(<ChatMessage message={msg} />);
    expect(screen.getByText(/web_search/i)).toBeInTheDocument();
    expect(screen.getByText(/streaming input/i)).toBeInTheDocument();
  });

  it("renders an image file part as an <img>", () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      parts: [
        {
          type: "file",
          mediaType: "image/png",
          url: "https://example.com/screenshot.png",
          filename: "screenshot.png",
        },
      ],
    };
    const { container } = render(<ChatMessage message={msg} />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute("src")).toBe("https://example.com/screenshot.png");
    expect(img?.getAttribute("alt")).toBe("screenshot.png");
  });

  it("blocks unsafe file URLs (javascript:)", () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      parts: [
        {
          type: "file",
          mediaType: "image/png",
          // biome-ignore lint/suspicious/noExplicitAny: testing unsafe URL handling
          url: "javascript:alert(1)" as any,
        },
      ],
    };
    const { container } = render(<ChatMessage message={msg} />);
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText(/blocked/i)).toBeInTheDocument();
  });

  it("renders a source-url part as an external link", () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      parts: [
        {
          type: "source-url",
          sourceId: "s1",
          url: "https://docs.example.com",
          title: "Example docs",
        },
      ],
    };
    const { container } = render(<ChatMessage message={msg} />);
    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link?.getAttribute("href")).toBe("https://docs.example.com");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders a source-document part with title + mediaType", () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      parts: [
        {
          type: "source-document",
          sourceId: "d1",
          mediaType: "application/pdf",
          title: "Annual report",
        },
      ],
    };
    render(<ChatMessage message={msg} />);
    expect(screen.getByText("Annual report")).toBeInTheDocument();
    expect(screen.getByText("application/pdf")).toBeInTheDocument();
  });

  it("renders a step-start part as an <hr> separator", () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      parts: [{ type: "step-start" }],
    };
    const { container } = render(<ChatMessage message={msg} />);
    expect(container.querySelector("hr")).toBeInTheDocument();
  });

  it("renders a data part with consumer-provided renderer", () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      parts: [
        {
          type: "data-weather",
          data: { temp: 22, city: "Berlin" },
        },
      ],
    };
    render(
      <ChatMessage
        message={msg}
        dataRenderers={{
          "data-weather": (data) => {
            const w = data as { temp: number; city: string };
            return <span data-testid="weather-widget">{`${w.city}: ${w.temp}°`}</span>;
          },
        }}
      />,
    );
    expect(screen.getByTestId("weather-widget")).toHaveTextContent("Berlin: 22°");
  });

  it("renders an unknown data part as <details> JSON fallback", () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      parts: [{ type: "data-unknown", data: { hello: "world" } }],
    };
    const { container } = render(<ChatMessage message={msg} />);
    expect(container.querySelector("details")).toBeInTheDocument();
    expect(screen.getByText(/data-unknown/i)).toBeInTheDocument();
  });
});

describe("ChatMessage — composable API", () => {
  it("renders multiple parts in order", async () => {
    const msg: UIMessage = {
      id: "1",
      role: "assistant",
      parts: [
        { type: "reasoning", text: "let me think" },
        { type: "text", text: "Hello **world**" },
        {
          type: "tool-search",
          toolCallId: "1",
          toolName: "search",
          state: "output-available",
          input: "test",
          output: "result",
        },
      ],
    };
    const { container } = render(<ChatMessage message={msg} />);
    expect(container.querySelector("details")).toBeInTheDocument(); // reasoning
    expect(await screen.findByText("world")).toBeInTheDocument(); // text
    expect(container.querySelector("[data-theo-tool-call]")).toBeInTheDocument(); // tool
  });
});
