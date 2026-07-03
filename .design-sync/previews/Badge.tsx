import { Badge } from "@theokit/ui";

export const Variants = () => (
  <div className="flex flex-wrap gap-3">
    <Badge>Default</Badge>
    <Badge variant="primary">Primary</Badge>
    <Badge variant="accent">Beta</Badge>
    <Badge variant="success">Live</Badge>
    <Badge variant="warning">Degraded</Badge>
    <Badge variant="destructive">Failed</Badge>
    <Badge variant="outline">Free tier</Badge>
  </div>
);

export const WithStatusDot = () => (
  <div className="flex flex-wrap gap-3">
    <Badge variant="success">
      <Badge.Dot tone="success" /> Deployed
    </Badge>
    <Badge variant="primary">
      <Badge.Dot tone="primary" pulse /> Building
    </Badge>
    <Badge variant="warning">
      <Badge.Dot tone="warning" pulse /> Queued
    </Badge>
    <Badge variant="destructive">
      <Badge.Dot tone="destructive" /> Failed
    </Badge>
    <Badge>
      <Badge.Dot tone="muted" /> Idle
    </Badge>
  </div>
);

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Badge size="sm">Small</Badge>
    <Badge size="md">Medium (default)</Badge>
    <Badge size="lg">Large</Badge>
    <Badge size="sm" variant="success">
      Live
    </Badge>
    <Badge size="lg" variant="destructive">
      Failed
    </Badge>
  </div>
);
