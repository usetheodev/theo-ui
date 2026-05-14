import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type Lane, LaneBoard } from "./lane-board.js";

const lanes: Lane[] = [
  {
    state: "started",
    cards: [{ id: "c1", title: "Plan refactor", description: "Break down" }],
  },
  {
    state: "blocked",
    cards: [{ id: "c2", title: "Wait API" }],
  },
  {
    state: "failed",
    cards: [],
  },
  {
    state: "finished",
    cards: [{ id: "c3", title: "Migrate auth" }],
  },
];

describe("LaneBoard", () => {
  it("renders all lane labels", () => {
    render(<LaneBoard lanes={lanes} />);
    expect(screen.getByText("Started")).toBeInTheDocument();
    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Finished")).toBeInTheDocument();
  });

  it("renders the cards in their lanes", () => {
    render(<LaneBoard lanes={lanes} />);
    expect(screen.getByText("Plan refactor")).toBeInTheDocument();
    expect(screen.getByText("Wait API")).toBeInTheDocument();
    expect(screen.getByText("Migrate auth")).toBeInTheDocument();
  });

  it("renders an optional title", () => {
    render(<LaneBoard title="Sprint board" lanes={lanes} />);
    expect(screen.getByText("Sprint board")).toBeInTheDocument();
  });
});
