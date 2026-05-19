# CLAUDE.md — TheoUI

Contract between Claude and the **TheoUI / `@usetheo/ui`** project (the **UI** pillar of [usetheo](../CLAUDE.md)). Read this file **and** the root `CLAUDE.md` before editing anything here.

This file complements `/home/paulo/Projetos/usetheo/CLAUDE.md` and `/home/paulo/.claude/CLAUDE.md`. Root rules apply unconditionally. TheoUI-specific rules layer on top.

---

## What this project is

`@usetheo/ui` — codenamed **Violet Forge** — is the React component library of the [usetheo](https://usetheo.dev) ecosystem. **102 components** (81 primitives + 21 composites) designed for AI agent surfaces and cloud dashboards. Framework-agnostic (peer-deps on React only). Apache-2.0. Production.

Published as `@usetheo/ui` on npm. Distributed two ways: install the whole package, or copy individual components via the shadcn-compatible registry.

Positioned as the **UI pillar** of usetheo and a **community auxiliary** of the ecosystem (Apache-2.0, not part of the paid funnel). Pairs naturally with TheoKit (framework) and `@usetheo/sdk` (harness) but runs standalone.

## Locked names

(Decisions documented; changing requires a CLAUDE.md update + CHANGELOG entry.)

| Item | Value |
| --- | --- |
| npm package | `@usetheo/ui` |
| Design system codename | **Violet Forge** |
| Default theme | `violet-forge` |
| Built-in themes | `violet-forge`, `classic-paper`, `aurora-terminal` |
| ThemeProvider component | `<ThemeProvider />` |
| Registry endpoint (planned) | `ui.usetheo.dev/r/*.json` |
| Module format | ESM-only (no CJS) |
| Component taxonomy | `primitive` (no internal `@usetheo/ui` deps) vs `composite` (depends on primitives) |
| Quality gate command | `pnpm quality:gates` |

## Voice and Tone

**Locked 2026-05-15** (strategic review). TheoUI has adopted the aspirational voice originally scoped to TheoKit. The operational guide — three communication layers (HERO / BODY / DEEP DIVE), vocabulary translation, banned terms list, storytelling rules, before/after examples — lives in [`../theokit/CLAUDE.md`](../theokit/CLAUDE.md). Read it before writing any public copy for this project. This file does not duplicate it.

**Applies to:**

- `PITCH.md` — landing-page copy at project root
- `README.md` HERO + "Why `@usetheo/ui`" sections (everything above the `## Component catalog` section)
- Future TheoUI launch material, blog posts, site sections referencing Violet Forge or the design system as a brand

**Does NOT apply to (stays technical-direct):**

- `README.md` from `## Component catalog` downward — component lists, themes reference, design system spec, quality gates, architecture, bundle/module section, development scripts. DEEP DIVE.
- `docs/design-system.md`, `docs/quality-gates.md`, `docs/architecture.md`, `docs/design-audit.md`, `docs/screens.md`
- `CONTRIBUTING.md`, `SECURITY.md`, this `CLAUDE.md`, `CHANGELOG.md`
- Ladle stories, JSDoc, inline source comments

**Cross-project narrative anchors that must hold (regardless of voice):**

- **UI pillar of usetheo** — one of four pillars (UI, Harness, Skills, Runtime). Not the framework (TheoKit), not the SDK (TheoKit-SDK), not the runtime (Theo PaaS).
- **Community auxiliary** — Apache-2.0, not part of the paid funnel. Usable standalone, no commitment to the rest of the stack.
- **Built for AI agents + cloud dashboards** — the categorical wedge against generic component libraries (shadcn, MUI, Mantine, Tremor).
- **shadcn-compatible registry** — copy-paste path is first-class, not a side feature.
- **Same Radix underneath as shadcn** — no foundational fork. The wedge is what we built on top.
- **Quality gates are hard requirements** — format → lint → typecheck → test → build → registry → structure → bundle → a11y → ladle. No PR ships otherwise.

If a piece of TheoUI copy contradicts the locked narrative in [`../CLAUDE.md`](../CLAUDE.md) or the operational rules in [`../theokit/CLAUDE.md`](../theokit/CLAUDE.md), the root and TheoKit rules win — surface the conflict before publishing.

## Relationship to other pillars

| Pillar | Project | Current integration (verify before claiming) |
| --- | --- | --- |
| Harness | `@usetheo/sdk` | None as of 2026-05-15. `SDKAgent` events (`SDKMessage`, `tool_call`, `assistant`) are natural data sources for `AgentEvent`, `ToolCall`, `ChatMessage` primitives, but no import exists. |
| Skills | `theokit` | None as of 2026-05-15. TheoKit apps can consume `@usetheo/ui` like any other React lib; no specific wiring. |
| Runtime | Theo PaaS | None (PaaS pre-release). `DeploymentRow`, `BuildLogStream`, `RollbackUI`, `EnvVarEditor`, `DomainConfig`, `PreviewEnvCard`, `ProjectCard`, `MetricsPanel` are PaaS-shaped primitives waiting for the PaaS surface to consume them. |
| Coding assistant | `theo-code` | TheoCode Desktop is a likely first-party consumer (Tauri + web view); no explicit dependency declared yet. |

> "Do not invent integration that does not exist yet." (Root `CLAUDE.md` rule 2.) Verify the actual import / dependency before claiming wiring exists in copy or examples. `grep` first, claim second.

## Roadmap (formalized 2026-05-18)

Four future engines / composites are explicitly in scope but **not implemented**. They will land through individual RFCs, each running the full quality-gate chain:

| Item | Type | Inspiration | Status | Notes |
| --- | --- | --- | --- | --- |
| `Whiteboard` | Primitive (engine, view-only) | Excalidraw | **Available** (2026-05-18, RFC 0001) | Subpath `@usetheo/ui/whiteboard`. JSON → SVG with hand-drawn aesthetic via `roughjs` + `perfect-freehand` (optional peer-deps). Pan + zoom built-in. NOT an editor — no toolbar / selection / undo. See `docs/rfcs/0001-whiteboard.md`. |
| `Slide` | Primitive (engine, view-only) | Marp | **Available** (2026-05-19, RFC 0002) | Subpath `@usetheo/ui/slide`. Markdown + YAML frontmatter → themed SVG/HTML surface via `mdast-util-from-markdown` + `mdast-util-gfm` + `mdast-util-to-hast` + `hast-util-sanitize` + `hast-util-to-jsx-runtime` (optional peer-deps). Fixed 1280×720 canvas (16:9 default), Reveal.js scale-to-fit, two built-in themes (`default`, `violet-forge`). View-only — no deck navigation. See `docs/rfcs/0002-slide.md`. |
| `SlideDeck` | Composite (engine, view-only) | Marp / Reveal.js | **Available** (2026-05-19, RFC 0003) | Subpath `@usetheo/ui/slide-deck`. Orchestrates N `<Slide>` primitives with keyboard/touch/hash navigation, thumbnails sidebar, presenter view (inline panel w/ next + notes + timer), fullscreen API, CSS transitions (`none`/`fade`/`slide` + prefers-reduced-motion), Marpit-style fragments (`*` lists), PDF export via `window.print()` + `@page` CSS. Zero new peer-deps (reuses Slide's 7). See `docs/rfcs/0003-slide-deck.md`. |
| `Slide` rich content (Tier 1 + Tier 2 plugins) | Slide extension (engine + 4 plugins) | Marp + Reveal.js + GitHub callouts + Shiki/KaTeX/Mermaid | **Available** (2026-05-19, RFC 0004) | **Tier 1 baked into `@usetheo/ui/slide`**: GFM alerts (`> [!NOTE/TIP/IMPORTANT/WARNING/CAUTION]`), 7 layouts (`default`/`title`/`two-column`/`image-right`/`image-left`/`code-output`/`section`), background image/gradient (sanitized — http(s) only, data: rejected), Marpit `![bg](url)` syntax, header/footer/paginate overlays. **Tier 2 opt-in plugins** in sub-subpaths `@usetheo/ui/slide/plugins/{shiki,math,mermaid,emoji}` — each with its own peer-deps externalized. Plugin architecture: explicit `plugins={SlidePlugin[]}` prop (`<Slide>` + `<SlideDeck>` relay), error isolation (D16 — plugin throws collected as `PLUGIN_ERROR`) + sanitize-schema merge (D17 — plugins MUST declare `sanitizeSchemaExtension` for custom tags). Pipeline order: `mdast → hast → sanitize → components`. **128 new tests**; bundle isolation invariant preserved (barrel unchanged). See `docs/rfcs/0004-slide-rich-content.md`. |
| `Diagram` | Primitive | Mermaid | Explorer (RFC) | DSL → SVG. Reuse `dagre` / `elk` for layout algorithms. MVP: one diagram type (flowchart). |

**Rules in force for each engine (non-negotiable):**

- **Don't reinvent the algorithmic core** (global rule 9). Markdown parsing, DSL parsing, graph layout, and freedraw stroke rendering use mature OSS deps. TheoUI ships the React shell, theming, a11y, and the agent-surface integration — not the algorithm.
- **Bundle isolation**: every engine likely blows the current `quality:bundle` ±5% baseline. Plan a subpath import (`@usetheo/ui/whiteboard`) with peer-dep opt-in; **do not include in the main barrel**. Update `quality:bundle` baseline only after subpath isolation is confirmed.
- **YAGNI gate**: no engine moves out of "Explorer" without a documented agent-surface or PaaS-dashboard consumer asking for it.
- **License compatibility**: Apache-2.0 compatible deps only (no GPL transitive).
- **Honesty**: until shipped, every public surface (README, PITCH, site) must label these as Roadmap, not Available.

No version commitment yet. These are not on the 0.1 / 1.0 line.

## Component taxonomy (mechanical)

The split between **primitive** and **composite** is enforced by [`scripts/validate-quality-gates.ts`](./scripts/validate-quality-gates.ts), not chosen subjectively:

- **Primitive** — imports zero other `@usetheo/ui` components. 81 of these.
- **Composite** — imports one or more primitives via the barrel. 21 of these.

Cross-imports across the boundary fail the gate. A primitive that grows to need another primitive must either inline what it needs or be promoted to a composite (and renamed via PR with rationale).

## Quality gates are inviolable

`pnpm quality:gates` runs the full chain. Skipping or bypassing it is not allowed — every PR ships green. The structural validator enforces test/story/registry presence per component (test gate is hard-fail), public-export surface, design-system fidelity (Geist fonts + Vercel type scale), README ↔ exports drift, docs typography drift, vitest-axe coverage on ≥30 interactive primitives, and zero stray `*.bak` / `*.json.tmp` artifacts.

If a quality gate fails, fix the root cause. Do not disable the gate. Do not silence the rule.

## Inviolable rules (from root and global)

1. **95% confidence gate.** Ask if uncertain.
2. **Task completion gate.** Finish before starting a new task.
3. **Extreme honesty.** Admit ignorance. Surface risks.
4. **Git rules.** No `git checkout` or `git revert`. No direct work on `main`.
5. **TDD.** Tests before production code; bug fixes start with a regression test.
6. **Changelog discipline.** Every code change updates `CHANGELOG.md` here.
7. **Don't reinvent.** Radix UI, CVA, cmdk, lucide-react, tailwind-merge are the foundations. Do not roll alternatives.
8. **No emojis** in code, READMEs, or CLAUDE.md files unless explicitly requested.

Full text: `/home/paulo/.claude/CLAUDE.md`. Cross-project rules: `/home/paulo/Projetos/usetheo/CLAUDE.md`.

## When this file is wrong

The code, the README, and `docs/` are authoritative. If this file disagrees with them, the code wins — update this file via PR with a one-line rationale in the commit message. **Locked names** and **Voice and Tone** rules require an explicit strategic review at the monorepo level before being weakened or repealed.
