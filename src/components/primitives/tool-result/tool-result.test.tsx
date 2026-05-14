import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToolResult } from "./tool-result.js";

describe("ToolResult", () => {
  it("renders text variant as a plain div", () => {
    const { container } = render(<ToolResult>plain body</ToolResult>);
    expect(screen.getByText("plain body")).toBeInTheDocument();
    expect(container.querySelector("pre")).toBeNull();
  });

  it("renders code variant inside a pre block", () => {
    const { container } = render(<ToolResult variant="code">npm test</ToolResult>);
    expect(container.querySelector("pre")?.textContent).toBe("npm test");
  });

  it("renders json variant inside a pre block with tinted color class", () => {
    const { container } = render(<ToolResult variant="json">{`{"k":1}`}</ToolResult>);
    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.className).toContain("text-primary-glow");
  });
});
