# DESIGN.md Convention — Deep Reference

> Plain-text design system spec read by AI agents to generate consistent UI. Distinct from `AGENTS.md` / `CLAUDE.md` / `llms.txt` — those describe **agent behavior**; `DESIGN.md` describes **visual language**.
>
> Source corpus: [`VoltAgent/awesome-design-md`](https://github.com/VoltAgent/awesome-design-md) — 73 real-world DESIGN.md files extracted from production marketing sites (Vercel, Linear, Stripe, ClickHouse, Claude, Notion, Figma, Apple, BMW, Tesla, …).
>
> Date: 2026-05-25 · Investigated by: Claude · Target consumer: `@theokit/ui` (Violet Forge, 121 components, Geist + Tailwind v4)

---

## 1. Context

### Problem the convention solves

Anyone who uses an LLM for frontend code has the same complaint: generate the same page twice and get two different visual languages. 8 px spacing one run, 16 px the next. Rounded corners one chat, sharp the next. The root cause isn't model temperature — it's the absence of an **authoritative design reference the model can read on every turn**.

CSS files tell the model *how to implement*. They don't tell it *why this radius* or *when to use which surface*. DESIGN.md fills that gap with a structured, prose-first spec that an LLM consumes as plain text and can quote verbatim into the code it generates.

### Who already does this

| Producer | What |
|---|---|
| **Stitch** (original Google research project, 2024) | First public DESIGN.md template — 9 sections, popularized the prose-spec-for-LLMs idea |
| **ClickHouse** | Canonical real-world example cited by the HagiCode write-up |
| **VoltAgent/awesome-design-md** | Curates 73 DESIGN.md files extracted from real marketing sites |
| **HagiCode** | Built a design gallery site on top of `awesome-design-md` as a git submodule, published the workflow |

### Where this doc lands

Target project: `@theokit/ui` — already has:
- 121 components (92 primitives + 29 composites) under `src/components/`
- 10 themes (Violet Forge default + Classic Paper + Aurora Terminal + 7 RFC-0007 themes)
- Vercel-style design system docs at `docs/design-system.md`
- Token source of truth at `src/styles/tokens.css`

A DESIGN.md at the **repo root** would let any LLM that lands in the workspace (Claude, Codex, Cursor, Windsurf, Aider, Continue, etc.) consume the visual spec without parsing the full docs tree. It complements — does not replace — `docs/design-system.md` (which is human-facing and links into ADRs and component pages).

---

## 2. Canonical 9-section structure

Per `awesome-design-md` README, every DESIGN.md follows the **"Stitch DESIGN.md format with extended sections"** — nine canonical sections in this order:

| # | Section | What goes in it | Source quote |
|---|---|---|---|
| 1 | **Visual Theme & Atmosphere** | Mood, density, philosophy. The "voice" before any token. | "Captures mood, density, and design philosophy" |
| 2 | **Color Palette & Roles** | Brand / Surface / Text / Semantic / Gradient buckets. Hex + role + example use. | "Documents semantic names, hex values, and functional purposes" |
| 3 | **Typography Rules** | Font family + weight ceiling + size/weight/line-height/tracking table. | "Details font families and complete type hierarchies" |
| 4 | **Component Stylings** | Buttons, cards, inputs, navigation — with hover/active/disabled states. | "Defines buttons, cards, inputs, navigation including various states" |
| 5 | **Layout Principles** | Spacing scale (base unit + token names), grid/container max-width, whitespace philosophy. | "Specifies spacing scales, grid systems, whitespace approaches" |
| 6 | **Depth & Elevation** | Shadow ladder + decorative depth strategy. | "Outlines shadow systems and surface hierarchies" |
| 7 | **Do's and Don'ts** | Enforceable guardrails. Each item starts with "Do" / "Don't" verb. | "Establishes design guardrails and anti-patterns" |
| 8 | **Responsive Behavior** | Breakpoints, touch targets, collapsing strategy per layout block. | "Details breakpoints, touch targets, and responsive strategies" |
| 9 | **Agent Prompt Guide** | Quick color references + ready-to-use prompt snippets. | "Provides quick color references and ready-to-use prompts" |

### What real DESIGN.md files actually do (Vercel as canonical example)

Vercel — the closest-fit reference for Violet Forge (same Geist fonts, same Vercel-style neutral grayscale, same negative-letter-spacing display typography) — uses a slight reordering and merges Responsive Behavior **into** Layout. Its actual top-level sections are:

1. **Overview** (= Visual Theme & Atmosphere + Key Characteristics bullet list)
2. **Colors** (Brand & Accent / Surface / Text / Semantic / Brand Gradient sub-sections)
3. **Typography** (Font Family / Hierarchy table / Principles / Note on Font Substitutes)
4. **Layout** (Spacing System / Grid & Container / Whitespace Philosophy / Responsive Strategy)
5. **Elevation & Depth** (level table + Decorative Depth notes)
6. **Shapes** (Border Radius Scale / Photography Geometry)
7. **Components** (Buttons / Cards & Containers / Inputs & Forms / Navigation / Signature Components / Examples)
8. **Do's and Don'ts** (Do bulleted list / Don't bulleted list)

**Observation:** real DESIGN.md files **don't dogmatically follow** the 9-section order. Vercel merges Responsive into Layout, has no separate Agent Prompt Guide, and adds a "Shapes" section that the README doesn't mention. Linear and Claude similarly diverge in micro-structure.

**Implication for theo-ui:** follow the 9-section *intent* but adopt Vercel's *practical ordering* (Layout absorbs Responsive). This matches how engineers will read it.

---

## 3. Convergent patterns across the corpus

Patterns that appear in **3+ real DESIGN.md files** (Vercel, Claude, ClickHouse, Stripe at minimum) — these are the load-bearing conventions, not folklore.

### 3.1 Token-name syntax: `{colors.x}` / `{spacing.y}` / `{typography.z}`

Vercel uses `{colors.primary}`, `{colors.canvas-soft}`, `{spacing.lg}`, `{rounded.pill}`, `{typography.display-xl}`. The braces serve two purposes:

1. **Visually distinct from prose** — humans scanning skim past them; LLMs treat them as referable identifiers.
2. **Maps cleanly to CSS variables or design tokens** in any framework (Tailwind class, CSS var, Style Dictionary output).

Don't invent a new namespace per project. Reuse Vercel's: `colors.*`, `typography.*`, `spacing.*`, `rounded.*`. If a project has additional dimensions (e.g., motion), extend with `motion.*`, `elevation.*`.

### 3.2 Hex + token reference together

Every color line has the form:

```
- **Ink** (`{colors.primary}` — `#171717`): The single primary CTA color. …
```

LLMs can pick either form. Designers reading the doc see hex. The dual notation is the convention — never just hex, never just token.

### 3.3 Typography table with size/weight/line-height/tracking columns

Every DESIGN.md surveyed has a typography table with exactly these columns (Vercel's column order is the de facto standard):

```
| Token | Size | Weight | Line Height | Letter Spacing | Use |
```

Vercel adds an explicit "Use" column with a concrete example ("Hero headline (\"Build and deploy on the AI Cloud.\")."). That example is what makes the table actionable — without it, the model has to invent context.

### 3.4 "Note on Font Substitutes" subsection

Vercel, Claude, and Stripe all include a paragraph naming open-source substitutes for proprietary faces:

> The two primary faces are proprietary (custom-cut for the brand). Open-source substitutes:
> - **Geometric sans** — *Inter* (400 / 500 / 600) is the closest stylistic match…

This matters because most consumer projects can't license the original face. LLMs reading the spec need to know what to substitute when generating example code.

### 3.5 Elevation as a LADDER (Level 0 → Level N), not a list

Vercel's elevation table:

| Level | Treatment | Use |
|---|---|---|
| Level 0 — Flat | No shadow, no border. | Full-bleed hero bands. |
| Level 1 — Inset Hairline | `0 0 0 1px #00000014` inset. | Default card chrome. |
| … | … | … |

Linear / Stripe / Apple use the same pattern. Numbered levels (0, 1, 2, …) give the LLM a **graduated** scale — it knows "elevation 3" means "more than 2, less than 4," which is more directional than discrete shadow tokens.

### 3.6 Components specified with a **token-reference shorthand**, not full CSS

Vercel's button spec:

> **`button-primary`** — the canonical 100-px-radius black pill, marketing scale.
> - Background `{colors.primary}`, text `{colors.on-primary}`, label set in `{typography.button-lg}`, padding `0px {spacing.sm}` 12 px, shape `{rounded.pill}` 100 px. Renders ~48 px tall when paired with the marketing flex layout.

Notice: no `box-shadow: …`, no `display: flex`, no media queries. The component is specified as **a composition of tokens defined elsewhere**. This forces internal consistency and makes the doc framework-agnostic (works for React, Vue, Swift, Flutter, plain HTML).

### 3.7 Do's and Don'ts always paired, always declarative

Every Do/Don't is a complete sentence that starts with the verb. No "Avoid…", no "Try not to…". The model needs unambiguous polarity:

> **Do**:
> - Reserve `{colors.primary}` for primary CTAs across the page. Black ink IS the conversion target.
>
> **Don't**:
> - Don't introduce a sixth accent colour. The brand operates with ink + gray + the four-pair gradient palette; new accents flatten the voice.

### 3.8 "Atmospheric" or "decorative" claim distinct from "elevation"

Vercel separates Level-N elevation (cards, modals) from **decorative depth** (the brand gradient backdrop, polarity-flipped dark bands). Claude separates surface elevation from the editorial cream-canvas alternation. This split exists because LLMs over-apply shadows when prompted with "make it elevated" — explicit decorative-vs-elevation taxonomy prevents that.

---

## 4. Divergent patterns (where corpus disagrees)

Things that vary by project — flag these as choices the author makes per project, not universal rules.

| Dimension | Vercel | Claude | ClickHouse | Stripe |
|---|---|---|---|---|
| Section count | 8 | 8 | 6 (compact) | 8 |
| Has "Agent Prompt Guide"? | No | No | No | No |
| Has dedicated "Shapes"? | Yes | No | No | No |
| Has gradient palette? | Yes (3 pairs + mesh) | No | No | Yes (5-stop mesh) |
| Display weight ceiling | 600 | 400 (serif) | 700 | 300 (Sohne) |
| Tap target spec? | Section in Responsive | Implicit | None | Implicit |
| Touch target floor cited | 44×44 px | None | None | None |
| Inline example sentences | Heavy use ("Build and deploy…") | Medium | Light | Heavy |

**Reading**: the 9-section template is **aspirational**, not enforced. ~70% of real files have only 6–8 sections and merge Responsive into Layout. The "Agent Prompt Guide" section from the README is **rare** in the corpus — Vercel, Claude, ClickHouse, Stripe all skip it. This is a gap worth filling for theo-ui (LLMs benefit from a copy-pasteable prompt fragment).

---

## 5. Anti-patterns observed in the corpus

Practical mistakes that show up when comparing weaker DESIGN.md files (some entries in `awesome-design-md` are noticeably thinner than Vercel/Claude):

1. **No "Use" column on the typography table.** Reader has to guess where `body-md` applies. Always include an example.
2. **Hex without token reference (or vice versa).** Forces the reader to mentally map. Always pair them.
3. **Don't-only or Do-only lists.** The pair forces the author to articulate the rule from both polarities. A Do without a paired Don't is usually a vague aspiration.
4. **Components specified with full CSS blocks.** Locks the spec to one framework, defeats the purpose of a prose token reference. Use the token-reference shorthand pattern from §3.6.
5. **Missing dark mode.** If the design system has a dark variant in code, the DESIGN.md must include it (table or duplicated palette block). Otherwise the LLM generates light-only UI.
6. **No quantified spacing/density.** "Generous whitespace" is folklore. "Sections use `{spacing.4xl}` (64 px) top/bottom padding" is actionable.
7. **Brand-name slugs without disclaimer.** Calling a theme `vercel` in a public design system can trigger trademark issues (theo-ui learned this in `seven-themes-edge-cases-2026-05-22.md` — slugs are now `vercel-mono`, `linear-glass`, etc.). DESIGN.md inherits the same risk if it references external brands as authority.

---

## 6. Implementation guide for `@theokit/ui`

This section is the actionable output. Everything above is reference; this is what to **write into `DESIGN.md` at the repo root**.

### 6.1 File location and dual-readership

- **Path**: `/home/paulo/Projetos/usetheo/theo-ui/DESIGN.md` (repo root, next to `README.md`, `CLAUDE.md`, `llms.txt`)
- **Primary reader**: LLM assistants (Claude, Codex, Cursor, Windsurf) consuming the file when generating React components against theo-ui
- **Secondary reader**: a designer or engineer who lands in the repo and wants the visual spec in 200 lines instead of reading the full `docs/design-system.md`
- **Tertiary reader**: external consumers via the npm package — DESIGN.md should be in `package.json` `files` so it ships alongside `llms.txt`

### 6.2 Sections to include (theo-ui specific, 9-section spec adapted to Vercel's practical ordering)

| # | Section | Theo-UI content sourced from |
|---|---|---|
| 1 | **Visual Theme & Atmosphere** | `docs/design-system.md` "Identity" + the locked narrative in `CLAUDE.md` (Violet Forge, Vercel-style neutrals, Geist throughout). Mood: "engineered, calm, agent-surface-ready, screaming-architecture honest." |
| 2 | **Color Palette & Roles** | `src/styles/tokens.css` and `src/themes/violet-forge.ts`. Both light + dark palettes. Token names match `--token-name` from CSS. Hex inline. |
| 3 | **Typography Rules** | `docs/design-system.md > Type scale (Vercel-inspired)`. Geist Sans + Geist Mono. Three strict weights (400 / 500 / 600). Display tier uses aggressive negative letter-spacing. |
| 4 | **Layout Principles** | `docs/design-system.md > Spacing scale` + `Density policy`. 4-px base, `--space-1` … `--space-32`. Density tri-state (compact / comfortable / spacious). |
| 5 | **Depth & Elevation** | `docs/design-system.md > Elevation`. 3-level shadow ladder + 2-level glow ladder. Theme-aware (derives from `--foreground` + `--primary`). |
| 6 | **Component Stylings** | Top ~15 representative components — Button, Card, Input, Dialog, Badge, Alert, DataTable, PageShell, ActionBar, DropdownMenu, ChatMessage, AgentEvent, ToolCall, ToolResult, CodeBlock. Token-reference shorthand per §3.6. |
| 7 | **Responsive Behavior** | Breakpoints from Tailwind preset (sm/md/lg/xl/2xl). Tap-target policy from `docs/design-system.md > Tap target policy` — WCAG 2.5.8 AA, 24×24 floor, density tiers. Collapsing strategy per signature composite (PageShell, ChatThread, DataTable). |
| 8 | **Do's and Don'ts** | Sourced from `docs/design-system.md > Principles` (Anti-glass guideline, calm restraint, no chrome glass) + locked CLAUDE.md rules (no emojis, Apache-2.0 only deps). |
| 9 | **Agent Prompt Guide** | Original — Vercel/Claude don't have this. Copy-pasteable prompt fragments for: "build a settings panel", "build a chat surface", "build a dashboard list page", "use the design system tokens via `@theokit/ui`". |

### 6.3 Tone and voice

Match `llms.txt` voice — declarative, present tense, no marketing fluff. Avoid the editorial flourishes from Vercel ("a deployment dashboard's marketing surface, written for engineers who already know the syntax") because theo-ui is a component library, not a marketing site. Closer to ClickHouse's economy.

### 6.4 What to leave OUT

- **Implementation snippets** (full JSX with imports). DESIGN.md is the spec; runnable examples live in Ladle stories.
- **API signatures** (props of `<Button>`). That's `llms.txt` and the per-component pages on docs.usetheo.dev.
- **Architecture / build / quality-gate content**. That's `CLAUDE.md` and `docs/architecture.md`.
- **Theme-by-theme breakdown of all 10 themes**. DESIGN.md describes Violet Forge as the default. Other themes inherit the token roles; their palettes live in `src/themes/*.ts`.
- **Emojis** (locked in CLAUDE.md).

### 6.5 Maintenance contract

Add to `scripts/validate-quality-gates.ts`:

- Drift check between `DESIGN.md` palette block and `src/styles/tokens.css` — same regex pattern already used for `docs/design-system.md` (the `validateDocsTypography` check).
- File presence check (`DESIGN.md` must exist at repo root).

Add to `package.json > files`:

```json
"files": ["dist", "src", "registry", "README.md", "CHANGELOG.md", "llms.txt", "DESIGN.md"]
```

So consumers of the npm package see the spec via `node_modules/@theokit/ui/DESIGN.md`.

### 6.6 ADR draft

```
# ADR — DESIGN.md as a first-class artifact

## Context
LLM-assisted frontend dev produces inconsistent UI across runs unless the
visual language is captured in a structured prose spec the model can
consume on every turn. `docs/design-system.md` is human-facing and 400+
lines; LLMs benefit from a 200-300 line summary at the repo root.

## Decision
Add `DESIGN.md` at repo root following the awesome-design-md 9-section
spec (adapted to Vercel's practical 8-section ordering). Ship via
`package.json > files`. Enforce drift against `tokens.css` in
`validate-quality-gates.ts`.

## Consequences
Positive — LLM-generated code converges on Violet Forge tokens
consistently; external consumers get the spec without parsing docs.
Negative — third drift-check surface to maintain (tokens.css ↔
design-system.md ↔ DESIGN.md). Mitigation: tooling.
```

### 6.7 Drafting checklist

When writing DESIGN.md for theo-ui, verify each line satisfies:

- [ ] Every color line has `**Name** (`{colors.x}` — `#HEX`): purpose.`
- [ ] Typography table has Token / Size / Weight / Line Height / Letter Spacing / Use columns
- [ ] Every component spec uses `{token}` references, not CSS blocks
- [ ] Elevation rendered as a numbered ladder
- [ ] Do's and Don'ts each contain ≥5 items, declarative verb start
- [ ] Both light and dark palettes present
- [ ] No emojis
- [ ] No external brand names without disclaimer (mention "Vercel-inspired" not "Vercel design")
- [ ] Section count: 8 or 9 (matching Vercel/Claude pattern is acceptable; 9 is aspirational)
- [ ] File length: 300–500 lines (Vercel's is ~380, Claude's ~280)

---

## 7. Cross-corpus statistics (for reference)

From the four DESIGN.md files inspected in detail (Vercel, Claude, ClickHouse, Stripe):

| Metric | Vercel | Claude | ClickHouse | Stripe |
|---|---|---|---|---|
| Approx line count | 380 | 280 | 220 | 320 |
| Distinct colors named | 22 | 9 | 3 | 18 |
| Component specs | 18 | 12 | 8 | 14 |
| Do / Don't items | 7 / 7 | 5 / 5 | 4 / 4 | 6 / 6 |
| Has dark mode block | Implicit (polarity-flipped band) | Explicit | Implicit | No |
| Mentions WCAG | Yes (AAA on CTAs) | No | No | No |

**Implication for theo-ui**: aim for ~350 lines, ~15 components, 7/7 Do's/Don'ts, **explicit** dark mode block (theo-ui's dark mode is dominant, not an afterthought), explicit WCAG 2.5.8 AA mention (already a locked rule in `docs/design-system.md > Tap target policy`).

---

## 8. References

- [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) — corpus of 73 DESIGN.md files
- [HagiCode write-up](https://hagi.code/) — original publication of the workflow (article dated 2025)
- [Vercel DESIGN.md (raw)](https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/vercel/DESIGN.md) — canonical reference for Geist-based design systems
- [Claude DESIGN.md (raw)](https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/claude/DESIGN.md) — editorial cream-canvas pattern
- Internal: [`docs/design-system.md`](../../../docs/design-system.md) — theo-ui's authoritative human-readable spec
- Internal: [`src/styles/tokens.css`](../../../src/styles/tokens.css) — token source of truth
- Internal: [`src/themes/violet-forge.ts`](../../../src/themes/violet-forge.ts) — default theme

---

## 9. Note on what this doc is NOT

This is a **reference doc** — material for the author writing the actual `DESIGN.md`. It is not a draft of the DESIGN.md itself. The actual DESIGN.md lives at the repo root and follows the implementation guide in §6.

It is also not a substitute for `docs/design-system.md` — that document is the long-form, ADR-linked, source-of-truth for humans. `DESIGN.md` (the file we're guiding the creation of) is the concise spec for LLMs and for engineers who want a 5-minute orientation.
