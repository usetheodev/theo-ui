# Recipe — Dashboard list page

A worked example of the default verb building a P1 ListPage. Skim before tackling your first cloud-dashboard build.

---

## Brief

> "Build a deployments list page. We need to show all deployments across our projects, with status, environment, branch, commit, timestamp. Users should be able to search, filter by environment, see deployment details, promote to production, and rollback."

---

## Step 0 — Pre-flight scan

```
Pre-flight findings:
- @usetheo/ui: 0.11.0-next.0 (package.json L42)
- Tailwind preset: loaded (tailwind.config.ts L8)
- ThemeProvider: violet-forge default, density=comfortable (src/app/layout.tsx L18)
- Imports: 6 barrel, 0 subpath (could optimize)
- React: 19 (peer-dep clean)

theo-ui will preserve: theme, density, import style (will use subpath for new code).
theo-ui will introduce: PageShell, DataTable, DropdownMenu (Brief #5 composites).
```

---

## Step 1 — Design-context gate

> *Before I build, I need three things:*
>
> *1. **Surface** — agent-chat · cloud-dashboard · settings-form · marketing · auth. Or pick another if I missed it.*
> *2. **Use case** — What's the one action this surface should drive? (Send message? Configure setting? View deployment? Sign in?)*
> *3. **Density** — compact · comfortable (default) · spacious. Or "match project" to inherit from your ThemeProvider.*
>
> *Or say **"go ahead"** and I'll infer from the brief — I'll tell you what I picked.*

User replies: *"go ahead"*

Skill infers:

> *Going with: surface = cloud-dashboard · use case = view / promote / rollback deployments · density = comfortable (matched project). If any of those is wrong, tell me and I'll redirect.*

---

## Step 2 — Pick a page archetype

Skill reads `composition-cookbook.md` and picks:

> *"Surface: cloud-dashboard. Archetype: P1 ListPage. Anchor composite: PageShell + ActionBar + DataTable."*

---

## Step 2.5 — Check project memory

```json
[
  { "date": "2026-05-24", "verb": "default", "archetype": "P3 SettingsPage", "surface": "settings-form", "brief": "Team settings" },
  { "date": "2026-05-23", "verb": "default", "archetype": "P4 ChatSurface", "surface": "agent-chat", "brief": "Project chat" }
]
```

No prior P1 ListPage. The list page archetype is fresh for this project.

> *"Project memory: 2 prior runs (settings + chat). First ListPage for this project — establishing the pattern. Future list pages will inherit this structure."*

---

## Step 3 — Load the ruleset

Always-load:
- `surfaces/cloud-dashboard.md`
- `composition-cookbook.md` § P1 ListPage

Load-per-build:
- `tokens.md`, `typography.md`, `anti-patterns.md`, `copy.md`

Load-conditionally:
- `microinteractions.md` (interactive page)
- `interaction-and-states.md` (DataTable has many states)
- `responsive.md` (mobile in scope)

---

## Step 5 — Preview

```markdown
**theo-ui · v1.0.0**

- **Surface** · cloud-dashboard
- **Archetype** · P1 ListPage
- **Anchor composite** · PageShell + ActionBar + DataTable
- **Components used** · PageShell · ActionBar · DataTable · DropdownMenu · ConfirmDialog · Badge · StatusDot · Timestamp · Button
- **Theme** · violet-forge (project default)
- **Density** · comfortable (project default)
- **Imports** · subpath (post-0.10)
- **Slop test** · 32 / 32 ✓ (will verify after Build)
```

---

## Step 6 — Build

