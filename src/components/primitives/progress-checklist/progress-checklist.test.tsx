import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TaskStep } from "../../../types/task.js";
import { ProgressChecklist } from "./progress-checklist.js";

const steps: TaskStep[] = [
  { id: "1", label: "Read files", status: "done" },
  { id: "2", label: "Apply diff", status: "running", progress: 0.6 },
  { id: "3", label: "Run tests", status: "pending" },
];

describe("ProgressChecklist", () => {
  it("renders title and all steps", () => {
    render(<ProgressChecklist title="Progress" steps={steps} />);
    expect(screen.getByRole("heading", { name: "Progress" })).toBeInTheDocument();
    expect(screen.getByText("Read files")).toBeInTheDocument();
    expect(screen.getByText("Apply diff")).toBeInTheDocument();
    expect(screen.getByText("Run tests")).toBeInTheDocument();
  });

  it("renders without a title", () => {
    render(<ProgressChecklist steps={steps} />);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
