import type { Story } from "@ladle/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ActionBar } from "./action-bar.js";

export default { title: "Primitives / Inputs / ActionBar" };

export const Default: Story = () => {
  const [q, setQ] = useState("");
  return (
    <div className="w-full max-w-2xl">
      <ActionBar
        search={{ placeholder: "Search projects…", value: q, onChange: setQ }}
        primaryAction={{ label: "New project", icon: Plus, onClick: () => undefined }}
      />
    </div>
  );
};

export const SearchOnly: Story = () => {
  const [q, setQ] = useState("");
  return (
    <div className="w-full max-w-2xl">
      <ActionBar search={{ placeholder: "Filter…", value: q, onChange: setQ }} />
    </div>
  );
};

export const ActionOnly: Story = () => (
  <div className="w-full max-w-2xl">
    <ActionBar primaryAction={{ label: "Create", icon: Plus, onClick: () => undefined }} />
  </div>
);

export const FullFeatured: Story = () => {
  const [q, setQ] = useState("");
  return (
    <div className="w-full max-w-2xl">
      <ActionBar
        search={{ placeholder: "Search…", value: q, onChange: setQ }}
        onFilterClick={() => undefined}
        primaryAction={{ label: "New", icon: Plus, onClick: () => undefined }}
      />
    </div>
  );
};

export const LoadingAction: Story = () => (
  <div className="w-full max-w-2xl">
    <ActionBar primaryAction={{ label: "Saving…", onClick: () => undefined, loading: true }} />
  </div>
);
