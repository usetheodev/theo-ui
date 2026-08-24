import type { Story } from "@ladle/react";
import { TheoCodeShell } from "./theo-code-shell.js";

/**
 * Theo Code Shell — the canonical reference for the desktop app.
 *
 * The whole shell lives in `./theo-code-shell.tsx` so both this story and the
 * playground app (`playground/`) consume the same source of truth.
 */
export default { title: "Screens / Theo Code Shell" };

export const Default: Story = () => (
  <div className="dark -m-12 h-[860px]">
    <TheoCodeShell />
  </div>
);

export const StartingInChat: Story = () => (
  <div className="dark -m-12 h-[860px]">
    <TheoCodeShell initialMode="chat" />
  </div>
);

export const StartingInInfra: Story = () => (
  <div className="dark -m-12 h-[860px]">
    <TheoCodeShell initialMode="infra" />
  </div>
);
