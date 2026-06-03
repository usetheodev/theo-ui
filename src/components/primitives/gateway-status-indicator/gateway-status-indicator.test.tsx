import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type GatewayStatus, GatewayStatusIndicator } from "./gateway-status-indicator.js";

describe("GatewayStatusIndicator", () => {
  // Post-T1.2 (ADR-0004 + ADR-0007): swept from literal Tailwind colors to
  // semantic status tokens so theme switching propagates.
  const cases: Array<{ status: GatewayStatus; dotClass: string }> = [
    { status: "online", dotClass: "bg-status-online" },
    { status: "offline", dotClass: "bg-status-offline" },
    { status: "degraded", dotClass: "bg-status-degraded" },
    { status: "reconnecting", dotClass: "bg-status-info" },
  ];

  for (const c of cases) {
    it(`uses the right dot color for ${c.status}`, () => {
      render(<GatewayStatusIndicator status={c.status} />);
      const root = screen.getByTestId("gateway-status-indicator");
      expect(root.querySelector("span[aria-hidden]")?.className).toContain(c.dotClass);
    });
  }

  it("animates pulse only when reconnecting", () => {
    const { rerender } = render(<GatewayStatusIndicator status="reconnecting" />);
    expect(
      screen.getByTestId("gateway-status-indicator").querySelector("span[aria-hidden]")?.className,
    ).toContain("animate-pulse");
    rerender(<GatewayStatusIndicator status="online" />);
    expect(
      screen.getByTestId("gateway-status-indicator").querySelector("span[aria-hidden]")?.className,
    ).not.toContain("animate-pulse");
  });

  it("renders latency in labeled variant", () => {
    render(<GatewayStatusIndicator status="online" latencyMs={47} />);
    expect(screen.getByTestId("gateway-latency").textContent).toBe("47ms");
  });

  it("compact variant omits the label text", () => {
    render(<GatewayStatusIndicator status="online" variant="compact" />);
    expect(screen.queryByText("Online")).not.toBeInTheDocument();
  });

  it("ignores invalid latency (negative / NaN)", () => {
    render(<GatewayStatusIndicator status="online" latencyMs={-50} />);
    expect(screen.queryByTestId("gateway-latency")).not.toBeInTheDocument();
  });

  it("formats sub-millisecond latency as <1ms", () => {
    render(<GatewayStatusIndicator status="online" latencyMs={0.4} />);
    expect(screen.getByTestId("gateway-latency").textContent).toBe("<1ms");
  });
});
