import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type Deployment, DeploymentRow } from "./deployment-row.js";

const base: Deployment = {
  id: "dpl_1",
  status: "live",
  environment: "production",
  branch: "main",
  commitSha: "abcdef1234567890",
  commitMessage: "feat: add deploy command",
  author: { name: "Paulo" },
  duration: "24s",
  timeAgo: "2m ago",
};

describe("DeploymentRow", () => {
  it("renders core deployment metadata", () => {
    render(<DeploymentRow deployment={base} />);
    expect(screen.getByText("feat: add deploy command")).toBeInTheDocument();
    expect(screen.getByText("production")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByText("abcdef1")).toBeInTheDocument(); // truncated SHA
    expect(screen.getByText("by Paulo")).toBeInTheDocument();
    expect(screen.getByText("24s")).toBeInTheDocument();
    expect(screen.getByText("2m ago")).toBeInTheDocument();
  });

  it("maps status to Live badge for status=live", () => {
    render(<DeploymentRow deployment={base} />);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("maps status=building to Building badge", () => {
    render(<DeploymentRow deployment={{ ...base, status: "building" }} />);
    expect(screen.getByText("Building")).toBeInTheDocument();
  });

  it("maps status=failed to Failed badge", () => {
    render(<DeploymentRow deployment={{ ...base, status: "failed" }} />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("renders action slot when provided", () => {
    render(<DeploymentRow deployment={base} actions={<button type="button">Redeploy</button>} />);
    expect(screen.getByRole("button", { name: "Redeploy" })).toBeInTheDocument();
  });
});
