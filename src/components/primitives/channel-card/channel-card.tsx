import {
  type LucideIcon,
  MessageCircle,
  Power,
  Send,
  Settings,
  Slack,
  Webhook,
} from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

export type ChannelPlatform = "telegram" | "discord" | "slack" | "whatsapp" | "webhook" | "mcp";

export type ChannelStatus = "disconnected" | "connecting" | "connected" | "error";

export interface Channel {
  id: string;
  name: string;
  platform: ChannelPlatform;
  status: ChannelStatus;
  description?: ReactNode;
  lastSeen?: string;
  messageCount?: number;
}

const PLATFORM_ICON: Record<ChannelPlatform, LucideIcon> = {
  telegram: Send,
  discord: MessageCircle,
  slack: Slack,
  whatsapp: MessageCircle,
  webhook: Webhook,
  mcp: Webhook,
};

const PLATFORM_LABEL: Record<ChannelPlatform, string> = {
  telegram: "Telegram",
  discord: "Discord",
  slack: "Slack",
  whatsapp: "WhatsApp",
  webhook: "Webhook",
  mcp: "MCP",
};

const STATUS_CONFIG: Record<ChannelStatus, { label: string; class: string }> = {
  connected: { label: "Connected", class: "border-success/40 bg-success/15 text-success" },
  connecting: {
    label: "Connecting",
    class: "border-primary/40 bg-primary/15 text-primary animate-pulse",
  },
  disconnected: {
    label: "Disconnected",
    class: "border-muted-foreground/40 bg-muted/40 text-muted-foreground",
  },
  error: { label: "Error", class: "border-destructive/40 bg-destructive/15 text-destructive" },
};

interface ChannelCardProps extends HTMLAttributes<HTMLElement> {
  channel: Channel;
  onConfigure?: (id: string) => void;
  onToggle?: (id: string, enabled: boolean) => void;
}

/**
 * ChannelCard — inbound gateway connection (Telegram, Discord, Slack, …)
 * showing its connection status, platform, and inline controls.
 *
 * EC absorbed: the toggle reflects the *current* status. "connected" implies
 * enabled (toggle off disconnects); "disconnected"/"error" implies disabled
 * (toggle on reconnects). "connecting" is a transient state — toggle is a
 * no-op (button disabled).
 */
const ChannelCard = forwardRef<HTMLElement, ChannelCardProps>(
  ({ className, channel, onConfigure, onToggle, ...props }, ref) => {
    const cfg = STATUS_CONFIG[channel.status];
    const Icon = PLATFORM_ICON[channel.platform];
    const enabled = channel.status === "connected";
    const togglePending = channel.status === "connecting";

    return (
      <article
        data-slot="channel-card"
        ref={ref}
        className={cn("grid gap-3 rounded-xl border border-border bg-card p-4", className)}
        aria-label={`Channel ${channel.name}`}
        {...props}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <h4 className="font-medium font-mono text-body-sm text-foreground">{channel.name}</h4>
              <p className="truncate font-mono text-label text-muted-foreground">
                {PLATFORM_LABEL[channel.platform]}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5",
              "font-mono text-label uppercase tracking-wider",
              cfg.class,
            )}
          >
            {cfg.label}
          </span>
        </header>

        {channel.description ? (
          <p className="font-sans text-body-sm text-muted-foreground">{channel.description}</p>
        ) : null}

        {(channel.lastSeen !== undefined || channel.messageCount !== undefined) && (
          <dl className="grid grid-cols-2 gap-2 font-mono text-label">
            {channel.lastSeen !== undefined ? (
              <div>
                <dt className="text-muted-foreground uppercase tracking-wider">Last seen</dt>
                <dd className="text-foreground">{channel.lastSeen}</dd>
              </div>
            ) : null}
            {channel.messageCount !== undefined ? (
              <div>
                <dt className="text-muted-foreground uppercase tracking-wider">Messages</dt>
                <dd className="text-foreground">{channel.messageCount.toLocaleString()}</dd>
              </div>
            ) : null}
          </dl>
        )}

        <footer className="flex items-center justify-end gap-1.5">
          {onConfigure ? (
            <button
              type="button"
              onClick={() => onConfigure(channel.id)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-2.5 py-1 font-mono text-label hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Settings className="size-3" /> Configure
            </button>
          ) : null}
          {onToggle ? (
            <button
              type="button"
              onClick={() => onToggle(channel.id, !enabled)}
              disabled={togglePending}
              aria-pressed={enabled}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-2.5 py-1 font-mono text-label hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                togglePending && "cursor-not-allowed opacity-60",
                enabled && "text-success",
              )}
            >
              <Power className="size-3" />
              {enabled ? "Disconnect" : "Connect"}
            </button>
          ) : null}
        </footer>
      </article>
    );
  },
);
ChannelCard.displayName = "ChannelCard";

export { ChannelCard };
