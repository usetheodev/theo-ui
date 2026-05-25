import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Alert, type AlertIntent } from "./alert.js";

describe("Alert — intents", () => {
  const cases: Array<{ intent: AlertIntent; border: string; iconColor: string }> = [
    { intent: "info", border: "border-primary/30", iconColor: "text-primary" },
    { intent: "success", border: "border-success/30", iconColor: "text-success" },
    { intent: "warning", border: "border-warning/30", iconColor: "text-warning" },
    { intent: "destructive", border: "border-destructive/30", iconColor: "text-destructive" },
  ];

  for (const { intent, border, iconColor } of cases) {
    it(`intent="${intent}" renders matching border + icon color`, () => {
      const { container } = render(<Alert intent={intent} title="x" />);
      expect(container.innerHTML).toContain(border);
      expect(container.innerHTML).toContain(iconColor);
    });
  }
});

describe("Alert — composition", () => {
  it("title only renders without description block", () => {
    render(<Alert title="Only title" />);
    expect(screen.getByText("Only title")).toBeInTheDocument();
  });

  it("description only renders without title block", () => {
    render(<Alert description="Only description" />);
    expect(screen.getByText("Only description")).toBeInTheDocument();
  });

  it("title + description stacked with spacing", () => {
    render(<Alert title="T" description="D" />);
    const title = screen.getByText("T");
    const desc = screen.getByText("D");
    expect(title).toBeInTheDocument();
    expect(desc).toBeInTheDocument();
    expect(desc.className).toContain("mt-0.5");
  });

  it("action renders to the right", () => {
    const { container } = render(
      <Alert title="t" description="d" action={<button type="button">Go</button>} />,
    );
    const actionWrapper = container.querySelector(".ml-auto");
    expect(actionWrapper).not.toBeNull();
    expect(actionWrapper?.textContent).toContain("Go");
  });
});

describe("Alert — dismiss", () => {
  it("renders X button only when onDismiss is provided", () => {
    const { rerender } = render(<Alert title="t" />);
    expect(screen.queryByLabelText("Dismiss")).toBeNull();
    rerender(<Alert title="t" onDismiss={() => undefined} />);
    expect(screen.getByLabelText("Dismiss")).toBeInTheDocument();
  });

  it("dismiss button fires handler", () => {
    const onDismiss = vi.fn();
    render(<Alert title="t" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe("Alert — a11y roles", () => {
  it("destructive intent uses role=alert (assertive)", () => {
    render(<Alert intent="destructive" title="failed" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("non-destructive intents use role=status (polite)", () => {
    render(<Alert intent="warning" title="warn" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Alert
        intent="warning"
        title="Verify your email"
        description="Click the link in your inbox."
        action={
          <button type="button" aria-label="Resend verification">
            Resend
          </button>
        }
        onDismiss={() => undefined}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
