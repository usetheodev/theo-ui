import { CopyButton } from "@theokit/ui";

export const IconOnlyGhost = () => <CopyButton value="theo deploy" aria-label="Copy" />;

export const WithLabelOutline = () => (
  <CopyButton value="https://docs.usetheo.dev" label="Copy URL" variant="outline" />
);

export const LongValue = () => (
  <div className="max-w-md">
    <CopyButton
      value={`v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${"x".repeat(80)}`}
      label="Copy DKIM"
      variant="outline"
    />
  </div>
);
