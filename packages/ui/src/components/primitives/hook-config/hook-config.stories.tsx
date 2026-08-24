import type { Story } from "@ladle/react";
import { useState } from "react";
import { HookConfig, type HookEntry } from "./hook-config.js";

export default { title: "Primitives / Agent / HookConfig" };

const INITIAL: HookEntry[] = [
  {
    id: "1",
    event: "PreToolUse",
    matcher: "Bash",
    command: "./scripts/audit-bash.sh",
    enabled: true,
  },
  {
    id: "2",
    event: "PostToolUse",
    matcher: "Write",
    command: "biome check --write",
    enabled: true,
  },
  { id: "3", event: "Stop", matcher: "*", command: "say 'agent done'", enabled: false },
];

let nextId = 4;

export const Interactive: Story = () => {
  const [hooks, setHooks] = useState(INITIAL);
  return (
    <HookConfig
      className="max-w-3xl"
      hooks={hooks}
      onAdd={(h) => setHooks((cur) => [...cur, { id: `h-${nextId++}`, ...h, enabled: true }])}
      onRemove={(id) => setHooks((cur) => cur.filter((h) => h.id !== id))}
      onToggle={(id, enabled) =>
        setHooks((cur) => cur.map((h) => (h.id === id ? { ...h, enabled } : h)))
      }
    />
  );
};
