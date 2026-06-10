# RFC 0002 — Slide primitive

| Field | Value |
|---|---|
| Author | paulohenriquevn |
| Date | 2026-05-19 |
| Status | **Implemented** (2026-05-19) |
| Subpath | `@theokit/ui/slide` |
| Plan | `.claude/knowledge-base/plans/slide-view-primitive-plan.md` |
| Reference research | `.claude/knowledge-base/reference/slide.md` |
| Edge-case review | `.claude/knowledge-base/reviews/edge-cases/slide-view-primitive-edge-cases-2026-05-19.md` |
| Consumer documented | TODO (placeholder). A concrete consumer surface (TheoCode Desktop "explain this PR" view, TheoKit slide-of-the-day app, or a Theo cloud dashboard panel) must be linked here before the follow-up PR that wires Slide into production traffic. |

## 1. Summary

`Slide` is a **view-only** primitive that renders a markdown string + optional YAML frontmatter into a themed surface with a fixed logical canvas (default 1280×720, 16:9). Designed to consume LLM tool-call output (`{"type":"slide","markdown":"..."}`) and render it immediately, safely, and with a consistent visual identity. Not an editor — no deck navigation, no transitions, no presenter mode.

The component lives in the isolated subpath `@theokit/ui/slide` with optional peer-deps for the markdown stack (`mdast-util-from-markdown`, `mdast-util-gfm`, `micromark-extension-gfm`, `mdast-util-to-hast`, `hast-util-sanitize`, `hast-util-to-jsx-runtime`, `yaml`). The main barrel (`@theokit/ui`) does not pay any of that cost.

## 2. Motivation

Agent surfaces increasingly emit slide-shaped artifacts — a markdown-formatted explanation, a summary, a one-page brief. Without a primitive, every consumer rolls their own markdown renderer with inconsistent typography, no security review, no theme, no aspect lock.

Marp owns this category in the wider ecosystem but ships ~200 KB+ of engine surface that does not belong in a UI library bundle. Marp React is explicitly INACTIVE upstream — direct evidence that wrapping the engine as a React redistributable does not survive long-term. We implement our own thin shell over the unified ecosystem instead (micromark + mdast/hast utilities), staying under budget and owning the surface we ship.

The primitive pairs with a future `<SlideDeck>` composite which orchestrates N `<Slide>` instances; deck-level concerns (navigation, transitions, paginate directive, header/footer) live there.

## 3. Decision

Fourteen ADRs govern the design. Full rationale lives in `.claude/knowledge-base/plans/slide-view-primitive-plan.md > ADRs`. Sumário:

| ID | Decision | One-line rationale |
|---|---|---|
| D1 | Parser stack = micromark + mdast/hast utilities | Smaller bundle, modular pipeline, owned tree transforms (Marp React INACTIVE proves wrapping is fragile). |
| D2 | 7 markdown deps as optional peer-deps | Consumer of barrel pays nothing; subpath user installs explicitly. |
| D3 | Subpath isolated `dist/slide/` (not barrel re-export) | Barrel baseline unchanged ±0%; reuses Whiteboard's ISOLATED_SUBPATHS infra. |
| D4 | YAML frontmatter only (no HTML comment syntax) | Simpler surface, LLM-friendlier, single source of truth. |
| D5 | Multi-slide input is `MULTIPLE_SLIDES` validation error | `<Slide>` is single-slide by contract; multi-slide is `<SlideDeck>` work. |
| D6 | Normal DOM scoped by `.theo-slide` (no Shadow DOM in MVP) | Violet Forge tokens inherit naturally; opt-in `isolate` prop in v0.2. |
| D7 | Fixed canvas + Reveal.js scale-to-fit | Predictable layout, GPU-accelerated transform, canvas dims independent of host. |
| D8 | `hast-util-sanitize.defaultSchema` without extensions | Safest starting point; opt-in looseSchema in v0.2 with security review. |
| D9 | Real React VDOM via `hast-util-to-jsx-runtime` | SSR-safe, DevTools-introspectable, components prop overrides work. |
| D10 | Slide excluded from barrel + census + axe coverage scan | Engine pattern; mirrors Whiteboard's D8. |
| D11 | `validateSlide` async (`Promise<ValidationResult>`) | Yaml + mdast parsing are lazy peer-deps; sync is incompatible. |
| D12 | Multi-slide detection via mdast `thematicBreak` (not regex) | Zero false-positive on `---` inside fenced code blocks. |
| D13 | BANNED_TAG detection via pre/post sanitize tag-count diff | Cheap (O(nodes) × 2), surfaces signal for LLM self-correction. |
| D14 | Input guards: BOM strip + aspectRatio fallback + frontmatter size cap | Three trivial guards close three concrete failure modes. |

