import type { Story } from "@ladle/react";
import { AutoCompactNotice } from "./auto-compact-notice.js";

export default { title: "Primitives / Agent / AutoCompactNotice" };

export const Variants: Story = () => (
  <div className="grid max-w-xl gap-3">
    <AutoCompactNotice
      turnsRemaining={3}
      tokensToCompact={48_000}
      onCompactNow={() => undefined}
      onDismiss={() => undefined}
    />
    <AutoCompactNotice
      title="Context compaction available"
      turnsRemaining={1}
      onCompactNow={() => undefined}
    />
    <AutoCompactNotice title="Context near limit" tokensToCompact={120_000} />
  </div>
);
