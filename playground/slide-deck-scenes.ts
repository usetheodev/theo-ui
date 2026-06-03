/**
 * SlideDeck demo scenes — exercises navigation, transitions, fragments,
 * speaker notes, thumbnails, presenter view, fullscreen, PDF export, hash
 * routing, custom layout. Mirrors `playground/slide-deck-demo.tsx`.
 */
import type { SlideDeckSlide, SlideDeckTransition } from "@theokit/ui/slide-deck";

export interface SlideDeckScene {
  id: string;
  title: string;
  description: string;
  /** Either full markdown (auto-split) or pre-parsed array. */
  slides: string | SlideDeckSlide[];
  transition?: SlideDeckTransition;
  initialIndex?: number;
  showThumbnails?: boolean;
  showPresenter?: boolean;
  /** Hint shown in card chrome — does NOT change behaviour. */
  expectError?: boolean;
}

export const SLIDE_DECK_SCENES: SlideDeckScene[] = [
  {
    id: "default-deck",
    title: "Default deck — 3 slides",
    description:
      "Canonical layout: Slides + Controls + ProgressBar + buttons (Presenter/Fullscreen/Print).",
    slides: `# Welcome to TheoUI

A multi-slide deck rendered from one markdown string.

---

# Navigation

Use ← / → / Space / Home / End / Esc / F / N or swipe on mobile.

---

# That's it

Press F to enter fullscreen, P or N to open presenter view.`,
  },
  {
    id: "gfm-table",
    title: "Quarterly KPIs — GFM table",
    description: "GFM table renders with semantic <table> markup, scaled to fit the slide canvas.",
    slides: `# Quarterly KPIs

| Metric  | Q1    | Q2    | Q3    |
| ------- | ----- | ----- | ----- |
| Revenue | 1.2M  | 1.5M  | 1.8M  |
| Users   | 8k    | 12k   | 18k   |
| NPS     | 42    | 48    | 53    |

---

# Insights

Revenue grew **50%** quarter-over-quarter. NPS climbed to 53.`,
  },
  {
    id: "with-speaker-notes",
    title: "Speaker notes (open Presenter)",
    description: "Click 'Presenter' or press N to reveal speaker notes panel below the slide.",
    slides: `# Pull Request #142

<!-- notes: lembre da queda no p99 — começou em 2026-05-12 -->

Adds rate limiting to the public API.

---

# Implementation

<!-- notes: explicar trade-off token-bucket vs leaky-bucket; mostrar gráfico -->

Token-bucket algorithm with sliding-window guard against clock skew.`,
    showPresenter: true,
  },
  {
    id: "progressive-fragments",
    title: "Progressive fragments (Marpit style)",
    description:
      "Lists with `*` advance one item at a time on each →. Regular `-` lists show all at once.",
    slides: `# Progressive Reveal

Press → to advance fragments first, then the slide.

* First item appears
* Second item appears
* Third item appears

---

# Done

These reveal immediately:

- Always visible
- Always visible
- Always visible`,
  },
  {
    id: "fade-transition",
    title: "Fade transition",
    description: "Opacity fade between slides (250ms; honours prefers-reduced-motion).",
    slides: `# Slide One

Watch the fade.

---

# Slide Two

Smooth and short.`,
    transition: "fade",
  },
  {
    id: "slide-transition",
    title: "Slide transition (horizontal)",
    description: "Horizontal slide with direction-aware enter (next vs prev).",
    slides: `# Slide One

Sliding in.

---

# Slide Two

Direction follows nav.`,
    transition: "slide",
  },
  {
    id: "thumbnails-sidebar",
    title: "Thumbnails sidebar (headless)",
    description: "Headless layout with thumbnails on the left. Click any thumbnail to jump.",
    slides: `# Welcome

---

# Architecture

The slide deck composes \`<Slide>\` primitives.

---

# Pipeline

micromark → mdast → hast → sanitize → React.

---

# Done`,
    showThumbnails: true,
  },
  {
    id: "large-deck",
    title: "Large deck (20 slides) with thumbnails",
    description: "Stress test for thumbnails lazy-load via IntersectionObserver.",
    slides: Array.from(
      { length: 20 },
      (_, i) => `# Slide ${i + 1}\n\nContent for slide ${i + 1}.`,
    ).join("\n\n---\n\n"),
    showThumbnails: true,
  },
  {
    id: "hash-routing",
    title: "Hash routing — opens at slide 2",
    description: "initialIndex={1} (0-based). With hash routing enabled, URL becomes #/2.",
    slides: `# Slide A

---

# Slide B (this one)

---

# Slide C`,
    initialIndex: 1,
  },
  {
    id: "array-input",
    title: "Pre-parsed array input",
    description: "Skip the markdown split; pass already-split SlideDeckSlide[].",
    slides: [
      { markdown: "# Alpha\n\nPre-parsed slide A." },
      { markdown: "# Beta\n\nPre-parsed slide B." },
      { markdown: "# Gamma\n\nPre-parsed slide C." },
    ],
  },
  {
    id: "frontmatter-global",
    title: "Global frontmatter (D15 / EC-1)",
    description: "Frontmatter at the top of the deck is stripped first — no phantom empty slide.",
    slides: `---
theme: violet-forge
lang: en-US
---

# First real slide

---

# Second real slide

If D15 is broken, this would be slide 3.`,
  },
  {
    id: "single-slide-deck",
    title: "Single-slide deck",
    description: "Edge case — only one slide; nav buttons disabled.",
    slides: `# Only one slide

No navigation needed. Prev / Next disabled.`,
  },
  {
    id: "empty-deck",
    title: "Empty deck (edge case)",
    description: "slides=[] renders an 'Empty deck' fallback; no crash.",
    slides: [],
    expectError: true,
  },
];
