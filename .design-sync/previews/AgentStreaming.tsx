import { AgentStreaming } from "@theokit/ui";

export const States = () => (
  <div className="grid max-w-2xl gap-3">
    <AgentStreaming model="Opus 4.7" />
    <AgentStreaming
      model="Opus 4.7"
      partial="Let me start by inspecting the constraint solver in AlignmentGrid"
    />
  </div>
);
