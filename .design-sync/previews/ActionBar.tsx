import { ActionBar } from "@theokit/ui";
import { Plus } from "lucide-react";
import { useState } from "react";

export const Default = () => {
  const [q, setQ] = useState("alignment");
  return (
    <div className="w-full max-w-2xl">
      <ActionBar
        search={{ placeholder: "Search projects…", value: q, onChange: setQ }}
        primaryAction={{ label: "New project", icon: Plus, onClick: () => undefined }}
      />
    </div>
  );
};

export const FullFeatured = () => {
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

export const LoadingAction = () => (
  <div className="w-full max-w-2xl">
    <ActionBar primaryAction={{ label: "Saving…", onClick: () => undefined, loading: true }} />
  </div>
);
