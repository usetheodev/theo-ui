---
type: RFC
title: "RFC 0001 — Whiteboard primitive"
description: A view-only hand-drawn diagram renderer built as a thin shell over roughjs and perfect-freehand, isolated in its own subpath.
tags: [rfc, engine, whiteboard, svg, bundle-isolation]
sources:
  - id: rfc
    resource: "archive:94d9b11:docs/rfcs/0001-whiteboard.md"
    author: "human:paulohenriquevn"
    last_modified: "2026-05-18"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

| Field | Value |
| --- | --- |
| Author | paulohenriquevn |
| Date | 2026-05-18 |
| Status | **Implemented** (2026-05-18) |
| Subpath | `@theokit/ui/whiteboard` |

# Motivation

The category "hand-drawn diagram rendered from structured JSON" did not exist in the
library. Analogues like a Mermaid-style `Diagram` cover flowcharts with automatic layout,
but there was no surface where the LLM **explicitly chooses element positions** —
architectures, UI sketches, annotations over images, brainstorms.

No viable off-the-shelf option:

- **Excalidraw upstream** is an application — roughly 13k LOC in `App.tsx` alone. Not a
  primitive.
- **`react-rough-fiber`** is a rough.js wrapper with no schema, viewport, or freedraw
  integration.
- **Mermaid** has no sketchy aesthetic.

So: a thin shell over `roughjs` and `perfect-freehand` — the consecrated upstreams of
Excalidraw and tldraw respectively.

# Decision — nine ADRs

| ID | Decision | One-line rationale |
| --- | --- | --- |
| D1 | Renderer is SVG, not Canvas | Native a11y, future hit-testing for free, trivial export |
| D2 | `roughjs` + `perfect-freehand` as optional peer-deps | Barrel consumers pay nothing; subpath users install explicitly |
| D3 | Isolated subpath with its own bundle `dist/whiteboard/index.js` | Does not inflate the barrel's bundle baseline |
| D4 | Lean JSON v1 validated with Zod | LLM-friendly — ~5 fields per element versus `.excalidraw`'s 68 |
| D5 | Pan/zoom via the SVG `viewBox` | No external libs; clean world coordinates; export carries the correct viewBox |
| D6 | Lazy import of `roughjs` / `perfect-freehand` | Lower TTI |
| D7 | No hit-testing or selection in the MVP | View-only; opt-in via a future prop if a consumer asks |
| D8 | Outside the barrel **and** outside the census | Engines do not inflate the catalogue |
| D9 | Deterministic seed via FNV-1a | Stable snapshots, SSR-safe, no jitter between renders |

# Risks accepted

| Risk | Mitigation |
| --- | --- |
| FNV-1a hash collision — two elements with identical `(type, x, y, w, h, label)` share a seed | ~1 in 4 billion for distinct input. Irrelevant at 5–50 elements. An explicit `seed` is available. |
| RTL / CJK / emoji in hand-drawn fonts | Virgil and Caveat have limited coverage. Automatic fallback to the system font; `fontFamily: "sans"` for full fidelity. |
| Scenes above 5k elements degrade SVG performance | Schema clamps at 5000. Virtualization becomes a future RFC if a consumer asks. |
| `pointer-events: none` prevents text selection | Conscious trade-off (D7). A future `interactive` prop enables it. |
| Peer-dep version drift | pnpm/npm warn on mismatch; the subpath README documents the exact version. rough.js APIs have been historically stable. |
| LLM draws outside `width × height` | Pan/zoom lets the user navigate; `fitOnLoad` recenters automatically. |

Six further edge cases were **must-fix** and shipped inside the plan: the bundle-isolation
regression became an automated gate; `onWheel` uses a manual `addEventListener` with
`{ passive: false }`; the schema enforces `.finite()` (no NaN/Infinity) and `.max(20000)`;
Zod is a real dependency rather than an optional peer; validation callbacks always fire in
`useEffect`, never during render.

# Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Canvas instead of SVG | Better above 5k elements, but a11y requires extra work (every interaction through a matrix), PNG/SVG export needs a canvas round-trip, and CSS theme integration is lost. At the real 5–50 element scale, SVG is sufficient. |
| Accept the `.excalidraw` format | 68 fields per element (`seed`, `versionNonce`, `boundElements`, `frameId`, …) that an LLM does not emit naturally. A lean schema is ~10× simpler to prompt and validate. |
| Embed tldraw | Megabytes of JS, its own state management (Zustand), its own peer-deps. Direct conflict with bundle isolation and the "ship the React shell, not the algorithm" rule. |
| Accept raw SVG from the model | No hand-drawn look without post-processing, no structural validation, and an enormous XSS surface (SVG embeds `<script>`). |

# Quality gates affected

- `validateExportsMap` accepts `./whiteboard` in `ISOLATED_SUBPATHS`.
- `validateBundleSize` gained the EC-1 check: `dist/index.js` must contain no `roughjs` or
  `perfect-freehand` string.
- Barrel bundle baseline **unchanged**.
- Excluded by design from `validateReadmeDrift`, `validateCountConsistency`,
  `validateArchitectureCensus`, and `validateAxeCoverage`.

# Open questions carried forward

- Does the lazy import (D6) actually pay off, or does Suspense overhead exceed the
  code-split gain? Revisitable.
- Should Whiteboard's Ladle stories appear in the public registry? Position: **not in the
  MVP**. Engines do not enter the shadcn registry until a consumer asks for
  `npx shadcn add whiteboard`.

# Outcome

Phases 1–5 implemented: Zod schema, full SVG renderer (rect / ellipse / diamond / line /
arrow / text / freedraw), pan + zoom, `fitOnLoad`, validation fallback. 86 component-specific
tests within 776 total, all green. Ten of ten quality gates green.

Usage reference: [`/engines/whiteboard.md`](/engines/whiteboard.md).
