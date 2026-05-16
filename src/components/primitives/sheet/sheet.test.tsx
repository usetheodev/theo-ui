import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Sheet } from "./sheet.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
function Example({ side }: { side?: "right" | "left" | "top" | "bottom" }) {
  return (
    <Sheet>
      <Sheet.Trigger>Open</Sheet.Trigger>
      <Sheet.Content side={side}>
        <Sheet.Header>
          <Sheet.Title>Memory</Sheet.Title>
          <Sheet.Description>Episodes and wiki pages</Sheet.Description>
        </Sheet.Header>
        <Sheet.Body>Body content</Sheet.Body>
        <Sheet.Footer>
          <Sheet.Close>Done</Sheet.Close>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet>
  );
}

describe("Sheet", () => {
  it("renders trigger and opens content on click", async () => {
    const user = userEvent.setup();
    render(<Example />);
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByText("Open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Memory")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("defaults to the right side", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByText("Open"));
    const content = screen.getByRole("dialog");
    expect(content.className).toMatch(/right-0/);
  });

  it("respects the side prop for left", async () => {
    const user = userEvent.setup();
    render(<Example side="left" />);
    await user.click(screen.getByText("Open"));
    const content = screen.getByRole("dialog");
    expect(content.className).toMatch(/left-0/);
  });

  it("closes via the close button", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByText("Open"));
    await user.click(screen.getByText("Done"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on Escape key press (T5.2 regression)", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByText("Open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<Example />);
  });

  // HIGH-009 / T6.2: compound displayName chain.
  it("exposes correct displayName on subparts", () => {
    expect(Sheet.Overlay.displayName).toBe("Sheet.Overlay");
    expect(Sheet.Content.displayName).toBe("Sheet.Content");
    expect(Sheet.Header.displayName).toBe("Sheet.Header");
    expect(Sheet.Body.displayName).toBe("Sheet.Body");
    expect(Sheet.Footer.displayName).toBe("Sheet.Footer");
    expect(Sheet.Title.displayName).toBe("Sheet.Title");
    expect(Sheet.Description.displayName).toBe("Sheet.Description");
  });
});
