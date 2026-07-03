import { useState } from "react";
import type { Skill } from "@theokit/ui";
import { SkillsList } from "@theokit/ui";



const INITIAL: Skill[] = [
  {
    id: "code-review",
    name: "code-review",
    source: "builtin",
    description:
      "Review a pull request diff and surface SQL safety, trust boundary, and side-effect issues.",
    allowedTools: ["Read", "Grep", "Bash"],
    triggers: ["review this PR", "pre-landing review"],
    state: "enabled",
  },
  {
    id: "make-pdf",
    name: "make-pdf",
    source: "project",
    description:
      "Turn any markdown file into a publication-quality PDF with cover, TOC, and watermark.",
    allowedTools: ["Read", "Write", "Bash"],
    triggers: ["make a pdf", "export to pdf"],
    state: "enabled",
  },
  {
    id: "design-review",
    name: "design-review",
    source: "plugin",
    description:
      "Designer's eye QA — finds visual inconsistency, spacing issues, AI slop patterns.",
    allowedTools: ["Read", "Grep", "Bash"],
    triggers: ["audit the design", "visual QA"],
    state: "enabled",
  },
  {
    id: "memory-pruner",
    name: "memory-pruner",
    source: "user",
    description: "Review and prune stale entries from CLAUDE.md memory files.",
    allowedTools: ["Read", "Write"],
    triggers: ["prune memories", "clean memory"],
    state: "disabled",
  },
];

export const Interactive = () => {
  const [skills, setSkills] = useState(INITIAL);
  return (
    <SkillsList
      className="max-w-3xl"
      skills={skills}
      onToggle={(id, next) =>
        setSkills((cur) => cur.map((s) => (s.id === id ? { ...s, state: next } : s)))
      }
    />
  );
};
