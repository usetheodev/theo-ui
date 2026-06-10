# Anti-patterns

Named patterns the skill must refuse to emit. Each anti-pattern is paired with a slop-test gate code (see [`slop-test.md`](slop-test.md)) and a corrective.

The anti-patterns fall into six families: **Library avoidance** (L), **Token improvisation** (T), **Composition flatness** (C), **A11y holes** (A), **Responsive fragility** (R), and **Voice / copy slop** (V).

---

## L · Library avoidance

The skill's primary failure mode: hand-rolling UI that the library already ships. Every L-gate failure is a missed `import`.

### L-01 · Hand-rolled button

```tsx
// WRONG
<button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
  Save
</button>

// RIGHT
import { Button } from "@theokit/ui/button";
<Button variant="primary">Save</Button>
```

Reason: `<Button>` already handles hover, focus-visible, active, disabled, loading states, density, theme. Hand-rolled buttons miss focus-visible 90% of the time.

### L-02 · Hand-rolled card

```tsx
// WRONG
<div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
  …
</div>

// RIGHT
import { Card } from "@theokit/ui/card";
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
  </Card.Header>
  <Card.Content>…</Card.Content>
</Card>
```

### L-03 · Hand-rolled modal

```tsx
// WRONG — manual fixed overlay
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div className="bg-white p-6 rounded-xl">…</div>
</div>

// RIGHT
import { Dialog } from "@theokit/ui/dialog";
<Dialog open={open} onOpenChange={setOpen}>
  <Dialog.Content>
    <Dialog.Header><Dialog.Title>…</Dialog.Title></Dialog.Header>
    …
  </Dialog.Content>
</Dialog>
```

Reason: Radix-backed `<Dialog>` handles focus trap, escape-to-close, return-focus-on-close, scroll lock, ARIA roles. Hand-rolled modals are an a11y disaster.

### L-04 · Hand-rolled data table

```tsx
// WRONG
<table><thead><tr>…</tr></thead><tbody>{rows.map(…)}</tbody></table>

// RIGHT
import { DataTable } from "@theokit/ui/data-table";
<DataTable
  columns={[
    { key: "name", label: "Name", sortable: true },
    { key: "status", label: "Status" },
  ]}
  data={rows}
  rowKey={(r) => r.id}
/>
```

