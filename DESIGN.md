# DESIGN.md — `@usetheo/ui` (Violet Forge)

> Plain-text design system spec for LLM assistants generating UI against `@usetheo/ui`. Companion to [`llms.txt`](./llms.txt) (component catalog) and [`docs/design-system.md`](./docs/design-system.md) (human-facing long-form). Read these three together; this file is the visual layer.
>
> Tokens here are normative — they mirror [`src/styles/tokens.css`](./src/styles/tokens.css) and [`src/themes/violet-forge.ts`](./src/themes/violet-forge.ts). Drift between this file and those is enforced in CI.

---

## 1. Visual Theme & Atmosphere

`@usetheo/ui` ships under the design system codename **Violet Forge** — a Vercel-inspired neutral-grayscale system with a Theo violet primary (`#7C3AED`) and a burnt-sienna accent (`#C96442`). The voice is **engineered, calm, agent-surface-ready**. Surfaces are pure neutrals (zero hue tint); color enters only through `primary`, `accent`, and semantic states (success / warning / destructive / info).

The system targets two adjacent surfaces:

1. **AI agent surfaces** — chat threads, tool calls, agent timelines, streaming responses. These need legible monospace, dense information layouts, and visually quiet chrome.
2. **Cloud dashboards** — deployment lists, environment configs, billing tables, settings panels. These need scannable data tables, predictable form rhythm, and elevation that signals action without shouting.

The default mode is **dark dominant** — `#0A0A0A` canvas with `#F5F5F5` foreground. Light mode is the polarity flip. The brand never mixes light + dark inside the same view; mode is a top-level decision.

**Anti-glass principle** (named guideline): Violet Forge does NOT use backdrop-filter blur, frosted-glass overlays, or chrome-glass effects as decorative depth. Elevation is built from theme-aware ink shadows (derived from `--foreground`) plus a primary-derived glow for signature actions. Reason: glass effects fight legibility on dense dashboards and inflate render cost on long-lived agent surfaces.

**Key characteristics**

- Pure-neutral surfaces (0% saturation on `background`, `card`, `secondary`, `muted`, `border`). All color comes from `primary` / `accent` / semantic tokens.
- Geist Sans + Geist Mono throughout. Three strict weights: 400 body, 500 UI, 600 display.
- 4-px base spacing scale; container caps at 1280 px.
- Theme-aware shadow tokens — they recolor when the theme swaps because they derive from `--foreground` (ink) and `--primary` (glow), not from baked hex.
- Density is a runtime tri-state (`compact` 32 px / `comfortable` 36 px / `spacious` 44 px control height) set on `<ThemeProvider>` or via `useDensity()`.
- 10 built-in themes (Violet Forge default + Classic Paper + Aurora Terminal + 7 RFC-0007 themes). Each is a frozen bundle of the same token slots — swapping themes never changes geometry or typography rules, only color values.

---

## 2. Color Palette & Roles

### 2.1 Light mode

#### Surface

- **Background** (`{colors.background}` — `#FFFFFF`): page canvas. Pure white.
- **Card** (`{colors.card}` — `#FFFFFF`): card / dialog surface. Same as background — depth comes from elevation, not tint.
- **Popover** (`{colors.popover}` — `#FFFFFF`): floating layer (dropdowns, tooltips, hovercards).
- **Secondary** (`{colors.secondary}` — `#F5F5F5`): muted surface for nested cards, code-block backgrounds, hover lifts.
- **Muted** (`{colors.muted}` — `#F5F5F5`): identical to secondary; aliased for semantic clarity.
- **Border** (`{colors.border}` — `#E8E8E8`): hairline dividers, card edges, input borders.
- **Input** (`{colors.input}` — `#E8E8E8`): same as border; aliased for forms.

#### Text

- **Foreground** (`{colors.foreground}` — `#0A0A0A`): every heading and body paragraph.
- **Muted Foreground** (`{colors.muted-foreground}` — `#737373`): secondary text — captions, helper text, inactive nav.
- **Card Foreground** (`{colors.card-foreground}` — `#0A0A0A`): text on card surfaces.

#### Brand

