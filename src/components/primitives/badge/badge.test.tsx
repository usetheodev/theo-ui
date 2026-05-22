import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
describe("Badge", () => {
  it("renders content", () => {
    render(<Badge>Live</Badge>);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    render(<Badge>x</Badge>);
    expect(screen.getByText("x").className).toContain("bg-muted");
  });

  it("applies the accent variant for celebratory status", () => {
    render(<Badge variant="accent">Beta</Badge>);
    expect(screen.getByText("Beta").className).toContain("text-accent");
  });

  it("renders Badge.Dot with pulse animation when requested", () => {
    render(
      <Badge variant="success">
        <Badge.Dot tone="success" pulse />
        Running
      </Badge>,
    );
    const dot = screen.getByText("Running").parentElement?.querySelector("span[aria-hidden]");
    expect(dot).not.toBeNull();
    expect(dot?.className).toContain("animate-pulse-glow");
    expect(dot?.className).toContain("bg-success");
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<Badge>Live</Badge>);
  });

  // T1.2 — size prop (theming-and-sizes plan)
  it("applies px-2 + text-label-caps when size='sm'", () => {
    render(<Badge size="sm">Live</Badge>);
    const el = screen.getByText("Live");
    expect(el.className).toContain("px-2");
    expect(el.className).toContain("text-label-caps");
  });

  it("applies px-2.5 + text-label when size is omitted (default md)", () => {
    render(<Badge>Live</Badge>);
    const el = screen.getByText("Live");
    expect(el.className).toContain("px-2.5");
    expect(el.className).toContain("text-label");
  });

  it("applies px-3 + text-body-md when size='lg'", () => {
    render(<Badge size="lg">Live</Badge>);
    const el = screen.getByText("Live");
    expect(el.className).toContain("px-3");
    expect(el.className).toContain("text-body-md");
  });

  it("preserves variant when size is set", () => {
    render(
      <Badge variant="success" size="sm">
        Live
      </Badge>,
    );
    expect(screen.getByText("Live").className).toContain("border-success/40");
  });
});
