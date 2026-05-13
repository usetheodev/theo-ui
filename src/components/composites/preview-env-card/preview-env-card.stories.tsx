import type { Story } from "@ladle/react";
import { ExternalLink, Rocket, Trash2 } from "lucide-react";
import { Button } from "../../primitives/button/button.js";
import { type PreviewEnv, PreviewEnvCard } from "./preview-env-card.js";

export default { title: "Composites / PaaS / PreviewEnvCard" };

const env: PreviewEnv = {
  id: "1",
  prNumber: 142,
  prTitle: "feat: preview env DNS propagation",
  branch: "feature/preview-envs",
  author: { name: "Paulo" },
  createdAt: "2h ago",
  services: [
    { name: "api", url: "https://pr-142-api.preview.usetheo.dev", status: "live" },
    { name: "web", url: "https://pr-142-web.preview.usetheo.dev", status: "live" },
    { name: "worker", status: "building" },
  ],
};

const envFailed: PreviewEnv = {
  ...env,
  id: "2",
  prNumber: 138,
  prTitle: "refactor: api middleware consolidation",
  branch: "feature/middleware",
  services: [
    { name: "api", url: "https://pr-138-api.preview.usetheo.dev", status: "failed" },
    { name: "web", url: "https://pr-138-web.preview.usetheo.dev", status: "cancelled" },
  ],
};

export const Full: Story = () => (
  <div className="grid w-full max-w-3xl gap-4">
    <PreviewEnvCard
      env={env}
      actions={
        <>
          <Button size="sm" variant="ghost">
            <ExternalLink /> Open preview
          </Button>
          <Button size="sm">
            <Rocket /> Promote to staging
          </Button>
          <Button size="sm" variant="ghost" className="ml-auto">
            <Trash2 /> Tear down
          </Button>
        </>
      }
    />
    <PreviewEnvCard env={envFailed} />
  </div>
);
