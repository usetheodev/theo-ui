import type { Story } from "@ladle/react";
import { ArrowRight, Download, Loader2, Rocket, Trash2 } from "lucide-react";
import { Button } from "./button.js";

export default {
  title: "Primitives / Button",
};

export const Variants: Story = () => (
  <div className="grid gap-6">
    <Row label="Primary">
      <Button>Deploy</Button>
      <Button>
        <Rocket /> Deploy
      </Button>
      <Button>
        Deploy <ArrowRight />
      </Button>
    </Row>
    <Row label="Secondary">
      <Button variant="secondary">Cancel</Button>
      <Button variant="secondary">
        <Download /> Download
      </Button>
    </Row>
    <Row label="Accent (burnt sienna)">
      <Button variant="accent">Celebrate</Button>
    </Row>
    <Row label="Ghost">
      <Button variant="ghost">Settings</Button>
    </Row>
    <Row label="Link">
      <Button variant="link">View deployment logs</Button>
    </Row>
    <Row label="Destructive">
      <Button variant="destructive">
        <Trash2 /> Delete project
      </Button>
    </Row>
  </div>
);

export const Sizes: Story = () => (
  <div className="grid gap-6">
    <Row label="sm">
      <Button size="sm">Deploy</Button>
      <Button size="sm" variant="secondary">
        Cancel
      </Button>
    </Row>
    <Row label="md (default)">
      <Button>Deploy</Button>
      <Button variant="secondary">Cancel</Button>
    </Row>
    <Row label="lg">
      <Button size="lg">Deploy</Button>
      <Button size="lg" variant="secondary">
        Cancel
      </Button>
    </Row>
    <Row label="icon">
      <Button size="icon" aria-label="Settings">
        <Rocket />
      </Button>
      <Button size="icon" variant="secondary" aria-label="Download">
        <Download />
      </Button>
    </Row>
  </div>
);

export const States: Story = () => (
  <div className="grid gap-6">
    <Row label="Disabled">
      <Button disabled>Deploy</Button>
      <Button disabled variant="secondary">
        Cancel
      </Button>
    </Row>
    <Row label="Loading">
      <Button disabled>
        <Loader2 className="animate-spin" /> Deploying…
      </Button>
    </Row>
  </div>
);

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-6">
      <span className="font-mono text-label-caps text-muted-foreground uppercase">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
