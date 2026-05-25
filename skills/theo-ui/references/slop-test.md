# Slop test — 32 gates

Run AFTER Build, BEFORE handoff. Every gate must answer **NO** (or **PASS** for the PASS-coded gates).

Gates are grouped into 6 buckets — **L** Library-fit, **T** Token-fidelity, **C** Composition, **A** A11y, **R** Responsive, **V** Voice. Buckets sized roughly by how often the LLM fails them.

If a gate fails, fix the code and re-run the affected bucket. Re-emit the preview block with the corrected slop-test row.

---

## Pre-emit self-critique

Before running the 32 gates, score the output 1–5 on six axes. Stamp at the top of the artifact:

```tsx
{/* theo-ui · pre-emit critique: L5 T5 C4 A5 R5 V5 */}
```

| Axis | What you're scoring |
|---|---|
| **L · Library-fit** | Did you reach for the right `@usetheo/ui` components? Or did you hand-roll? |
| **T · Token-fidelity** | Did every color, font, size resolve to a token? Any inline hex / raw size class? |
| **C · Composition** | Did you use composites (`<PageShell>`, `<DataTable>`, etc.) where they fit? Or primitives + manual layout? |
| **A · A11y** | Focus rings, tap targets, labels, semantic HTML, ARIA, keyboard nav. |
| **R · Restraint** | Did you add what was needed or pile on motion / shadows / decoration? Less is more. |
| **V · Voice** | Copy is honest, specific, verb-led. No invented metrics. |

Anything **< 3** triggers a revision pass. Do not ship a 2 or 1.

Be honest. Stamp inflation (every output is 5/5/5/5/5/5) defeats the purpose.

---

## L · Library-fit (6 gates)

### L-01 — Did you hand-roll a button?

Search the artifact for `<button ` elements (lowercase). Each one must be either:
- Inside a `<Button asChild>` (Radix Slot pattern), OR
- A genuinely custom button that `<Button>` cannot express (rare — usually means custom variant).

If a `<button className="…">` exists with `bg-`, `hover:`, `px-`, `py-` styling, **FAIL**.

### L-02 — Did you hand-roll a card?

Search for `<div className="…bg-card…rounded-…border-border…">` or similar combinations of card-shaped utility classes. If found, **FAIL** — should be `<Card>`.

### L-03 — Did you hand-roll a modal / dialog?

Search for `fixed inset-0`, `bg-black/50`, or any pattern that builds a modal manually. **FAIL** — should be `<Dialog>`.

### L-04 — Did you hand-roll a dropdown / menu?

Search for `useState(false)` + `<ul>` + `absolute mt-` patterns. **FAIL** — should be `<DropdownMenu>`.

### L-05 — Did you hand-roll a table?

If the page renders tabular data and uses `<table>` directly (vs `<DataTable>`), **FAIL**. Exception: a 2–3 row read-only key-value list is OK with `<Card>` rows.

### L-06 — Did you hand-roll a form field?

Search for `<input type="text">` or `<select>` raw HTML. **FAIL** — should be `<Input>`, `<Textarea>`, `<Select>`. Exception: file inputs (`<input type="file">`) where theo-ui doesn't ship a specialized primitive yet — wrap in a styled `<Button asChild>` if you can.

---

## T · Token-fidelity (8 gates)

### T-01 — Any inline hex?

`grep -E "#[0-9A-Fa-f]{3,8}"` in the artifact. Hits **FAIL** (unless inside a comment).

### T-02 — Any raw Tailwind palette color?

`grep -E "(bg|text|border|ring|from|to|via)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-[0-9]+"`. Hits **FAIL** — should use theme tokens (`bg-primary`, `text-foreground`, `border-border`).

### T-03 — Any hardcoded shadow?

`grep -E "boxShadow:|shadow-\[.*\]"`. Hits **FAIL** — should use `shadow-sm` / `shadow-md` / `shadow-lg` / `shadow-glow`.

