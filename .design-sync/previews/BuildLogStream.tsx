import { BuildLogStream, type LogLine } from "@theokit/ui";

const lines: LogLine[] = [
  {
    id: "1",
    timestamp: "10:01:32",
    level: "info",
    message: "preparing build environment",
    source: "theo",
  },
  {
    id: "2",
    timestamp: "10:01:33",
    level: "info",
    message: "fetching dependencies",
    source: "pnpm",
  },
  {
    id: "3",
    timestamp: "10:01:35",
    level: "debug",
    message: "resolved 247 packages",
    source: "pnpm",
  },
  { id: "4", timestamp: "10:01:38", level: "info", message: "running typecheck", source: "tsc" },
  {
    id: "5",
    timestamp: "10:01:42",
    level: "warn",
    message: "deprecated: legacy ssr flag",
    source: "tsc",
  },
  { id: "6", timestamp: "10:01:44", level: "success", message: "types ok", source: "tsc" },
  { id: "7", timestamp: "10:01:46", level: "info", message: "running build", source: "tsup" },
  {
    id: "8",
    timestamp: "10:01:51",
    level: "success",
    message: "ESM bundle 13.03 KB",
    source: "tsup",
  },
  { id: "9", timestamp: "10:01:53", level: "info", message: "uploading artifact", source: "theo" },
  {
    id: "10",
    timestamp: "10:01:55",
    level: "info",
    message: "starting rolling deploy",
    source: "k8s",
  },
  {
    id: "11",
    timestamp: "10:01:58",
    level: "success",
    message: "deploy succeeded · 24s total",
    source: "theo",
  },
];

export const Full = () => (
  <div className="w-full max-w-3xl">
    <BuildLogStream lines={lines} />
  </div>
);

export const WithError = () => (
  <div className="w-full max-w-3xl">
    <BuildLogStream
      lines={[
        ...lines.slice(0, 6),
        {
          id: "x1",
          timestamp: "10:01:48",
          level: "error",
          message: "ENOSPC: no space left on device",
          source: "tsup",
        },
        {
          id: "x2",
          timestamp: "10:01:49",
          level: "error",
          message: "build aborted",
          source: "theo",
        },
      ]}
    />
  </div>
);
