import type { Story } from "@ladle/react";
import { useState } from "react";
import { AgentProfile, type AgentProfileDescriptor } from "./agent-profile.js";

export default { title: "Primitives / Agent / AgentProfile" };

const AGENTS: AgentProfileDescriptor[] = [
  {
    id: "coder",
    name: "Coder",
    initials: "CD",
    description: "Edits files and runs tests.",
    tone: "primary",
  },
  {
    id: "planner",
    name: "Planner",
    initials: "PL",
    description: "Breaks tasks into plans, no edits.",
    tone: "accent",
  },
  {
    id: "reviewer",
    name: "Reviewer",
    initials: "RV",
    description: "Reviews diffs, suggests changes.",
    tone: "info",
  },
  {
    id: "researcher",
    name: "Researcher",
    initials: "RS",
    description: "Searches the web, reads docs.",
    tone: "warning",
    badge: "beta",
  },
  {
    id: "ops",
    name: "Ops",
    initials: "OP",
    description: "Deploys, monitors, rolls back.",
    tone: "success",
  },
];

export const Switcher: Story = () => {
  const [active, setActive] = useState("coder");
  return <AgentProfile agents={AGENTS} activeId={active} onChange={setActive} />;
};
