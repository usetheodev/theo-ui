# RFCs — TheoUI

Architecture decisions for `@usetheo/ui` that span multiple components or change shared invariants.

Engines (heavy primitives shipped under isolated subpaths) MUST land via an RFC per `CLAUDE.md > Roadmap`.

| ID | Title | Status | Last update |
|---|---|---|---|
| [0001](./0001-whiteboard.md) | Whiteboard — view-only primitive (JSON → SVG, Excalidraw aesthetic) | **Implemented** | 2026-05-18 |
| [0002](./0002-slide.md) | Slide — view-only primitive (Markdown → themed surface, Marp-inspired) | **Implemented** | 2026-05-19 |
| [0003](./0003-slide-deck.md) | SlideDeck — composite engine (multi-slide deck w/ navigation, presenter, fullscreen, PDF) | **Implemented** | 2026-05-19 |
| [0004](./0004-slide-rich-content.md) | Slide rich content — Tier 1 (alerts, layouts, bg, header/footer, paginate, Marpit) + Tier 2 plugins (shiki, math, mermaid, emoji) | **Implemented** | 2026-05-19 |
| [0005](./0005-theming-and-sizes.md) | Theming customization (`defineTheme` + `hex` / `rgb`) + `size` standardization on 9 primitives | **Implemented** | 2026-05-20 |

Status lifecycle: `Proposed` → `Accepted` (merged into main) → `Implemented` (feature shipped + quality gates green).
