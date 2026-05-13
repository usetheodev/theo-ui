import type { Story } from "@ladle/react";
import { useState } from "react";
import { type RollbackTarget, RollbackUI } from "./rollback-ui.js";

export default { title: "Composites / PaaS / RollbackUI" };

const initial: RollbackTarget[] = [
  {
    id: "v5",
    version: "v1.4.0",
    commitSha: "1f3b8e2",
    commitMessage: "feat(billing): usage metering",
    deployedAt: "2m ago",
    duration: "24s",
    isCurrent: true,
  },
  {
    id: "v4",
    version: "v1.3.0",
    commitSha: "8d9c204",
    commitMessage: "fix: preview env DNS race",
    deployedAt: "1h ago",
    duration: "22s",
  },
  {
    id: "v3",
    version: "v1.2.0",
    commitSha: "a2e9301",
    commitMessage: "feat: deploy coordination",
    deployedAt: "3h ago",
    duration: "31s",
  },
  {
    id: "v2",
    version: "v1.1.0",
    commitSha: "ff0021c",
    commitMessage: "refactor: middleware",
    deployedAt: "1d ago",
    duration: "19s",
  },
  {
    id: "v1",
    version: "v1.0.0",
    commitSha: "9871abc",
    commitMessage: "initial release",
    deployedAt: "1w ago",
    duration: "47s",
  },
];

export const Interactive: Story = () => {
  const [history, setHistory] = useState(initial);
  return (
    <div className="w-full max-w-3xl">
      <RollbackUI
        history={history}
        onRollback={async (id) => {
          await new Promise((r) => setTimeout(r, 400));
          setHistory((cur) => cur.map((h) => ({ ...h, isCurrent: h.id === id })));
        }}
      />
    </div>
  );
};