- **Primary** (`{colors.primary}` — `#7C3AED`): Theo violet. Single canonical primary CTA color, focus-ring color, brand accent. Used as fill on primary buttons, badges, active tabs.
- **Primary Deep** (`{colors.primary-deep}` — `#5B21B6`): pressed / active state of primary.
- **Primary Glow** (`{colors.primary-glow}` — `#A78BFA`): hover halo, signature shadow component.
- **Primary Foreground** (`{colors.primary-foreground}` — `#FFFFFF`): text on primary surfaces.

#### Accent

- **Accent** (`{colors.accent}` — `#C96442`): burnt sienna. Celebratory secondary actions, rare-use highlight (success milestones, premium tier badges).
- **Accent Deep** (`{colors.accent-deep}` — `#9C4A2E`): pressed accent.
- **Accent Foreground** (`{colors.accent-foreground}` — `#FFFFFF`): text on accent surfaces.

#### Ring

- **Ring** (`{colors.ring}` — `#7C3AED`): focus ring — matches primary. Always 2 px width with 2 px offset.

#### Semantic

- **Success** (`{colors.success}` — `#16A34A`): positive confirmation, healthy status dots, build-passed badges.
- **Warning** (`{colors.warning}` — `#D97706`): caution, pending state, soft alerts.
- **Destructive** (`{colors.destructive}` — `#DC2626`): irreversible action, error states, danger zone CTAs.
- **Info** (`{colors.info}` — `#3B82F6`): informational callouts, neutral status indicators.

### 2.2 Dark mode (dominant)

#### Surface

- **Background** (`{colors.background}` — `#0A0A0A`): page canvas.
- **Card** (`{colors.card}` — `#121212`): elevated surface — one step lighter than background.
- **Popover** (`{colors.popover}` — `#171717`): floating layer — one step lighter than card.
- **Secondary** (`{colors.secondary}` — `#1C1C1C`): nested cards, code blocks.
- **Muted** (`{colors.muted}` — `#1C1C1C`).
- **Border** (`{colors.border}` — `#292929`): hairline dividers.
- **Input** (`{colors.input}` — `#1C1C1C`).

#### Text

- **Foreground** (`{colors.foreground}` — `#F5F5F5`): every heading and body paragraph.
- **Muted Foreground** (`{colors.muted-foreground}` — `#999999`): Vercel gray-500 — secondary text.

#### Brand, Accent, Semantic (dark mode delta)

`primary` / `primary-deep` / `primary-glow` / `accent` / `accent-deep` keep the same hex values across modes — the brand identity is mode-invariant. Semantics shift toward the brighter end of the hue:

- **Success** — `#22E58C` (was `#16A34A`).
- **Warning** — `#F59E0B` (was `#D97706`).
- **Destructive** — `#FF4F6D` (was `#DC2626`).
- **Info** — `#5FB3FF` (was `#3B82F6`).

### 2.3 Implementation note

All color tokens are stored as HSL triplets (`262 83% 58%`) in CSS custom properties, not hex. This enables alpha modulation via `hsl(var(--primary) / 0.4)` and `color-mix(in oklch, hsl(var(--primary)) 50%, transparent)`. Hex values shown above are the rendered equivalents.

---

## 3. Typography Rules

### 3.1 Font families

- **Display + Body**: `Geist` — Vercel's open-source geometric sans. Loaded from Google Fonts with the full 100–900 weight axis; the design system uses only 400 / 500 / 600.
- **Mono**: `Geist Mono` — paired Vercel face. Code, paths, metrics, timestamps, terminal output, agent tool calls.

