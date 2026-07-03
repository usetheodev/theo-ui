import { DataTable, type DataTableColumn, DropdownMenu } from "@theokit/ui";

interface Domain {
  id: string;
  name: string;
  status: "active" | "pending" | "failed";
  lastVerified: string;
}

const domains: Domain[] = [
  { id: "1", name: "usetheo.dev", status: "active", lastVerified: "2026-05-20" },
  { id: "2", name: "docs.usetheo.dev", status: "active", lastVerified: "2026-05-18" },
  { id: "3", name: "blog.usetheo.dev", status: "pending", lastVerified: "—" },
  { id: "4", name: "old.usetheo.dev", status: "failed", lastVerified: "2026-05-10" },
];

const columns: DataTableColumn<Domain>[] = [
  { key: "name", label: "Domain", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "lastVerified", label: "Last verified", sortable: true, align: "right" },
];

export const Minimal = () => (
  <div className="w-full max-w-3xl">
    <DataTable columns={columns} data={domains} rowKey={(r) => r.id} />
  </div>
);

export const Expandable = () => (
  <div className="w-full max-w-3xl">
    <DataTable
      columns={columns}
      data={domains}
      rowKey={(r) => r.id}
      expandable={(d) =>
        d.status === "pending" ? (
          <div className="font-mono text-body-sm">
            <p className="text-muted-foreground">DNS records to add:</p>
            <pre className="mt-2 rounded bg-card p-2">_acme-challenge.{d.name} TXT abc123…</pre>
          </div>
        ) : null
      }
    />
  </div>
);

export const RowActions = () => (
  <div className="w-full max-w-3xl">
    <DataTable
      columns={columns}
      data={domains}
      rowKey={(r) => r.id}
      rowActions={(d) => (
        <>
          <DropdownMenu.Item>Edit {d.name}</DropdownMenu.Item>
          <DropdownMenu.Item>Re-verify</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item>Delete</DropdownMenu.Item>
        </>
      )}
    />
  </div>
);

export const Paginated = () => {
  const many = Array.from({ length: 23 }, (_, i) => ({
    id: `r-${i}`,
    name: `domain-${i}.usetheo.dev`,
    status: (["active", "pending", "failed"] as const)[i % 3] ?? "active",
    lastVerified: "2026-05-20",
  }));
  return (
    <div className="w-full max-w-3xl">
      <DataTable
        columns={columns}
        data={many as Domain[]}
        rowKey={(r) => r.id}
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
};

export const Empty = () => (
  <div className="w-full max-w-3xl">
    <DataTable columns={columns} data={[]} rowKey={(r) => r.id} />
  </div>
);
