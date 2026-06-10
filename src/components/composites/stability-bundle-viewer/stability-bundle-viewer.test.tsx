import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type StabilityBundle, StabilityBundleViewer } from "./stability-bundle-viewer.js";

const baseBundle: StabilityBundle = {
  timestamp: "2026-05-29T14:00:00.000Z",
  severity: "fatal",
  summary: "Boom",
};

describe("StabilityBundleViewer", () => {
  it("renders timestamp + severity + summary in header", () => {
    render(<StabilityBundleViewer bundle={baseBundle} />);
    expect(screen.getByTestId("stability-severity").textContent).toBe("Fatal");
    expect(screen.getByTestId("stability-timestamp").textContent).toBe("2026-05-29T14:00:00.000Z");
    expect(screen.getByTestId("stability-summary").textContent).toBe("Boom");
  });

  it("omits all optional sections when fields are missing (EC-9)", () => {
    render(<StabilityBundleViewer bundle={baseBundle} />);
    expect(screen.queryByTestId("stability-section-error")).not.toBeInTheDocument();
    expect(screen.queryByTestId("stability-section-env")).not.toBeInTheDocument();
    expect(screen.queryByTestId("stability-section-config")).not.toBeInTheDocument();
    expect(screen.queryByTestId("stability-section-metadata")).not.toBeInTheDocument();
  });

  it("renders error section with stack as <pre>", () => {
    render(
      <StabilityBundleViewer
        bundle={{
          ...baseBundle,
          error: { name: "X", message: "y", stack: "line1\nline2" },
        }}
      />,
    );
    expect(screen.getByTestId("stability-section-error")).toBeInTheDocument();
    expect(screen.getByTestId("stability-stack").tagName).toBe("PRE");
  });

  it("env section collapses on toggle click", () => {
    render(<StabilityBundleViewer bundle={{ ...baseBundle, env: { KEY: "value" } }} />);
    const toggle = screen.getByTestId("stability-section-env-toggle");
    // default open=false for env
    expect(screen.queryByText("KEY")).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByText("KEY")).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByText("KEY")).not.toBeInTheDocument();
  });

  it("renders copy button only when onCopy provided", () => {
    const onCopy = vi.fn();
    const { rerender } = render(<StabilityBundleViewer bundle={baseBundle} />);
    expect(screen.queryByTestId("stability-copy")).not.toBeInTheDocument();
    rerender(<StabilityBundleViewer bundle={baseBundle} onCopy={onCopy} />);
    fireEvent.click(screen.getByTestId("stability-copy"));
    expect(onCopy).toHaveBeenCalledOnce();
  });
});
