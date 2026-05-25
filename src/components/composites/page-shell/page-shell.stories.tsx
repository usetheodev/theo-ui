import type { Story } from "@ladle/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { PageShell } from "./page-shell.js";

export default { title: "Composites / Layout / PageShell" };

export const Minimal: Story = () => (
  <PageShell title="Settings">
    <p className="font-sans text-body-md text-muted-foreground">This is the page content area.</p>
  </PageShell>
);

export const WithSearch: Story = () => {
  const [q, setQ] = useState("");
  return (
    <PageShell
      title="Projects"
      description="All your TheoCloud projects."
      search={{ placeholder: "Search projects…", value: q, onChange: setQ }}
    >
      <p className="font-sans text-body-md">Filtered by: "{q || "(nothing)"}"</p>
    </PageShell>
  );
};

export const FullFeatured: Story = () => {
  const [q, setQ] = useState("");
  return (
    <PageShell
      title="Domains"
      description="Custom domains and DNS verification."
      search={{ placeholder: "Search domains…", value: q, onChange: setQ }}
      onFilterClick={() => undefined}
      primaryAction={{ label: "Add domain", icon: Plus, onClick: () => undefined }}
    >
      <p className="font-sans text-body-md">[Table or content here]</p>
    </PageShell>
  );
};

export const Loading: Story = () => <PageShell title="Loading example" loading />;

export const ErrorState: Story = () => (
  <PageShell
    title="Error example"
    error={{
      message: "Could not load domains. Network failed.",
      onRetry: () => alert("retry"),
      docsHref: "https://docs.usetheo.dev/theoui",
    }}
  />
);

export const Empty: Story = () => (
  <PageShell
    title="No domains yet"
    empty={{
      title: "Add your first domain",
      description: "Connect a custom domain to deploy to a branded URL.",
      action: { label: "Add domain", onClick: () => undefined },
    }}
  />
);