Fallbacks: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` (display + body); `ui-monospace, SFMono-Regular, Menlo, monospace` (mono).

### 3.2 Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-2xl}` | 64 px | 600 | 1.0 | -0.0464em | Hero headline (marketing surfaces only). |
| `{typography.display-xl}` | 48 px | 600 | 1.05 | -0.05em | Display headline — landing pages, empty-state heros. |
| `{typography.display-lg}` | 40 px | 600 | 1.1 | -0.05em | Section headline — splash dialogs. |
| `{typography.display-md}` | 32 px | 600 | 1.2 | -0.04em | Page title (PageShell `title` slot). |
| `{typography.headline}` | 28 px | 600 | 1.25 | -0.035em | Card cluster heads, settings section heads. |
| `{typography.title-lg}` | 24 px | 600 | 1.33 | -0.04em | Modal title, card title (`Card.Header`). |
| `{typography.title-md}` | 20 px | 600 | 1.4 | -0.03em | Sub-section title, inline heading. |
| `{typography.body-lg}` | 18 px | 400 | 1.56 | -0.01em | Lead paragraph under section headline. |
| `{typography.body-md}` | 14 px | 400 | 1.43 | 0 | Default body — paragraphs, list items, table cells. |
| `{typography.body-sm}` | 13 px | 400 | 1.46 | 0 | Helper text, captions, secondary metadata. |
| `{typography.label}` | 14 px | 500 | 1.43 | 0 | Button labels, form labels, nav links. |
| `{typography.label-caps}` | 12 px | 500 | 1.33 | 0.04em | Eyebrow caps, section dividers, badge uppercase. |
| `{typography.code-md}` | 14 px | 400 | 1.5 | 0 | Default code blocks, inline `<code>`. |
| `{typography.code-sm}` | 13 px | 500 | 1.54 | 0 | Tight code blocks, terminal output, agent tool calls. |

### 3.3 Principles

- **Three strict weights**. The system uses only 400 / 500 / 600. Weight 700 / 800 is never used; the display ceiling is 600. This produces a calmer visual register than typical SaaS systems that lean on bold display weights.
- **Aggressive negative letter-spacing on display tier**. Every `display-*` and `title-*` token tracks negative (`-0.05em` to `-0.03em`). Reverting to default tracking visibly breaks the brand voice.
- **Sentence-case for headlines**. The system does not use ALL-CAPS headlines outside of `label-caps` (which is reserved for eyebrows). Page titles, section heads, dialog titles are all sentence case.
- **Mono only for the technical layer**. Code, paths, IDs (tenant_id, deployment_id), timestamps, terminal mockups, tool-call output. Body paragraphs never set in mono.
- **Tabular numerals on data cells**. `<code>` / `<pre>` / `<kbd>` / `<samp>` get `font-feature-settings: "tnum"` via the preset. Numbers in DataTable cells align column-wise.

### 3.4 Font substitutes

The two faces (`Geist` and `Geist Mono`) are Apache-2.0-licensed and free for commercial use. No substitute is required for license reasons. If a consumer wants a different brand voice while keeping the design system geometry, swap to:

- **Geometric sans** — *Inter* (400 / 500 / 600) is the closest match. *Satoshi* is a passable second.
- **Mono** — *JetBrains Mono* (400) or *IBM Plex Mono* match the technical voice.

Theme switching covers this — `classic-paper` swaps to Inter, `aurora-terminal` swaps to Geist Mono as body.

---

## 4. Layout Principles

### 4.1 Spacing scale

Base unit **4 px**. Tokens follow Tailwind's geometric scale.

| Token | Value | Use |
|---|---|---|
| `{spacing.1}` | 4 px | Inline gap between icon + label, tightest separation. |
| `{spacing.2}` | 8 px | Default inline gap (button row, badge row, chip row). |
| `{spacing.3}` | 12 px | Form-control internal padding, default `gap-3` row. |
| `{spacing.4}` | 16 px | Section gutter, card content gap. |
| `{spacing.5}` | 20 px | Card padding (`md` size, default density). |
| `{spacing.6}` | 24 px | Card padding (spacious density), section header gap. |
| `{spacing.8}` | 32 px | Section-to-section spacing inside a page. |
| `{spacing.10}` | 40 px | Page header gap below `PageShell.title`. |
| `{spacing.12}` | 48 px | Major section break inside long pages. |
| `{spacing.16}` | 64 px | Hero-band top/bottom padding. |
| `{spacing.20}` | 80 px | Landing-page section padding. |
| `{spacing.24}` | 96 px | Hero-section vertical rhythm. |
| `{spacing.32}` | 128 px | Top-of-page hero stretch. |

### 4.2 Grid & container

- **Max width**: container caps at `1280 px` (the Tailwind `2xl` breakpoint). Content centers with `1 rem` horizontal padding at all sizes.
- **Column patterns** seen across composites:
  - PageShell content area — single column, max 1280 px.
  - DataTable — full-width, with sticky header and horizontal scroll on overflow.
  - Dashboard grids — 1-up (mobile) → 2-up (tablet) → 3-up (desktop) for card clusters.
  - ChatThread / AgentTimeline — single column with internal max-width ~768 px for readability.

