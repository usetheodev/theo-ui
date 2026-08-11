---
type: RFC
title: "RFC 0002 — Slide primitive"
description: A view-only markdown-to-themed-surface renderer over the unified ecosystem, with a sanitize-first security posture and a fixed logical canvas.
tags: [rfc, engine, slide, markdown, security, sanitize]
sources:
  - id: rfc
    resource: "git:94d9b11:docs/rfcs/0002-slide.md"
    author: "human:paulohenriquevn"
    last_modified: "2026-05-19"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

| Field | Value |
| --- | --- |
| Author | paulohenriquevn |
| Date | 2026-05-19 |
| Status | **Implemented** (2026-05-19) |
| Subpath | `@theokit/ui/slide` |

# Motivation

Agent surfaces increasingly emit slide-shaped artifacts — a markdown explanation, a
summary, a one-page brief. Without a primitive, every consumer rolls their own markdown
renderer with inconsistent typography, no security review, no theme, no aspect lock.

Marp owns this category in the wider ecosystem but ships 200 KB+ of engine surface that
does not belong in a UI library bundle. **Marp React is explicitly INACTIVE upstream** —
direct evidence that wrapping the engine as a React redistributable does not survive
long-term. The answer is a thin shell over the unified ecosystem (micromark plus the
mdast/hast utilities), staying under budget and owning the surface actually shipped.

# Decision — fourteen ADRs

| ID | Decision | One-line rationale |
| --- | --- | --- |
| D1 | Parser stack = micromark + mdast/hast utilities | Smaller bundle, modular pipeline, owned tree transforms |
| D2 | Seven markdown deps as optional peer-deps | Barrel consumers pay nothing |
| D3 | Isolated `dist/slide/`, not a barrel re-export | Barrel baseline unchanged ±0%; reuses Whiteboard's infrastructure |
| D4 | YAML frontmatter only — no HTML-comment directives | Simpler surface, LLM-friendlier, single source of truth |
| D5 | Multi-slide input is a `MULTIPLE_SLIDES` validation error | `<Slide>` is single-slide by contract; multi-slide is SlideDeck's job |
| D6 | Normal DOM scoped by `.theo-slide` — no Shadow DOM in the MVP | Violet Forge tokens inherit naturally; opt-in `isolate` prop later |
| D7 | Fixed canvas + Reveal.js scale-to-fit | Predictable layout, GPU-accelerated transform, canvas dims independent of host |
| D8 | `hast-util-sanitize.defaultSchema` with no extensions | Safest starting point; a loose schema is opt-in with security review |
| D9 | Real React VDOM via `hast-util-to-jsx-runtime` | SSR-safe, DevTools-introspectable, `components` overrides work |
| D10 | Excluded from the barrel, census, and axe scan | Engine pattern; mirrors Whiteboard D8 |
| D11 | `validateSlide` is async | YAML and mdast parsing are lazy peer-deps; a sync API is incompatible |
| D12 | Multi-slide detection via mdast `thematicBreak`, not regex | Zero false positives on `---` inside fenced code blocks |
| D13 | `BANNED_TAG` detection via a pre/post-sanitize tag-count diff | Cheap — O(nodes) × 2 — and surfaces a signal the agent can self-correct on |
| D14 | Input guards: BOM strip, aspectRatio fallback, frontmatter size cap | Three trivial guards closing three concrete failure modes |

D12 and D13 are the two worth internalizing. **D12** is why a `---` inside a fenced code
block never splits a slide — a regex-based splitter would produce silent corruption on
exactly the content an agent emits most (code). **D13** turns the sanitizer from a silent
filter into a feedback channel: when a tag is stripped, the agent learns and can reissue.

# Security posture

- HTML stripped per `defaultSchema`: no `<script>`, `<iframe>`, `<object>`, `<embed>`,
  `<form>`, `<input>`, `<style>`, `<link>`.
- `clobberPrefix: "user-content-"` prefixes user-supplied IDs, preventing DOM clobbering.
- Frontmatter capped at 10 KB, body at 50 KB — DoS prevention.
- Invalid `aspectRatio` falls back silently to 16:9 and reports `INVALID_ASPECT_RATIO`.
- `BANNED_TAG` fires as a callback so agents can self-correct.

# Non-goals

Deck navigation, transitions, presenter mode (→ [SlideDeck](/rfcs/0003-slide-deck.md)).
An authoring/editor surface — view-only by design. PDF/PPTX export — `marp-cli` does this
and there is no reason to compete. Custom theme registry from frontmatter. Shadow DOM
mounting. Loose sanitize schema. Syntax highlighting, math, mermaid, emoji — all deferred
to the [Tier 2 plugins](/rfcs/0004-slide-rich-content.md).

# Risks

| Risk | Mitigation |
| --- | --- |
| Bundle above 30 KB gzip | tsup external list pinned; `pnpm quality:bundle` gate |
| SSR hydration mismatch (scale 1 → resize) | Documented in JSDoc; consumers wrap in Suspense or a skeleton |
| Markdown extension creep | Non-goals documented; future surface arrives via the plugin prop, never core |
| Peer-dep version drift during pre-1.0 churn | Pinned at semver minor; the integration suite catches breaks |

Usage reference: [`/engines/slide.md`](/engines/slide.md). Authoring guide for LLMs:
[`/engines/slide-authoring-guide.md`](/engines/slide-authoring-guide.md).
