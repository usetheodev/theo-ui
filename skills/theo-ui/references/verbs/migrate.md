# Verb — `theo-ui migrate`

Convert hand-rolled UI to its `@usetheo/ui` equivalent. Preserves behavior, replaces only the styling / structure layer.

---

## When to invoke

The user has an existing React component / page / app and wants it converted to use `@usetheo/ui`. Or they ran `theo-ui audit` and want to apply the quick wins.

Triggers:

- `theo-ui migrate src/app/deployments/page.tsx`
- `theo-ui migrate src/components/Button.tsx`
- `theo-ui migrate ./apps/dashboard/`
- *"Migrate this to theo-ui"*
- *"Convert this to use theo-ui components"*
- *"Apply the audit fixes"* (after a `theo-ui audit` run)

---

## Pipeline

### 1. Resolve the target

Same as audit — file, directory, or glob. Read each target file in full.

### 2. Pre-flight (visible for migrate)

Emit the pre-flight block. The user needs to know what version + theme + density the migration will target. Without it, the migrated code may import from subpaths that don't exist on their `@usetheo/ui` version.

### 3. Migration plan

Before any edit, produce a migration plan and ask for confirmation:

```markdown
## Migration plan for `src/app/deployments/page.tsx`

**Surface inferred:** cloud-dashboard
**Target archetype:** P1 ListPage

### Replacements

| Original (L) | Replacement |
|---|---|
| `<button className="bg-purple-600 …">` (L42) | `<Button variant="primary">` |
| `<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">` (L60) | `<Card>` |
| `<table>` … `<tbody>` (L88-L142) | `<DataTable columns={…} data={…}>` |
| Manual dropdown with `useState(false)` (L155-L180) | `<DropdownMenu>` |
| Raw `text-4xl font-bold` (L28) | `text-display-md` |
| `bg-purple-50` (L67) | `bg-primary/10` |

### Imports to add

```ts
import { Button } from "@usetheo/ui/button";
import { Card } from "@usetheo/ui/card";
import { DataTable } from "@usetheo/ui/data-table";
import { DropdownMenu } from "@usetheo/ui/dropdown-menu";
import { PageShell } from "@usetheo/ui/page-shell";
```

### Imports to remove

```ts
import { ChevronDown } from "lucide-react";  // no longer needed — DropdownMenu handles
```

### Behavior preserved

- The `handleDeploy` and `handleDelete` handlers run unchanged.
- The `useDeployments` hook is unchanged.
- The route, the page metadata, the page title remain.

### Behavior changed

- Manual confirmation `if (confirm(…))` at L145 is replaced by `<ConfirmDialog>` (modal flow instead of native confirm).
- The hand-rolled empty state at L62 is replaced by `<PageShell empty>` — the empty-state appearance changes from custom to theo-ui default. Copy preserved.

### Files to modify

- `src/app/deployments/page.tsx` — full rewrite of the JSX (~180 lines → ~120 lines)

### Files to leave alone

- `src/hooks/useDeployments.ts` — data layer, unchanged.
- `src/lib/api/deployments.ts` — API client, unchanged.

**Approve? Reply `go` to apply, or describe changes you want first.**
```

The user explicitly approves with `go` / `yes` / `apply` / `proceed`. Without approval, do NOT edit.

### 4. Apply migrations

Once approved, apply file by file. For each file:

1. Read the current content.
2. Compute the new content (full rewrite of the JSX, preserving imports/handlers).
3. Use the `Edit` tool with surgical replacements where possible, OR `Write` for a full rewrite.
4. Verify the diff is minimal (only the JSX layer changes — handlers, hooks, types are unchanged).

### 5. Post-migration audit

After applying, run the audit verb on the migrated files to verify the slop-test gates pass. Emit the audit output briefly:

```markdown
## Post-migration audit

