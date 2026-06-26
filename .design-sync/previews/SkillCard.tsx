import { SkillCard } from "@theokit/ui";



export const States = () => (
  <div className="grid max-w-xl gap-2">
    <SkillCard
      skill={{
        id: "sk1",
        name: "diff-explainer",
        description: "Explain a diff in plain English with intent + risk.",
        source: "user",
        state: "enabled",
        allowedTools: ["Read", "Grep"],
        triggers: ["explain diff"],
      }}
      onToggle={() => undefined}
    />
    <SkillCard
      skill={{
        id: "sk2",
        name: "test-runner",
        description: "Run the test suite and summarise failures.",
        source: "project",
        state: "enabled",
        allowedTools: ["Bash"],
      }}
      onToggle={() => undefined}
    />
    <SkillCard
      skill={{
        id: "sk3",
        name: "security-audit",
        description: "OWASP-style sweep over the changed files.",
        source: "plugin",
        state: "disabled",
      }}
      onToggle={() => undefined}
    />
  </div>
);
