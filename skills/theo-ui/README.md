# theo-ui — design skill for `@theokit/ui`

**A library-aware design skill for AI coding assistants (Claude Code, Cursor, Codex) that uses `@theokit/ui` correctly.**

Not a generic visual skill. Picks from 121 existing components, respects the Violet Forge token system, and refuses to hand-roll what the library already ships.

The differentiator: this skill insists on **library discipline**, not just visual discipline. An LLM that doesn't know `@theokit/ui` will hand-roll a `<div className="bg-purple-600 hover:bg-purple-700 rounded-lg px-4 py-2">` button when `<Button variant="primary">` exists. This skill catches that.

Powered by `@theokit/ui` — Apache-2.0, 121 components, Vercel-style Violet Forge.

---

## Four verbs

| Verb | What it does |
| --- | --- |
| *(default)* | Build new UI with `@theokit/ui`. Picks the right composite for the surface, applies the rule-set, runs the slop test before handing back. |
| `theo-ui audit <target>` | Score existing code against the anti-patterns + slop-test gates. Punch list, no edits. |
| `theo-ui migrate <target>` | Convert hand-rolled UI to its `@theokit/ui` equivalent. Replaces `<button>` with `<Button>`, `<table>` with `<DataTable>`, hand-rolled modals with `<Dialog>`, etc. |
| `theo-ui catalog <need>` | Search the 121 components for a fit. Names the matches, emits import + usage example. |

---

## What the skill knows

- **121 components** (92 primitives + 29 composites) cataloged with surface fit, anti-patterns, and 8-state coverage.
- **10 built-in themes** (Violet Forge default + Classic Paper + Aurora Terminal + 7 RFC-0007 themes) plus the `defineTheme()` API.
- **5 surfaces** with vocabulary + composition recipes: `agent-chat`, `cloud-dashboard`, `settings-form`, `marketing`, `auth`.
- **12 page archetypes** (P1–P12) — ListPage, DetailPage, ChatSurface, BillingPage, OTPVerifyPage, etc.
- **32-gate slop test** + surface-specific extensions.
- **Pre-emit self-critique** on 6 axes (L/T/C/A/R/V scored 1–5).
- **Project memory** at `.theo-ui-skill/log.json` (last 20 builds tracked).

---

## How it works

1. **Pre-flight scan** — reads `package.json`, `tailwind.config`, `<ThemeProvider>` mount. Surfaces `@theokit/ui` version, theme, density, import style.
2. **Design-context gate** — asks for Surface / Use case / Density (or accepts `"go ahead"` and infers).
3. **Archetype pick** — chooses one of 12 page archetypes from `composition-cookbook.md`.
4. **Build** — emits stamped JSX file(s) using composites first, primitives second, tokens always.
5. **Slop test** — verifies 32 gates pass. If any fail, fix and re-emit.
6. **Append to project memory** — `.theo-ui-skill/log.json` records the build for future runs.

The skill respects file safety:

- Never deletes files unless explicitly authorized.
- Never edits files outside the migration plan.
- Treats `DESIGN.md` at the project root as the locked design system (overrides theme rotation).
- Refuses to invent metrics, testimonials, or customer logos.
- Refuses to pixel-clone competitor designs (offers structural rebuild instead).

---

## Install

### One command (recommended)

```bash
npx skills add usetheodev/theo-ui
```

That's it. The [`vercel-labs/skills`](https://github.com/vercel-labs/skills) CLI auto-detects this skill at `skills/theo-ui/` inside the [`usetheodev/theo-ui`](https://github.com/usetheodev/theo-ui) repo and installs it into your AI assistant.

#### Choose your AI assistant explicitly

```bash
# Claude Code
npx skills add usetheodev/theo-ui -a claude-code

# Cursor
npx skills add usetheodev/theo-ui -a cursor

# Codex
npx skills add usetheodev/theo-ui -a codex

# All supported assistants
npx skills add usetheodev/theo-ui -a '*'
```

#### Install globally (for all your projects)

```bash
npx skills add usetheodev/theo-ui -g
```

#### Non-interactive (CI / dotfiles)

```bash
npx skills add usetheodev/theo-ui -y
```

#### Update

```bash
npx skills update theo-ui
```

#### Remove

```bash
npx skills remove theo-ui
```

### Manual install

If you don't want the CLI, copy the files directly:

