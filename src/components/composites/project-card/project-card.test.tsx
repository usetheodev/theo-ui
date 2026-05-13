import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type Project, ProjectCard } from "./project-card.js";

const base: Project = {
  id: "p1",
  name: "acme-api",
  description: "Internal API for the Acme product.",
  framework: "Go",
  branch: "main",
  commitSha: "abcdef1234",
  commitMessage: "feat: add deploy command",
  status: "live",
  region: "iad1",
  lastDeployedAt: "2m ago",
};

describe("ProjectCard", () => {
  it("renders project name, framework, branch, sha", () => {
    render(<ProjectCard project={base} />);
    expect(screen.getByText("acme-api")).toBeInTheDocument();
    expect(screen.getByText("Go")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByText("abcdef1")).toBeInTheDocument();
    expect(screen.getByText("iad1")).toBeInTheDocument();
    expect(screen.getByText("2m ago")).toBeInTheDocument();
  });

  it("shows Live status badge", () => {
    render(<ProjectCard project={base} />);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("renders as anchor when href is provided", () => {
    render(<ProjectCard project={base} href="/projects/acme-api" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/projects/acme-api");
  });

  it("renders as div when href is omitted", () => {
    render(<ProjectCard project={base} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("hides description and commit message when detailed=false", () => {
    render(<ProjectCard project={base} detailed={false} />);
    expect(screen.queryByText("Internal API for the Acme product.")).not.toBeInTheDocument();
    expect(screen.queryByText("feat: add deploy command")).not.toBeInTheDocument();
  });

  it("renders Building label when status=building", () => {
    render(<ProjectCard project={{ ...base, status: "building" }} />);
    expect(screen.getByText("Building")).toBeInTheDocument();
  });
});