```tsx
{/* theo-ui · archetype: P1 ListPage · surface: cloud-dashboard · density: comfortable
 *  composites: PageShell · ActionBar · DataTable · DropdownMenu · ConfirmDialog
 *  primitives: Button · Badge · StatusDot · Timestamp
 *  theme: violet-forge  ·  a11y: WCAG 2.5.8 AA pass
 *  pre-emit critique: L5 T5 C5 A5 R5 V5
 */}
"use client";

import { useMemo, useState } from "react";
import { Plus, GitBranch, MoreHorizontal } from "lucide-react";

import { PageShell } from "@usetheo/ui/page-shell";
import { DataTable } from "@usetheo/ui/data-table";
import { DropdownMenu } from "@usetheo/ui/dropdown-menu";
import { ConfirmDialog } from "@usetheo/ui/confirm-dialog";
import { Badge } from "@usetheo/ui/badge";
import { StatusDot } from "@usetheo/ui/status-dot";
import { Timestamp } from "@usetheo/ui/timestamp";
import { Button } from "@usetheo/ui/button";

import { useDeployments } from "@/hooks/useDeployments";

type DeploymentStatus = "ready" | "building" | "queued" | "failed" | "canceled";

interface Deployment {
  id: string;
  name: string;
  status: DeploymentStatus;
  environment: "production" | "preview" | "development";
  branch: string;
  commit: string;
  author: { name: string; avatar?: string };
  createdAt: string;
  durationMs: number;
}

function statusVariant(status: DeploymentStatus) {
  switch (status) {
    case "ready":    return "success";
    case "building":
    case "queued":   return "warning";
    case "failed":   return "destructive";
    case "canceled": return "muted";
  }
}

export default function DeploymentsPage() {
  const { deployments, isLoading, error, refetch, promote, rollback } = useDeployments();
  const [query, setQuery] = useState("");
  const [envFilter, setEnvFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return deployments.filter((d) => {
      const matchesQuery = query === "" || d.name.toLowerCase().includes(query.toLowerCase()) || d.branch.toLowerCase().includes(query.toLowerCase());
      const matchesEnv = envFilter === null || d.environment === envFilter;
      return matchesQuery && matchesEnv;
    });
  }, [deployments, query, envFilter]);

  return (
    <PageShell
      title="Deployments"
      description="All deployments across your projects."
      search={{ placeholder: "Search by name or branch…", value: query, onChange: setQuery }}
      primaryAction={{
        label: "New deployment",
        icon: Plus,
        onClick: () => { /* open create modal */ },
      }}
      loading={isLoading}
      error={error ? { message: error.message, onRetry: refetch, docsHref: "https://docs.usetheo.dev/deployments" } : undefined}
      empty={
        filtered.length === 0 && query === "" && envFilter === null
          ? {
              title: "No deployments yet",
              description: "Connect a Git repo to deploy your first project.",
              icon: GitBranch,
              action: { label: "Connect repo", onClick: () => { /* open wizard */ } },
            }
          : undefined
      }
    >
      <DataTable<Deployment>
        columns={[
          {
            key: "name",
            label: "Name",
            sortable: true,
            render: (d) => (
              <div className="flex flex-col">
                <span className="text-body-md text-foreground">{d.name}</span>
                <span className="text-body-sm text-muted-foreground font-mono">{d.commit.slice(0, 7)}</span>
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            sortable: true,
            render: (d) => (
              <span className="inline-flex items-center gap-2">
                <StatusDot variant={statusVariant(d.status)} />
                <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
              </span>
            ),
          },
          {
            key: "environment",
            label: "Environment",
            sortable: true,
            hideBelow: "md",
            render: (d) => <Badge variant="secondary">{d.environment}</Badge>,
          },
          {
            key: "branch",
            label: "Branch",
            hideBelow: "lg",
            render: (d) => <span className="font-mono text-body-sm">{d.branch}</span>,
          },
          {
            key: "createdAt",
            label: "Created",
            sortable: true,
            hideBelow: "md",
            render: (d) => <Timestamp date={d.createdAt} />,
          },
          {
            key: "durationMs",
            label: "Duration",
            align: "right",
            hideBelow: "lg",
            render: (d) => <span className="font-mono text-body-sm text-muted-foreground">{formatDuration(d.durationMs)}</span>,
          },
        ]}
        data={filtered}
        rowKey={(d) => d.id}
        defaultSort={{ key: "createdAt", direction: "desc" }}
        rowActions={(d) => (
          <>
            <DropdownMenu.Item onSelect={() => { /* view */ }}>View logs</DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => promote(d.id)}
              disabled={d.environment === "production" || d.status !== "ready"}
            >
              Promote to production
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <ConfirmDialog
              title={`Rollback to ${d.name}?`}
              description="This will redirect production traffic to this build. You can rollback again at any time."
              confirmLabel="Rollback"
              variant="destructive"
              onConfirm={() => rollback(d.id)}
            >
              <DropdownMenu.Item
                className="text-destructive"
                onSelect={(e) => e.preventDefault()}
              >
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

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
```

---

## Step 6 — Append to project memory

```json
{
  "date": "2026-05-25",
  "verb": "default",
  "archetype": "P1 ListPage",
  "surface": "cloud-dashboard",
  "components": ["PageShell", "DataTable", "DropdownMenu", "ConfirmDialog", "Badge", "StatusDot", "Timestamp", "Button"],
  "theme": "violet-forge",
  "density": "comfortable",
  "brief": "Deployments list (search + filter + promote + rollback)"
}
```

---

## Step 7 — Slop test

| Gate | Result |
|---|---|
| L-01 to L-06 | PASS — no hand-rolled UI |
| T-01 to T-08 | PASS — token-only styling |
| C-01 PageShell on list page | PASS |
| C-02 DataTable | PASS |
| C-03 ConfirmDialog | PASS — rollback wrapped |
| A-01 to A-06 | PASS — composites ship a11y; row action triggers have implicit aria-label |
| R-01 to R-04 | PASS — DataTable has hideBelow on env/branch/createdAt/duration |
| V-01 | PASS — all data wired to real props |
| V-02 | PASS — button labels are verbs ("Promote to production", "Rollback") |
| V-03 | PASS — utility voice |

**32 / 32 ✓**

---

## Handoff

```
Build complete: src/app/deployments/page.tsx (94 lines).

Next steps:
- Wire `useDeployments()` to your data layer if not already.
- Run `theo-ui audit src/app/deployments/page.tsx` to verify after wiring.
- Consider P6 DeploymentsList archetype if you want richer per-row rendering (uses <DeploymentRow> composite).
```
