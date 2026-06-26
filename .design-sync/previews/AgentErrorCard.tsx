import { AgentErrorCard, Button } from "@theokit/ui";

export const Kinds = () => (
  <div className="grid max-w-2xl gap-3">
    <AgentErrorCard
      kind="rate-limit"
      title="Rate limit hit"
      detail="anthropic: 429 — retry after 60s"
      timestamp="9:59 PM"
      actions={
        <>
          <Button size="sm" variant="ghost">
            Cancel
          </Button>
          <Button size="sm">Retry in 60s</Button>
        </>
      }
    />
    <AgentErrorCard
      kind="context-overflow"
      title="Context window full"
      detail="Used 198.4k of 200k tokens. Compact to continue."
      actions={<Button size="sm">Compact now</Button>}
    />
    <AgentErrorCard
      kind="auth"
      title="Provider auth lost"
      detail="anthropic OAuth token expired."
      actions={<Button size="sm">Re-authenticate</Button>}
    />
    <AgentErrorCard
      kind="tool-failure"
      title="Tool failed"
      detail="Bash · exit 137 — process killed (OOM)"
      actions={<Button size="sm">Retry</Button>}
    />
    <AgentErrorCard
      kind="network"
      title="Network error"
      detail="ECONNRESET while streaming response"
      actions={<Button size="sm">Reconnect</Button>}
    />
  </div>
);
