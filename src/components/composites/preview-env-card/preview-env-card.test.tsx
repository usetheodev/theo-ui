import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type PreviewEnv, PreviewEnvCard } from "./preview-env-card.js";

const env: PreviewEnv = {
  id: "pe1",
  prNumber: 142,
  prTitle: "feat: preview env DNS",
  branch: "feature/preview-envs",
  author: { name: "Paulo" },
  createdAt: "2h ago",
  services: [
    { name: "api", url: "https://pr-142-api.preview.usetheo.dev", status: "live" },
    { name: "web", url: "https://pr-142-web.preview.usetheo.dev", status: "live" },
    { name: "worker", status: "building" },
  ],
};

describe("PreviewEnvCard", () => {
  it("renders PR title and number", () => {
    render(<PreviewEnvCard env={env} />);
    expect(screen.getByText("PR #142")).toBeInTheDocument();
    expect(screen.getByText("feat: preview env DNS")).toBeInTheDocument();
  });

  it("renders branch + author + createdAt", () => {
    render(<PreviewEnvCard env={env} />);
    expect(screen.getByText("feature/preview-envs")).toBeInTheDocument();
    expect(screen.getByText("by Paulo")).toBeInTheDocument();
    expect(screen.getByText("opened 2h ago")).toBeInTheDocument();
  });

  it("lists all services with their hosts and statuses", () => {
    render(<PreviewEnvCard env={env} />);
    expect(screen.getByText("api")).toBeInTheDocument();
    expect(screen.getByText("web")).toBeInTheDocument();
    expect(screen.getByText("worker")).toBeInTheDocument();
    expect(screen.getByText("pr-142-api.preview.usetheo.dev")).toBeInTheDocument();
    expect(screen.getByText("internal")).toBeInTheDocument();
    expect(screen.getAllByText("Live").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Building")).toBeInTheDocument();
  });

  it("renders count badge in header (services count)", () => {
    render(<PreviewEnvCard env={env} />);
    expect(screen.getByText(/3 services/)).toBeInTheDocument();
  });

  it("renders 'service' (singular) when only one", () => {
    render(<PreviewEnvCard env={{ ...env, services: [env.services[0] as never] }} />);
    expect(screen.getByText(/1 service/)).toBeInTheDocument();
    expect(screen.queryByText(/services/)).not.toBeInTheDocument();
  });
});
