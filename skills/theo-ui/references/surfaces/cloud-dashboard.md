# Surface — cloud-dashboard

Operator dashboards: deployments, environments, projects, builds, logs, metrics, billing summaries. The surface vocabulary is **scannable, status-coded, action-dense** — the user lands here to *do something* (deploy, rollback, configure, debug).

---

## When this surface applies

The brief mentions any of:

- deployment / deploy / environment / build / production
- project / projects list / project detail
- logs / build logs / runtime logs / stream
- metrics / usage / analytics / monitoring
- domain / DNS / SSL / cert
- rollback / promote / canary / release
- billing / plan / usage meter / quota
- team / member / role / permission (when bundled with operator concerns)

If the brief is *"build a Vercel-style dashboard"* / *"build a Render-style projects page"* / *"build a billing surface"* — this surface.

---

## Anchor composites

| Composite | When to use |
|---|---|
| `<PageShell>` | Every dashboard page. Owns title, description, ActionBar, state precedence. |
| `<DataTable>` | Any tabular data with > 3 rows. Default for list pages. |
| `<ActionBar>` | Page-top search + filter + primary action row. Composes inside `<PageShell>`. |
| `<DropdownMenu>` | Row actions, page actions, sub-menus. |
| `<ConfirmDialog>` | Any destructive or irreversible action (delete, rollback, drop). |
| `<DeploymentRow>` | Specialized row for deployment lists. |
| `<ProjectCard>` | Project tile for grid layouts. |
| `<PreviewEnvCard>` | Preview environment summary card. |
| `<EnvVarEditor>` | Environment variable editor (key/value with secret toggle). |
| `<DomainConfig>` | Domain + DNS configuration block. |
| `<BuildLogStream>` | Live build log surface. |
| `<RollbackUI>` | Rollback flow with comparison. |
| `<MetricsPanel>` | Charts grid for project metrics. |
| `<UsageMeter>` | Quota / limit visualization. |
| `<AccountMenu>` | Top-right user menu (with org switcher). |
| `<CommandPalette>` | Cmd+K palette. |
| `<CronJobsList>` | List of scheduled jobs. |
| `<MCPServerList>` | List of connected MCP servers. |

---

## Primitives commonly used

| Primitive | Role |
|---|---|
| `<Button>` | Every action — primary, secondary, ghost, destructive, link, accent. |
| `<Badge>` | Status, plan, role, label tags. |
| `<StatusDot>` | Inline status indicator (success / warning / destructive / info / muted). |
| `<StatTile>` | Single metric tile in a stat grid. |
| `<CopyButton>` | Copy-to-clipboard with success state. |
| `<Timestamp>` | Relative + absolute timestamp with tooltip. |
| `<PlanBadge>` | Tier badge (free / pro / enterprise). |
| `<DangerZone>` | Boxed danger zone block at the bottom of a settings page. |
| `<CodeBlock>` | Inline / block code with copy + syntax highlight. |
| `<Alert>` | Inline alert banner (success / warning / destructive / info). |
| `<EmptyState>` | Empty list / no-data state. |
| `<Skeleton>` | Loading placeholder. |
| `<Pagination>` | Page navigation for paginated lists. |
| `<CronJobCard>` | Card for a scheduled job. |
| `<AuditLogEntry>` | Compact audit row. |
| `<BrowserControls>` | Address-bar-style controls for previews. |

---

## Layout

The canonical dashboard layout is **page-shell + content**:

```tsx
<PageShell
  title="Deployments"
  description="Manage your project deployments."
  primaryAction={{ label: "New deployment", icon: Plus, onClick: openWizard }}
  search={{ placeholder: "Search…", value: q, onChange: setQ }}
>
  <DataTable
    columns={cols}
    data={deployments}
    rowKey={(d) => d.id}
    rowActions={(d) => (
      <>
        <DropdownMenu.Item onSelect={() => view(d)}>View logs</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => promote(d)}>Promote to production</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => rollback(d)} className="text-destructive">
          Rollback
        </DropdownMenu.Item>
      </>
    )}
    pagination={{ pageSize: 20 }}
  />
</PageShell>
```

`<PageShell>` owns:

- The page header (title + description + ActionBar)
- The state precedence (loading > error > empty > children)
- The `<main>` element with `aria-busy` semantics

Never start a dashboard page with `<div className="p-6">`. Always `<PageShell>`.

### Optional sidebar layout

For app shells with persistent navigation:

```tsx
<div className="flex h-screen">
  <aside className="w-56 border-r border-border bg-card">
    {/* nav items */}
    <AccountMenu align="bottom" />
  </aside>
  <main className="flex-1 overflow-y-auto">
    <PageShell title="Deployments" ...>
      <DataTable .../>
    </PageShell>
  </main>
</div>
```

