import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type PlanNode, TaskPlan } from "./task-plan.js";

const plan: PlanNode[] = [
  {
    id: "1",
    label: "Read codebase",
    status: "done",
    children: [{ id: "1.1", label: "Read package.json", status: "done" }],
  },
  { id: "2", label: "Run tests", status: "running", detail: "vitest --run" },
  { id: "3", label: "Update README", status: "pending" },
];

describe("TaskPlan", () => {
  it("renders all top-level nodes with labels", () => {
    render(<TaskPlan nodes={plan} />);
    expect(screen.getByText("Read codebase")).toBeInTheDocument();
    expect(screen.getByText("Run tests")).toBeInTheDocument();
    expect(screen.getByText("Update README")).toBeInTheDocument();
  });

  it("renders nested children", () => {
    render(<TaskPlan nodes={plan} />);
    expect(screen.getByText("Read package.json")).toBeInTheDocument();
  });

  it("renders detail when provided", () => {
    render(<TaskPlan nodes={plan} />);
    expect(screen.getByText("vitest --run")).toBeInTheDocument();
  });
});