### T-04 — Any hardcoded font-family?

`grep -E "fontFamily:|font-family"`. Hits **FAIL** — should use `font-display`, `font-sans`, `font-mono` tokens.

### T-05 — Any raw Tailwind text size?

`grep -E "text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b"`. Hits **FAIL** — should use `text-body-md`, `text-display-md`, `text-title-lg`, etc.

### T-06 — Any weight 700+?

`grep -E "font-(bold|extrabold|black)"`. Hits **FAIL** — weight ceiling is 600. Display tokens already bake weight; don't add `font-bold`.

### T-07 — Any inline OKLCH / RGB / HSL?

`grep -E "(oklch|rgb|hsl)\("`. Hits inside `style={…}` **FAIL**. Hits inside CSS files for the project's own custom tokens are OK — but the consuming JSX still references them by name.

### T-08 — Any glass / backdrop-blur?

`grep -E "backdrop-blur|backdrop-filter"`. Hits **FAIL** — anti-glass principle. Use opaque card + shadow.

---

## C · Composition (5 gates)

### C-01 — Page-level surface uses `<PageShell>`?

For ListPage / DetailPage / SettingsPage archetypes, the JSX must open with `<PageShell>`. If it opens with `<div className="p-6">` + custom title, **FAIL**.

### C-02 — Destructive action wrapped in `<ConfirmDialog>` or `<DangerZone>`?

Any `onClick={handleDelete}` / `onClick={handleRollback}` must be wrapped. Direct destructive clicks **FAIL**.

### C-03 — Empty state uses `<EmptyState>`?

If the page renders an empty list / empty result / no-data state, it must use `<EmptyState>`. Hand-rolled `<div className="text-center">…</div>` **FAIL**.

### C-04 — Tool calls in chat use `<ToolCall>` / `<ToolResult>`?

In `agent-chat` surface, every tool invocation must render via the dedicated primitive. Plain `<div>` wrappers around tool output **FAIL**.

### C-05 — Loading state uses `<Skeleton>` or `<PageShell loading>` or `<Loader2>`?

Hand-rolled spinners (`<div className="animate-spin border-2 …">`) **FAIL**. Use the lucide `<Loader2 className="animate-spin" />` for buttons or `<Skeleton>` for content placeholders or `loading` prop on `<PageShell>`.

---

## A · A11y (6 gates)

### A-01 — Every interactive has `:focus-visible`?

Theo-ui primitives ship with focus rings. If you wrote a custom `<button>` or `<div onClick>`, **FAIL**.

### A-02 — Tap target ≥ 24 × 24 px?

Default `size="md"` controls are 36 px (comfortable) / 32 px (compact) / 44 px (spacious). All pass WCAG 2.5.8 AA. Icon-only buttons with custom sizing < 24 px **FAIL**.

### A-03 — `<Button>` for actions, `<a>` for navigation?

A button that does `window.location = "/x"` should be an `<a>` (or `<Link>` in Next.js). An anchor `<a>` that does an action (no `href`, only `onClick`) should be a `<Button>`. Mismatch **FAIL**.

### A-04 — Form inputs have `<Label htmlFor=…>`?

Every `<Input>`, `<Textarea>`, `<Select>` needs a paired `<Label>` with `htmlFor` matching the input's `id`. Exception: `placeholder`-only inputs are accessible if they're search boxes inside an `<ActionBar search>` (the primitive sets `aria-label`).

### A-05 — Status indicators have non-color signal?

A red dot alone is not accessible. `<StatusDot variant="destructive">` includes aria-label. Color-only signals **FAIL**.

### A-06 — Modal / Dialog has `Dialog.Title`?

Radix requires a `<Dialog.Title>` (or `aria-labelledby`) for screen readers. A `<Dialog>` with only `<Dialog.Content>` **FAIL**.

---

## R · Responsive (4 gates)

### R-01 — No horizontal scroll at 320 px?

