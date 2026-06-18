/**
 * data-slot compound-naming regression test (review fix F-dom-1 / F-dom-3).
 *
 * Compound sub-parts MUST be namespaced after the component's displayName
 * (`Card.Header` → `card-header`), NOT the bare local const name (`header`).
 * The original codemod produced bare/wrong values; this pins the shadcn v4
 * convention so it cannot regress.
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "./card.js";

describe("Card emits namespaced compound data-slots (shadcn v4)", () => {
  it("root is `card`, not `root`", () => {
    const { container } = render(<Card>x</Card>);
    expect(container.querySelector('[data-slot="card"]')).toBeTruthy();
    expect(container.querySelector('[data-slot="root"]')).toBeNull();
  });

  it("sub-parts are `card-<part>`, not bare `<part>`", () => {
    const { container } = render(
      <Card>
        <Card.Header>
          <Card.Title>t</Card.Title>
          <Card.Description>d</Card.Description>
        </Card.Header>
        <Card.Body>b</Card.Body>
        <Card.Footer>f</Card.Footer>
      </Card>,
    );
    for (const slot of [
      "card-header",
      "card-title",
      "card-description",
      "card-body",
      "card-footer",
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).toBeTruthy();
    }
    // No bare collision-prone names leaked.
    for (const bare of ["header", "title", "description", "body", "footer"]) {
      expect(container.querySelector(`[data-slot="${bare}"]`)).toBeNull();
    }
  });
});
