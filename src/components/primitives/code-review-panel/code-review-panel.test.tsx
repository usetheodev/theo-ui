import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { CodeReviewPanel, type ReviewFile } from "./code-review-panel.js";

const files: ReviewFile[] = [
  {
    path: "agents/support-agent.ts",
    additions: 12,
    deletions: 3,
    diff: "--- a/agents/support-agent.ts\n+++ b/agents/support-agent.ts\n context line\n+added line\n-removed line",
  },
  {
    path: "agents/tools/lookup.ts",
    additions: 5,
    deletions: 4,
    diff: "+++ b/agents/tools/lookup.ts\n+brand new\n-old removed",
  },
];

describe("CodeReviewPanel", () => {
  it("renders a diff for every file by default", () => {
    render(<CodeReviewPanel files={files} />);
    const diffs = screen.getAllByTestId("review-file-diff");
    expect(diffs).toHaveLength(2);
  });

  it("filters to the selected file", () => {
    render(<CodeReviewPanel files={files} selectedPath="agents/tools/lookup.ts" />);
    const diffs = screen.getAllByTestId("review-file-diff");
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toHaveAttribute("data-path", "agents/tools/lookup.ts");
  });

  it("shows aggregate additions and deletions", () => {
    render(<CodeReviewPanel files={files} />);
    expect(screen.getByText("+17")).toBeInTheDocument();
    expect(screen.getByText("-7")).toBeInTheDocument();
  });

  it("parses the diff into add / del / context rows", () => {
    render(<CodeReviewPanel files={files.slice(0, 1)} />);
    expect(screen.getAllByTestId("diff-line-add").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId("diff-line-del").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId("diff-line-ctx").length).toBeGreaterThanOrEqual(1);
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CodeReviewPanel files={files} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /close review/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("selects a file from the tree", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CodeReviewPanel files={files} onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "lookup.ts" }));
    expect(onSelect).toHaveBeenCalledWith("agents/tools/lookup.ts");
  });

  it("exposes a data-slot", () => {
    const { container } = render(<CodeReviewPanel files={files} />);
    expect(container.querySelector('[data-slot="code-review-panel"]')).not.toBeNull();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<CodeReviewPanel files={files} onClose={() => {}} />);
  });
});
