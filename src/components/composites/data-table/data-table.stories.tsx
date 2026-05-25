import type { Story } from "@ladle/react";
import { DropdownMenu } from "../../primitives/dropdown-menu/index.js";
import { DataTable, type DataTableColumn } from "./data-table.js";

export default { title: "Composites / Display / DataTable" };

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

export const Minimal: Story = () => (
  <div className="w-full max-w-3xl">
    <DataTable columns={columns} data={domains} rowKey={(r) => r.id} />
  </div>
);

export const Sortable: Story = () => (
  <div className="w-full max-w-3xl">
    <DataTable columns={columns} data={domains} rowKey={(r) => r.id} />
  </div>
);

export const Expandable: Story = () => (
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

export const RowActions: Story = () => (
  <div className="w-full max-w-3xl">
    <DataTable
      columns={columns}
      data={domains}
      rowKey={(r) => r.id}
      rowActions={(d) => (
        <>
          <DropdownMenu.Item onSelect={() => alert(`Edit ${d.name}`)}>Edit</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => alert(`Verify ${d.name}`)}>
            Re-verify
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onSelect={() => alert(`Delete ${d.name}`)}>Delete</DropdownMenu.Item>
        </>
      )}
    />
  </div>
);

export const Paginated: Story = () => {
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

export const Loading: Story = () => (
  <div className="w-full max-w-3xl">
    <DataTable columns={columns} data={[]} rowKey={(r) => r.id} loading />
  </div>
);

export const Empty: Story = () => (
  <div className="w-full max-w-3xl">
    <DataTable columns={columns} data={[]} rowKey={(r) => r.id} />
  </div>
);

export const FullyFeatured: Story = () => (
  <div className="w-full max-w-3xl">
    <DataTable
      columns={columns}
      data={domains}
      rowKey={(r) => r.id}
      expandable={(d) =>
        d.status === "pending" ? (
          <div className="font-mono text-body-sm text-muted-foreground">
            Add DNS record: _acme-challenge.{d.name}
          </div>
        ) : null
      }
      rowActions={() => (
        <>
          <DropdownMenu.Item>Edit</DropdownMenu.Item>
          <DropdownMenu.Item>Delete</DropdownMenu.Item>
        </>
      )}
    />
  </div>
);
