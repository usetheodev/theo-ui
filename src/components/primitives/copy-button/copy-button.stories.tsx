import type { Story } from "@ladle/react";
import { CopyButton } from "./copy-button.js";

export default { title: "Primitives / Inputs / CopyButton" };

export const IconOnlyGhost: Story = () => <CopyButton value="theo deploy" aria-label="Copy" />;

export const WithLabelOutline: Story = () => (
  <CopyButton value="https://docs.usetheo.dev" label="Copy URL" variant="outline" />
);

export const LongValue: Story = () => (
  <div className="max-w-md">
    <CopyButton
      value={`v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${"x".repeat(80)}`}
      label="Copy DKIM"
      variant="outline"
    />
  </div>
);

export const Failure: Story = () => {
  if (typeof navigator !== "undefined") {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("blocked")) },
    });
  }
  return <CopyButton value="will-fail" label="Try copy" variant="outline" />;
};
