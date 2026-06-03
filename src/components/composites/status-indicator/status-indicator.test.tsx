import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusIndicator } from "./status-indicator.js";

describe("StatusIndicator", () => {
  it("renders dot with bg-status-online for status=online", () => {
    const { container } = render(<StatusIndicator status="online" />);
    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot).toBeTruthy();
    expect(dot?.className).toMatch(/bg-status-online/);
  });

  it("renders dot with bg-status-offline for status=offline", () => {
    const { container } = render(<StatusIndicator status="offline" />);
    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot?.className).toMatch(/bg-status-offline/);
  });

  it("renders dot with bg-status-degraded for status=degraded", () => {
    const { container } = render(<StatusIndicator status="degraded" />);
    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot?.className).toMatch(/bg-status-degraded/);
  });

  it("renders dot with bg-status-info for status=info", () => {
    const { container } = render(<StatusIndicator status="info" />);
    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot?.className).toMatch(/bg-status-info/);
  });

  it("renders visible label when provided", () => {
    render(<StatusIndicator status="online" label="Connected" />);
    expect(screen.getByText("Connected")).toBeTruthy();
  });

  it("uses default aria-label per status when label omitted", () => {
    render(<StatusIndicator status="degraded" data-testid="indicator" />);
    const root = screen.getByTestId("indicator");
    expect(root.getAttribute("aria-label")).toBe("Degraded");
  });

  it("aria-label uses label when both provided (label wins)", () => {
    render(
      <StatusIndicator status="online" label="Live" data-testid="indicator" aria-label="ignored" />,
    );
    const root = screen.getByTestId("indicator");
    expect(root.getAttribute("aria-label")).toBe("Live");
  });

  it("applies animate-pulse when pulse=true", () => {
    const { container } = render(<StatusIndicator status="online" pulse />);
    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot?.className).toMatch(/animate-pulse/);
  });

  it("size=md renders larger dot", () => {
    const { container } = render(<StatusIndicator status="online" size="md" />);
    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot?.className).toMatch(/size-2\.5/);
  });

  it("sets data-status attribute", () => {
    render(<StatusIndicator status="online" data-testid="indicator" />);
    const root = screen.getByTestId("indicator");
    expect(root.getAttribute("data-status")).toBe("online");
  });
});
