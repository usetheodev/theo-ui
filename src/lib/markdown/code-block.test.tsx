import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CodeBlock } from "./code-block.js";

describe("CodeBlock — shape + a11y", () => {
  it("renders the language label", () => {
    render(<CodeBlock code="const x = 1;" language="typescript" />);
    expect(screen.getByText("typescript")).toBeInTheDocument();
  });

  it("falls back to 'text' label when no language", () => {
    render(<CodeBlock code="hello" />);
    expect(screen.getByText("text")).toBeInTheDocument();
  });

  it("renders the source code in the <code> element", () => {
    render(<CodeBlock code="const x = 42;" language="ts" />);
    expect(screen.getByText("const x = 42;")).toBeInTheDocument();
  });

  it("has an accessible Copy button", () => {
    render(<CodeBlock code="hello" />);
    const button = screen.getByRole("button", { name: /copy/i });
    expect(button).toBeInTheDocument();
  });
});

describe("CodeBlock — copy interaction", () => {
  it("flips the button label to 'Copied' after click (when clipboard API resolves)", async () => {
    // happy-dom ships a working `navigator.clipboard.writeText` that resolves.
    const user = userEvent.setup();
    render(<CodeBlock code="hello world" language="text" />);
    const button = screen.getByRole("button", { name: /copy/i });

    await user.click(button);
    expect(await screen.findByText(/copied/i)).toBeInTheDocument();
  });

  it("does not throw when clipboard.writeText rejects (graceful degradation)", async () => {
    // Stub writeText to reject; the handler must swallow the error.
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    const originalDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    const user = userEvent.setup();
    render(<CodeBlock code="x" />);
    const button = screen.getByRole("button", { name: /copy/i });
    await expect(user.click(button)).resolves.not.toThrow();

    if (originalDescriptor) {
      Object.defineProperty(navigator, "clipboard", originalDescriptor);
    }
  });
});
