import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type GatewayStatus, GatewayStatusIndicator } from "./gateway-status-indicator.js";

describe("GatewayStatusIndicator", () => {
  const cases: Array<{ status: GatewayStatus; dotClass: string }> = [
    { status: "online", dotClass: "bg-emerald-500" },
    { status: "offline", dotClass: "bg-red-500" },
    { status: "degraded", dotClass: "bg-amber-500" },
    { status: "reconnecting", dotClass: "bg-blue-500" },
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
