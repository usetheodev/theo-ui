# Typography — Geist / Vercel scale

Mirror of [`src/styles/tailwind-preset.ts > theme.extend.fontSize`](../../../src/styles/tailwind-preset.ts) and the typography section of [`../../../docs/design-system.md`](../../../docs/design-system.md).

---

## Font families

| Family | Token | Tailwind | Use |
|---|---|---|---|
| Display | `var(--font-display)` | `font-display` | Headlines, hero text, display tier |
| Body | `var(--font-body)` | `font-sans` | Body, UI, navigation (same face as display) |
| Mono | `var(--font-mono)` | `font-mono` | Code, paths, IDs, timestamps, tool calls |

**Both Geist faces are Apache-2.0** — no licensing constraint. Loaded by default via the `<ThemeProvider>` and the `fontUrls` field of each theme.

---

## Type scale (Vercel-inspired)

Three strict weights — **400 (body) / 500 (UI) / 600 (display)**. Weight 700+ is forbidden. Display tier uses aggressive negative letter-spacing.

| Tailwind class | Token | Size | Weight | Line height | Letter spacing | Use |
|---|---|---|---|---|---|---|
| `text-display-2xl` | `{typography.display-2xl}` | 64 px | 600 | 1.0 | -0.0464em | Hero headline (marketing only) |
| `text-display-xl` | `{typography.display-xl}` | 48 px | 600 | 1.05 | -0.05em | Landing page display |
| `text-display-lg` | `{typography.display-lg}` | 40 px | 600 | 1.1 | -0.05em | Section headline |
| `text-display-md` | `{typography.display-md}` | 32 px | 600 | 1.2 | -0.04em | **Page title** (PageShell default) |
| `text-headline` | `{typography.headline}` | 28 px | 600 | 1.25 | -0.035em | Card cluster heads |
| `text-title-lg` | `{typography.title-lg}` | 24 px | 600 | 1.33 | -0.04em | **Card title** (Card.Header default) |
| `text-title-md` | `{typography.title-md}` | 20 px | 600 | 1.4 | -0.03em | Sub-section title, inline heading |
| `text-body-lg` | `{typography.body-lg}` | 18 px | 400 | 1.56 | -0.01em | Lead paragraph |
| `text-body-md` | `{typography.body-md}` | 14 px | 400 | 1.43 | 0 | **Default body** (paragraphs, list items) |
| `text-body-sm` | `{typography.body-sm}` | 13 px | 400 | 1.46 | 0 | Helper text, captions, secondary metadata |
| `text-label` | `{typography.label}` | 14 px | 500 | 1.43 | 0 | **Button labels**, form labels, nav links |
| `text-label-caps` | `{typography.label-caps}` | 12 px | 500 | 1.33 | 0.04em | **Eyebrows**, section dividers, badge uppercase |
| `text-code-md` | `{typography.code-md}` | 14 px | 400 | 1.5 | 0 | Code blocks, inline `<code>` |
| `text-code-sm` | `{typography.code-sm}` | 13 px | 500 | 1.54 | 0 | Terminal output, tool calls, tight code |

### Critical defaults

- **Page title** → `text-display-md` (32 px). Set by `<PageShell title>` automatically.
- **Card title** → `text-title-lg` (24 px). Set by `<Card.Title>` automatically.
- **Body** → `text-body-md` (14 px). Set on `<body>` by the preset. Don't override per-paragraph unless you specifically want `body-lg` lead.
- **Button label** → `text-label` (14 px / weight 500). Set by `<Button>` automatically.

When you compose pages with theo-ui composites, you rarely need to touch typography tokens — the composites already apply the right scale. Touch the tokens when:

- Writing custom Card content with multiple typographic levels.
- Building marketing surfaces with hero / display tiers.
- Composing dense data tables where you need `text-body-sm` instead of `text-body-md` rows.

---

## Principles

### 1. Three strict weights

