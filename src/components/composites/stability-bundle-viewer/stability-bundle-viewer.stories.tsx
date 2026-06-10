import type { Story } from "@ladle/react";

import { type StabilityBundle, StabilityBundleViewer } from "./stability-bundle-viewer.js";

export default { title: "Composites / Infrastructure / StabilityBundleViewer" };

const fatalBundle: StabilityBundle = {
  timestamp: "2026-05-29T14:00:00.000Z",
  severity: "fatal",
  summary: "Gateway failed to start: Invalid config at /home/node/.openclaw/openclaw.json.",
  error: {
    name: "ConfigValidationError",
    message: "models.providers.openrouter.models.0.name: expected string, received undefined",
    stack:
      "ConfigValidationError: models.providers.openrouter.models.0.name: expected string\n    at parseConfig (dist/config.js:42:11)\n    at startGateway (dist/gateway.js:18:5)",
  },
  env: {
    NODE_ENV: "production",
    HOSTNAME: "5c14100d5356",
    PORT: "18789",
    OPENROUTER_API_KEY: "[REDACTED]",
  },
  config: { gateway: { mode: "local", port: 18789 } },
  metadata: { processUptimeMs: 1280, pid: 8 },
};

const minimalBundle: StabilityBundle = {
  timestamp: "2026-05-29T14:00:00.000Z",
  severity: "warn",
  summary: "Disk space low: 5% remaining on /tmp",
};

export const Fatal: Story = () => (
  <StabilityBundleViewer bundle={fatalBundle} onCopy={() => alert("Copied!")} />
);

export const MinimalWarning: Story = () => <StabilityBundleViewer bundle={minimalBundle} />;
