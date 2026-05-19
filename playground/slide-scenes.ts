/**
 * Slide demo scenes for the playground. Each scene exercises a different
 * surface of the `<Slide>` primitive: happy path, GFM, themes, edge cases,
 * aspect ratios, container fit. Mirrors the structure used by the Whiteboard
 * demo (`playground/whiteboard-scenes.ts`).
 */
import type { SlideTheme } from "@usetheo/ui/slide";

export interface SlideScene {
  id: string;
  title: string;
  description: string;
  markdown: string;
  theme?: SlideTheme;
  aspectRatio?: "16:9" | "4:3" | { width: number; height: number };
  /** Hint shown in the card chrome — does NOT change behaviour. */
  expectError?: boolean;
}

export const SLIDE_SCENES: SlideScene[] = [
  {
    id: "happy-path",
    title: "Happy path",
    description:
      "Simple CommonMark — heading, paragraph, bulleted list. The bread and butter of an LLM-emitted slide.",
    markdown: `# Welcome to TheoUI

The \`<Slide>\` primitive renders markdown + YAML frontmatter into a themed surface.

- Single-slide only
- 16:9 logical canvas (1280×720)
- Scale-to-fit via ResizeObserver`,
  },
  {
    id: "gfm-table",
    title: "GFM table",
    description:
      "GitHub Flavored Markdown extensions — tables render with semantic <table> markup.",
    markdown: `# Quarterly KPIs

| Metric  | Q1    | Q2    | Q3    |
| ------- | ----- | ----- | ----- |
| Revenue | 1.2M  | 1.5M  | 1.8M  |
| Users   | 8k    | 12k   | 18k   |
| NPS     | 42    | 48    | 53    |

Numbers are illustrative — not real revenue.`,
  },
  {
    id: "frontmatter-driven",
    title: "Frontmatter-driven theme",
    description:
      "Theme + language come from the YAML frontmatter block, not from props. The slide is fully self-describing.",
    markdown: `---
theme: violet-forge
lang: en-US
---

# Frontmatter Demo

The block above is a **YAML mapping**. Recognised keys: \`theme\`, \`lang\`, \`color\`, \`backgroundColor\`. Anything else triggers \`INVALID_FRONTMATTER\`.`,
  },
  {
    id: "violet-forge",
    title: "Violet Forge theme (prop)",
    description: "Theme switched via the prop. Same content, different palette.",
    theme: "violet-forge",
    markdown: `# Violet Forge

The branded palette running on the slide canvas.

> Tokens live in \`@usetheo/ui/slide/themes/violet-forge.css\`.

\`\`\`ts
<Slide markdown={md} theme="violet-forge" />
\`\`\``,
  },
  {
    id: "aspect-4x3",
    title: "4:3 canvas",
    description: "Logical canvas switches to 960×720 (4:3). Container fit re-clamps the scale.",
    aspectRatio: "4:3",
    markdown: `# 4:3 Aspect

Older projector ratio. Layout reflows naturally because the canvas is bigger on the vertical axis.`,
  },
  {
    id: "code-with-dashes",
    title: "Fenced code with --- inside",
    description:
      "Multi-slide detection uses mdast `thematicBreak` (ADR D12). A `---` inside a fenced code block does NOT trigger MULTIPLE_SLIDES.",
    markdown: `# Writing frontmatter

You can put YAML at the top of a slide like this:

\`\`\`yaml
---
theme: default
lang: pt-BR
---
\`\`\`

The triple-dash inside the fence stays as code.`,
  },
  {
    id: "multi-slide-truncated",
    title: "Multi-slide (truncated)",
    description:
      "Input contains a top-level horizontal rule. Only the FIRST slide renders; onValidationError fires with MULTIPLE_SLIDES.",
    expectError: true,
    markdown: `# Slide A

This slide renders.

---

# Slide B

This slide is dropped — promotion to <SlideDeck> is a future composite.`,
  },
  {
    id: "malformed-frontmatter",
    title: "Malformed frontmatter",
    description:
      "Broken YAML in the frontmatter. The component never throws — body still renders, callback receives INVALID_FRONTMATTER.",
    expectError: true,
    markdown: `---
theme: : :
---

# Body still renders

The YAML above is junk. Sanitize + parse pipeline still produces a valid React tree.`,
  },
  {
    id: "banned-script",
    title: "<script> tag (stripped)",
    description:
      "Raw HTML script tag in markdown body. mdastToHast drops it (allowDangerousHtml:false). Sanitize would catch it anyway.",
    markdown: `# Safe Title

<script>alert("xss")</script>

Body content survives. Script tag is stripped before reaching the React tree.`,
  },
  {
    id: "long-content",
    title: "Dense content",
    description: "Longer payload — exercises typography spacing and the auto-scale boundary.",
    markdown: `# Lots of content

This slide carries dense content to verify the layout doesn't overflow the logical canvas.

- Item one with a longer description that wraps the line at least once on most aspect ratios.
- Item two with another description spanning some characters.
- Item three to balance the eye.

\`\`\`ts
function example(input: string): number {
  return input.length * 42;
}
\`\`\`

> A pull-quote-style block to round out the test surface.`,
  },
  {
    id: "links-and-emphasis",
    title: "Links + emphasis",
    description:
      "Inline emphasis (bold/italic/strike), code spans, and autolinks. All sanitized by the default hast schema.",
    markdown: `# Inline formatting

Click [the docs](https://usetheo.dev) for details. Visit https://github.com/marp-team/marpit for prior art.

- **bold**, *italic*, ~~strike~~
- Inline \`code\` block
- A line with multiple **emphasis** kinds *combined* together.`,
  },
];