```bash
# Claude Code (user-level)
git clone https://github.com/usetheodev/theo-ui.git /tmp/theo-ui
cp -r /tmp/theo-ui/skills/theo-ui ~/.claude/skills/theo-ui

# Cursor
cp /tmp/theo-ui/skills/theo-ui/SKILL.md .cursor/rules/theo-ui.mdc
# (Strip the YAML frontmatter from .mdc — Cursor doesn't parse it)

# Codex
cp -r /tmp/theo-ui/skills/theo-ui ~/.codex/skills/theo-ui     # personal
cp -r /tmp/theo-ui/skills/theo-ui ./.codex/skills/theo-ui     # project
```

### Other AI assistants

The skill is structured as plain markdown — any assistant that can read a project's docs can consume it. The `SKILL.md` entry point references the `references/` subdirectory for specialized rule-sets.

---

## Quick start

After installing the skill, drop into a project that uses `@theokit/ui`:

```bash
cd my-app/
# Verify @theokit/ui is installed
pnpm list @theokit/ui
# Should show: @theokit/ui 0.12.0-next.0 (or later)
```

Then in your AI assistant, try:

```
Build a deployments list page using theo-ui.
```

The skill will:

1. Scan the project (pre-flight).
2. Ask for context (Surface / Use case / Density).
3. Pick P1 ListPage from the cookbook.
4. Emit a stamped `app/deployments/page.tsx` using `<PageShell>` + `<DataTable>` + `<DropdownMenu>`.
5. Append to `.theo-ui-skill/log.json`.

---

## Worked examples

Recipes live in [`docs/recipes/`](docs/recipes/) — copy-pasteable, full builds for each surface:

- [`dashboard-list.md`](docs/recipes/dashboard-list.md) — deployments list (P1 ListPage)
- [`chat-surface.md`](docs/recipes/chat-surface.md) — agent chat with tool calls (P4 ChatSurface)
- [`settings-page.md`](docs/recipes/settings-page.md) — account settings with danger zone (P3 SettingsPage)
- [`auth-page.md`](docs/recipes/auth-page.md) — sign-in + OTP verify (P10 + P11)
- [`billing-page.md`](docs/recipes/billing-page.md) — current plan + usage + pricing tiers (P8 BillingPage)

Catalog examples in [`docs/catalog-examples.md`](docs/catalog-examples.md) — worked catalog queries.

---

## Skill structure

```
skills/theo-ui/
├── SKILL.md              # main entry (frontmatter + design flow)
├── README.md             # this file
├── LICENSE               # Apache-2.0
├── package.json          # skill metadata
├── docs/
│   ├── recipes/          # 5 worked builds
│   └── catalog-examples.md
└── references/
    ├── tokens.md
    ├── typography.md
    ├── anti-patterns.md
    ├── slop-test.md
    ├── composition-cookbook.md  # 12 page archetypes
    ├── interaction-and-states.md  # 8-state coverage
    ├── microinteractions.md
    ├── responsive.md
    ├── motion.md
    ├── copy.md
    ├── themes.md
    ├── contract.md       # output contract
    ├── surfaces/
    │   ├── agent-chat.md
    │   ├── cloud-dashboard.md
    │   ├── settings-form.md
    │   ├── marketing.md
    │   └── auth.md
    └── verbs/
        ├── audit.md
        ├── migrate.md
        └── catalog.md
```

The skill loads references on-demand. `SKILL.md` is always read; specialized references load only when the active flow needs them. Total token budget for an average build is ~6-10 KB of skill content (not the full ~50 KB).

---

## Versioning

v1.0.0 (2026-05-25). Targets `@theokit/ui` 0.12.0-next.0+.

The skill's `version` field in `SKILL.md` is authoritative. Future versions will add:

- New surfaces as theo-ui grows (e.g., `docs-page` for documentation sites).
- New verbs (e.g., `theo-ui story <component>` for Ladle story generation).
- New page archetypes (P13+).
- New slop-test gates as the library evolves.

---

## License

Apache-2.0. Same as `@theokit/ui`.

---

## See also

- [`SKILL.md`](SKILL.md) — main skill entry point.
- [`../../README.md`](../../README.md) — `@theokit/ui` package overview.
- [`../../DESIGN.md`](../../DESIGN.md) — Violet Forge design system spec.
- [`../../llms.txt`](../../llms.txt) — `@theokit/ui` component catalog for LLMs.
- [`../../docs/design-system.md`](../../docs/design-system.md) — long-form design system spec with ADR links.
- [`../../CHANGELOG.md`](../../CHANGELOG.md) — version history.
