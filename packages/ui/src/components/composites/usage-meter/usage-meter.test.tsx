import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { UsageMeter, type UsageMetric } from "./usage-meter.js";

const baseMetrics: UsageMetric[] = [
  { label: "Fast Data Transfer", value: 12, max: 100, unit: "GB" },
  { label: "Fast Origin Transfer", value: 0, max: 10, unit: "GB" },
  { label: "Edge Requests", value: 0, max: 1_000_000, unit: "req" },
];

describe("UsageMeter — layout", () => {
  it("renders metric rows in array order", () => {
    render(<UsageMeter metrics={baseMetrics} />);
    const labels = screen.getAllByText(/Transfer|Requests/);
    expect(labels.map((n) => n.textContent)).toEqual([
      "Fast Data Transfer",
      "Fast Origin Transfer",
      "Edge Requests",
    ]);
  });

  it("Progress bars carry aria-valuenow matching value", () => {
    render(<UsageMeter metrics={[{ label: "X", value: 42, max: 100 }]} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "42");
  });

  it("renders header with title left and action right", () => {
    render(
      <UsageMeter
        title="Last 30 days"
        action={<span data-testid="action">Upgrade</span>}
        metrics={baseMetrics}
      />,
    );
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
    expect(screen.getByTestId("action")).toBeInTheDocument();
  });

  it("empty metrics array still renders header if provided", () => {
    const { container } = render(<UsageMeter title="Last 30 days" metrics={[]} />);
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
  });
});

describe("UsageMeter — over-quota", () => {
  it("applies text-warning when value > max", () => {
    render(<UsageMeter metrics={[{ label: "Data", value: 120, max: 100, unit: "GB" }]} />);
    const value = screen.getByText("120 / 100 GB");
    expect(value.className).toContain("text-warning");
  });

  it("Progress uses warning intent (clamped at max) when over-quota", () => {
    render(<UsageMeter metrics={[{ label: "Data", value: 120, max: 100 }]} />);
    const bar = screen.getByRole("progressbar");
    // Progress clamps to max → aria-valuenow=100
    expect(bar).toHaveAttribute("aria-valuenow", "100");
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.className).toContain("bg-warning");
  });
});

describe("UsageMeter — formatter", () => {
  it("default format includes unit with space separator", () => {
    render(<UsageMeter metrics={[{ label: "X", value: 5, max: 100, unit: "GB" }]} />);
    expect(screen.getByText("5 / 100 GB")).toBeInTheDocument();
  });

  it("default format omits unit space when no unit", () => {
    render(<UsageMeter metrics={[{ label: "X", value: 5, max: 100 }]} />);
    expect(screen.getByText("5 / 100")).toBeInTheDocument();
  });

  it("custom formatter overrides default", () => {
    render(
      <UsageMeter
        metrics={[{ label: "X", value: 5, max: 10, formatter: (v, m) => `${v} of ${m}` }]}
      />,
    );
    expect(screen.getByText("5 of 10")).toBeInTheDocument();
  });
});

describe("UsageMeter — edge cases", () => {
  it("zero max does not crash (no NaN/Infinity)", () => {
    render(<UsageMeter metrics={[{ label: "X", value: 5, max: 0 }]} />);
    const bar = screen.getByRole("progressbar");
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe("0%");
    expect(fill.style.width).not.toMatch(/NaN|Infinity/);
  });

  it("compact mode hides label + value rows but keeps Progress bars", () => {
    const { container } = render(<UsageMeter compact metrics={baseMetrics} />);
    // Labels NOT in DOM in compact mode
    expect(screen.queryByText("Fast Data Transfer")).toBeNull();
    // 3 progressbars present
    expect(container.querySelectorAll('[role="progressbar"]').length).toBe(3);
  });
});

describe("UsageMeter — a11y", () => {
  it("has no axe violations", async () => {
    const { container } = render(<UsageMeter title="Last 30 days" metrics={baseMetrics} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
