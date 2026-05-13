import type { Story } from "@ladle/react";
import { SessionListItem } from "./session-list-item.js";

export default { title: "Primitives / App Chrome / SessionListItem" };

export const States: Story = () => (
  <div className="grid max-w-xs gap-1 rounded-xl border border-border/40 bg-card p-2">
    <SessionListItem
      title="Build the alignment grid demo"
      status="running"
      mode="code"
      timestamp="now"
      active
    />
    <SessionListItem
      title="Integrate API client with retries"
      status="completed"
      mode="cowork"
      timestamp="14m ago"
    />
    <SessionListItem
      title="Race condition in upload queue (very long title that will truncate gracefully)"
      status="failed"
      mode="code"
      timestamp="1h ago"
    />
    <SessionListItem
      title="Add keyboard shortcuts to command palette"
      status="queued"
      mode="chat"
      timestamp="yesterday"
    />
    <SessionListItem
      title="Explain Tree-Sitter integration"
      status="completed"
      mode="chat"
      timestamp="2d ago"
      unread={3}
    />
    <SessionListItem
      title="Cancelled refactor"
      status="cancelled"
      mode="cowork"
      timestamp="3d ago"
    />
  </div>
);
