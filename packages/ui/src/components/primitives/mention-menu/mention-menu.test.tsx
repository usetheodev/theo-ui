import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type MentionItem, MentionMenu } from "./mention-menu.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
const items: MentionItem[] = [
  { id: "1", label: "/clear", description: "Reset session" },
  { id: "2", label: "/help", description: "Show help" },
  { id: "3", label: "/undo", description: "Undo last action" },
];

describe("MentionMenu", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <MentionMenu
        open={false}
        trigger="/"
        items={items}
        onSelect={() => undefined}
        onClose={() => undefined}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders items and default title when open", () => {
    render(
      <MentionMenu
        open
        trigger="/"
        items={items}
        onSelect={() => undefined}
        onClose={() => undefined}
      />,
    );
    expect(screen.getByText("Commands")).toBeInTheDocument();
    expect(screen.getByText("/clear")).toBeInTheDocument();
    expect(screen.getByText("/help")).toBeInTheDocument();
  });

  it("renders empty state when items is empty", () => {
    render(
      <MentionMenu
        open
        trigger="@"
        items={[]}
        onSelect={() => undefined}
        onClose={() => undefined}
        emptyLabel="Nothing here"
      />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("calls onSelect when an item is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <MentionMenu open trigger="/" items={items} onSelect={onSelect} onClose={() => undefined} />,
    );
    await user.click(screen.getByRole("menuitem", { name: /\/undo/i }));
    expect(onSelect).toHaveBeenCalledWith(items[2]);
  });

  it("invokes onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <MentionMenu open trigger="/" items={items} onSelect={() => undefined} onClose={onClose} />,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("invokes onSelect on Enter with the first item by default", () => {
    const onSelect = vi.fn();
    render(
      <MentionMenu open trigger="/" items={items} onSelect={onSelect} onClose={() => undefined} />,
    );
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(items[0]);
  });

  it("moves selection down with ArrowDown and picks the new active item on Enter", () => {
    const onSelect = vi.fn();
    render(
      <MentionMenu open trigger="/" items={items} onSelect={onSelect} onClose={() => undefined} />,
    );
    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(items[2]);
  });

  it("does not call onSelect on Enter when items is empty", () => {
    const onSelect = vi.fn();
    render(
      <MentionMenu open trigger="/" items={[]} onSelect={onSelect} onClose={() => undefined} />,
    );
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(
      <MentionMenu open={true} trigger="/" items={items} onSelect={() => {}} onClose={() => {}} />,
    );
  });
});
