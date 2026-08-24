---
type: Component Reference
title: Whiteboard — JSON to hand-drawn SVG
description: The declarative scene schema, sanity limits, public API, and peer-dep requirements for the view-only whiteboard engine.
tags: [engine, whiteboard, svg, schema, api, llm-output]
sources:
  - id: rfc-0001
    resource: "archive:94d9b11:docs/rfcs/0001-whiteboard.md"
  - id: schema
    resource: "src/components/primitives/whiteboard/schema.ts"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# What it is

A **view-only** primitive rendering declarative JSON into SVG with an Excalidraw-style
hand-drawn aesthetic. Built to consume LLM tool-call output
(`{"type":"whiteboard","data":{...}}`) and display it immediately.

**Not an editor.** No toolbar, no selection, no hit-testing, no undo. Render plus pan/zoom
for navigation, nothing more. The design rationale is [RFC 0001](/rfcs/0001-whiteboard.md).

# Install

```bash
pnpm add @theokit/ui roughjs perfect-freehand
```

Both are **optional peer-deps** — barrel consumers pay nothing.

# API

```tsx
import { Whiteboard, type WhiteboardData } from "@theokit/ui/whiteboard";

const scene: WhiteboardData = { version: 1, width: 800, height: 600, elements: [...] };

<Whiteboard
  data={scene}
  initialZoom={1}
  initialCenter={[400, 300]}
  fitOnLoad
  onValidationError={(errors) => console.log(errors)}
  aria-label="Architecture diagram"
/>
```

# Schema — JSON v1

A discriminated union on `type`. Seven element types: `rect`, `ellipse`, `diamond`, `line`,
`arrow`, `text`, `freedraw`.

```jsonc
{
  "version": 1,
  "width": 800,
  "height": 600,
  "background": "#fff",
  "elements": [
    { "type": "rect", "x": 100, "y": 80, "w": 200, "h": 100, "label": "User",
      "stroke": "#000", "fill": "#fef3c7" },
    { "type": "ellipse", "x": 400, "y": 80, "w": 160, "h": 100, "label": "DB" },
    { "type": "arrow", "x": 300, "y": 130, "to": [400, 130], "label": "query" },
    { "type": "text", "x": 100, "y": 260, "text": "Auth flow", "fontSize": 18,
      "align": "left" },
    { "type": "diamond", "x": 200, "y": 400, "w": 140, "h": 80, "label": "Decision?" },
    { "type": "line", "x": 0, "y": 500, "to": [800, 500] },
    { "type": "freedraw", "x": 0, "y": 0, "points": [[10,10],[50,40],[100,30]] }
  ]
}
```

Roughly five fields per element, versus 68 in the `.excalidraw` format. That ratio is the
point: an LLM emits this naturally, and it is ~10× simpler to prompt and validate.

## Sanity limits (enforced by Zod)

| Field | Limit |
| --- | --- |
| Scene `width` / `height` | 1..20000 |
| `strokeWidth` | 0..50 |
| `fontSize` | 0..500 |
| `label` | ≤ 500 chars |
| `text` | ≤ 5000 chars |
| `freedraw.points` | 2..5000 |
| `elements` | ≤ 5000 |
| All numerics | `.finite()` — NaN and Infinity rejected |

The `.finite()` constraint and the dimension caps are not cosmetic. A model emitting `NaN`
for a coordinate, or a scene of `1e9 × 1e9`, produces either an invisible render or a
browser hang — both indistinguishable from "the component is broken".

# Behavior

Rendering
: SVG, not Canvas. Native accessibility, trivial export, CSS theme integration.

Pan and zoom
: Via the SVG `viewBox`, so no external library and exports carry the correct viewBox. The
  wheel handler attaches through a manual `addEventListener` with `{ passive: false }` —
  React's synthetic `onWheel` is passive and cannot `preventDefault`.

Determinism
: The hand-drawn jitter seeds from FNV-1a over element properties, so renders are
  byte-stable across reloads and SSR. Pass an explicit `seed` to override.

Validation
: `onValidationError` fires from `useEffect`, never during render. Invalid scenes render
  what they can rather than throwing.

`fitOnLoad`
: Recenters the viewport on the actual content — the recovery path when a model draws
  outside the declared `width × height`.

# Known limitations

- Text is not selectable (`pointer-events: none`) — a conscious trade-off of the view-only
  design.
- Hand-drawn fonts (Virgil, Caveat) have limited RTL and CJK coverage; the component falls
  back to the system font. Use `fontFamily: "sans"` for full fidelity.
- Above ~5000 elements SVG performance degrades; the schema clamps there.
