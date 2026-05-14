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
});
