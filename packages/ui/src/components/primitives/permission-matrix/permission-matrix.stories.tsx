import type { Story } from "@ladle/react";
import { useState } from "react";
import { PermissionMatrix, type PermissionRule } from "./permission-matrix.js";

export default { title: "Primitives / Agent / PermissionMatrix" };

const INITIAL: PermissionRule[] = [
  { id: "1", tool: "Read", path: "**/*", decision: "allow" },
  { id: "2", tool: "Write", path: "src/**/*.ts", decision: "allow", note: "Codebase only" },
  { id: "3", tool: "Write", path: ".env*", decision: "deny", note: "Never touch env files" },
  { id: "4", tool: "Bash", path: "rm -rf*", decision: "deny" },
  { id: "5", tool: "Bash", path: "*", decision: "ask" },
  { id: "6", tool: "WebFetch", path: "*", decision: "deny" },
];

let nextId = 7;

export const Interactive: Story = () => {
  const [rules, setRules] = useState(INITIAL);
  return (
    <PermissionMatrix
      className="max-w-2xl"
      rules={rules}
      toolOptions={["Read", "Write", "Bash", "WebFetch", "Grep"]}
      onAdd={(rule) => setRules((cur) => [...cur, { id: `r-${nextId++}`, ...rule }])}
      onRemove={(id) => setRules((cur) => cur.filter((r) => r.id !== id))}
      onDecisionChange={(id, decision) =>
        setRules((cur) => cur.map((r) => (r.id === id ? { ...r, decision } : r)))
      }
    />
  );
};