## 4. Frontmatter schema (Zod, v1)

```ts
SlideFrontmatter = {
  theme?: "default" | "violet-forge";
  lang?: string;                  // BCP-47 (e.g. "en", "en-US", "pt-BR")
  color?: string;                 // CSS color
  backgroundColor?: string;       // CSS color
};
// strict() — unknown keys produce INVALID_FRONTMATTER with the key path.
```

Out-of-MVP directives (deferred to `<SlideDeck>` or v0.2): `paginate`, `header`, `footer`, `style`, `class`, `backgroundImage`, spot variants (`_foo:`).

## 5. Public API

```ts
export interface SlideProps {
  markdown: string;
  theme?: "default" | "violet-forge";
  aspectRatio?: "16:9" | "4:3" | { width: number; height: number };
  minScale?: number;
  maxScale?: number;
  onValidationError?: (errors: SlideValidationError[]) => void;
  components?: Record<string, React.FC<any>>;
  "aria-label"?: string;
  className?: string;
}
```

`SlideValidationErrorCode` union: `"INVALID_FRONTMATTER" | "FRONTMATTER_TOO_LARGE" | "MULTIPLE_SLIDES" | "CONTENT_TOO_LARGE" | "BANNED_TAG" | "BANNED_ATTRIBUTE" | "INVALID_ASPECT_RATIO"`.

## 6. Non-goals (deferred or out of scope)

- Deck navigation / transitions / presenter mode — `<SlideDeck>` composite.
- Markdown authoring/editor surface — view-only by design.
- PDF / PPTX export — marp-cli does this; we don't compete.
- KaTeX math, Mermaid, Twemoji — opt-in v0.2 plugins if a consumer asks.
- HTML comment directive syntax — frontmatter only.
- Custom theme registry from frontmatter — built-in only; consumer overrides via CSS vars.
- Shadow DOM mounting — opt-in `isolate` prop in v0.2 if CSS bleed reported.
- Loose sanitize schema (`<figure>`/`<figcaption>`) — opt-in v0.2 with security review.
- Code syntax highlighting — opt-in v0.2 via `codeHighlighter` prop.

## 7. Security posture (v0.1)

- HTML stripped per `defaultSchema`: no `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`, `<style>`, `<link>`, …
- `clobberPrefix: "user-content-"` (default) — prefixes user-supplied IDs to prevent DOM clobbering.
- Frontmatter capped at 10 KB to prevent DoS.
- Body capped at 50 KB.
- `aspectRatio` invalid input silently falls back to 16:9 + `INVALID_ASPECT_RATIO` error.
- `BANNED_TAG` callback fires when sanitize strips a tag — agents can self-correct.

## 8. Risks + mitigations

| Risk | Mitigation |
|---|---|
| Bundle blow-up beyond 30 KB gzip | tsup external list pinned; `pnpm quality:bundle` gate. |
| SSR hydration mismatch (scale 1 → resize) | Documented in JSDoc; consumers can wrap in Suspense/skeleton. |
| Markdown extension creep | Non-goals documented; future surface via plugin prop, not core. |
| Peer-dep version drift (pre-1.0 churn) | Pinned at semver minor; integration suite catches breaks. |

## 9. Rollout

1. **Phase 0** — Tooling + scaffold isolated, RFC + CHANGELOG.
2. **Phase 1** — Schema + validation (frontmatter, multi-slide detection).
3. **Phase 2** — Markdown pipeline (parseBody → mdastToHast → sanitize → hastToReact).
4. **Phase 3** — Themes CSS + container fit hook.
5. **Phase 4** — Component composition + a11y + Ladle stories.
6. **Phase 5** — Docs alignment + quality:gates full.
7. **Phase 6** — Dogfood QA (`pnpm dogfood:slide`).

## 10. References

- Reference research: `.claude/knowledge-base/reference/slide.md`
- Implementation plan: `.claude/knowledge-base/plans/slide-view-primitive-plan.md`
- Edge-case review: `.claude/knowledge-base/reviews/edge-cases/slide-view-primitive-edge-cases-2026-05-19.md`
- Whiteboard precedent: `docs/rfcs/0001-whiteboard.md`
- Marpit upstream: https://github.com/marp-team/marpit
- Marp Core upstream: https://github.com/marp-team/marp-core
- Reveal.js (divergent reference): https://github.com/hakimel/reveal.js
- mdast-util-from-markdown: https://github.com/syntax-tree/mdast-util-from-markdown
- hast-util-sanitize: https://github.com/syntax-tree/hast-util-sanitize
