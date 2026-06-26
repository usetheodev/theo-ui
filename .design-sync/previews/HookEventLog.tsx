import { type HookEventEntry, HookEventLog } from "@theokit/ui";



const EVENTS: HookEventEntry[] = [
  {
    id: "1",
    event: "PreToolUse",
    matcher: "Bash",
    command: "./scripts/audit-bash.sh",
    result: "ok",
    timestamp: "10:02:14",
    duration: "47ms",
  },
  {
    id: "2",
    event: "PostToolUse",
    matcher: "Write",
    command: "biome check --write",
    result: "ok",
    timestamp: "10:02:31",
    duration: "212ms",
    output: "Checked 1 file. Fixed 1 file.",
  },
  {
    id: "3",
    event: "PreToolUse",
    matcher: "Bash",
    command: "./scripts/audit-bash.sh",
    result: "blocked",
    timestamp: "10:03:02",
    duration: "8ms",
    output: 'blocked by audit: command matches "rm -rf"',
  },
  {
    id: "4",
    event: "Stop",
    matcher: "*",
    command: "say 'agent done'",
    result: "error",
    timestamp: "10:04:55",
    duration: "?",
    output: "command not found: say",
  },
];

export const Mixed = () => <HookEventLog className="max-w-3xl" events={EVENTS} />;