**`src/app/deployments/page.tsx`** — 32 / 32 PASS ✓
- L-01 button hand-roll: PASS (replaced)
- L-02 card hand-roll: PASS (replaced)
- L-04 dropdown hand-roll: PASS (replaced)
- L-05 table hand-roll: PASS (replaced)
- C-01 PageShell on list page: PASS (wrapped)
- C-03 ConfirmDialog: PASS (wired)
- T-02 raw palette: PASS (replaced)
- T-05 raw text size: PASS (replaced)
- A-01 focus rings: PASS (theo-ui primitives ship with them)
- R-04 DataTable hideBelow: PASS (added to low-priority columns)
```

If any gate still fails, surface it and ask whether to apply additional fixes.

### 6. Append to project memory

Append a migration entry to `.theo-ui-skill/log.json`:

```json
{
  "date": "2026-05-25",
  "verb": "migrate",
  "files_changed": ["src/app/deployments/page.tsx"],
  "gates_fixed": ["L-01", "L-02", "L-04", "L-05", "C-01", "C-03", "T-02", "T-05"],
  "score_delta": "+24"
}
```

---

## Migration rules

### Replace, don't rewrite

The migrate verb's job is to swap hand-rolled UI for `@usetheo/ui` equivalents. It does NOT redesign the page structure. If the original has 4 sections in order A/B/C/D, the migrated version has the same 4 sections in the same order — just composed of theo-ui components.

If the user wants a redesign, they ask for one explicitly (default verb) — that's a different invocation.

### Preserve handlers

`onClick={handleDelete}` stays exactly as it was. The migrate verb does NOT refactor the handler logic.

### Preserve copy

Button labels, headings, card descriptions stay exactly as the user wrote them. The migrate verb does NOT improve copy. (If the audit flagged a V-* voice issue, surface it but don't auto-rewrite — the user owns their copy.)

### Preserve types

If the original file has TypeScript types or interfaces, keep them. Add new imports for theo-ui types where needed (`DataTableColumn<T>`).

### Preserve imports

Don't strip existing imports unless they become genuinely unused. `import { Plus } from "lucide-react"` stays if it's still passed to `<Button>` or `<PageShell primaryAction.icon>`.

### One file at a time

When migrating a directory, process files sequentially. For each file:

1. Read.
2. Plan.
3. Apply.
4. Verify (audit).
5. Move to next file.

Don't batch-modify across files (e.g., touch every file in src/app/ in parallel). Sequential is safer and easier to review.

### Stop on uncertainty

If the migration plan involves removing > 30% of the file's lines (likely a full rewrite, not a migration), STOP and confirm:

> *"This migration removes 87 of 215 lines. That's a structural rewrite, not a swap. Confirm proceed, or scope down the migration to specific changes?"*

### Behavior change requires explicit callout

If the migration changes USER-VISIBLE behavior (e.g., `confirm()` dialog → `<ConfirmDialog>` modal, or hand-rolled toast → `<Toast>` with different visual), surface this in the plan under "Behavior changed". Don't silently change UX.

---

## Common migration patterns

### Hand-rolled button → `<Button>`

**Before:**
```tsx
<button
  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
  onClick={handleDeploy}
  disabled={loading}
