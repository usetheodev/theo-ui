import type { Story } from "@ladle/react";
import { WorkLog } from "./work-log.js";

export default { title: "Primitives / Agent / WorkLog" };

export const Collapsed: Story = () => (
  <div className="max-w-md">
    <WorkLog
      workedFor="2m 30s"
      steps={[
        "Read the repository structure",
        "Edited agents/support-agent.ts",
        "Added a tool schema with Zod",
        "Ran the test suite — 12 passing",
      ]}
    />
  </div>
);

export const Expanded: Story = () => (
  <div className="max-w-md">
    <WorkLog
      workedFor="47s"
      defaultOpen
      steps={[
        "Located the failing assertion",
        "Patched the off-by-one in paginate()",
        "Re-ran the suite — green",
      ]}
    />
  </div>
);