### 4.3 Density tri-state (runtime)

| Density | Control height (md tier) | Textarea min-h | Card `md` padding | Body text |
|---|---|---|---|---|
| `compact` | 32 px (`h-8`) | 96 px | 20 px | 14 px |
| `comfortable` *(default)* | **36 px** | 96 px | 20 px | **14 px** |
| `spacious` | 44 px (`h-11`) | 128 px | 24 px | 14 px |

Set globally via `<ThemeProvider defaultDensity="compact">` or runtime via `useDensity()`. Density only affects the `md` size tier — explicit `size="sm"` / `size="lg"` overrides density.

### 4.4 Whitespace philosophy

The system reads as engineered — large outer gaps + tight interior gaps, never the other way around. Section-to-section uses `{spacing.8}`–`{spacing.12}` (32–48 px). Inside a card, the title-to-body gap is `{spacing.2}` (8 px); body-to-CTA gap is `{spacing.4}` (16 px). The page's calm cadence comes from this contrast.

---

## 5. Depth & Elevation

Elevation is a numbered ladder. Theme-aware — every shadow derives from `--foreground` (ink) and `--primary` (glow), so swapping themes recolors them automatically.

| Level | Treatment | Use |
|---|---|---|
| Level 0 — Flat | No shadow, no border. | Full-bleed bands, hero surfaces. |
| Level 1 — Hairline | `1 px` solid `{colors.border}`. | Default card chrome, input borders, table dividers. |
| Level 2 — Subtle (`shadow-sm`) | `0 1px 2px 0 hsl(var(--foreground) / 0.06)`. | Slightly elevated cards (deployment rows, table headers). |
| Level 3 — Medium (`shadow-md`) | `0 2px 8px -2px hsl(var(--foreground) / 0.08), 0 1px 3px hsl(var(--foreground) / 0.06)`. | Floating cards (hover state), popovers, dropdowns. |
| Level 4 — High (`shadow-lg`) | `0 12px 32px -8px hsl(var(--foreground) / 0.12), 0 4px 12px hsl(var(--foreground) / 0.08)`. | Modals, command palettes, drawer surfaces. |
| Level 5 — Glow (`shadow-glow`) | `0 0 24px hsl(var(--primary) / 0.25)`. | Primary button hover state, signature emphasis. |
| Level 6 — Strong glow (`shadow-glow-strong`) | `0 0 32px hsl(var(--primary) / 0.4)`. | Primary button focus + hover combined, "now playing" emphasis. |

### 5.1 Decorative depth (separate from elevation)

- **Dark-mode polarity flip** is the system's chief depth cue between sections. Switching a band from `{colors.background}` to `{colors.card}` (one step lighter in dark mode, identical in light mode) signals a new "depth zone."
- **Primary glow** is the only non-ink decoration. Reserved for the canonical primary CTA hover state. Never apply it to secondary buttons, cards, or surfaces — it's the brand signature.
- **No glass / backdrop-filter**. Violet Forge does not use frosted glass, backdrop blur, or chrome-glass effects. Stated explicitly in `docs/design-system.md > Anti-glass guideline`.

---

## 6. Component Stylings

The library exposes 121 components (92 primitives + 29 composites). The set below is the spec-defining subset — patterns here propagate to the rest.

### 6.1 Buttons

**`<Button variant="primary">`** — canonical Theo CTA.
- Background `{colors.primary}`, text `{colors.primary-foreground}`, label set in `{typography.label}`, padding `{spacing.3}` horizontal, height tracks density (default 36 px), shape `{rounded.lg}` (10 px).
- Hover: adds `{shadow.glow}` (no fill change).
- Active: `bg-primary-deep`, `scale-[0.98]`, removes glow.
- Disabled: `opacity-50`, `pointer-events-none`.

**`<Button variant="secondary">`** — paired secondary action.
- Background `{colors.secondary}`, text `{colors.secondary-foreground}`, `1 px` `{colors.border}` border. Hover: `bg-muted`. Active: `scale-[0.98]`.

**`<Button variant="accent">`** — celebratory / premium action.
- Background `{colors.accent}`, text `{colors.accent-foreground}`. Hover: `bg-accent-deep`. Use sparingly.

