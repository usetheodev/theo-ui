import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BrowserControls } from "./browser-controls.js";

describe("BrowserControls", () => {
  it("renders the URL in the address input", () => {
    render(<BrowserControls url="https://example.com" />);
    expect(screen.getByLabelText("Address")).toHaveValue("https://example.com");
  });

  it("calls onBack, onForward, and onReload when controls are pressed", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const onForward = vi.fn();
    const onReload = vi.fn();
    render(
      <BrowserControls url="https://x" onBack={onBack} onForward={onForward} onReload={onReload} />,
    );
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Forward" }));
    await user.click(screen.getByRole("button", { name: "Reload" }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onForward).toHaveBeenCalledTimes(1);
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it("marks URL input read-only when no onUrlChange provided", () => {
    render(<BrowserControls url="https://x" />);
    expect(screen.getByLabelText("Address")).toHaveAttribute("readonly");
  });

  it("fires onUrlChange when input value changes", async () => {
    const user = userEvent.setup();
    const onUrlChange = vi.fn();
    render(<BrowserControls url="" onUrlChange={onUrlChange} />);
    const input = screen.getByLabelText("Address");
    await user.type(input, "a");
    expect(onUrlChange).toHaveBeenCalled();
  });
});
