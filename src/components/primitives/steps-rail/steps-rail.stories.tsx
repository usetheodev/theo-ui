import type { Story } from "@ladle/react";
import { StepsRail } from "./steps-rail.js";

export default { title: "Primitives / Cowork / StepsRail" };

export const FiveSteps: Story = () => (
  <div className="flex h-[420px]">
    <StepsRail
      title="Steps"
      steps={[
        { id: 1, state: "complete" },
        { id: 2, state: "complete" },
        { id: 3, state: "current" },
        { id: 4, state: "pending" },
        { id: 5, state: "pending" },
      ]}
    />
  </div>
);
