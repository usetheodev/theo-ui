---
type: Component Reference
title: SlideDeck — navigable deck of Slide primitives
description: The two input shapes, sub-component namespace, navigation contract, presenter view and PDF export path.
tags: [engine, slide-deck, navigation, presenter, print, api]
sources:
  - id: rfc-0003
    resource: "git:94d9b11:docs/rfcs/0003-slide-deck.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# What it is

A **composite engine** orchestrating N [`<Slide>`](/engines/slide.md) primitives into a
navigable, presenter-aware, fullscreen-capable, printable deck. Delivers a
PowerPoint-shaped experience in the browser without Reveal.js, Marp, or impress.js.

Reuses Slide's seven peer-deps and adds **zero new ones** — hotkeys, swipe, and transitions
are all hand-rolled at under 50 lines each. Design rationale:
[RFC 0003](/rfcs/0003-slide-deck.md).

# Install

```bash
pnpm add @theokit/ui   # plus Slide's seven peer-deps
```

# API

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
```

## Two input shapes

```tsx
<SlideDeck slides="# A\n\n---\n\n# B" />                        // markdown, auto-split
<SlideDeck slides={[{markdown:"# A"}, {markdown:"# B"}]} />     // pre-parsed array
```

## Sub-components

`SlideDeck` is a dot-namespace: `Slides`, `Controls`, `ProgressBar`, `SlideNumber`,
`Thumbnails`, `PresenterView`, `PresenterButton`, `FullscreenButton`, `PrintButton`.

The default layout renders canonical chrome. Passing `children` switches to **headless
mode**, where the consumer assembles custom chrome from those sub-components — one API
covering both cases.

# Navigation

| Mechanism | Detail |
| --- | --- |
| Keyboard | Ten hardcoded bindings. Not remappable at this version. |
| Touch | Swipe via Pointer Events — native, cross-platform, multi-touch filtered by `pointerId`, `pointercancel` cleaned up. |
| Hash routing | `#/N`, opt-in and default-on. Deep links, back button, share links. Initialization is **lazy inside `useReducer`** so SSR and client agree. |
| Transitions | CSS-only: `none` / `fade` / `slide`, all collapsing under `prefers-reduced-motion`. A 300ms `setTimeout` fallback unsticks state when `transitionend` is cancelled by rapid navigation. |

# Speaker notes and fragments

Notes use `<!-- notes: ... -->` HTML comments — the convention Marpit, Reveal, and Marp all
converge on. They are extracted **before** the sanitize stage and never reach the rendered
slide DOM.

Marpit-style `*` bullet lists become fragments, reusing existing CommonMark syntax rather
than inventing a marker.

# PDF export

`window.print()` plus `@page` CSS. Zero dependencies, native rendering quality, and
save-as-PDF works on every OS. The print container renders in normal DOM with
`visibility: hidden` until `@media print`.

Mermaid diagrams fall back to their source code in print, since PDF output cannot run the
client-side renderer.

# Deck splitting

`splitDeck` reuses Slide's mdast `thematicBreak` algorithm, so `---` inside a fenced code
block never splits a slide. It strips global frontmatter **first**, which avoids a phantom
empty leading slide when the deck carries deck-level frontmatter.

# Not supported at this version

Separate presenter window (`window.open` + `BroadcastChannel`) — the presenter panel is
inline. PPTX import. Real-time collaboration. Custom keyboard remapping. Transitions beyond
fade/slide. Auto-play / kiosk mode. Per-slide PNG export. Deck-wide search. Multi-monitor
cursor sharing.
