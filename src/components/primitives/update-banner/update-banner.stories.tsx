import type { Story } from "@ladle/react";

import { UpdateBanner } from "./update-banner.js";

export default { title: "Primitives / Infrastructure / UpdateBanner" };

export const Info: Story = () => (
  <UpdateBanner
    currentVersion="2026.5.17"
    latestVersion="2026.5.27"
    onUpdate={() => alert("Update!")}
    onDismiss={() => alert("Dismiss!")}
  />
);

export const Warn: Story = () => (
  <UpdateBanner
    currentVersion="1.0.0"
    latestVersion="2.0.0"
    severity="warn"
    onUpdate={() => alert("Major update!")}
  />
);