Below `md`, the sidebar becomes a drawer triggered by a menu button in the PageShell header.

---

## Density

`cloud-dashboard` defaults to `comfortable` (36 px controls). Switch to `compact` for:

- Audit log surfaces (high row count, scanning task).
- Build log streams (tighter rows reads more "console").
- Read-only data dumps.

`spacious` is right when the consumer is targeting WCAG AAA accessibility or building a touch-first tablet UI.

---

## Typography

- Page title → `text-display-md` (handled by `<PageShell>`).
- Section heads inside Cards → `text-title-lg` (handled by `<Card.Title>`).
- Body / table cells → `text-body-md`.
- Numeric data in tables → `text-body-md font-mono` (use `font-mono` on the column).
- Timestamps → `<Timestamp>` (applies the right typography).
- IDs (deployment hashes, project IDs) → `<span className="font-mono text-body-sm text-muted-foreground">dep_abc123</span>`.
- Empty state heading → `text-title-md` (handled by `<EmptyState>`).
- Stat tile big number → `text-display-md font-mono` (handled by `<StatTile>`).

---

## State coverage

`<PageShell>` handles the four common states out of the box:

```tsx
<PageShell
  title="Deployments"
  loading={isLoading}
  error={error ? { message: error.message, onRetry: refetch } : undefined}
  empty={
    deployments.length === 0
      ? {
          title: "No deployments yet",
          description: "Connect a Git repo to deploy.",
          action: { label: "Connect repo", onClick: openWizard },
        }
      : undefined
  }
>
  <DataTable .../>
</PageShell>
```

State precedence: loading > error > empty > children. If multiple are true, the higher-priority state renders.

Row-level loading inside DataTable uses `<Skeleton>` automatically when `loading` prop is true.

---

## Status indicators

Status semantics map directly to Violet Forge tokens:

| State | Token | `<StatusDot variant>` | `<Badge variant>` | `<Alert variant>` |
|---|---|---|---|---|
| Healthy / Active | `success` | `success` | `success` | `success` |
| Pending / Building | `warning` | `warning` | `warning` | `warning` |
| Failed / Error | `destructive` | `destructive` | `destructive` | `destructive` |
| Info / Note | `info` | `info` | `info` | `info` |
| Idle / Inactive | `muted` | `muted` | `secondary` | (none — use note) |

**Never use color alone.** Always pair with an icon or label:

```tsx
// WRONG
<span className="text-success">●</span>

// RIGHT
<StatusDot variant="success" label="Production" />
<Badge variant="success">Active</Badge>
<StatusDot variant="destructive" /> Failed
```

---

## Actions

### Primary action

The page's main action lives in `<PageShell primaryAction>`:

```tsx
<PageShell
  primaryAction={{ label: "New deployment", icon: Plus, onClick: openWizard }}
/>
```

This renders as `<Button variant="primary">` in the ActionBar, right-aligned.

### Row actions

Each table row gets a `<DropdownMenu>` triggered by a ghost icon button in the rightmost cell:

```tsx
<DataTable
  rowActions={(row) => (
    <>
      <DropdownMenu.Item onSelect={() => view(row)}>View</DropdownMenu.Item>
      <DropdownMenu.Item onSelect={() => edit(row)}>Edit</DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item onSelect={() => del(row)} className="text-destructive">
        Delete
      </DropdownMenu.Item>
    </>
  )}
/>
```

The `<DataTable>` wraps the items in a `<DropdownMenu>` with a `<MoreHorizontal>` trigger. Never put inline action buttons in each row — clutter.

### Destructive actions

Always wrap in `<ConfirmDialog>`:

```tsx
<ConfirmDialog
  title="Delete deployment?"
  description="This will permanently remove the deployment and its build artifacts. This cannot be undone."
  confirmLabel="Delete"
  variant="destructive"
  onConfirm={handleDelete}
>
  <Button variant="destructive" size="sm">Delete</Button>
</ConfirmDialog>
```

### Bulk actions

When `<DataTable>` has selectable rows, the bulk-action bar floats at the top of the content area:

```tsx
<DataTable
  selectable
  selectedKeys={selected}
  onSelectionChange={setSelected}
  bulkActions={
    selected.size > 0 && (
      <div className="flex items-center gap-2 px-4 py-2 bg-secondary border-b border-border">
        <span className="text-body-sm text-muted-foreground">
          {selected.size} selected
        </span>
        <Button variant="ghost" size="sm" onClick={archiveSelected}>Archive</Button>
        <ConfirmDialog title="Delete N items?" ...>
          <Button variant="destructive" size="sm">Delete</Button>
        </ConfirmDialog>
      </div>
    )
  }
/>
```

---

## A11y essentials

