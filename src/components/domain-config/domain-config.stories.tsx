import type { Story } from "@ladle/react";
import { useState } from "react";
import { type Domain, DomainConfig } from "./domain-config.js";

export default { title: "Compostos / DomainConfig" };

let nextId = 100;

const initial: Domain[] = [
  { id: "1", hostname: "acme.com", status: "verified", tls: true, primary: true },
  { id: "2", hostname: "www.acme.com", status: "verified", tls: true },
  { id: "3", hostname: "api.acme.com", status: "verified", tls: true },
  {
    id: "4",
    hostname: "staging.acme.com",
    status: "pending",
    tls: false,
    verificationRecord: {
      type: "TXT",
      name: "_theo.staging.acme.com",
      value: "theo-verify=8d9c204a2e93011f3b8e2ff0021ce",
    },
  },
];

export const Interactive: Story = () => {
  const [domains, setDomains] = useState<Domain[]>(initial);
  return (
    <div className="w-full max-w-3xl">
      <DomainConfig
        domains={domains}
        onAdd={(hostname) =>
          setDomains((cur) => [
            ...cur,
            {
              id: `${++nextId}`,
              hostname,
              status: "pending",
              tls: false,
              verificationRecord: {
                type: "TXT",
                name: `_theo.${hostname}`,
                value: `theo-verify=${Math.random().toString(36).slice(2, 12)}`,
              },
            },
          ])
        }
        onRemove={(id) => setDomains((cur) => cur.filter((d) => d.id !== id))}
        onSetPrimary={(id) => setDomains((cur) => cur.map((d) => ({ ...d, primary: d.id === id })))}
      />
    </div>
  );
};
