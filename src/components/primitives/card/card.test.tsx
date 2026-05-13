import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "./card.js";

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
});