Manually verify in dev tools or via JSX inspection. `overflow-x-auto` somewhere is fine if scoped (e.g., a deliberate code block). Page-level horizontal scroll **FAIL**.

### R-02 — No two-line buttons?

`<Button>Click here to learn more about our features</Button>` will wrap at small widths. Rewrite shorter or apply `size="sm"`. **FAIL** if any button label exceeds ~20 chars on a primary CTA.

### R-03 — `<DataTable>` columns marked with `hideBelow` for low-priority?

If the table has > 4 columns and renders on mobile, low-priority columns need `hideBelow: "md"` or `hideBelow: "lg"`. Otherwise horizontal scroll. **FAIL**.

### R-04 — `<Dialog>` becomes full-screen below `sm`?

Theo-ui `<Dialog>` does this by default. If you wrote a custom modal that doesn't collapse to full-screen on mobile, **FAIL**.

---

## V · Voice / Copy (3 gates)

### V-01 — Any invented metrics / testimonials / logos?

Search for numeric values inside `<StatTile>`, `<UsageMeter>`, `<CostMeter>`, pricing tables, marketing proof bars. If the value isn't bound to a real prop or constant **FAIL**.

### V-02 — Button labels are verbs?

Read every `<Button>` label. Nouns ("Settings", "Email", "Profile") **FAIL** unless they're navigation labels in a nav bar. Single-word verbs ("Save", "Delete", "Continue") pass.

### V-03 — Error messages have a next step?

Read every `<Alert variant="destructive">` and `<PageShell error>`. If the user reads it and can't tell what to do next **FAIL**.

---

## Surface-specific extensions

Some gates only apply to certain surfaces. The slop test runs **all 32 universal gates** plus the applicable surface-specific gates.

### `agent-chat` extra gates

- **AC-01** — Streaming state uses `<AgentStreaming>` primitive, not a manual spinner.
- **AC-02** — User messages render right-aligned, assistant messages left-aligned (handled by `<ChatMessage role>`).
- **AC-03** — Tool calls collapse / expand via `<ToolCall>`'s built-in toggle, not custom state.

### `cloud-dashboard` extra gates

- **CD-01** — Lists with > 10 rows have pagination wired (`<DataTable pagination>`).
- **CD-02** — Status indicators are `<StatusDot>` + label, not just colored dots.
- **CD-03** — Row actions are `<DropdownMenu>` in the rightmost column, not inline buttons cluttering each row.

### `settings-form` extra gates

- **SF-01** — Destructive settings live in `<DangerZone>` at the bottom of the page.
- **SF-02** — Long forms split into multiple `<Card>` sections, one concern per card.
- **SF-03** — Submit button at the bottom of each card, not a single page-wide save bar (unless the form is small).

### `marketing` extra gates

- **MK-01** — Hero CTA uses `<Button variant="primary" size="lg">` paired with `<Button variant="secondary" size="lg">`.
- **MK-02** — Pricing tiers use `<PlanBadge variant="primary">` on the featured tier.
- **MK-03** — Logo strips use real customer logos or are omitted — no invented logo placeholders.

### `auth` extra gates

- **AU-01** — Sign-in surface uses `<LoginSplit>` or `<Card>` centered, not a custom layout.
- **AU-02** — OAuth providers via `<SocialAuthRow>`, never hand-rolled provider buttons.
- **AU-03** — OTP / 2FA via `<PinInput>`, never multiple `<Input>` with manual focus management.

---

## Running the slop test

In your head: read each gate header, verify against the emitted code, mark PASS or FAIL. For most builds you'll have 0–2 fails on the first pass. Fix and re-verify only the failed bucket.

In the preview block at Step 5, the slop-test row reports:

```
- **Slop test** · 32 / 32 ✓
```

or

```
- **Slop test** · 30 / 32 — fails: L-03 (hand-rolled modal), V-02 (button label "Settings")
```

Fix every fail before shipping. The build is not done until the slop test is green.
