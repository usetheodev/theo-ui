import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type DiffHunk, DiffViewer } from "./diff-viewer.js";

const hunks: DiffHunk[] = [
  {
    id: "h1",
    header: "@@ -1,3 +1,3 @@",
    lines: [
      { kind: "unchanged", oldNumber: 1, newNumber: 1, content: "hello" },
      { kind: "removed", oldNumber: 2, content: "old line" },
      { kind: "added", newNumber: 2, content: "new line" },
    ],
  },
  {
    id: "h2",
    lines: [
      { kind: "unchanged", oldNumber: 50, newNumber: 50, content: "" },
      { kind: "unchanged", oldNumber: 51, newNumber: 51, content: "" },
    ],
    collapsed: true,
  },
];

describe("DiffViewer", () => {
  it("renders path and stats", () => {
    render(<DiffViewer path="src/app.ts" stats={{ added: 5, removed: 2 }} hunks={hunks} />);
    expect(screen.getByText("src/app.ts")).toBeInTheDocument();
    expect(screen.getByText("+5")).toBeInTheDocument();
    expect(screen.getByText("-2")).toBeInTheDocument();
  });

  it("renders hunk header and added/removed lines", () => {
    render(<DiffViewer path="x" hunks={hunks} />);
    expect(screen.getByText("@@ -1,3 +1,3 @@")).toBeInTheDocument();
    expect(screen.getByText("old line")).toBeInTheDocument();
    expect(screen.getByText("new line")).toBeInTheDocument();
  });

  it("collapses placeholder hunks", () => {
    render(<DiffViewer path="x" hunks={hunks} />);
    expect(screen.getByText(/2 unmodified lines/)).toBeInTheDocument();
  });
});
