import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type ToolEntry, ToolsList } from "./tools-list.js";

const tools: ToolEntry[] = [
  { id: "bash", name: "Bash", enablement: "ask", source: "built-in" },
  { id: "write", name: "Write", enablement: "enabled", source: "built-in" },
];

describe("ToolsList", () => {
  it("renders the title and each tool name", () => {
    render(<ToolsList tools={tools} />);
    expect(screen.getByRole("heading", { name: /Tools/i })).toBeInTheDocument();
    expect(screen.getByText("Bash")).toBeInTheDocument();
    expect(screen.getByText("Write")).toBeInTheDocument();
  });

  it("cycles enablement when a chip is clicked", async () => {
    const user = userEvent.setup();
    const onEnablementChange = vi.fn();
    render(<ToolsList tools={tools} onEnablementChange={onEnablementChange} />);
    await user.click(screen.getByRole("button", { name: /Cycle enablement for Write/i }));
    expect(onEnablementChange).toHaveBeenCalledWith("write", "ask");
  });
});

/**
 * Narrow-container layout — usetheokit/theokit-ui#80.
 *
 * The enablement chip used to be its own `auto` grid column, which never yielded width. Measured
 * in Chrome at a 300px panel, the row resolved to `32px 63px 104px`: the chip held 104px while
 * the tool name and its description shared 63px. The name overlapped the chip and the description
 * wrapped roughly a word per line — 398px tall for one sentence.
 *
 * jsdom does no layout, so pixel widths cannot be asserted here. What can be asserted is the
 * structure the fix depends on: the chip shares the content column, so it wraps instead of
 * competing for width, and the description is never boxed into a sliver.
 */
describe("ToolsList in a narrow container", () => {
  it("keeps the enablement chip inside the content column so it can wrap", () => {
    render(<ToolsList tools={tools} onEnablementChange={vi.fn()} />);

    const chip = screen.getByRole("button", { name: /Cycle enablement for Bash/i });
    const name = screen.getByText("Bash");

    // Same wrapping row as the name: a flex-wrap sibling, not a rigid third column.
    expect(chip.parentElement).toBe(name.parentElement);
    expect(chip.parentElement?.className).toContain("flex-wrap");
  });

  it("gives the description the full content column rather than a leftover sliver", () => {
    render(
      <ToolsList
        tools={[{ id: "feedback_list", name: "feedback_list", description: "Lists the queue." }]}
      />,
    );

    const description = screen.getByText("Lists the queue.");
    const chip = screen.getByRole("button", { name: /Cycle enablement/i });

    // The description is a sibling of the chip's row, not a cell beside the chip.
    expect(description.parentElement?.className).toContain("min-w-0");
    expect(description.parentElement?.contains(chip)).toBe(true);
    expect(description.previousElementSibling?.contains(chip)).toBe(true);
  });

  it("lets a long tool name break instead of overflowing onto the chip", () => {
    render(<ToolsList tools={[{ id: "x", name: "an_extremely_long_tool_name_here" }]} />);

    expect(screen.getByText("an_extremely_long_tool_name_here").className).toContain("break-all");
  });
});
