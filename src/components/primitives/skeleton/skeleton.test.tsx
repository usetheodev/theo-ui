import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./skeleton.js";

describe("Skeleton", () => {
  it("renders a status region with aria-label=Loading", () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);
    const node = container.firstChild as HTMLElement;
    expect(node).not.toBeNull();
    expect(node.getAttribute("role")).toBe("status");
    expect(node.getAttribute("aria-label")).toBe("Loading");
  });

  it("merges custom className with default animation", () => {
    const { container } = render(<Skeleton className="h-8 w-48" />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain("animate-pulse");
    expect(node.className).toContain("h-8");
    expect(node.className).toContain("w-48");
  });
});
