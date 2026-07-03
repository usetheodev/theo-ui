import { ApprovalCard } from "@theokit/ui";

export const Severities = () => (
  <div className="grid max-w-2xl gap-3">
    <ApprovalCard
      severity="info"
      title="Run a new tool?"
      request="Bash · git status"
      description="The agent wants to use a tool it has not used in this session yet."
      onApprove={() => undefined}
      onDeny={() => undefined}
      onAlways={() => undefined}
    />
    <ApprovalCard
      severity="warning"
      title="Edit outside the workspace?"
      request="Edit · ~/.zshrc"
      description="This file is outside the project directory."
      onApprove={() => undefined}
      onDeny={() => undefined}
    />
    <ApprovalCard
      severity="destructive"
      title="Run destructive command?"
      request="Bash · rm -rf node_modules"
      description="This will permanently delete files."
      details={
        <code className="block whitespace-pre font-mono text-code-sm">
          $ rm -rf node_modules $ pnpm install --frozen-lockfile
        </code>
      }
      onApprove={() => undefined}
      onDeny={() => undefined}
    />
  </div>
);
