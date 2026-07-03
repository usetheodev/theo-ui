import { type Channel, ChannelCard } from "@theokit/ui";

const baseConnected: Channel = {
  id: "telegram-support",
  name: "support-bot",
  platform: "telegram",
  status: "connected",
  description:
    "Routes inbound DMs to the Support agent. Mirrors threads back via Telegram replies.",
  lastSeen: "2m ago",
  messageCount: 8421,
};

export const Connected = () => (
  <ChannelCard
    className="max-w-md"
    channel={baseConnected}
    onConfigure={() => undefined}
    onToggle={() => undefined}
  />
);

export const Disconnected = () => (
  <ChannelCard
    className="max-w-md"
    channel={{
      id: "discord-dev",
      name: "dev-feedback",
      platform: "discord",
      status: "disconnected",
      description: "Engineering channel — currently paused.",
    }}
    onConfigure={() => undefined}
    onToggle={() => undefined}
  />
);

export const Connecting = () => (
  <ChannelCard
    className="max-w-md"
    channel={{
      id: "slack-ops",
      name: "ops-alerts",
      platform: "slack",
      status: "connecting",
      description: "Establishing OAuth handshake…",
    }}
    onConfigure={() => undefined}
    onToggle={() => undefined}
  />
);

export const ErrorState = () => (
  <ChannelCard
    className="max-w-md"
    channel={{
      id: "wh-inbound",
      name: "voice-webhook",
      platform: "webhook",
      status: "error",
      description: "401 from inbound signer — rotate the shared secret.",
      lastSeen: "12m ago",
    }}
    onConfigure={() => undefined}
    onToggle={() => undefined}
  />
);

export const MCP = () => (
  <ChannelCard
    className="max-w-md"
    channel={{
      id: "mcp-postgres",
      name: "postgres-tools",
      platform: "mcp",
      status: "connected",
      description: "Exposes 4 read-only tools to the agent fleet.",
      lastSeen: "now",
      messageCount: 17,
    }}
    onConfigure={() => undefined}
    onToggle={() => undefined}
  />
);
