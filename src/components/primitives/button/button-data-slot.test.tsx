/**
 * data-slot regression test (shadcn v4 convention) — a representative pilot
 * batch. The full coverage is enforced structurally by
 * `scripts/validate-quality-gates.ts § validateDataSlot`; this test proves the
 * attribute actually reaches the rendered DOM for a few primitives.
 * (community-standard-componentization T2.1)
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "../badge/badge.js";
import { Button } from "./button.js";

describe("data-slot is emitted on component roots", () => {
  it('Button root carries data-slot="button"', () => {
    const { container } = render(<Button>Go</Button>);
    const slot = container.querySelector('[data-slot="button"]');
    expect(slot).toBeTruthy();
  });

  it("Button reflects variant + size via data attributes (shadcn v4)", () => {
    const { container } = render(
      <Button variant="secondary" size="sm">
        Go
      </Button>,
    );
    const root = container.querySelector('[data-slot="button"]');
    expect(root?.getAttribute("data-variant")).toBe("secondary");
    expect(root?.getAttribute("data-size")).toBe("sm");
  });

  it('Badge root carries data-slot="badge"', () => {
    const { container } = render(<Badge>New</Badge>);
    const slot = container.querySelector('[data-slot="badge"]');
    expect(slot).toBeTruthy();
  });
});
