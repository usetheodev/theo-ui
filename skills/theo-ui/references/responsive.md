# Responsive

Mobile is non-negotiable. Every emit verified at **320 / 375 / 414 / 768 px**. If any of those four widths break, the build fails.

---

## Breakpoints (Tailwind defaults, inherited by the theo-ui preset)

| Name | Width | Devices | Key changes |
|---|---|---|---|
| (base) | < 640 px | Mobile portrait | Stacked layouts, hamburger nav, drawer-style modals, hidden low-priority columns. |
| `sm` | ≥ 640 px | Mobile landscape, small tablet | Stacked → 2-col where applicable. Modals become centered. |
| `md` | ≥ 768 px | Tablet portrait, small laptop | 2-col → 3-col where applicable. Nav stays horizontal. Side-rails appear. |
| `lg` | ≥ 1024 px | Tablet landscape, laptop | 3-col fully revealed. PageShell + sidebar layout common. |
| `xl` | ≥ 1280 px | Desktop | Container caps here. Full dashboard layouts. |
| `2xl` | ≥ 1536 px | Large desktop, ultrawide | Content stays centered at 1280 px max. |

---

## Non-negotiable mobile gates

### R-01 — No horizontal scroll at 320 px

The page must NOT scroll horizontally at the narrowest target (320 px iPhone SE 1st-gen width). Common culprits:

- Wide `<DataTable>` without `hideBelow` on low-priority columns.
- Flex rows without `flex-wrap` overflowing.
- Pre-formatted code blocks with long lines and no `overflow-x: auto` scoped to the block itself.
- Inline-stretched images without `max-width: 100%`.

Fix:

```tsx
// DataTable — mark columns
<DataTable
  columns={[
    { key: "name", label: "Name" },  // always visible
    { key: "branch", label: "Branch", hideBelow: "md" },
    { key: "duration", label: "Duration", hideBelow: "lg" },
  ]}
/>

// Flex row — allow wrap
<div className="flex flex-wrap items-center gap-2">

// Code block — scoped scroll only
<pre className="overflow-x-auto bg-secondary rounded-lg p-4">

// Image — constrain
<img src={...} alt={...} className="max-w-full h-auto" />
```

