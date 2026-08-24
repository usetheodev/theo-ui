---
type: RFC
title: "RFC 0003 — SlideDeck composite engine"
description: Orchestrating N Slide primitives into a navigable, presenter-aware, printable deck with zero new peer-deps.
tags: [rfc, engine, slide-deck, navigation, presenter, print]
sources:
  - id: rfc
    resource: "archive:94d9b11:docs/rfcs/0003-slide-deck.md"
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
| Subpath | `@theokit/ui/slide-deck` |
| Depends on | [RFC 0002](/rfcs/0002-slide.md) |

# Motivation

Agent surfaces emit multi-slide content — release notes, RFC summaries, "explain this PR"
decks. The [Slide primitive](/rfcs/0002-slide.md) renders a **single** slide. Without a
composite, every consumer reinvents navigation, hash routing, presenter view, and print
logic — all tedious and error-prone (focus management, transition cancellation, popup
blockers, hydration mismatches).

SlideDeck owns those deck-level concerns in one tested composite, keeping the Slide
primitive narrow and reusable.

# Decision — seventeen ADRs

| ID | Decision | One-line rationale |
| --- | --- | --- |
| D1 | Isolated `dist/slide-deck/` | Zero cost for Slide-only consumers |
| D2 | **Zero new peer-deps** — reuses Slide's seven | Hotkeys, swipe, transitions rolled by hand at < 50 LOC each |
| D3 | `splitDeck` reuses Slide's mdast algorithm (D12) | No regex false positives on `---` inside fenced code |
| D4 | `slides: string \| SlideDeckSlide[]` | Two consumer shapes, one prop |
| D5 | `useReducer` state machine | Five interlinked fields demand action-typed transitions |
| D6 | Inline presenter panel; `window.open` deferred | Pragmatic scope reduction |
| D7 | PDF via `window.print()` + `@page` CSS | Zero deps, native quality, save-as-PDF works on every OS |
| D8 | CSS-only transitions + `prefers-reduced-motion` | No Framer Motion; ~0 bundle cost |
| D9 | Keyboard hook with hardcoded bindings | Ten bindings, ~50 LOC; remappable later |
| D10 | Swipe via Pointer Events | Native, cross-platform, multi-touch filtered |
| D11 | Speaker notes via `<!-- notes: -->` comments | Marpit, Reveal, and Marp all converge on this |
| D12 | Marpit-style `*` lists become fragments | Existing convention, reuses CommonMark syntax |
| D13 | Hash routing `#/N`, opt-in default-on | Deep linking, back button, share links |
| D14 | Dot-namespace sub-components | Headless and default layouts through one API |
| D15 | `splitDeck` strips frontmatter **first** | Avoids a phantom empty slide when global frontmatter is present (EC-1) |
| D16 | Transition `setTimeout(300ms)` fallback | Unsticks state when `transitionend` is cancelled by rapid navigation (EC-3) |
| D17 | Hash init is lazy inside `useReducer` | SSR-safe — no hydration mismatch between server and client (EC-5) |

D2 is the decision that shaped everything else: **zero new peer-deps**. Hotkeys, swipe
handling, and transitions each cost under 50 lines rolled by hand, versus three
dependencies with their own version churn and bundle weight. D15, D16, and D17 are all
edge-case fixes promoted into the design rather than filed as known bugs.

# Security posture

- Speaker notes are extracted from `<!-- notes: -->` **before** the sanitize stage; they
  never reach the rendered slide DOM.
- Banned tags are stripped by Slide's inherited sanitize pipeline.
- The print container renders in normal DOM with `visibility: hidden` until `@media print`.
- Fullscreen API is gated by a user gesture (browser-enforced).
- Presenter view runs in the same document — no cross-window CSP boundary at this version.

# Risks

| Risk | Mitigation |
| --- | --- |
| Bundle above 50 KB gz | Slide is vendored; current size acceptable for an engine |
| Rapid keyboard navigation sticking the state | D16 timeout fallback, tested in the rapid-nav case |
| SSR hydration mismatch from the hash | D17 lazy init, tested |
| iOS Safari fullscreen quirks | `useFullscreen` feature-detects and degrades gracefully |
| Multi-touch false positives | Filter by `pointerId` |
| `pointercancel` mid-swipe | Cleanup in the handler |

# Non-goals

Separate presenter window via `window.open` + `BroadcastChannel`. PPTX import. Real-time
collaboration. Custom keyboard remapping. Transitions beyond fade/slide. Auto-play / kiosk
mode. Per-slide PNG export. Voice control. Deck-wide search. Multi-monitor cursor sharing.

Usage reference: [`/engines/slide-deck.md`](/engines/slide-deck.md).