- `<PageShell>` sets `<main>` with `aria-busy="true"` when loading.
- `<DataTable>` headers are `<th scope="col">` with sortable indicators that include `aria-sort`.
- Row actions trigger has `aria-label="Actions for {row.name}"`.
- Status indicators include text labels (visible or `<VisuallyHidden>`).
- Destructive actions in dropdowns use `text-destructive` color AND start with a verb (`Delete`, `Drop`, `Remove`) — color isn't the only signal.

---

## Composition examples

### Deployments list page

```tsx
import { PageShell } from "@theokit/ui/page-shell";
import { DataTable } from "@theokit/ui/data-table";
import { DropdownMenu } from "@theokit/ui/dropdown-menu";
import { Badge } from "@theokit/ui/badge";
import { StatusDot } from "@theokit/ui/status-dot";
import { Timestamp } from "@theokit/ui/timestamp";
import { Plus } from "lucide-react";

export function DeploymentsPage() {
  const { deployments, isLoading, error, refetch } = useDeployments();
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => deployments.filter((d) => d.name.includes(q)),
    [deployments, q],
  );

  return (
    <PageShell
      title="Deployments"
      description="All deployments across your projects."
      search={{ placeholder: "Search deployments…", value: q, onChange: setQ }}
      primaryAction={{ label: "New deployment", icon: Plus, onClick: openWizard }}
      loading={isLoading}
      error={error ? { message: error.message, onRetry: refetch } : undefined}
      empty={
        filtered.length === 0 && !q
          ? {
              title: "No deployments yet",
              description: "Connect a Git repo to deploy your first project.",
              action: { label: "Connect repo", onClick: openWizard },
            }
          : undefined
      }
    >
      <DataTable
        columns={[
          { key: "name", label: "Name", sortable: true },
          {
            key: "status",
            label: "Status",
            render: (d) => (
              <span className="flex items-center gap-2">
                <StatusDot variant={statusToVariant(d.status)} />
                <Badge variant={statusToVariant(d.status)}>{d.status}</Badge>
              </span>
            ),
          },
          {
            key: "environment",
            label: "Environment",
            hideBelow: "md",
            render: (d) => <Badge variant="secondary">{d.environment}</Badge>,
          },
          {
            key: "createdAt",
            label: "Created",
            hideBelow: "lg",
            render: (d) => <Timestamp date={d.createdAt} />,
          },
          {
            key: "duration",
            label: "Duration",
            align: "right",
            hideBelow: "lg",
            render: (d) => <span className="font-mono text-body-sm">{d.duration}</span>,
          },
        ]}
        data={filtered}
        rowKey={(d) => d.id}
        rowActions={(d) => (
          <>
            <DropdownMenu.Item onSelect={() => view(d)}>View logs</DropdownMenu.Item>
            <DropdownMenu.Item onSelect={() => promote(d)}>Promote</DropdownMenu.Item>
            <DropdownMenu.Separator />
            <ConfirmDialog
              title="Rollback to this deployment?"
              description="This will redirect production traffic to this build."
              confirmLabel="Rollback"
              variant="destructive"
              onConfirm={() => rollback(d)}
            >
              <DropdownMenu.Item className="text-destructive" onSelect={(e) => e.preventDefault()}>
                Rollback
              </DropdownMenu.Item>
            </ConfirmDialog>
          </>
        )}
        pagination={{ pageSize: 20 }}
      />
    </PageShell>
  );
}
```

### Project detail page (with metric grid)

```tsx
<PageShell
  title={project.name}
  description={project.repo}
  breadcrumbs={[{ label: "Projects", href: "/" }, { label: project.name }]}
>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <StatTile label="Deployments (24h)" value={stats.deployments} />
    <StatTile label="Build success rate" value={`${stats.successRate}%`} />
    <StatTile label="Avg build time" value={stats.avgBuildTime} valueFormat="duration" />
    <StatTile label="Active environments" value={stats.envs} />
  </div>
  <Card>
    <Card.Header>
      <Card.Title>Recent deployments</Card.Title>
    </Card.Header>
    <Card.Content>
      <DataTable .../>
    </Card.Content>
  </Card>
</PageShell>
```

---

## Anti-patterns specific to cloud-dashboard

- **Bypassing `<PageShell>`** — every dashboard page goes through it.
- **Inline action buttons in every table row** — use `<DropdownMenu>` via `rowActions`.
- **Status indicators as colored dots without labels** — pair with `<Badge>` text or icon.
- **Destructive actions without `<ConfirmDialog>`** — even "soft delete" benefits from a confirm step.
- **Hand-rolled metric cards** — use `<StatTile>` / `<UsageMeter>` / `<CostMeter>`.
- **Page-level filter bars built from scratch** — use `<PageShell search>` + the ActionBar slot.
- **Pagination DIY** — `<DataTable pagination={{ pageSize: 20 }}>` handles it.
- **`<table>` raw HTML** — always `<DataTable>`.
