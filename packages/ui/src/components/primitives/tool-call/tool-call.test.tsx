import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ToolCall } from "./tool-call.js";

describe("ToolCall", () => {
  it("renders the summary", () => {
    render(<ToolCall summary="Read 18 files" />);
    expect(screen.getByText("Read 18 files")).toBeInTheDocument();
  });

  it("is disabled when no detail is provided", () => {
    render(<ToolCall summary="Inert call" />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("toggles detail visibility when expandable", async () => {
    const user = userEvent.setup();
    render(<ToolCall summary="Ran command" detail={<span>stdout: ok</span>} />);
    expect(screen.queryByText("stdout: ok")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(screen.getByText("stdout: ok")).toBeInTheDocument();
  });

  it("respects defaultOpen", () => {
    render(<ToolCall summary="Ran command" detail={<span>stdout</span>} defaultOpen />);
    expect(screen.getByText("stdout")).toBeInTheDocument();
  });
});
