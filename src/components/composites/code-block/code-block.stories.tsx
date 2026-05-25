import type { Story } from "@ladle/react";
import { CodeBlock } from "./code-block.js";

export default { title: "Composites / Display / CodeBlock" };

export const SingleCommand: Story = () => (
  <div className="w-96">
    <CodeBlock code="theo deploy" terminal copyable />
  </div>
);

export const MultiLine: Story = () => (
  <div className="w-96">
    <CodeBlock
      code={`# Install theo CLI
brew install usetheo/tap/theo
theo login
theo init my-app
theo deploy`}
      terminal
      copyable
    />
  </div>
);

export const WithCaption: Story = () => (
  <div className="w-96">
    <CodeBlock
      caption=".env.local"
      copyable
      code={`DATABASE_URL=postgres://localhost:5432/dev
REDIS_URL=redis://localhost:6379
API_KEY=sk_test_abc123`}
    />
  </div>
);

export const LongLineScroll: Story = () => (
  <div className="w-96">
    <CodeBlock
      caption="DNS TXT record"
      copyable
      code={`v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${"x".repeat(160)}`}
    />
  </div>
);
