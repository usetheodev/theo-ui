import { UpdateBanner } from "@theokit/ui";



export const Info = () => (
  <UpdateBanner
    currentVersion="2026.5.17"
    latestVersion="2026.5.27"
    onUpdate={() => alert("Update!")}
    onDismiss={() => alert("Dismiss!")}
  />
);

export const Warn = () => (
  <UpdateBanner
    currentVersion="1.0.0"
    latestVersion="2.0.0"
    severity="warn"
    onUpdate={() => alert("Major update!")}
  />
);
