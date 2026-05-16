import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ToolCallCard } from "./tool-call-card.js";

describe("ToolCallCard", () => {
  it("renders tool name, target, and status label", () => {
    render(<ToolCallCard tool="Bash" target="tsc --noEmit" status="success" />);
    expect(screen.getByText("Bash")).toBeInTheDocument();
    expect(screen.getByText("tsc --noEmit")).toBeInTheDocument();
    expect(screen.getByLabelText("Completed")).toBeInTheDocument();
  });

  it("does not render an expander when no output is provided", () => {
    render(<ToolCallCard tool="Lint" status="success" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders the output when expanded", async () => {
    const user = userEvent.setup();
    render(
      <ToolCallCard
        tool="Bash"
        target="tsc --noEmit"
        status="failed"
        output={<pre>error TS2304: Cannot find name 'foo'.</pre>}
      />,
    );
    expect(screen.queryByText(/error TS2304/)).toBeNull();
    await user.click(screen.getByRole("button"));
    expect(screen.getByText(/error TS2304/)).toBeInTheDocument();
  });

  it("renders the output expanded by default when defaultExpanded is true", () => {
    render(
      <ToolCallCard
        tool="Bash"
        target="tsc --noEmit"
        status="failed"
        defaultExpanded
        output={<pre>error TS2304</pre>}
      />,
    );
    expect(screen.getByText(/error TS2304/)).toBeInTheDocument();
  });

  it("does not use <header role=button> pattern (T5.4 regression)", () => {
    const { container } = render(
      <ToolCallCard tool="Bash" target="tsc --noEmit" status="success" output={<pre>ok</pre>} />,
    );
    // Header element with role=button is the prohibited pattern (axe + AT
    // confusion). The expander is now a dedicated <button> inside a <div>.
    expect(container.querySelector('header[role="button"]')).toBeNull();
  });

  it("status icon span has role=img so aria-label is valid (T5.4)", () => {
    const { container } = render(<ToolCallCard tool="Bash" status="running" />);
    const statusSpan = container.querySelector('span[role="img"]');
    expect(statusSpan).not.toBeNull();
    expect(statusSpan?.getAttribute("aria-label")).toBe("Running");
  });
});
