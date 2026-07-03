import { StepsRail } from "@theokit/ui";



export const FiveSteps = () => (
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
