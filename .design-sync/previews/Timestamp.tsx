import { Timestamp } from "@theokit/ui";



const now = Date.now();

export const Relative = () => (
  <div className="flex flex-col gap-2 font-mono text-body-sm">
    <Timestamp value={new Date(now - 30_000)} />
    <Timestamp value={new Date(now - 5 * 60_000)} />
    <Timestamp value={new Date(now - 2 * 60 * 60_000)} />
    <Timestamp value={new Date(now - 3 * 24 * 60 * 60_000)} />
    <Timestamp value={new Date(now - 30 * 24 * 60 * 60_000)} />
    <Timestamp value={new Date(now - 400 * 24 * 60 * 60_000)} />
  </div>
);

export const Absolute = () => (
  <div className="font-mono text-body-sm">
    <Timestamp value={new Date(now - 3 * 60 * 60_000)} format="absolute" />
  </div>
);

export const Both = () => (
  <div className="font-mono text-body-sm">
    <Timestamp value={new Date(now - 3 * 60 * 60_000)} format="both" />
  </div>
);

export const WithTooltip = () => (
  <div className="font-mono text-body-sm">
    Hover the timestamp: <Timestamp value={new Date(now - 3 * 60 * 60_000)} />
  </div>
);
