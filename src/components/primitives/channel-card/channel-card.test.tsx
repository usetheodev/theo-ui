import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type Channel, ChannelCard } from "./channel-card.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";

const connected: Channel = {
  id: "telegram-support",
  name: "support-bot",
  platform: "telegram",
  status: "connected",
  description: "Routes DMs to the Support agent.",
  lastSeen: "2m ago",
  messageCount: 8421,
};

describe("ChannelCard", () => {
  it("renders name, platform label, and status", () => {
    render(<ChannelCard channel={connected} />);
    expect(screen.getByText("support-bot")).toBeInTheDocument();
    expect(screen.getByText("Telegram")).toBeInTheDocument();
    expect(screen.getByText(/Connected/i)).toBeInTheDocument();
  });

  it("renders optional metadata (lastSeen + messageCount)", () => {
    render(<ChannelCard channel={connected} />);
    expect(screen.getByText("2m ago")).toBeInTheDocument();
    expect(screen.getByText("8,421")).toBeInTheDocument();
  });

  it("calls onConfigure with id when configure clicked", async () => {
    const user = userEvent.setup();
    const onConfigure = vi.fn();
    render(<ChannelCard channel={connected} onConfigure={onConfigure} />);
    await user.click(screen.getByRole("button", { name: /Configure/i }));
    expect(onConfigure).toHaveBeenCalledWith("telegram-support");
  });

  it("calls onToggle with inverted enabled flag when toggle clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<ChannelCard channel={connected} onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: /Disconnect/i }));
    // connected → toggle off
    expect(onToggle).toHaveBeenCalledWith("telegram-support", false);
  });

  it("toggle is disabled while connecting (transient state)", async () => {
    const onToggle = vi.fn();
    render(<ChannelCard channel={{ ...connected, status: "connecting" }} onToggle={onToggle} />);
    const btn = screen.getByRole("button", { name: /Connect/i });
    expect(btn).toBeDisabled();
  });

  it("disconnected status renders Connect label", () => {
    render(
      <ChannelCard channel={{ ...connected, status: "disconnected" }} onToggle={() => undefined} />,
    );
    expect(screen.getByRole("button", { name: /Connect/i })).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<ChannelCard channel={connected} />);
  });
});
