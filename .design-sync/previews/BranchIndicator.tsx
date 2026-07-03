import { BranchIndicator } from "@theokit/ui";

export const Counts = () => (
  <div className="flex flex-wrap gap-3">
    <span>
      1: <BranchIndicator branchCount={1} />
    </span>
    <span>
      2: <BranchIndicator branchCount={2} />
    </span>
    <span>
      3: <BranchIndicator branchCount={3} />
    </span>
    <span>
      10: <BranchIndicator branchCount={10} />
    </span>
  </div>
);
