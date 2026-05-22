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
| [0006](./0006-density-faang.md) | FAANG-grade density defaults (Button/Input 36px, body 14px, Card p-5) + `useDensity` hook | **Implemented** | 2026-05-22 |
| [0007](./0007-seven-themes.md) | 7 new built-in themes (Vercel, GitHub Dark, Dracula, One Dark, Anthropic-style, OpenAI-style, Linear Glass) + `validateThemeContrast` gate | **Implemented** | 2026-05-22 |
| [0008](./0008-vite-plugin-and-preset.md) | `./vite-plugin` + `./preset` subpath exports for TheoKit zero-config integration | **Implemented** | 2026-05-22 |

Status lifecycle: `Proposed` → `Accepted` (merged into main) → `Implemented` (feature shipped + quality gates green).
