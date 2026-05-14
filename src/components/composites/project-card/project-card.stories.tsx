import type { Story } from "@ladle/react";
import { ExternalLink, Rocket } from "lucide-react";
import { Button } from "../../primitives/button/index.js";
import { type Project, ProjectCard } from "./project-card.js";

export default { title: "Composites / PaaS / ProjectCard" };

const projects: Project[] = [
  {
    id: "1",
    name: "acme-api",
    description: "Backend Go service for Acme product.",
    framework: "Go · Buildpack",
    branch: "main",
    commitSha: "1f3b8e2",
    commitMessage: "feat: add deploy command",
    status: "live",
    region: "iad1",
    lastDeployedAt: "2m ago",
    url: "https://acme-api.usetheo.dev",
  },
  {
    id: "2",
    name: "acme-web",
    description: "Customer-facing Next.js app.",
    framework: "Next.js · CDN",
    branch: "feature/checkout-v2",
    commitSha: "8d9c204",
    commitMessage: "fix: clearer error states in checkout",
    status: "building",
    region: "iad1",
    lastDeployedAt: "30s ago",
  },
  {
    id: "3",
    name: "acme-worker",
    description: "Background job processor.",
    framework: "Node · Dockerfile",
    branch: "main",
    commitSha: "a2e9301",
    commitMessage: "chore: bump bullmq",
    status: "queued",
    region: "iad1, fra1",
    lastDeployedAt: "1m ago",
  },
  {
    id: "4",
    name: "acme-cli",
    description: "Developer-facing CLI.",
    framework: "Rust · Cargo",
    branch: "main",
    commitSha: "ff0021c",
    commitMessage: "refactor: pull config into shared crate",
    status: "failed",
    lastDeployedAt: "1h ago",
  },
];

export const Single: Story = () => (
  <div className="max-w-md">
    <ProjectCard project={projects[0] as Project} href="#" />
  </div>
);

export const Grid: Story = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    {projects.map((p) => (
      <ProjectCard
        key={p.id}
        project={p}
        href="#"
        actions={
          <>
            <Button size="sm" variant="ghost">
              <ExternalLink /> Open
            </Button>
            <Button size="sm">
              <Rocket /> Redeploy
            </Button>
          </>
        }
      />
    ))}
  </div>
);
