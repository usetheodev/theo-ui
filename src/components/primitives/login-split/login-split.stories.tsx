import type { Story } from "@ladle/react";
import { LoginSplit } from "./login-split.js";

export default { title: "Primitives / Layout / LoginSplit" };

export const Shell: Story = () => (
  <div className="-m-12 h-[700px] overflow-hidden">
    <LoginSplit
      footer="© 2026 Theo. Forged for builders."
      left={
        <div className="grid gap-4 text-center">
          <h2 className="font-display text-display-md tracking-tight">Left pane slot</h2>
          <p className="text-body-md text-muted-foreground">
            Your form goes here. See <code className="font-mono">Screens / Login Split</code> for
            the full assembled example.
          </p>
        </div>
      }
      right={
        <div className="grid h-72 place-items-center rounded-2xl border border-primary/30 bg-card font-mono text-label-caps text-muted-foreground uppercase tracking-wider shadow-glow">
          [right pane slot]
        </div>
      }
    />
  </div>
);
