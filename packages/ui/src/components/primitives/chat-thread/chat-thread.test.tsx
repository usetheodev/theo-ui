import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatThread } from "./chat-thread.js";

describe("ChatThread", () => {
  it("renders children inside an aria-live log region", () => {
    render(
      <ChatThread>
        <p>turn one</p>
        <p>turn two</p>
      </ChatThread>,
    );
    const log = screen.getByRole("log");
    expect(log).toBeInTheDocument();
    expect(log.getAttribute("aria-live")).toBe("polite");
    expect(log.getAttribute("aria-relevant")).toBe("additions");
    expect(screen.getByText("turn one")).toBeInTheDocument();
    expect(screen.getByText("turn two")).toBeInTheDocument();
  });

  it("merges custom className with the default spacing classes", () => {
    const { container } = render(<ChatThread className="px-10" />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain("flex");
    expect(node.className).toContain("flex-col");
    expect(node.className).toContain("gap-6");
    expect(node.className).toContain("px-10");
  });
});
