import { type AuditEntry, AuditLogEntry } from "@theokit/ui";

const ENTRIES: AuditEntry[] = [
  {
    id: "1",
    actor: { kind: "user", name: "paulo" },
    action: "granted permission",
    target: "Write * → ~/Downloads/capturas",
    timestamp: "10:01:32",
    severity: "info",
  },
  {
    id: "2",
    actor: { kind: "agent", name: "coder" },
    action: "edited",
    target: "src/lib/cn.ts",
    timestamp: "10:01:48",
    severity: "info",
    detail: "Added IconComponent type alias. +12 / -3 lines.",
  },
  {
    id: "3",
    actor: { kind: "agent", name: "coder" },
    action: "blocked from running",
    target: "rm -rf /etc/secrets",
    timestamp: "10:02:14",
    severity: "warning",
    detail: 'Matched permission rule "Bash · rm -rf* · deny".',
  },
  {
    id: "4",
    actor: { kind: "system", name: "audit" },
    action: "rotated session",
    timestamp: "10:03:00",
    severity: "info",
    detail: "Auto-rotation: 50k tokens, switching to fresh context.",
  },
  {
    id: "5",
    actor: { kind: "agent", name: "deployer" },
    action: "failed",
    target: "kubectl rollout undo deploy/theo-api",
    timestamp: "10:04:55",
    severity: "error",
    detail: "exit 1: cluster unreachable.",
  },
];

export const Mixed = () => (
  <div className="max-w-3xl rounded-xl border bg-card">
    {ENTRIES.map((e) => (
      <AuditLogEntry key={e.id} entry={e} />
    ))}
  </div>
);
