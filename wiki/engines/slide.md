---
type: Component Reference
title: Slide — markdown to a themed presentation surface
description: The frontmatter schema, public API, error codes, security posture and layout set for the view-only slide engine.
tags: [engine, slide, markdown, api, security, schema]
sources:
  - id: rfc-0002
    resource: "archive:94d9b11:docs/rfcs/0002-slide.md"
  - id: rfc-0004
    resource: "archive:94d9b11:docs/rfcs/0004-slide-rich-content.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# What it is

A **view-only** primitive rendering a markdown string plus optional YAML frontmatter into a
themed surface on a fixed logical canvas (default 1280×720, 16:9). Built to consume LLM
tool-call output (`{"type":"slide","markdown":"..."}`) and render it immediately, safely,
and with a consistent identity.

Single-slide by contract. Multi-slide input is a validation error, not a silent truncation —
use [SlideDeck](/engines/slide-deck.md).

Design rationale: [RFC 0002](/rfcs/0002-slide.md). Rich content:
[RFC 0004](/rfcs/0004-slide-rich-content.md). What to *write*:
[the authoring guide](/engines/slide-authoring-guide.md).

# Install

```bash
pnpm add @theokit/ui \
  mdast-util-from-markdown mdast-util-gfm micromark-extension-gfm \
  mdast-util-to-hast hast-util-sanitize hast-util-to-jsx-runtime yaml
```

Seven optional peer-deps. Barrel consumers install none of them.

# API

```ts
export interface SlideProps {
  markdown: string;
  theme?: "default" | "violet-forge";
  aspectRatio?: "16:9" | "4:3" | { width: number; height: number };
  minScale?: number;
  maxScale?: number;
  plugins?: SlidePlugin[];
  onValidationError?: (errors: SlideValidationError[]) => void;
  components?: Record<string, React.FC<any>>;
  "aria-label"?: string;
  className?: string;
}
```

```tsx
import { Slide } from "@theokit/ui/slide";
import "@theokit/ui/slide/themes/default.css";

<Slide markdown={md} theme="violet-forge" />
```

# Frontmatter schema

All fields optional. **Unknown keys are rejected** with `INVALID_FRONTMATTER` and the
offending field path.

| Field | Type |
| --- | --- |
| `theme` | `"default" \| "violet-forge"` |
| `layout` | `"default" \| "title" \| "two-column" \| "image-right" \| "image-left" \| "code-output" \| "section"` |
| `backgroundImage` | http(s) URL, ≤ 500 000 chars. **`data:` URLs rejected.** |
| `backgroundGradient` | String starting with `linear-`, `radial-`, or `conic-gradient(` |
| `header` / `footer` | Plain text ≤ 200 chars |
| `paginate` | `true \| "skip" \| "hold"` |
| `lang` | BCP-47 (`en`, `pt-BR`) |
| `color` / `backgroundColor` | CSS color ≤ 64 chars |

# Error codes

`parseSlide` **never throws.** It always renders something and reports issues in `errors[]`,
each `{ code, path, message, got }`.

| Code | Meaning | Fix |
| --- | --- | --- |
| `INVALID_FRONTMATTER` | A field has the wrong type or value | Read `path` and `message` — the message includes accepted values |
| `FRONTMATTER_TOO_LARGE` | Raw frontmatter > 10 KB | Move content into the body |
| `CONTENT_TOO_LARGE` | Body > 50 KB | Split into multiple slides |
| `MULTIPLE_SLIDES` | Top-level `---` in `<Slide>` input | Use `<SlideDeck>` |
| `BANNED_TAG` | A sanitizer-banned tag was stripped | Use a safe markdown alternative |
| `BANNED_ATTRIBUTE` | A banned attribute was stripped | Same |
| `INVALID_ASPECT_RATIO` | `aspectRatio` prop non-finite or ≤ 0 | Consumer-side fault; falls back to 16:9 |
| `PLUGIN_ERROR` | A Tier 2 plugin threw | Content stays as plain markdown |
| `PLUGIN_PEER_DEP_MISSING` | A plugin's peer-dep is not installed | Consumer setup |
| `MARPIT_BG_UNSAFE_URL` | `![bg](url)` is `javascript:`, `data:`, or malformed | Use an https URL |

This table is the engine's actual contract with an agent. Because errors are codes rather
than exceptions, a model that emits `<script>` receives `BANNED_TAG` and can self-correct
on the next turn — the reason the sanitizer reports a diff instead of silently filtering.

# Layouts

Seven CSS grid templates, selected via frontmatter `layout:`.

| Layout | Shape |
| --- | --- |
| `default` | Vertical flow, no grid |
| `title` | Centered hero — cover slides |
| `two-column` | Equal 50/50 split |
| `image-right` | Text left (1.5fr), single `<img>` right (1fr) |
| `image-left` | Mirrored |
| `code-output` | Code block left (1.2fr), prose right (1fr) |
| `section` | Full-bleed chapter divider, tinted backdrop, centered |

# Security posture

- HTML stripped per `hast-util-sanitize.defaultSchema`: no `<script>`, `<iframe>`,
  `<object>`, `<embed>`, `<form>`, `<input>`, `<style>`, `<link>`.
- `clobberPrefix: "user-content-"` prefixes user-supplied IDs, preventing DOM clobbering.
- Frontmatter capped at 10 KB, body at 50 KB.
- Background URLs validated http/https only — `data:` rejected to prevent DoS via base64
  payloads.
- Sanitize runs **after** every plugin transform. A plugin can widen the allow-list
  explicitly, never bypass it.

# Rendering behavior

- Fixed logical canvas with Reveal.js-style scale-to-fit — layout is predictable and the
  transform is GPU-accelerated, independent of host dimensions.
- Real React VDOM via `hast-util-to-jsx-runtime` — SSR-safe, DevTools-introspectable, and
  `components` overrides work.
- Normal DOM scoped by `.theo-slide`, so Violet Forge tokens inherit naturally. No Shadow
  DOM.
- Slide detection uses the mdast `thematicBreak` node, never a regex — so a `---` inside a
  fenced code block never splits a slide.

# JSON Schema for tool calling

```ts
import { slideFrontmatterJsonSchema } from "@theokit/ui/slide";

const tool = {
  name: "render_slide",
  description: "Render a presentation slide.",
  input_schema: {
    type: "object",
    properties: {
      frontmatter: slideFrontmatterJsonSchema,
      body: { type: "string", description: "CommonMark + GFM markdown body" },
    },
    required: ["body"],
  },
};
```

Auto-derived from Zod, so it stays in sync with the runtime validator.