Reason: `<DataTable>` (Brief #5) handles sortable headers, sticky header, expandable rows, row actions via DropdownMenu, pagination, loading skeleton, empty state. Hand-rolled tables miss all of these.

### L-05 · Hand-rolled dropdown menu

```tsx
// WRONG — manual click-outside, manual ARIA
const [open, setOpen] = useState(false);
return (
  <div className="relative">
    <button onClick={() => setOpen(!open)}>…</button>
    {open && <ul className="absolute mt-1 bg-white shadow-lg">…</ul>}
  </div>
);

// RIGHT
import { DropdownMenu } from "@theokit/ui/dropdown-menu";
<DropdownMenu>
  <DropdownMenu.Trigger asChild>
    <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item>Edit</DropdownMenu.Item>
    <DropdownMenu.Item>Delete</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu>
```

### L-06 · Hand-rolled chat bubble

```tsx
// WRONG
<div className="rounded-lg p-4 bg-purple-50">
  <p>{message}</p>
</div>

// RIGHT
import { ChatMessage } from "@theokit/ui/chat-message";
<ChatMessage role="assistant" parts={[{ type: "text", text: message }]} />
```

Reason: `<ChatMessage>` handles role-based alignment, markdown rendering, tool calls and results as message parts, streaming state, copy actions. Hand-rolled bubbles miss the parts API entirely.

---

## T · Token improvisation

The skill must refuse to bypass the design token system. Every T-gate failure is a styling decision that should have referenced a token.

### T-01 · Inline hex

```tsx
// WRONG
<div style={{ background: '#7C3AED' }}>

// RIGHT
<div className="bg-primary">
```

### T-02 · Raw Tailwind palette color

```tsx
// WRONG — bypasses the theme system
<button className="bg-purple-600 text-white">

// RIGHT
<Button variant="primary">  // OR <div className="bg-primary text-primary-foreground">
```

Reason: `bg-purple-600` is a fixed Tailwind palette color. It does NOT swap when the theme changes. Theme-aware tokens (`bg-primary`) recolor with `<ThemeProvider>`.

### T-03 · Hardcoded shadow

```tsx
// WRONG
<div style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>

// RIGHT
<div className="shadow-md">  // resolves to theme-aware ink shadow
```

Reason: `rgba(0,0,0,…)` hardcodes black. In dark mode, the shadow becomes invisible against the dark surface. Theme-aware shadow tokens use `hsl(var(--foreground) / 0.06)` which inverts correctly.

### T-04 · Hardcoded font-family

```tsx
// WRONG
<h1 style={{ fontFamily: 'Geist' }}>

// RIGHT
<h1 className="font-display">  // OR just use the token
<h1 className="text-display-md">  // applies Geist + size + weight + tracking in one
```

### T-05 · Raw Tailwind size class for typography

```tsx
// WRONG — bypasses the Vercel-inspired scale
<h1 className="text-4xl font-bold">
<p className="text-lg">

// RIGHT
<h1 className="text-display-md">  // 32 px / 600 / tight tracking, all baked
<p className="text-body-md">      // 14 px / 400 / 1.43, default body
```

Reason: Raw Tailwind sizes (`text-xl`, `text-2xl`, `text-4xl`) don't include the negative letter-spacing or the 600-weight ceiling. They produce visually different headlines run-to-run.

### T-06 · Weight 700 or higher

```tsx
// WRONG
<h1 className="text-display-md font-bold">    // 700 — out of system

// RIGHT
<h1 className="text-display-md">              // 600 baked in, leave it alone
```

### T-07 · Mid-render inline OKLCH / RGB

```tsx
// WRONG
<div style={{ background: 'oklch(58% 0.16 35)' }}>
<div style={{ color: 'rgb(124, 58, 237)' }}>

// RIGHT
<div className="bg-primary">
```

If you need a color that doesn't exist as a token, lift it into the project's theme via `defineTheme()` first, then reference it.

### T-08 · Glass / backdrop-blur

```tsx
// WRONG — Violet Forge explicitly rejects glass
<div className="backdrop-blur-md bg-white/50">

// RIGHT — opaque card with theme shadow
<Card className="shadow-lg">
```

Reason: Anti-glass principle (named in `docs/design-system.md > Principles`). Glass effects fight legibility on dense dashboards and inflate render cost.

---

## C · Composition flatness

Composites exist for the most common compositions. Skipping them produces flat, repetitive output.

### C-01 · Skipping `<PageShell>` on a list page

```tsx
// WRONG
<div className="p-6">
  <h1 className="text-display-md">Deployments</h1>
  <p className="text-body-md text-muted-foreground">Manage your deployments.</p>
  <DataTable …/>
</div>

// RIGHT
<PageShell
  title="Deployments"
  description="Manage your deployments."
  primaryAction={{ label: "New deployment", onClick: openModal }}
>
  <DataTable …/>
</PageShell>
```

Reason: `<PageShell>` handles state precedence (loading > error > empty > children), document title coupling, breadcrumbs slot, and ARIA `aria-busy`. Hand-rolled page wrappers miss the state machine.

### C-02 · Skipping `<DataTable>` for tabular data

A list of 3+ rows with consistent fields is a `<DataTable>`. A flex column of `<Card>` rows is acceptable for 2–3 rows of heterogeneous content; beyond that, switch to DataTable.

### C-03 · Skipping `<ConfirmDialog>` for destructive actions

```tsx
// WRONG — manual confirmation
if (confirm("Are you sure?")) { /* delete */ }

// WRONG — manual modal
<Dialog>
  <Dialog.Content>
    <p>Delete this deployment?</p>
    <Button onClick={onDelete}>Delete</Button>
  </Dialog.Content>
</Dialog>

// RIGHT
<ConfirmDialog
  title="Delete deployment?"
  description="This will permanently remove the deployment and its build artifacts."
  confirmLabel="Delete"
  variant="destructive"
  onConfirm={handleDelete}
>
  <Button variant="destructive" size="sm">Delete</Button>
</ConfirmDialog>
```

### C-04 · Skipping `<EmptyState>`

```tsx
// WRONG
<div className="text-center py-16">
  <p>No deployments yet.</p>
  <button>Create one</button>
</div>

// RIGHT
<EmptyState
  icon={Rocket}
  title="No deployments yet"
  description="Connect a Git repo to deploy your first project."
  action={{ label: "Connect repo", onClick: openWizard }}
/>
```

### C-05 · Skipping `<Alert>` for inline messages

```tsx
// WRONG
<div className="bg-red-50 border border-red-200 p-3 rounded">
  <p className="text-red-900">Build failed: missing env var</p>
</div>

// RIGHT
<Alert variant="destructive">
  <AlertCircle />
  <Alert.Title>Build failed</Alert.Title>
  <Alert.Description>Missing env var: DATABASE_URL</Alert.Description>
</Alert>
```

---

## A · A11y holes

The skill must never ship a11y holes. Each A-gate is a baseline a11y requirement.

### A-01 · Missing focus-visible

Every interactive element MUST have a visible focus ring. Theo-ui primitives ship with `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`. Hand-rolled buttons / divs with `onClick` miss this.

### A-02 · Tap target < 24 × 24 px

WCAG 2.5.8 Level AA floor. Theo-ui `comfortable` density (36 px) easily exceeds this; `compact` (32 px) just meets it via focus-ring expansion. Hand-rolled icon buttons at 16 × 16 px fail.

### A-03 · `<div onClick>` instead of `<Button>`

```tsx
// WRONG — not keyboard accessible, no role, no focus
<div onClick={onSave} className="cursor-pointer">Save</div>

// RIGHT
<Button onClick={onSave}>Save</Button>
```

### A-04 · Missing label on form input

```tsx
// WRONG
<Input placeholder="Email" />

// RIGHT
<Label htmlFor="email">Email</Label>
<Input id="email" placeholder="you@example.com" />
```

`<Input>` does NOT auto-link a label. Always pair with `<Label>`.

### A-05 · Color-only state indicator

```tsx
// WRONG — color is the only signal
<span className="text-destructive">●</span>

// RIGHT — icon + color
<StatusDot variant="destructive" />     // includes an aria-label
<XCircle className="text-destructive" /> // icon shape + color
```

### A-06 · Missing `<label>` association in checkbox

```tsx
// WRONG
<Checkbox /> Agree to terms

// RIGHT
<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Agree to terms</Label>
</div>
```

---

## R · Responsive fragility

### R-01 · Horizontal scroll on mobile

Test at 320 px. If horizontal scroll appears (`overflow-x: auto` somewhere), fix the layout — usually a too-wide table or a flex row without `min-w-0` / `flex-wrap`.

### R-02 · Two-line clickable text

Buttons, primary nav links, footer links, breadcrumbs, CTAs MUST be single-line on every breakpoint. If a label wraps to two lines, it's the wrong label (rewrite shorter) or wrong size (use `size="sm"` or shorter padding).

### R-03 · Image-bearing grid track without `minmax(0, 1fr)`

```css
/* WRONG — image pushes the track wider than 1fr */
grid-template-columns: 1fr 1fr 1fr;

/* RIGHT */
grid-template-columns: repeat(3, minmax(0, 1fr));
```

Tailwind: `grid-cols-3` already uses `minmax(0, 1fr)` so this is automatic.

### R-04 · `<DataTable>` without column-hide on mobile

```tsx
// WRONG — all 8 columns on a 320-px screen → horizontal scroll
<DataTable columns={cols} …/>

// RIGHT — mark low-priority columns
<DataTable
  columns={[
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
    { key: "lastSeen", label: "Last seen", hideBelow: "md" },
    { key: "createdAt", label: "Created", hideBelow: "lg" },
  ]}
  …
/>
```

---

## V · Voice / copy slop

### V-01 · Invented metrics

```tsx
// WRONG — invented number to fill a stat tile
<StatTile label="Active users" value="47,283" />

// RIGHT — placeholder + future data binding
<StatTile label="Active users" value="—" hint="data pending" />

// RIGHT — wired to real data
<StatTile label="Active users" value={users.toLocaleString()} />
```

Same for testimonials, logos, "trusted by N teams", "+47% improvement". If the user didn't supply it, don't generate it.

### V-02 · Button labels that aren't verbs

```tsx
// WRONG — nouns
<Button>Settings</Button>
<Button>Email</Button>

// RIGHT — verbs
<Button>Open settings</Button>
<Button>Send email</Button>

// EXCEPTION — single-word action verbs are fine
<Button>Save</Button>
<Button>Delete</Button>
<Button>Continue</Button>
```

### V-03 · Marketing fluff in dashboard surfaces

```tsx
// WRONG — marketing voice in a settings page
<Card.Description>
  Take control of your account and unlock the full power of your workspace.
</Card.Description>

// RIGHT — utility voice
<Card.Description>
  Manage your account preferences and notification settings.
</Card.Description>
```

Marketing voice belongs on `marketing` surface only. `cloud-dashboard`, `settings-form`, `agent-chat`, `auth` surfaces are utility-voice (concrete, declarative, no aspirational language).

### V-04 · Error messages without next step

```tsx
// WRONG — what should the user do?
<Alert variant="destructive">
  <Alert.Title>Something went wrong.</Alert.Title>
</Alert>

// RIGHT — specific + actionable
<Alert variant="destructive">
  <Alert.Title>Build failed: missing env var DATABASE_URL</Alert.Title>
  <Alert.Description>
    Add the variable in the Environment settings, then redeploy.
  </Alert.Description>
</Alert>
```

---

## Stamp anti-pattern: lying critique scores

The pre-emit critique block is the user's accountability line. If you stamp `L5 T5 C5 A5 R5 V5` on every output regardless of actual quality, you've poisoned the signal.

Be honest. A first-pass output that hand-rolls one button instead of importing `<Button>` is **L3**, not L5. Score it L3, then fix the issue, then re-emit with L5.

Slop-test gate **V-05** (meta) catches stamp inflation by spot-checking the artifact against the claimed scores.
