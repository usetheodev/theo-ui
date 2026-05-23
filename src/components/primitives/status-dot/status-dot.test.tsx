import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { StatusDot, type StatusKind } from "./status-dot.js";

describe("StatusDot — colors", () => {
  const cases: Array<{ status: StatusKind; cls: string }> = [
    { status: "live", cls: "bg-success" },
    { status: "building", cls: "bg-warning" },
    { status: "failed", cls: "bg-destructive" },
    { status: "idle", cls: "bg-muted-foreground/40" },
    { status: "warning", cls: "bg-warning" },
  ];
  for (const { status, cls } of cases) {
    it(`status="${status}" renders ${cls}`, () => {
      const { container } = render(<StatusDot status={status} label="x" />);
      expect(container.innerHTML).toContain(cls);
    });
  }
});

describe("StatusDot — pulse", () => {
  it("pulse=true adds animate-pulse", () => {
    const { container } = render(<StatusDot status="live" pulse label="live" />);
    expect(container.innerHTML).toContain("animate-pulse");
  });

  it("status=building auto-pulses", () => {
    const { container } = render(<StatusDot status="building" label="building" />);
    expect(container.innerHTML).toContain("animate-pulse");
  });

  it("pulse=false on building overrides auto-pulse", () => {
    const { container } = render(<StatusDot status="building" pulse={false} label="building" />);
    expect(container.innerHTML).not.toContain("animate-pulse");
  });
});

describe("StatusDot — labels and a11y", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("no label renders only the dot", () => {
    const { container } = render(<StatusDot status="live" aria-label="live" />);
    expect(container.querySelectorAll("span").length).toBe(2); // wrapper + dot
  });

  // EC-6: dev warning + fallback aria-label when no label and no aria-label
  it("dev warning when no label and no aria-label, with fallback aria-label", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<StatusDot status="failed" />);
    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls[0]?.[0]).toMatch(/no `label` or `aria-label`/);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "failed");
  });
});

describe("StatusDot — a11y", () => {
  it("has no axe violations (with label)", async () => {
    const { container } = render(<StatusDot status="live" label="Live" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (aria-label only)", async () => {
    const { container } = render(<StatusDot status="failed" aria-label="failed" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
