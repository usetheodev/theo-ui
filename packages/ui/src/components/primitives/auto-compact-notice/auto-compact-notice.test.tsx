import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AutoCompactNotice } from "./auto-compact-notice.js";

describe("AutoCompactNotice", () => {
  it("renders the default title and a countdown chip", () => {
    render(<AutoCompactNotice turnsRemaining={3} />);
    expect(screen.getByText(/Auto-compaction soon/)).toBeInTheDocument();
    expect(screen.getByText(/3 turns left/)).toBeInTheDocument();
  });

  it("singularizes 'turn' when 1 turn remains", () => {
    render(<AutoCompactNotice turnsRemaining={1} />);
    expect(screen.getByText(/1 turn left/)).toBeInTheDocument();
  });

  it("formats tokensToCompact with k suffix", () => {
    render(<AutoCompactNotice tokensToCompact={12500} />);
    expect(screen.getByText(/12\.5k tokens/)).toBeInTheDocument();
  });

  it("calls onCompactNow when action button clicked", async () => {
    const user = userEvent.setup();
    const onCompactNow = vi.fn();
    render(<AutoCompactNotice onCompactNow={onCompactNow} />);
    await user.click(screen.getByRole("button", { name: /Compact now/ }));
    expect(onCompactNow).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss when dismiss button clicked", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<AutoCompactNotice onDismiss={onDismiss} />);
    await user.click(screen.getByRole("button", { name: /Dismiss/ }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
