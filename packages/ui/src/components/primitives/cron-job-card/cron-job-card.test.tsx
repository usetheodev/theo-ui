import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type CronJob, CronJobCard } from "./cron-job-card.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
const job: CronJob = {
  id: "j1",
  name: "Refresh issues",
  schedule: "0 */4 * * *",
  prompt: "summarize new issues since last run",
  status: "idle",
  lastRun: "2026-05-13 12:00",
  nextRun: "2026-05-13 16:00",
};

describe("CronJobCard", () => {
  it("renders the job name and schedule", () => {
    render(<CronJobCard job={job} />);
    expect(screen.getByText("Refresh issues")).toBeInTheDocument();
    expect(screen.getByText(/0 \*\/4 \* \* \*/)).toBeInTheDocument();
  });

  it("renders the prompt", () => {
    render(<CronJobCard job={job} />);
    expect(screen.getByText(/summarize new issues/)).toBeInTheDocument();
  });

  it("calls onRunNow when the run-now button is clicked", async () => {
    const user = userEvent.setup();
    const onRunNow = vi.fn();
    render(<CronJobCard job={job} onRunNow={onRunNow} />);
    const runBtn = screen.getByRole("button", { name: /run now/i });
    await user.click(runBtn);
    expect(onRunNow).toHaveBeenCalledWith("j1");
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<CronJobCard job={job} />);
  });
});
