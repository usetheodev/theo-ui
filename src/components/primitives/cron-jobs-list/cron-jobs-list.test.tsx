import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CronJob } from "../cron-job-card/cron-job-card.js";
import { CronJobsList } from "./cron-jobs-list.js";

const jobs: CronJob[] = [
  {
    id: "j1",
    name: "Build",
    schedule: "0 * * * *",
    prompt: "run build",
    status: "idle",
  },
  {
    id: "j2",
    name: "Deploy",
    schedule: "0 6 * * *",
    prompt: "deploy",
    status: "running",
  },
];

describe("CronJobsList", () => {
  it("renders all jobs and the job count", () => {
    render(<CronJobsList jobs={jobs} />);
    expect(screen.getByText("Build")).toBeInTheDocument();
    expect(screen.getByText("Deploy")).toBeInTheDocument();
    expect(screen.getByText(/2 jobs/)).toBeInTheDocument();
  });

  it("singularizes job count when only one job", () => {
    render(<CronJobsList jobs={[jobs[0] as CronJob]} />);
    expect(screen.getByText(/1 job\b/)).toBeInTheDocument();
  });

  it("fires onAdd when the new job button is clicked", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<CronJobsList jobs={jobs} onAdd={onAdd} />);
    await user.click(screen.getByRole("button", { name: /New job/ }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
