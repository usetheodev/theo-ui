import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type CommandItem, CommandPalette } from "./command-palette.js";

const items: CommandItem[] = [
  { id: "search", label: "Search files", searchable: "search files" },
  { id: "deploy", label: "Deploy", searchable: "deploy production" },
];

describe("CommandPalette", () => {
  it("renders nothing when closed", () => {
    render(
      <CommandPalette
        open={false}
        onOpenChange={() => undefined}
        items={items}
        onSelect={() => undefined}
      />,
    );
    expect(screen.queryByPlaceholderText(/Type a command/)).not.toBeInTheDocument();
  });

  it("renders all items when open and query is empty", () => {
    render(
      <CommandPalette
        open
        onOpenChange={() => undefined}
        items={items}
        onSelect={() => undefined}
      />,
    );
    expect(screen.getByText("Search files")).toBeInTheDocument();
    expect(screen.getByText("Deploy")).toBeInTheDocument();
  });

  it("filters items by query and fires onSelect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <CommandPalette open onOpenChange={() => undefined} items={items} onSelect={onSelect} />,
    );
    await user.type(screen.getByPlaceholderText(/Type a command/), "deploy");
    expect(screen.queryByText("Search files")).not.toBeInTheDocument();
    await user.click(screen.getByText("Deploy"));
    expect(onSelect).toHaveBeenCalledWith("deploy");
  });
});
