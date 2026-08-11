---
okf_version: "0.2"
---

# `@theokit/ui` knowledge bundle

Agent-readable knowledge for **`@theokit/ui`** (codename **Violet Forge**) — the React
component library of the [Theo](https://usetheo.dev) ecosystem, built for AI-agent
surfaces (coding agents and chat). Apache-2.0, ESM-only, published on npm.

This bundle is the successor to the repository's former `docs/` tree and
`.claude/knowledge-base/` tree, both removed on 2026-08-11. Every load-bearing fact from
those trees that still governs the library lives here as a concept. Process artifacts
that were spent on execution (implementation plans, per-cycle edge-case reviews, run
logs) were not carried over — they remain readable in git history. See
[`/log.md`](/log.md) for the exact crawl boundary and the commit that holds the originals.

## Where to start

| If you want to know | Read |
| --- | --- |
| Whether a component is a primitive or a composite | [`/architecture/taxonomy-rule.md`](/architecture/taxonomy-rule.md) |
| What a color, font size, or spacing token is | [`/design-system/color-tokens.md`](/design-system/color-tokens.md), [`/design-system/typography.md`](/design-system/typography.md), [`/design-system/spacing-radii-elevation.md`](/design-system/spacing-radii-elevation.md) |
| What must be green before a PR merges | [`/quality-gates/gate-catalog.md`](/quality-gates/gate-catalog.md) |
| Why a decision was made the way it was | [`/decisions/index.md`](/decisions/index.md) |
| How a feature was designed before it shipped | [`/rfcs/index.md`](/rfcs/index.md) |
| How to render slides or whiteboards from agent output | [`/engines/index.md`](/engines/index.md) |
| How to upgrade across a breaking release | [`/migrations/index.md`](/migrations/index.md) |
| Why the library is AI-exclusive today | [`/history/ai-exclusive-pivot.md`](/history/ai-exclusive-pivot.md) |

## Sections

### [Architecture](/architecture/index.md)

The mechanical primitive/composite rule, the source layout, package shape, subpath
export strategy, and the component lifecycle.

### [Design system](/design-system/index.md)

Violet Forge: identity, color tokens, typography, spacing, motion, density, the ten
built-in themes, and the accessibility contract.

### [Quality gates](/quality-gates/index.md)

The gate catalog (Gate 0 through Gate 10), the structural validator, the registry gate,
and release readiness. Gates are hard requirements, not guidance.

### [Decisions](/decisions/index.md)

Twelve accepted architecture decision records covering the package contract, the color
format, tonal derivations, status tokens, forced colors, system mode, page scaffolding,
and per-component subpath exports.

### [RFCs](/rfcs/index.md)

Nine implemented RFCs. Every engine and every change to a shared invariant lands through
one.

### [Engines](/engines/index.md)

Whiteboard, Slide, SlideDeck, and the Slide plugin tier — heavy view-only primitives that
ship under isolated subpaths, plus the LLM authoring guide for slide markdown.

### [Migrations](/migrations/index.md)

HSL to OKLCH (0.13 → next) and the v1 `@usetheo/ui` split.

### [Registry](/registry/index.md)

The shadcn-compatible copy-paste distribution path and the component census.

### [History](/history/index.md)

The AI-exclusive pivot, the 2026-05 design direction selection, the competitor visual
audit, the example screens, and the release record.

## Conventions in this bundle

- **Source provenance.** Concepts carry a `sources` list. A `resource` of the form
  `git:94d9b11:docs/architecture.md` names the file and the commit that still holds it.
  Those paths no longer exist in the working tree.
- **Trust.** Every concept was `generated` by an agent. Nothing carries a `verified`
  event, because no human has signed off on the transcription. Treat concepts as
  faithful-but-unreviewed until that changes.
- **Authority.** Where this bundle disagrees with the code, the code wins — the same rule
  the removed `docs/` tree carried. Report the drift rather than trusting the prose.