**`<Button variant="ghost">`** — minimal action, embedded in dense rows.
- Background `transparent`, text `{colors.foreground}`. Hover: `bg-muted`. Active: `bg-secondary` + `scale-[0.98]`.

**`<Button variant="link">`** — inline text action.
- Background `transparent`, text `{colors.primary}`, `underline-offset-4`. Hover: `text-primary-deep` + underline. Height auto, padding zero.

**`<Button variant="destructive">`** — irreversible action.
- Background `{colors.destructive}`, text `{colors.destructive-foreground}`. Hover: `bg-destructive/90`. Active: `scale-[0.98]`. Used inside `<DangerZone>` composites and `<ConfirmDialog>` destructive flows.

**Sizes**: `sm` (32 px), `md` (36 px default, density-aware), `lg` (48 px), `icon` (square at md height).

### 6.2 Cards & containers

**`<Card>`** — universal container primitive.
- Background `{colors.card}`, text `{colors.card-foreground}`, border `1 px` `{colors.border}`, shape `{rounded.xl}` (14 px), padding `{spacing.5}` (20 px) at `md` size.
- Sub-components: `Card.Header`, `Card.Title` (`{typography.title-lg}`), `Card.Description` (`{typography.body-sm}` + `text-muted-foreground`), `Card.Content`, `Card.Footer`.

**`<Dialog>` (modal surface)**.
- Background `{colors.popover}`, shape `{rounded.xl}`, padding `{spacing.6}` (24 px), elevation Level 4 (`shadow-lg`). Backdrop is `bg-black/80` (no blur — anti-glass principle).

**`<Popover>` / `<DropdownMenu>` / `<Tooltip>`**.
- Background `{colors.popover}`, shape `{rounded.lg}` (10 px), elevation Level 3 (`shadow-md`), border `1 px` `{colors.border}`.

### 6.3 Inputs & forms

**`<Input>` / `<Textarea>` / `<Select.Trigger>`**.
- Background `{colors.input}`, text `{colors.foreground}`, border `1 px` `{colors.border}`, shape `{rounded.md}` (6 px), padding `{spacing.3}` (12 px) horizontal, height tracks density (36 px default).
- Focus: ring `{colors.ring}` (matches primary), `ring-2` `ring-offset-2`.
- Disabled: `opacity-50`, `cursor-not-allowed`.

**`<Checkbox>` / `<Switch>` / `<RadioGroup>`**.
- Effective tap area ≥ 24×24 CSS px (WCAG 2.5.8 AA floor); visual size 16 px, with padding extending the focus zone.
- Checked state: `bg-primary` fill, `border-primary`.

