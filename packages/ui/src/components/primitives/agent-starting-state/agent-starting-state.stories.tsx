import type { Story } from "@ladle/react";
import { AgentStartingState } from "./agent-starting-state.js";

export default { title: "Primitives / Agent / AgentStartingState" };

export const Variants: Story = () => (
  <div className="grid max-w-2xl gap-4">
    <AgentStartingState />
    <AgentStartingState
      label="Booting local sandbox…"
      hint="Validating folder permissions and warming up the model context."
    />
  </div>
);
