import { StatusDot, type StatusKind } from "@theokit/ui";



const kinds: StatusKind[] = ["live", "building", "failed", "idle", "warning"];

export const Kinds = () => (
  <div className="flex gap-6">
    {kinds.map((k) => (
      <StatusDot key={k} status={k} aria-label={k} />
    ))}
  </div>
);

export const Sizes = () => (
  <div className="flex items-center gap-6">
    <StatusDot status="live" size="xs" aria-label="xs" />
    <StatusDot status="live" size="sm" aria-label="sm" />
    <StatusDot status="live" size="md" aria-label="md" />
  </div>
);

export const WithLabels = () => (
  <div className="flex flex-col gap-2">
    {kinds.map((k) => (
      <StatusDot key={k} status={k} label={k.charAt(0).toUpperCase() + k.slice(1)} />
    ))}
  </div>
);
