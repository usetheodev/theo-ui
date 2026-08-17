---
type: Architecture Reference
title: Source layout of @theokit/ui
description: What each top-level folder under src/ owns, and which of them are published.
tags: [architecture, layout, conventions]
sources:
  - id: arch-doc
    resource: "archive:94d9b11:docs/architecture.md"
  - id: screens-doc
    resource: "archive:94d9b11:docs/screens.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# Schema

```
src/
├── lib/                   Pure utilities (cn, safe-href, env) — no React state, no DOM.
├── themes/                Theme registry + ThemeProvider + ThemeSwitcher + density.
├── types/                 Shared domain models (UIMessage, AgentEvent, …).
├── components/
│   ├── primitives/        Atomic components. Import no other @theokit/ui component.
│   └── composites/        Compose >= 1 primitive.
├── screens/               Example screens (Ladle stories only — NOT exported).
└── test/                  Vitest setup.
```

| Folder | Exported from the barrel? | Owns |
| --- | --- | --- |
| `lib/` | Partially (`cn`) | Pure functions. No React state, no DOM access. |
| `themes/` | Yes | The ten built-in themes, `ThemeProvider`, `ThemeScript`, `ThemeSwitcher`, `defineTheme`, `hex`/`rgb`, density. See [`/design-system/themes.md`](/design-system/themes.md). |
| `types/` | Yes (types only) | Structural types shared across layers. Type-only imports may cross the primitive/composite boundary. |
| `components/primitives/` | Yes | See [`/architecture/taxonomy-rule.md`](/architecture/taxonomy-rule.md). |
| `components/composites/` | Yes | Same. |
| `screens/` | **No** | Illustrative full-page compositions, Ladle-only. Consumers copy them as reference. |
| `test/` | No | Vitest setup, including the fetch stub that keeps happy-dom from hitting Google Fonts during teardown. |

# Required files per component

A component folder is `src/components/<layer>/<kebab-name>/` and must contain:

| File | Purpose | Gated |
| --- | --- | --- |
| `<name>.tsx` | Implementation | yes |
| `index.ts` | Barrel re-export — the only import surface for composites | yes |
| `<name>.test.tsx` | Smoke render, props matrix, key behaviors | **hard-fail** |
| `<name>.stories.tsx` | Ladle story titled `<Layer> / <Name>` | yes |
| `registry/<name>.json` | Registry descriptor with the correct `path` | yes |

`validateComponentStructure` enforces presence; the test gate is a hard fail, not a
warning. See [`/quality-gates/structural-validator.md`](/quality-gates/structural-validator.md).

# Screens are not API

`src/screens/` holds full-page compositions demonstrating how primitives and composites
assemble into a real workflow. They are **not exported** from the barrel and never enter
the registry. Their job is to prove a composition works, using realistic data, long
labels, and empty/error states. The catalogue of them lives at
[`/history/example-screens.md`](/history/example-screens.md).
