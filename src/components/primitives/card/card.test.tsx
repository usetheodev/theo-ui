import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "./card.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
describe("Card", () => {
  it("renders composed children", () => {
    render(
      <Card>
        <Card.Header>
          <Card.Title>acme-api</Card.Title>
          <Card.Description>Production · main</Card.Description>
        </Card.Header>
        <Card.Body>v1.2.0 deployed 2 hours ago</Card.Body>
        <Card.Footer>
          <span>View logs</span>
        </Card.Footer>
      </Card>,
    );
    expect(screen.getByText("acme-api")).toBeInTheDocument();
    expect(screen.getByText("Production · main")).toBeInTheDocument();
    expect(screen.getByText("v1.2.0 deployed 2 hours ago")).toBeInTheDocument();
    expect(screen.getByText("View logs")).toBeInTheDocument();
  });

  it("uses display font on Card.Title", () => {
    render(<Card.Title>title</Card.Title>);
    expect(screen.getByText("title").className).toContain("font-display");
  });

  it("uses muted color on Card.Description", () => {
    render(<Card.Description>desc</Card.Description>);
    expect(screen.getByText("desc").className).toContain("text-muted-foreground");
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(
      <Card>
        <Card.Header>
          <Card.Title>acme-api</Card.Title>
          <Card.Description>Production · main</Card.Description>
        </Card.Header>
        <Card.Body>v1.2.0 deployed 2 hours ago</Card.Body>
        <Card.Footer>
          <span>View logs</span>
        </Card.Footer>
      </Card>,
    );
  });

  // HIGH-009 / T6.2: regression-guard the compound displayName chain.
  it("exposes correct displayName on root + subparts", () => {
    expect(Card.displayName).toBe("Card");
    expect(Card.Header.displayName).toBe("Card.Header");
    expect(Card.Title.displayName).toBe("Card.Title");
    expect(Card.Description.displayName).toBe("Card.Description");
    expect(Card.Body.displayName).toBe("Card.Body");
    expect(Card.Footer.displayName).toBe("Card.Footer");
  });

  // T1.6 — size prop (theming-and-sizes plan)
  it("applies p-3 + text-title-md on subparts when Card size='sm'", () => {
    render(
      <Card size="sm">
        <Card.Header>
          <Card.Title>x</Card.Title>
        </Card.Header>
        <Card.Body>y</Card.Body>
      </Card>,
    );
    expect(screen.getByText("x").parentElement?.className ?? "").toContain("p-3");
    expect(screen.getByText("x").className).toContain("text-title-md");
    expect(screen.getByText("y").className).toContain("p-3");
  });

  it("applies p-5 + text-title-lg when Card size omitted (default md, FAANG-density)", () => {
    render(
      <Card>
        <Card.Header>
          <Card.Title>x</Card.Title>
        </Card.Header>
      </Card>,
    );
    expect(screen.getByText("x").parentElement?.className ?? "").toContain("p-5");
    expect(screen.getByText("x").className).toContain("text-title-lg");
  });

  it("applies p-6 + text-headline when Card size='lg' (FAANG-density)", () => {
    render(
      <Card size="lg">
        <Card.Header>
          <Card.Title>x</Card.Title>
        </Card.Header>
      </Card>,
    );
    expect(screen.getByText("x").parentElement?.className ?? "").toContain("p-6");
    expect(screen.getByText("x").className).toContain("text-headline");
  });

  it("Card.Title used in isolation renders without crash (Context default md)", () => {
    render(<Card.Title>orphan</Card.Title>);
    expect(screen.getByText("orphan").className).toContain("text-title-lg");
  });
});
