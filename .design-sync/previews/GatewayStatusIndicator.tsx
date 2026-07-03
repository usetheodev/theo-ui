import { type GatewayStatus, GatewayStatusIndicator } from "@theokit/ui";



const STATES: GatewayStatus[] = ["online", "offline", "degraded", "reconnecting"];

export const Matrix = () => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-wrap gap-3">
      {STATES.map((s) => (
        <GatewayStatusIndicator key={s} status={s} variant="labeled" />
      ))}
    </div>
    <div className="flex flex-wrap gap-3">
      {STATES.map((s) => (
        <GatewayStatusIndicator key={s} status={s} variant="compact" />
      ))}
    </div>
  </div>
);

export const WithLatency = () => (
  <div className="flex flex-col gap-3">
    <GatewayStatusIndicator status="online" latencyMs={47} />
    <GatewayStatusIndicator status="degraded" latencyMs={2100} />
    <GatewayStatusIndicator status="online" latencyMs={0.4} />
  </div>
);
