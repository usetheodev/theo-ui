import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { DangerZone } from "./danger-zone.js";

describe("DangerZone", () => {
  it("defaults the title to 'Danger Zone'", () => {
    render(<DangerZone />);
    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
  });

  it("renders custom title when provided", () => {
    render(<DangerZone title="Destructive Actions" />);
    expect(screen.getByText("Destructive Actions")).toBeInTheDocument();
  });

  it("renders multiple actions with dividers", () => {
    render(
      <DangerZone>
        <DangerZone.Action
          title="Delete"
          description="..."
          action={<button type="button">delete</button>}
        />
        <DangerZone.Action
          title="Transfer"
          description="..."
          action={<button type="button">transfer</button>}
        />
        <DangerZone.Action
          title="Reset"
          description="..."
          action={<button type="button">reset</button>}
        />
      </DangerZone>,
    );
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Transfer")).toBeInTheDocument();
    expect(screen.getByText("Reset")).toBeInTheDocument();
  });

  it("last action has the last:border-b-0 utility", () => {
    const { container } = render(
      <DangerZone>
        <DangerZone.Action title="A" description="..." action={<button type="button">x</button>} />
        <DangerZone.Action title="B" description="..." action={<button type="button">y</button>} />
      </DangerZone>,
    );
    // Each action carries the utility; CSS applies it only to :last-child.
    // Action rows are children of <section> AFTER the title-row div.
    const allChildren = Array.from(container.querySelectorAll("section > div"));
    const actions = allChildren.slice(1); // skip title row
    expect(actions.length).toBe(2);
    for (const el of actions) {
      expect((el as HTMLElement).className).toContain("last:border-b-0");
    }
  });

  it("empty renders title only", () => {
    const { container } = render(<DangerZone />);
    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    expect(container.querySelectorAll("section > div").length).toBe(1); // just the title row
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <DangerZone>
        <DangerZone.Action
          title="Delete project"
          description="Permanent."
          action={<button type="button">Delete</button>}
        />
      </DangerZone>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