The system uses only **400 / 500 / 600**. Never write `font-bold` (700), `font-extrabold` (800), or `font-black` (900). Display ceiling is 600.

Reason: weights 700+ produce a louder visual register than Vercel-style minimalism wants. The calmness comes from the cap.

### 2. Aggressive negative tracking on display

Every `text-display-*` and `text-title-*` token tracks negative (`-0.05em` to `-0.03em`). Reverting to default tracking visibly breaks the brand voice. If a designer hands you a mockup with default tracking on the headline, push back — it's a copy mistake, not a design choice.

### 3. Sentence-case headlines

Page titles, dialog titles, section heads are sentence case. ALL-CAPS is reserved for `text-label-caps` (eyebrows) only. No `text-transform: uppercase` on headlines.

### 4. Mono only for the technical layer

`font-mono` (Geist Mono) is for:

- Code blocks (`<CodeBlock>`)
- Terminal output (`<AgentStream>`, `<BuildLogStream>`)
- Tool calls and tool results (`<ToolCall>`, `<ToolResult>`)
- IDs, file paths, deployment hashes, env var names
- Timestamps that should align (in `<DataTable>` cells)
- Inline `<code>` snippets

Body paragraphs in mono are forbidden. The exception: the `aurora-terminal` theme intentionally sets body in mono — that's the whole point of the theme.

### 5. Tabular numerals on data

`<code>`, `<pre>`, `<kbd>`, `<samp>` get `font-feature-settings: "tnum"` via the preset. Numbers in `<DataTable>` cells should align column-wise — use `font-mono` for numeric columns when columns are stacked.

### 6. Liga enabled

OpenType `liga` is enabled globally. `=>`, `!=`, `>=` render as ligatures in code blocks. This is a Geist Mono feature — don't disable it.

---

## Sizing decisions in JSX

When wrapping custom content in theo-ui's typographic scale:

```tsx
// Page title — handled by PageShell
<PageShell title="Deployments" description="Manage your project deployments.">

// Stand-alone page (no PageShell, rare)
<h1 className="text-display-md text-foreground">Deployments</h1>

// Section head inside Card
<Card.Header>
  <Card.Title>Recent activity</Card.Title>          {/* text-title-lg */}
  <Card.Description>Last 24 hours.</Card.Description> {/* text-body-sm text-muted-foreground */}
</Card.Header>

// Stat tile big number
<StatTile label="Active deployments" value="42" />
{/* Internally: label uses text-label-caps, value uses text-display-md font-mono */}

// Eyebrow above a hero (marketing surface only)
<span className="text-label-caps text-muted-foreground">Introducing</span>
<h1 className="text-display-xl text-foreground">Build with confidence.</h1>

// Inline code in body
<p className="text-body-md text-foreground">
  Set <code className="text-code-md bg-secondary px-1 py-0.5 rounded">VERCEL_URL</code> to your deployment.
</p>
```

---

## Anti-patterns

```tsx
// WRONG — raw Tailwind size class
<h1 className="text-4xl font-bold">

// WRONG — inline font-family
<h1 style={{ fontFamily: 'Geist' }}>

// WRONG — weight 700+
<h1 className="text-display-md font-bold">  // 600 is already baked into text-display-md

// WRONG — mono for body
<p className="font-mono">Welcome to the app.</p>

// WRONG — ALL CAPS for a headline
<h1 className="text-display-md uppercase">DEPLOYMENTS</h1>

// RIGHT — use the token, weight is baked
<h1 className="text-display-md text-foreground">Deployments</h1>

// RIGHT — mono for an ID
<span className="font-mono text-body-sm text-muted-foreground">dep_abc123</span>

// RIGHT — eyebrow above title
<span className="text-label-caps text-muted-foreground">RELEASE NOTES</span>
<h2 className="text-headline text-foreground">November 2026</h2>
```

The slop test in [`slop-test.md`](slop-test.md) catches each as gates **T-09** through **T-12**.