>
  {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Deploy"}
</button>
```

**After:**
```tsx
<Button variant="primary" onClick={handleDeploy} loading={loading}>
  Deploy
</Button>
```

The `loading` prop replaces the manual Loader2 ternary.

### Hand-rolled card → `<Card>`

**Before:**
```tsx
<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
  <div className="mb-4">
    <h3 className="text-lg font-semibold text-gray-900">Recent activity</h3>
    <p className="text-sm text-gray-500">Last 24 hours</p>
  </div>
  <div>{children}</div>
</div>
```

**After:**
```tsx
<Card>
  <Card.Header>
    <Card.Title>Recent activity</Card.Title>
    <Card.Description>Last 24 hours</Card.Description>
  </Card.Header>
  <Card.Content>{children}</Card.Content>
</Card>
```

### Hand-rolled dropdown → `<DropdownMenu>`

**Before:**
```tsx
const [open, setOpen] = useState(false);
const ref = useRef<HTMLDivElement>(null);

useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

return (
  <div ref={ref} className="relative">
    <button onClick={() => setOpen(!open)} className="…">
      <MoreHorizontal />
    </button>
    {open && (
      <ul className="absolute right-0 mt-1 w-48 bg-white shadow-lg rounded-lg border">
        <li><button onClick={view}>View</button></li>
        <li><button onClick={edit}>Edit</button></li>
        <li><button onClick={del} className="text-red-600">Delete</button></li>
      </ul>
    )}
  </div>
);
```

**After:**
```tsx
<DropdownMenu>
  <DropdownMenu.Trigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal />
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item onSelect={view}>View</DropdownMenu.Item>
    <DropdownMenu.Item onSelect={edit}>Edit</DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item onSelect={del} className="text-destructive">Delete</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu>
```

The `useState` / `useRef` / `useEffect` for click-outside are gone — Radix handles it.

### Hand-rolled table → `<DataTable>`

**Before:**
```tsx
<table className="w-full">
  <thead>
    <tr>
      <th className="text-left p-3">Name</th>
      <th className="text-left p-3">Status</th>
      <th className="text-right p-3">Created</th>
    </tr>
  </thead>
  <tbody>
    {deployments.map((d) => (
      <tr key={d.id} className="border-t border-gray-200">
        <td className="p-3">{d.name}</td>
        <td className="p-3">
          <span className={`inline-block px-2 py-0.5 rounded text-xs ${
            d.status === "success" ? "bg-green-100 text-green-800" :
            d.status === "failed"  ? "bg-red-100 text-red-800" :
                                     "bg-yellow-100 text-yellow-800"
          }`}>
            {d.status}
          </span>
        </td>
        <td className="p-3 text-right text-sm text-gray-500">
          {formatRelativeTime(d.createdAt)}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**After:**
```tsx
<DataTable
  columns={[
    { key: "name", label: "Name", sortable: true },
    {
      key: "status",
      label: "Status",
      render: (d) => <Badge variant={statusToVariant(d.status)}>{d.status}</Badge>,
    },
    {
      key: "createdAt",
      label: "Created",
      align: "right",
      sortable: true,
      render: (d) => <Timestamp date={d.createdAt} />,
    },
  ]}
  data={deployments}
  rowKey={(d) => d.id}
/>
```

### Manual confirm → `<ConfirmDialog>`

**Before:**
```tsx
function handleDelete() {
  if (confirm(`Delete ${item.name}?`)) {
    deleteItem(item.id);
  }
}
// …
<button onClick={handleDelete} className="text-red-600">Delete</button>
```

**After:**
```tsx
<ConfirmDialog
  title={`Delete ${item.name}?`}
  description="This cannot be undone."
  confirmLabel="Delete"
  variant="destructive"
  onConfirm={() => deleteItem(item.id)}
>
  <Button variant="destructive" size="sm">Delete</Button>
</ConfirmDialog>
```

The handler function isn't needed — `onConfirm` wires directly. Behavior change: native `confirm()` (blocking, browser-styled) → modal dialog (styled, focus-trapped, dismissable).

### Raw text classes → typography tokens

**Before:**
```tsx
<h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
<p className="text-lg text-gray-500">{description}</p>
```

**After:**
```tsx
<h1 className="text-display-md text-foreground mb-2">{title}</h1>
<p className="text-body-lg text-muted-foreground">{description}</p>
```

Or, if the surface is a page, replace with `<PageShell title={title} description={description}>`.

### Raw palette → theme tokens

**Before:**
```tsx
<div className="bg-purple-50 border border-purple-200 p-4 rounded">
  <p className="text-purple-900">Welcome!</p>
</div>
```

**After:**
```tsx
<div className="bg-primary/10 border border-primary/40 p-4 rounded">
  <p className="text-primary-deep">Welcome!</p>
</div>
```

Or, if it's an alert: `<Alert variant="info">…</Alert>`.

---

## Edge cases

### Original file uses a different design system

If the file imports from another UI library (`@chakra-ui/*`, `@mantine/*`, `@radix-ui/*` directly, `antd`, etc.), the migration plan must:

1. List the foreign-lib imports under "Imports to remove".
2. Surface this in the plan as "**Foreign library detected:** @chakra-ui/react. Removing on migration."
3. Confirm with user explicitly before proceeding.

### Original file has custom Tailwind classes

If the file uses Tailwind utility classes that the theo-ui preset doesn't recognize (e.g., custom plugin classes), preserve them. Only swap the conflicting ones (`bg-purple-600` → `bg-primary`).

### Original file has inline styles

Inline `style={{...}}` is forbidden by the theo-ui token system. The migration plan lists each inline style under "Replacements" with the token equivalent.

### Original file uses CSS modules

If the file imports a `.module.css`, the migration plan calls this out:

> *"This file uses CSS modules. The migration will convert the JSX classes to use the theo-ui Tailwind preset. The `.module.css` file is left untouched — you can delete it after if it's now empty, or migrate its rules to the theo-ui token system separately."*

### Original file already uses theo-ui partially

Common — some files are 60% theo-ui already. The migration plan lists ONLY the gaps. Don't re-emit the already-correct imports.

---

## Stamp format for migrated files

Stamp the migrated file at the top:

```tsx
{/* theo-ui · migrated: 2026-05-25 · v1.0.0
 *  surface: cloud-dashboard  ·  archetype: P1 ListPage
 *  composites: PageShell · ActionBar · DataTable · DropdownMenu · ConfirmDialog
 *  pre-migration audit score: 60%  ·  post-migration audit score: 100%
 */}
```

This stamp tells the next run "this file was migrated; the next audit will pass."