**`<PinInput>`** (Brief #5 — agent verification, OTP).
- 4 / 6 / 8-digit grid. Each slot is a `<Input>` styled `text-center` `{typography.title-md}` with auto-advance on key press.

### 6.4 Data display

**`<DataTable>`** (composite).
- Header row uses `{typography.label-caps}` (12 px, uppercase, weight 500) with `text-muted-foreground`. Header background `{colors.card}`.
- Body cells use `{typography.body-md}` (14 px), padding `{spacing.3}` (12 px) vertical, `{spacing.4}` (16 px) horizontal.
- Row dividers: `1 px` `{colors.border}`.
- Hover row: `bg-secondary`.
- Sticky header on scroll. Selectable rows show a `{colors.primary}` ring on the leftmost cell.

**`<Badge>`**.
- Default variant: `bg-secondary`, `text-secondary-foreground`, `{rounded.md}` (6 px), padding `{spacing.2}` (8 px) horizontal, height auto, `{typography.label-caps}` or `{typography.body-sm}`.
- Variants: `primary` / `accent` / `success` / `warning` / `destructive` / `info` / `outline` — fill follows the semantic color.

**`<StatusDot>` / `<StatTile>` / `<UsageMeter>` / `<Progress>`**.
- Dashboard primitives. Status colors map directly to `success` / `warning` / `destructive` / `info` semantic tokens. Numeric values in `{typography.display-md}` or `{typography.title-md}` with `font-mono` for the digits.

### 6.5 Navigation

**`<PageShell>`** (composite — Brief #5).
- Owns the page header (title + description + optional ActionBar) and the state precedence (loading > error > empty > children). Title uses `{typography.display-md}` (32 px), description uses `{typography.body-sm}` `text-muted-foreground`.
- Reserves `{spacing.10}` (40 px) gap below the header before children.

**`<ActionBar>`** (Brief #5).
- Horizontal flex row: search input (grows `flex-1`), optional filter icon button, optional primary action button right-aligned. Returns `null` when empty. Composes inside `PageShell` or standalone.

**`<DropdownMenu>` / `<CommandPalette>`**.
- Popover surface, elevation Level 3, items use `{typography.body-md}`, padding `{spacing.2}` (8 px) vertical, `{spacing.3}` (12 px) horizontal. Active/highlighted item: `bg-secondary`. Destructive items: `text-destructive`.

### 6.6 Agent surfaces (signature components)

**`<ChatMessage>`** — message bubble with `parts[]` API (text / tool-call / tool-result / file / image).
- Background `{colors.card}`, text `{colors.foreground}`, padding `{spacing.4}` (16 px), shape `{rounded.lg}` (10 px). Role-based variants: `user` (right-aligned, `bg-primary/10`), `assistant` (left-aligned, `bg-card`), `system` (full-width, muted).
- Markdown rendering via the bundled engine. Code blocks use `<CodeBlock>` (mono, syntax highlight).

**`<AgentEvent>` / `<ToolCall>` / `<ToolResult>`**.
- Compact inline-block surfaces inside the chat stream. Background `{colors.secondary}`, text `{colors.foreground}`, shape `{rounded.md}` (6 px), padding `{spacing.3}` (12 px). Mono labels (`{typography.code-sm}`), prose body (`{typography.body-sm}`).

**`<CodeBlock>`**.
- Background `{colors.secondary}` (or `{colors.popover}` in dark mode for slightly deeper register), shape `{rounded.lg}` (10 px), padding `{spacing.4}` (16 px), `{typography.code-md}`. Syntax highlighting via Shiki (optional peer-dep).

**`<AgentTimeline>` / `<AgentStream>`**.
- Vertical list of events with a left-aligned status dot per row. Time stamps use `font-mono` and `text-muted-foreground`.

---

## 7. Responsive Behavior

### 7.1 Breakpoints (Tailwind defaults)

| Name | Width | Key changes |
|---|---|---|
| `sm` | ≥ 640 px | Stacked layouts unstack. Side-by-side button rows resume. |
| `md` | ≥ 768 px | Two-column grids enable. Nav stays horizontal. |
| `lg` | ≥ 1024 px | Three-column grids enable. PageShell + sidebar layout common. |
| `xl` | ≥ 1280 px | Container caps here. Full dashboard layouts. |
| `2xl` | ≥ 1536 px | Content stays centered at 1280 px. Bands stretch edge-to-edge in color. |

### 7.2 Touch targets (WCAG 2.5.8 AA)

The system targets **WCAG 2.5.8 Level AA** — minimum 24×24 CSS px effective tap area. The default `comfortable` density (36 px control height) comfortably exceeds this. Compact mode (32 px) still meets AA because the 2 px focus ring on each side expands the focusable area to ~36×36 effective.

The system does **not** target 2.5.5 Level AAA (44 px) at `comfortable`. Consumers requiring AAA can opt into `spacious` mode globally or use `size="lg"` per call site.

### 7.3 Collapsing strategy per signature composite

- **`<PageShell>`** — title stays `{typography.display-md}` across all breakpoints. `<ActionBar>` collapses from horizontal flex to stacked at `<sm`. Search input always grows `flex-1`.
- **`<ChatThread>`** — internal max-width 768 px. Below `sm`, padding tightens from `{spacing.4}` to `{spacing.3}`.
- **`<DataTable>`** — sticky header preserved. Below `md`, low-priority columns hide (consumer specifies via column `hideBelow` prop) and remaining columns enable horizontal scroll.
- **`<DropdownMenu>` / `<CommandPalette>`** — full-screen drawer below `sm`, floating popover at `≥ sm`.
- **`<Dialog>`** — full-screen below `sm`, centered modal `≥ sm`. Max-width ~600 px at `lg`.

### 7.4 Reduced motion

The token layer respects `prefers-reduced-motion: reduce` — all `transition-*` durations neutralize, scale transforms remove, `shadow-glow` becomes a static border. Consumers don't opt in; it's automatic.

---

## 8. Do's and Don'ts

### Do

- **Reserve `{colors.primary}` for the canonical Theo CTA.** Primary buttons, focus rings, active tab indicators, brand accents. Never for body text, never for body backgrounds.
- **Use the density tri-state as a global preference**, not as a per-component override. Set `<ThemeProvider defaultDensity="compact">` once and let the system propagate.
- **Compose composites from primitives via the barrel**, not by re-implementing layout primitives. A new dashboard page is `<PageShell>` + `<ActionBar>` + `<DataTable>`, not custom flex/grid.
- **Set every code surface and technical label in `{typography.code-*}` (Geist Mono).** Tool calls, file paths, IDs, timestamps, terminal output.
- **Pair Do's and Don'ts when adding a new component spec.** Each component should declare its allowed states and its forbidden states.
- **Layer theme-aware shadows over hardcoded ones.** Use `{shadow.sm/md/lg/glow}` tokens; never write `0 4px 12px rgba(0,0,0,0.1)` inline.
- **Use sentence-case for headlines.** Page titles, dialog titles, card titles. ALL-CAPS is reserved for `label-caps` eyebrows only.

### Don't

- **Don't introduce a sixth surface tint.** The system operates on background / card / popover / secondary / muted — five neutrals. New tints flatten the elevation language.
- **Don't promote Geist to weight 700.** The display ceiling is 600. The calm visual register depends on this.
- **Don't use `backdrop-filter: blur(…)` or glass effects.** Anti-glass principle is named in `docs/design-system.md > Principles`. Elevation is built from ink shadows + glow, never from blur.
- **Don't render body paragraphs in `{font.mono}`.** Mono is for the technical layer only.
- **Don't apply `{shadow.glow}` to secondary buttons, cards, or surfaces.** The glow is the primary CTA signature; spreading it dilutes the brand.
- **Don't use emojis in component labels, button text, error messages, or markdown content authored by the system.** Consumers' user content may contain emojis (chat messages, names) — that's user data, not authored UI.
- **Don't reference external brand names (Vercel, Linear, etc.) as if endorsed.** When citing inspiration in docs or theme descriptions, prefix with "Inspired by, not affiliated with" — see `seven-themes-edge-cases-2026-05-22.md` for the trademark rule.
- **Don't pair the `comfortable` density on one screen with `spacious` controls on another.** Density is a global choice — pick one tier and stay consistent within a surface.

---

## 9. Agent Prompt Guide

Quick fragments for LLM assistants generating UI against `@usetheo/ui`. Drop into a prompt verbatim.

### 9.1 Quick token reference

```
PRIMARY        var(--primary)         hsl(262 83% 58%)   #7C3AED   Theo violet
ACCENT         var(--accent)          hsl(15 54% 53%)    #C96442   Burnt sienna
FOREGROUND     var(--foreground)      hsl(0 0% 4%)       #0A0A0A   Ink (light) / inverted in dark
BACKGROUND     var(--background)      hsl(0 0% 100%)     #FFFFFF   Canvas
MUTED-FG       var(--muted-foreground) hsl(0 0% 45%)     #737373   Secondary text
BORDER         var(--border)          hsl(0 0% 91%)      #E8E8E8   Hairline
SUCCESS        var(--success)         hsl(142 71% 36%)   #16A34A
WARNING        var(--warning)         hsl(33 92% 44%)    #D97706
DESTRUCTIVE    var(--destructive)     hsl(0 72% 51%)     #DC2626
INFO           var(--info)            hsl(217 91% 60%)   #3B82F6

FONT-DISPLAY   Geist (weights 400/500/600)
FONT-BODY      Geist (weights 400/500/600)
FONT-MONO      Geist Mono (weights 400/500/600)

SPACING        4 px base — space-1 (4) … space-32 (128). Default control height 36 px.
RADIUS         sm 4 / md 6 / lg 10 / xl 14 / 2xl 20 / full 9999
```

### 9.2 Prompt: build a dashboard list page

> Build a [DOMAIN] list page using `@usetheo/ui`. Compose `<PageShell title="…" description="…">` with an `<ActionBar>` (search input + primary action button). Inside, render `<DataTable>` with sticky header. Use `{typography.display-md}` for the title via PageShell's built-in. Status indicators use `<StatusDot variant="success|warning|destructive|info">`. Row actions use `<DropdownMenu>` with `variant="ghost"` trigger. No emojis, no inline hex — only token references. Match the `comfortable` density default.

### 9.3 Prompt: build a settings panel

> Build a settings page using `@usetheo/ui`. Wrap content in `<PageShell title="Settings" description="…">`. Inside, stack `<Card>` sections per setting group. Each Card has `Card.Header` (title `{typography.title-lg}` + description `{typography.body-sm} text-muted-foreground`), `Card.Content` with form fields (`<Input>`, `<Switch>`, `<Select>`), and `Card.Footer` with a `<Button variant="primary">` save action. Destructive actions go in a final `<DangerZone>` composite. Spacing between Cards is `{spacing.6}` (24 px).

### 9.4 Prompt: build an agent chat surface

> Build a chat surface using `@usetheo/ui`. Wrap in a flex column with internal max-width 768 px. Render messages via `<ChatMessage role="user|assistant|system" parts={…}>`. Tool calls and tool results inside `parts[]` render as `<ToolCall>` / `<ToolResult>` blocks (mono labels via `{typography.code-sm}`, prose via `{typography.body-sm}`). Use `<AgentEvent>` for non-message stream events. Composer at the bottom uses `<ChatComposer>` (a composite with `<Textarea>` + send button). No emojis. Streaming state uses `<AgentStreaming>`.

### 9.5 Prompt: build a billing / pricing surface

> Build a pricing/billing page using `@usetheo/ui`. Wrap in `<PageShell title="Billing" description="…">`. Pricing tiers render as a 3-up grid of `<Card>` (tablet 2-up, mobile 1-up). Featured tier uses `<PlanBadge variant="primary">` and an outline on the Card (`border-primary`). Tier name in `{typography.title-lg}`, price in `{typography.display-xl}` with `font-mono` for digits, feature list in `{typography.body-md}` rows with a `<Check>` icon. CTA at the bottom: `<Button variant="primary" size="lg">` for the featured tier, `<Button variant="secondary" size="lg">` for the rest. Usage meters use `<UsageMeter>` and `<CostMeter>`.

### 9.6 Prompt: use the design system tokens

> All styling must use `@usetheo/ui` tokens. Colors via Tailwind preset classes (`bg-primary`, `text-foreground`, `border-border`) or CSS vars (`hsl(var(--primary))`). Typography via preset (`text-display-md`, `text-body-md`, `text-label-caps`) — never raw `text-4xl`. Spacing via Tailwind utilities (`gap-4`, `p-5`) which map to the 4-px base. Radii via `rounded-lg` / `rounded-xl` / `rounded-md` mapped to system tokens. Never inline hex, never inline pixel values for spacing — always tokens. The `@usetheo/ui` Tailwind preset must be installed via `presets: [theoUiPreset]` in `tailwind.config.{ts,js}`.

### 9.7 Component subpath import map (post-Brief-4 tree-shaking)

For Tailwind v4 / Vite projects, prefer subpath imports — they tree-shake per-component:

```ts
import { Button } from "@usetheo/ui/button";
import { Card } from "@usetheo/ui/card";
import { Input } from "@usetheo/ui/input";
import { DataTable } from "@usetheo/ui/data-table";
import { PageShell } from "@usetheo/ui/page-shell";
import { ActionBar } from "@usetheo/ui/action-bar";
import { ChatMessage } from "@usetheo/ui/chat-message";
```

Barrel imports (`import { Button } from "@usetheo/ui"`) work but ship the full barrel — acceptable for prototyping, not for production bundles.

---

## See also

- [`README.md`](./README.md) — package overview + install instructions
- [`llms.txt`](./llms.txt) — component catalog + anti-patterns + import recipes
- [`docs/design-system.md`](./docs/design-system.md) — long-form spec with ADR links
- [`CLAUDE.md`](./CLAUDE.md) — locked names, voice rules, quality gates
- [`CHANGELOG.md`](./CHANGELOG.md) — version history

---

**End of DESIGN.md** — Violet Forge, `@usetheo/ui` 0.11.0-next.0
