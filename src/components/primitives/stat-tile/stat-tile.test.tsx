import { fireEvent, render, screen } from "@testing-library/react";
import { Rocket } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { StatTile } from "./stat-tile.js";

describe("StatTile", () => {
  it("renders value and label", () => {
    render(<StatTile value="42" label="Projects" />);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    const { container } = render(<StatTile value="42" label="Projects" icon={Rocket} />);
    expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(1);
  });

  it("no chevron / button semantics when onClick is undefined", () => {
    const { container } = render(<StatTile value="42" label="Projects" />);
    expect(container.querySelector("button")).toBeNull();
  });

  it("renders button + chevron when onClick provided", () => {
    const onClick = vi.fn();
    render(<StatTile value="42" label="Projects" onClick={onClick} />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button.querySelectorAll("svg").length).toBeGreaterThanOrEqual(1);
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });

  it("delta trend colors", () => {
    const { container: up } = render(
      <StatTile value="42" label="x" delta={{ value: "+1", trend: "up" }} />,
    );
    expect(up.innerHTML).toContain("text-success");

    const { container: down } = render(
      <StatTile value="42" label="x" delta={{ value: "-1", trend: "down" }} />,
    );
    expect(down.innerHTML).toContain("text-destructive");

    const { container: flat } = render(
      <StatTile value="42" label="x" delta={{ value: "0", trend: "flat" }} />,
    );
    expect(flat.innerHTML).toContain("text-muted-foreground");
  });

  it("long value has whitespace-nowrap", () => {
    const { container } = render(<StatTile value="1,234,567" label="x" />);
    expect(container.innerHTML).toContain("whitespace-nowrap");
  });

  it("has no axe violations (interactive)", async () => {
    const { container } = render(
      <StatTile value="42" label="Projects" icon={Rocket} onClick={() => undefined} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
