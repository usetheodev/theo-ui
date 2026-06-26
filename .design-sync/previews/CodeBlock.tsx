import { CodeBlock } from "@theokit/ui";

export const SingleCommand = () => (
  <div className="w-96">
    <CodeBlock code="theo deploy" terminal copyable />
  </div>
);

export const MultiLine = () => (
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

export const WithCaption = () => (
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
