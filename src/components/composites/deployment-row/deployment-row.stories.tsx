import type { Story } from "@ladle/react";
import { MoreHorizontal, RotateCcw } from "lucide-react";
import { Button } from "../../primitives/button/index.js";
import { Card } from "../../primitives/card/index.js";
import { type Deployment, DeploymentRow } from "./deployment-row.js";

export default { title: "Composites / PaaS / DeploymentRow" };

const deployments: Deployment[] = [
  {
    id: "1",
    status: "live",
    environment: "production",
    branch: "main",
    commitSha: "1f3b8e2",
    commitMessage: "feat(billing): add usage metering for Pro plan",
    author: { name: "Paulo" },
    duration: "24s",
    timeAgo: "2m ago",
  },
  {
    id: "2",
    status: "deploying",
    environment: "staging",
    branch: "feature/preview-envs",
    commitSha: "8d9c204",
    commitMessage: "fix: preview env DNS propagation race",
    author: { name: "Alfredo" },
    duration: "—",
    timeAgo: "5m ago",
  },
  {
    id: "3",
    status: "building",
    environment: "preview/PR-142",
    branch: "feature/migrations",
    commitSha: "a2e9301",
    commitMessage: "chore: bump postgres operator to 1.24",
    author: { name: "Theo" },
    duration: "—",
    timeAgo: "8m ago",
  },
  {
    id: "4",
    status: "failed",
    environment: "production",
    branch: "main",
    commitSha: "ff0021c",
    commitMessage: "refactor(api): consolidate request middleware",
    author: { name: "Paulo" },
    duration: "12s",
    timeAgo: "1h ago",
  },
  {
    id: "5",
    status: "cancelled",
    environment: "staging",
    branch: "main",
    commitSha: "9871abc",
    commitMessage: "test: add e2e for rollback",
    author: { name: "Paulo" },
    duration: "3s",
    timeAgo: "3h ago",
  },
];

export const List: Story = () => (
  <Card className="w-full max-w-3xl overflow-hidden p-0">
    <Card.Header className="p-4">
      <Card.Title>Recent deployments</Card.Title>
      <Card.Description>Last 24 hours · acme-api</Card.Description>
    </Card.Header>
    <div>
      {deployments.map((d) => (
        <DeploymentRow
          key={d.id}
          deployment={d}
          actions={
            <>
              <Button size="icon" variant="ghost" aria-label="Redeploy">
                <RotateCcw />
              </Button>
              <Button size="icon" variant="ghost" aria-label="More">
                <MoreHorizontal />
              </Button>
            </>
          }
        />
      ))}
    </div>
  </Card>
);
