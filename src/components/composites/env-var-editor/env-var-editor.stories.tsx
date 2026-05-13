import type { Story } from "@ladle/react";
import { useState } from "react";
import { type EnvVar, EnvVarEditor } from "./env-var-editor.js";

export default { title: "Composites / PaaS / EnvVarEditor" };

let nextId = 100;

const initial: EnvVar[] = [
  {
    id: "1",
    key: "DATABASE_URL",
    value: "postgres://acme:hunter2@db.usetheo.dev:5432/acme",
    masked: true,
    scope: "production",
  },
  { id: "2", key: "LOG_LEVEL", value: "info", scope: "all" },
  {
    id: "3",
    key: "STRIPE_SECRET_KEY",
    value: "sk_test_redacted_demo_placeholder",
    masked: true,
    scope: "production",
  },
  {
    id: "4",
    key: "REDIS_URL",
    value: "redis://default:hunter3@redis.usetheo.dev:6379",
    masked: true,
    scope: "staging",
  },
  {
    id: "5",
    key: "THEO_DEPLOY_ID",
    value: "dpl_8f3jka9dfsdfasdf",
    readonly: true,
    scope: "production",
  },
];

export const Interactive: Story = () => {
  const [vars, setVars] = useState<EnvVar[]>(initial);
  return (
    <div className="w-full max-w-3xl">
      <EnvVarEditor
        vars={vars}
        onAdd={(entry) => setVars((cur) => [...cur, { id: `${++nextId}`, ...entry }])}
        onRemove={(id) => setVars((cur) => cur.filter((v) => v.id !== id))}
      />
    </div>
  );
};
