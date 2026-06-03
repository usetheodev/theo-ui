# RFC 0003 — SlideDeck composite engine

| Field | Value |
|---|---|
| Author | paulohenriquevn |
| Date | 2026-05-19 |
| Status | **Implemented** (2026-05-19) |
| Subpath | `@theokit/ui/slide-deck` |
| Plan | `.claude/knowledge-base/plans/slide-deck-composite-plan.md` |
| Edge-case review | `.claude/knowledge-base/reviews/edge-cases/slide-deck-composite-edge-cases-2026-05-19.md` |
| Reference research | `.claude/knowledge-base/reference/slide.md` (Marpit/Reveal.js prior art shared with Slide RFC) |
| Consumer documented | TODO (placeholder). A concrete consumer surface (TheoCode Desktop "explain a release" deck, TheoKit slide-of-the-day app, or a Theo PaaS dashboard incident-summary panel) must be linked here before the follow-up PR that wires SlideDeck into production traffic. |

## 1. Summary

`SlideDeck` is a **composite engine** that orchestrates N `<Slide>` primitives into a navigable, presenter-aware, fullscreen-capable, printable deck. Lives at `@theokit/ui/slide-deck`. Reuses Slide's markdown peer-deps (zero new ones). Designed to consume LLM tool-call output (`{"type":"slide-deck","markdown":"..."}`) and deliver a PowerPoint-like experience in the browser without Reveal.js / Marp / impress.js.

Two API shapes:
- `<SlideDeck slides="# A\n\n---\n\n# B" />` — full markdown string, auto-split.
- `<SlideDeck slides={[{markdown:"# A"},{markdown:"# B"}]} />` — pre-parsed array.

Default layout renders canonical chrome (Controls + ProgressBar + Slide + Buttons + PresenterView). Headless mode (consumer-provided children) lets you assemble custom chrome from `<SlideDeck.X>` sub-components.

## 2. Motivation

Agent surfaces increasingly emit multi-slide content (release notes, RFC summaries, "explain this PR" decks). The Slide primitive (RFC 0002) renders a SINGLE slide. Without a composite, every consumer rolls their own navigation, hash routing, presenter view, and print logic — all of which are tedious and error-prone (focus management, transition cancellation, popup blockers, hydration mismatches).

SlideDeck owns these deck-level concerns in one tested composite, keeping the Slide primitive narrow and reusable.

## 3. Decision

Seventeen ADRs govern the design. Full rationale lives in the plan. Sumário:

