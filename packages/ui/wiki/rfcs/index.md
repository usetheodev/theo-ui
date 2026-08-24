# RFCs

Architecture decisions for `@theokit/ui` that span multiple components or change a shared
invariant. **Engines — heavy primitives shipped under isolated subpaths — must land via an
RFC.**

Status lifecycle: `Proposed` → `Accepted` (merged) → `Implemented` (shipped, gates green).

| ID | Title | Status | Date |
| --- | --- | --- | --- |
| [0001](/rfcs/0001-whiteboard.md) | Whiteboard — view-only primitive (JSON → SVG, Excalidraw aesthetic) | **Implemented** | 2026-05-18 |
| [0002](/rfcs/0002-slide.md) | Slide — view-only primitive (Markdown → themed surface, Marp-inspired) | **Implemented** | 2026-05-19 |
| [0003](/rfcs/0003-slide-deck.md) | SlideDeck — composite engine (navigation, presenter, fullscreen, PDF) | **Implemented** | 2026-05-19 |
| [0004](/rfcs/0004-slide-rich-content.md) | Slide rich content — Tier 1 baked in, Tier 2 opt-in plugins | **Implemented** | 2026-05-19 |
| [0005](/rfcs/0005-theming-and-sizes.md) | `defineTheme` + `hex`/`rgb`, and `size` on nine more primitives | **Implemented** | 2026-05-20 |
| [0006](/rfcs/0006-density-faang.md) | FAANG-grade density defaults + `useDensity` | **Implemented** | 2026-05-22 |
| [0007](/rfcs/0007-seven-themes.md) | Seven new built-in themes + the contrast gate | **Implemented** | 2026-05-22 |
| [0008](/rfcs/0008-vite-plugin-and-preset.md) | `./vite-plugin` + `./preset` for TheoKit zero-config integration | **Implemented** | 2026-05-22 |
| [0009](/rfcs/0009-chat-message-parts-api.md) | ChatMessage parts API + owned markdown engine | **Implemented** | 2026-05-23 |

## What an RFC must contain

Summary, motivation with **measured** state (not asserted), the decision as a numbered ADR
table with a one-line rationale each, the public API, non-goals, security posture where
relevant, risks with mitigations, the rollout phases, and references.

Two conventions worth noting because they appear across every record here:

- **The motivation cites a measurement.** RFC 0005 opens with a `grep` result (2 of 102
  components had a `size` prop). RFC 0006 opens with measured control heights across five
  design systems. An RFC that asserts a problem without measuring it is not ready.
- **A user request may be recalibrated, in writing.** RFC 0006 was asked for a 25%
  tightening and shipped 10%, with the reason (WCAG 2.5.8 AA) recorded as an ADR rather
  than silently applied. See [`/design-system/density.md`](/design-system/density.md).

## Consumer-documented field

Several RFCs carry a `Consumer documented` field with an explicit `TODO (placeholder)`.
That is the YAGNI gate for engines: an engine does not get wired into production traffic
until a concrete consumer surface is named. The placeholders are honest markers of unfinished
work, not oversights.
