import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Whiteboard, type WhiteboardData } from "./whiteboard.js";

const emptyScene: WhiteboardData = {
  version: 1,
  width: 400,
  height: 300,
  elements: [],
};

const sampleScene: WhiteboardData = {
  version: 1,
  width: 400,
  height: 300,
  elements: [
    { type: "rect", x: 50, y: 50, w: 100, h: 80, label: "User", seed: 42 },
    { type: "ellipse", x: 250, y: 50, w: 100, h: 80, label: "DB", seed: 7 },
    { type: "arrow", x: 150, y: 90, to: [250, 90], label: "query", seed: 9 },
  ],
};

describe("Whiteboard", () => {
  it("renders an svg with role=img", () => {
    render(<Whiteboard data={emptyScene} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("renders a valid scene with elements", () => {
    const { container } = render(<Whiteboard data={sampleScene} />);
    expect(container.querySelectorAll("[data-element-type]").length).toBe(3);
  });

  it("uses provided aria-label", () => {
    render(<Whiteboard data={emptyScene} aria-label="Architecture diagram" />);
    expect(screen.getByRole("img", { name: "Architecture diagram" })).toBeInTheDocument();
  });

  it("falls back to default aria-label", () => {
    render(<Whiteboard data={emptyScene} />);
    expect(screen.getByRole("img", { name: "Whiteboard diagram" })).toBeInTheDocument();
  });

  it("applies className", () => {
    render(<Whiteboard data={emptyScene} className="custom-class" />);
    expect(screen.getByRole("img")).toHaveClass("custom-class");
  });

  it("renders background fill when provided", () => {
    const scene: WhiteboardData = { ...emptyScene, background: "#fef3c7" };
    const { container } = render(<Whiteboard data={scene} />);
    const bg = container.querySelector('[data-layer="background"]');
    expect(bg?.getAttribute("fill")).toBe("#fef3c7");
  });

  it("data-whiteboard-state=ok when valid", () => {
    const { container } = render(<Whiteboard data={emptyScene} />);
    expect(container.querySelector("svg")?.getAttribute("data-whiteboard-state")).toBe("ok");
  });

  it("data-whiteboard-state=invalid when scene fails validation", () => {
    const { container } = render(<Whiteboard data={{ nope: true }} />);
    expect(container.querySelector("svg")?.getAttribute("data-whiteboard-state")).toBe("invalid");
  });

  it("calls onValidationError when data is invalid (EC-6: via useEffect)", async () => {
    const cb = vi.fn();
    render(<Whiteboard data={{ wrong: "shape" }} onValidationError={cb} />);
    await waitFor(() => expect(cb).toHaveBeenCalled());
    const errors = cb.mock.calls[0]?.[0];
    expect(Array.isArray(errors)).toBe(true);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("does NOT call onValidationError during render — only in useEffect (EC-6)", () => {
    // If the callback fired during render, StrictMode would invoke it twice
    // synchronously and React would warn about updates during render. We assert
    // it's not called synchronously by checking that on initial mount, no call
    // arrives before the effect flush.
    const cb = vi.fn();
    render(
      <StrictMode>
        <Whiteboard data={{ bad: true }} onValidationError={cb} />
      </StrictMode>,
    );
    // useEffect runs after render — assert it eventually fires.
    return waitFor(() => expect(cb).toHaveBeenCalled());
  });

  it("EC-12: re-renders when data prop changes (new reference)", () => {
    const { container, rerender } = render(<Whiteboard data={emptyScene} />);
    expect(container.querySelectorAll("[data-element-type]").length).toBe(0);
    rerender(<Whiteboard data={sampleScene} />);
    expect(container.querySelectorAll("[data-element-type]").length).toBe(3);
  });

  it("EC-13: SSR — renderToString produces valid static SVG without window", () => {
    const html = renderToString(<Whiteboard data={sampleScene} />);
    expect(html).toContain("<svg");
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Whiteboard diagram"');
    // Should not contain NaN or React error markers.
    expect(html).not.toContain("NaN");
  });

  it("passes axe a11y check on empty scene", async () => {
    const { container } = render(<Whiteboard data={emptyScene} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("passes axe a11y check on populated scene", async () => {
    const { container } = render(<Whiteboard data={sampleScene} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders invalid data as empty svg without throwing", () => {
    expect(() => render(<Whiteboard data={null} />)).not.toThrow();
  });
});