| ID | Decision | One-line rationale |
|---|---|---|
| D1 | Subpath isolated `dist/slide-deck/` | Zero cost for Slide-only consumers; barrel unchanged. |
| D2 | Zero new peer-deps (reuses Slide's 7) | Roll-our-own hotkeys/swipe/transitions; < 50 LOC each. |
| D3 | splitDeck reuses mdast algorithm of Slide D12 | No regex false-positives on `---` inside fenced code. |
| D4 | `slides: string \| SlideDeckSlide[]` | Two consumer shapes covered with one prop. |
| D5 | useReducer state machine | 5 interlinked fields demand action-typed transitions. |
| D6 | Inline presenter panel (window.open deferred to v0.5) | Pragmatic scope reduction; v0.5 ships separate window. |
| D7 | PDF via `window.print()` + `@page` CSS | Zero deps, native quality, save-as-PDF works on all OS. |
| D8 | CSS-only transitions + prefers-reduced-motion | No Framer Motion; ≈ 0 bundle cost. |
| D9 | Keyboard hook with hardcoded bindings | 10 bindings, ~50 LOC; remappable in v0.5. |
| D10 | Swipe via Pointer Events | Native, cross-platform, multi-touch filtered. |
| D11 | Speaker notes via `<!-- notes: -->` HTML comments | Marpit/Reveal/Marp converge on comment-based notes. |
| D12 | Marpit-style `*` lists = fragments | Existing convention; reuses CommonMark syntax. |
| D13 | Hash routing `#/N` opt-in default-on | Deep-linking + back-button + share-link. |
| D14 | Dot-namespace sub-components | Headless + default layouts via same API. |
| D15 | splitDeck strips frontmatter FIRST (EC-1) | Avoids phantom empty slide when global frontmatter present. |
| D16 | Transition `setTimeout(300ms)` fallback (EC-3) | Destrava state when `transitionend` is cancelled in rapid nav. |
| D17 | Hash lazy `initFromHash` in useReducer (EC-5) | SSR-safe — no hydration mismatch between server and client. |

## 4. Public API

```ts
interface SlideDeckSlide {
  markdown: string;
  id?: string;
  notes?: string;
}

interface SlideDeckProps {
  slides: string | SlideDeckSlide[];
  initialIndex?: number;
  transition?: "none" | "fade" | "slide";
  enableKeyboard?: boolean;
  enableTouch?: boolean;
  enableHashRouting?: boolean;
  deckId?: string;
  onIndexChange?: (index: number, slide: SlideDeckSlide | undefined) => void;
  children?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

const SlideDeck: React.FC<SlideDeckProps> & {
  Slides;
  Controls;
  ProgressBar;
  SlideNumber;
  Thumbnails;
  PresenterView;
  PresenterButton;
  FullscreenButton;
  PrintButton;
};
```

## 5. Non-goals (deferred or out of scope)

- Separate presenter window via `window.open` + `BroadcastChannel` — v0.5.
- PPTX import — out of scope (separate deep-reference needed).
- Real-time collaboration (Yjs/CRDT) — separate product.
- Custom keyboard remapping — v0.5 via `keyMap` prop.
- Slide transitions beyond fade/slide — bundle pressure; opt-in via custom CSS.
- Auto-play / kiosk mode — manual nav only.
- Export PNG per slide — only PDF native.
- Voice control — experimental future.
- Slide search (Ctrl+F over deck) — v0.5.
- Speaker view multi-monitor cursor sharing — v0.6.

## 6. Security posture (v0.4)

- Speaker notes are extracted from `<!-- notes: -->` comments BEFORE sanitize stage; they never reach the rendered slide DOM.
- `<script>` and other banned tags are stripped by Slide's sanitize pipeline (inherited).
- Print container is rendered in normal DOM with `visibility: hidden` until `@media print`. No data leak (it's just our content, just hidden).
- Presenter view runs in same document (no cross-window CSP for now).
- Fullscreen API is gated by user gesture (browser-enforced).

## 7. Risks + mitigations

| Risk | Mitigation |
|---|---|
| Bundle blow-up beyond 50 KB gz | Slide is vendored; v0.5 considers self-reference. Current size acceptable for engine. |
| Rapid keyboard nav stuck state | D16 timeout fallback; tested in rapid-nav case. |
| SSR hydration mismatch from hash | D17 lazy init; tested. |
| iOS Safari fullscreen quirks | useFullscreen feature-detects gracefully (EC-8). |
| Multi-touch false-positive | Filter by pointerId (EC-7). |
| pointercancel mid-swipe | Cleanup in handler (EC-6). |

## 8. Rollout (10 phases)

1. **Phase 0** — Tooling + scaffold + RFC + CHANGELOG.
2. **Phase 1** — Schema + splitDeck + state machine.
3. **Phase 2** — Navigation hooks (keyboard + swipe + hash).
4. **Phase 3** — UI chrome (Controls + ProgressBar + SlideNumber).
5. **Phase 4** — Thumbnails sidebar with lazy IO.
6. **Phase 5** — Presenter view + fullscreen.
7. **Phase 6** — Transitions + fragments.
8. **Phase 7** — PDF export via print CSS.
9. **Phase 8** — Main composition + a11y + stories.
10. **Phase 9** — Docs + RFC closure + quality:gates.
11. **Phase 10** — Dogfood QA mandatory.

## 9. References

- Plan: `.claude/knowledge-base/plans/slide-deck-composite-plan.md`
- Edge-case review: `.claude/knowledge-base/reviews/edge-cases/slide-deck-composite-edge-cases-2026-05-19.md`
- Slide RFC 0002: `docs/rfcs/0002-slide.md`
- Slide reference doc: `.claude/knowledge-base/reference/slide.md` (Marpit, Marp Core, Reveal.js, mdast/micromark)
- Whiteboard RFC 0001: `docs/rfcs/0001-whiteboard.md` (engine subpath precedent)
- Marpit fragmented list: `referencia/marp/website/docs/guide/fragmented-list.md`
