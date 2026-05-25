import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Progress } from "./progress.js";

describe("Progress — semantics", () => {
  it("renders with role='progressbar'", () => {
    render(<Progress value={50} aria-label="upload" />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("defaults max to 100", () => {
    render(<Progress value={50} aria-label="x" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "100");
  });

  it("aria-valuenow reflects value", () => {
    render(<Progress value={50} max={100} aria-label="x" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
  });
});

describe("Progress — clamping", () => {
  it("clamps value > max to max", () => {
    render(<Progress value={150} max={100} aria-label="x" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "100");
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe("100%");
  });

  it("clamps value < 0 to 0", () => {
    render(<Progress value={-10} max={100} aria-label="x" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe("0%");
  });

  it("max=0 produces no NaN in style", () => {
    render(<Progress value={5} max={0} aria-label="x" />);
    const bar = screen.getByRole("progressbar");
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe("0%");
    expect(fill.style.width).not.toMatch(/NaN|Infinity/);
  });
});

describe("Progress — indeterminate", () => {
  it("omits aria-valuenow when indeterminate", () => {
    render(<Progress indeterminate aria-label="loading" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).not.toHaveAttribute("aria-valuenow");
  });

  it("sets aria-busy='true' when indeterminate", () => {
    render(<Progress indeterminate aria-label="loading" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-busy", "true");
  });
});

describe("Progress — variants", () => {
  it("intent='warning' applies bg-warning class on the fill", () => {
    render(<Progress value={50} intent="warning" aria-label="x" />);
    const fill = screen.getByRole("progressbar").firstElementChild as HTMLElement;
    expect(fill.className).toContain("bg-warning");
  });

  it("intent='success' applies bg-success class on the fill", () => {
    render(<Progress value={50} intent="success" aria-label="x" />);
    const fill = screen.getByRole("progressbar").firstElementChild as HTMLElement;
    expect(fill.className).toContain("bg-success");
  });

  it("height='h-2' applies on root", () => {
    render(<Progress value={50} height="h-2" aria-label="x" />);
    expect(screen.getByRole("progressbar").className).toContain("h-2");
  });

  it("passes aria-label through", () => {
    render(<Progress value={50} aria-label="upload-progress" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "upload-progress");
  });
});

describe("Progress — a11y", () => {
  it("has no axe violations (determinate)", async () => {
    const { container } = render(<Progress value={50} aria-label="x" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (indeterminate)", async () => {
    const { container } = render(<Progress indeterminate aria-label="loading" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