The root `<html>` and `<body>` should have `overflow-x: clip` (NOT `hidden` — `clip` doesn't introduce a scroll container, `hidden` does).

### R-02 — No two-line clickable text

Buttons, primary nav links, footer links, breadcrumbs, CTAs MUST be single-line on every breakpoint.

```tsx
// WRONG — long label wraps on mobile
<Button>Click here to learn more about our features</Button>

// RIGHT — short verb
<Button>Learn more</Button>

// RIGHT — use icon-only when label is descriptive in context
<Button variant="ghost" size="icon" aria-label="Settings">
  <Settings className="h-4 w-4" />
</Button>
```

If a label genuinely needs more than ~20 chars, it's the wrong copy or the wrong control (use a `<DropdownMenu>` with the long-form label inside the menu).

### R-03 — Image-bearing grid tracks use `minmax(0, 1fr)`

```css
/* WRONG — image content pushes tracks wider than 1fr should allow */
grid-template-columns: 1fr 1fr 1fr;

/* RIGHT */
grid-template-columns: repeat(3, minmax(0, 1fr));
```

Tailwind's `grid-cols-N` utilities already use `minmax(0, 1fr)` internally — so `grid-cols-3` is safe. Only relevant when writing custom CSS.

### R-04 — Display headlines wrap inside long words

Long unbreakable words (URLs, hashes, identifiers) in display headlines can overflow:

```tsx
<h1 className="text-display-xl break-words [overflow-wrap:anywhere] min-w-0">
  https://example.com/very/long/url/with/no/spaces
</h1>
```

Apply `overflow-wrap: anywhere` + `min-width: 0` on the headline to allow mid-word breaks.

### R-05 — Section heads collapse to one column on mobile

If a section uses a 2-col header pattern (label left, content right), it MUST collapse to one column below `md`:

```tsx
<div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
  <div>
    <h3 className="text-label-caps text-muted-foreground">Features</h3>
  </div>
  <div>
    {/* content */}
  </div>
</div>
```

The "left label / right content" pattern is forbidden when it doesn't collapse. (Hallmark calls this "the templated-editorial tell"; the same rule applies here.)

---

## Per-composite responsive contracts

### `<PageShell>`

- **Title** stays `text-display-md` (32 px) across all breakpoints. Doesn't shrink on mobile.
- **`<ActionBar>`** collapses from horizontal flex to stacked column below `sm`. The search input stays full-width.
- **Description** wraps to multiple lines if needed.
- **`primaryAction`** button label remains visible; icon-only collapse only when explicitly requested via `primaryAction.iconOnly`.

### `<DataTable>`

- **Sticky header** preserved at all breakpoints.
- **Columns with `hideBelow: "md"`** hide below `md`. Use this on date columns, secondary metadata, anything not load-bearing.
- **Columns with `hideBelow: "lg"`** hide below `lg`. Use for tertiary columns (duration, last-seen).
- **Row actions** (`<DropdownMenu>` trigger) stays in the rightmost column at all breakpoints.
- **Pagination** stays at the bottom — controls stack vertically below `sm`.

### `<ChatThread>`

- **Internal max-width 768 px** at all breakpoints. Content doesn't stretch to ultra-wide.
- **Padding** tightens from `{spacing.4}` (16 px) to `{spacing.3}` (12 px) below `sm`.
- **Message bubbles** stay role-aligned (user right, assistant left) at all breakpoints.

### `<Dialog>`

- **Below `sm`** — full-screen drawer-style (slides up from the bottom on iOS-style devices).
- **`≥ sm`** — centered modal with max-width 600 px.
- **Backdrop** — `bg-black/80` overlay at all breakpoints (no blur — anti-glass).

### `<DropdownMenu>` / `<CommandPalette>`

- **Below `sm`** — full-screen drawer.
- **`≥ sm`** — floating popover.

### `<LoginSplit>`

- **`≥ lg`** — 50/50 split layout.
- **`< lg`** — single column with form on top, branding below (or branding hidden if small enough).

### `<Card>` grids

- **3-up grid** (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) — 1-up mobile, 2-up tablet, 3-up desktop.
- **Card content** doesn't shrink — only the columns reflow.

---

## Touch targets — WCAG 2.5.8 Level AA

**Floor: 24 × 24 CSS px.** Theo-ui's `comfortable` density (36 px control height) easily exceeds this. `compact` (32 px) meets it via the focus ring expansion (2 px each side = effective 36×36).

The skill does NOT target 2.5.5 Level AAA (44 px) by default. For accessibility-first surfaces:

- Set `<ThemeProvider defaultDensity="spacious">` (44 px controls).
- OR use `size="lg"` per control.

### Icon-only buttons

`<Button variant="ghost" size="icon">` is a 36 px square (default density). Meets AA. The icon inside is 16 px (`h-4 w-4`) with 10 px padding all around.

For dense surfaces where space is genuinely constrained, you can use `size="sm"` (32 px). Below 24 px effective tap area, fail.

---

## Hit targets vs. visible size

A 24 × 24 visible icon button with 8 px padding has a 40 × 40 effective hit target. The hit target counts, not the visible icon. This is why ghost icon buttons at `size="icon"` are AA-compliant.

For inline links (`<a>` inside body text), the line-height + padding usually gives enough effective hit area. Don't worry about 24 px for inline links in `text-body-md`.

---

## Testing protocol

Before declaring a build done:

1. **320 px** — iPhone SE / older Android. The hardest test. If this passes, the rest usually do.
2. **375 px** — iPhone 13 mini / standard. The common case.
3. **414 px** — iPhone Plus / Pro Max. Slightly wider, often has different layout shifts.
4. **768 px** — iPad portrait / small tablet. The `md` breakpoint boundary.

Open dev tools → device toolbar → cycle through these four widths. Look for:

- Horizontal scroll bar appearing at the bottom.
- Text overlapping or clipping.
- Buttons / links wrapping to two lines.
- Cards squashing or content getting cut off.
- DataTable headers misaligning with rows.
- Modals stretching past the viewport.

If any of these fire, fix and retest.

---

## Common responsive bugs

### `flex-wrap` missing

Long button rows wrap weirdly on mobile when the parent is `flex` without `flex-wrap`:

```tsx
// WRONG
<div className="flex items-center gap-2">
  <Button>One</Button>
  <Button>Two</Button>
  <Button>Three</Button>
  <Button>Four</Button>
</div>

// RIGHT
<div className="flex flex-wrap items-center gap-2">
```

### Sticky footer overlapping content

```tsx
// WRONG — sticky save bar covers the last form field on mobile
<form>
  {/* fields */}
  <div className="sticky bottom-0 bg-background border-t border-border py-4">
    <Button>Save</Button>
  </div>
</form>

// RIGHT — add bottom padding to the form equal to the sticky height
<form className="pb-20">
  {/* fields */}
  <div className="sticky bottom-0 bg-background border-t border-border py-4 -mx-4 px-4">
    <Button>Save</Button>
  </div>
</form>
```

### Modal larger than viewport

If `<Dialog.Content>` content is taller than 100vh on mobile, scroll inside the dialog (not on body):

```tsx
<Dialog.Content className="max-h-[90vh] overflow-y-auto">
  {/* tall content */}
</Dialog.Content>
```

### Sidebar not collapsing

```tsx
// WRONG — sidebar stays visible at 320 px and the main content gets crushed
<div className="flex h-screen">
  <aside className="w-56">…</aside>
  <main className="flex-1">…</main>
</div>

// RIGHT
<div className="flex h-screen">
  <aside className="hidden md:flex md:w-56">…</aside>
  <main className="flex-1">…</main>
</div>
{/* Mobile menu button + drawer dialog elsewhere */}
```

### Horizontal scroll on a code block bleeding to the page

```tsx
// WRONG — pre's content overflows past the card border on mobile
<Card>
  <Card.Content>
    <pre>{longCode}</pre>  // no overflow-x scoped
  </Card.Content>
</Card>

// RIGHT
<Card>
  <Card.Content>
    <pre className="overflow-x-auto">{longCode}</pre>
    {/* OR */}
    <CodeBlock value={longCode} />  // primitive handles overflow internally
  </Card.Content>
</Card>
```
