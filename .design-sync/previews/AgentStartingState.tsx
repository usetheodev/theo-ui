import { AgentStartingState } from "@theokit/ui";

export const Variants = () => (
  <div className="grid max-w-2xl gap-4">
    <AgentStartingState />
    <AgentStartingState
      label="Booting local sandbox…"
      hint="Validating folder permissions and warming up the model context."
    />
  </div>
);
