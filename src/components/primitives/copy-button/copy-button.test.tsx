import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { CopyButton } from "./copy-button.js";

function stubClipboard(impl: (value: string) => Promise<void>) {
  const writeText = vi.fn(impl);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  return writeText;
}

describe("CopyButton — happy path", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("click writes value to clipboard", async () => {
    const writeText = stubClipboard(() => Promise.resolve());
    render(<CopyButton value="hello" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("hello"));
  });

  it("icon swaps to Check after copy", async () => {
    stubClipboard(() => Promise.resolve());
    render(<CopyButton value="hello" />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    await waitFor(() => expect(button.dataset.state).toBe("copied"));
  });

  it("reverts to idle after feedback duration", async () => {
    vi.useFakeTimers();
    stubClipboard(() => Promise.resolve());
    render(<CopyButton value="hello" feedbackDuration={500} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    await vi.waitFor(() => expect(button.dataset.state).toBe("copied"));
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(button.dataset.state).toBe("idle");
    vi.useRealTimers();
  });

  it("fires onCopied callback after success", async () => {
    stubClipboard(() => Promise.resolve());
    const spy = vi.fn();
    render(<CopyButton value="hello" onCopied={spy} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(spy).toHaveBeenCalledWith("hello"));
  });
});

describe("CopyButton — failure / aria", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("enters failed state when clipboard rejects", async () => {
    stubClipboard(() => Promise.reject(new Error("denied")));
    render(<CopyButton value="hello" />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    await waitFor(() => expect(button.dataset.state).toBe("failed"));
  });

  it("announces copy via aria-live region", async () => {
    stubClipboard(() => Promise.resolve());
    const { container } = render(<CopyButton value="hello" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      const live = container.querySelector('[aria-live="polite"]');
      expect(live?.textContent).toBe("Copied to clipboard");
    });
  });

  it("ssr-safe (no navigator)", () => {
    vi.stubGlobal("navigator", undefined);
    expect(() => render(<CopyButton value="x" />)).not.toThrow();
  });
});

describe("CopyButton — edge cases", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // EC-1: empty value
  it("empty value still copies and announces", async () => {
    const writeText = stubClipboard(() => Promise.resolve());
    render(<CopyButton value="" />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(""));
    await vi.waitFor(() => expect(button.dataset.state).toBe("copied"));
  });

  // EC-2: unmount during feedback timer should not warn
  it("unmount during feedback cleans up timer (no react warning)", async () => {
    stubClipboard(() => Promise.resolve());
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { unmount } = render(<CopyButton value="x" feedbackDuration={5000} />);
    fireEvent.click(screen.getByRole("button"));
    unmount();
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("unmounted"));
    expect(error).not.toHaveBeenCalledWith(expect.stringContaining("unmounted"));
  });

  // EC-3: navigator.clipboard undefined (HTTP non-localhost)
  it("clipboard undefined does not crash, state goes to failed", async () => {
    vi.stubGlobal("navigator", {});
    render(<CopyButton value="x" />);
    const button = screen.getByRole("button");
    expect(() => fireEvent.click(button)).not.toThrow();
    await vi.waitFor(() => expect(button.dataset.state).toBe("failed"));
  });
});

describe("CopyButton — a11y", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("has no axe violations (ghost)", async () => {
    stubClipboard(() => Promise.resolve());
    const { container } = render(<CopyButton value="x" aria-label="Copy" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (outline with label)", async () => {
    stubClipboard(() => Promise.resolve());
    const { container } = render(<CopyButton value="x" variant="outline" label="Copy" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
