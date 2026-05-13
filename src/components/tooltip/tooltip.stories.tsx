import type { Story } from "@ladle/react";
import { GitBranch, Rocket } from "lucide-react";
import { Button } from "../button/button.js";
import { Tooltip } from "./tooltip.js";

export default { title: "Primitives / Tooltip" };

export const Sides: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Tooltip label="Deploy to production" side="top">
      <Button size="icon" aria-label="Deploy">
        <Rocket />
      </Button>
    </Tooltip>
    <Tooltip label="On branch main" side="right">
      <Button variant="secondary" size="sm">
        <GitBranch /> main
      </Button>
    </Tooltip>
    <Tooltip label="Cancel deployment" side="bottom">
      <Button variant="ghost" size="sm">
        Cancel
      </Button>
    </Tooltip>
    <Tooltip
      label={
        <div className="grid gap-1">
          <p className="font-bold">acme-api</p>
          <p className="text-muted-foreground">Production · main · v1.2.0</p>
        </div>
      }
      side="left"
    >
      <Button variant="secondary">Project info</Button>
    </Tooltip>
  </div>
);
