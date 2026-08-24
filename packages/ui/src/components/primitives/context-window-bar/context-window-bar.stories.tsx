import type { Story } from "@ladle/react";
import { ContextWindowBar } from "./context-window-bar.js";

export default { title: "Primitives / Agent / ContextWindowBar" };

export const Levels: Story = () => (
  <div className="grid max-w-md gap-6">
    <ContextWindowBar
      used={32_400}
      total={200_000}
      label="Context · Sonnet 4.6"
      trailing="20% used, ~167k tokens remaining"
    />
    <ContextWindowBar used={148_000} total={200_000} label="Context · approaching warning" />
    <ContextWindowBar used={186_000} total={200_000} label="Context · danger zone" />
    <ContextWindowBar used={56_000} total={1_000_000} label="Context · Opus 4.7 (1M)" />
    <ContextWindowBar used={12_000} total={200_000} compact />
  </div>
);
