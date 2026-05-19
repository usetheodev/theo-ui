/**
 * Rich-content showcase scenes for the playground.
 *
 * Each scene exercises one or more rich-content features from RFC 0004:
 *   Tier 1 — alerts, layouts, background, header/footer/paginate, Marpit
 *   Tier 2 — Shiki, KaTeX, Mermaid, emoji
 */

export interface SlideRichScene {
  id: string;
  title: string;
  description: string;
  markdown: string;
  /** Indicates which Tier 2 plugins this scene depends on. */
  plugins?: Array<"shiki" | "math" | "mermaid" | "emoji">;
}

export const SLIDE_RICH_SCENES: SlideRichScene[] = [
  {
    id: "alert-all-types",
    title: "GFM Alerts — five callout types",
    description:
      "Tier 1 baked into the Slide primitive. `> [!TYPE]` blockquotes become themed `<aside>` callouts.",
    markdown: `# GFM Alerts

> [!NOTE]
> Useful information that users should know.

> [!TIP]
> Helpful advice that improves outcomes.

> [!IMPORTANT]
> Crucial detail necessary for understanding.

> [!WARNING]
> Urgent info that needs immediate attention.

> [!CAUTION]
> Negative potential consequences of an action.`,
  },
  {
    id: "layout-title",
    title: "Layout — title hero",
    description: "Frontmatter `layout: title` centers content with hero typography.",
    markdown: `---
layout: title
---
# Q2 Release Notes

## Live in production — May 19, 2026`,
  },
  {
    id: "layout-two-column",
    title: "Layout — two-column grid",
    description: "Equal split grid; first block left, rest right.",
    markdown: `---
layout: two-column
---
## Build & Deploy
The pipeline produces deterministic artifacts via Railpack-derived BuildKit
recipes. Cosign signs every image; ArgoCD reconciles to KEDA-scaled pods.

## Observe & Iterate
Grafana captures latency p50/p95, error rates, and resource ceilings — all
wired into the deck's runtime metric proof points.`,
  },
  {
    id: "layout-image-right",
    title: "Layout — image right",
    description: "Text left (1.5fr), single image right (1fr).",
    markdown: `---
layout: image-right
---
## The cycle in one slide

TheoCode plans, codes, and ships. TheoCloud handles the runtime so you
don't have to think about Kubernetes, BuildKit, ArgoCD, or Cosign — just
\`theo deploy\` and the URL.

![cycle diagram](https://images.unsplash.com/photo-1518770660439-4636190af475?w=600)`,
  },
  {
    id: "layout-section",
    title: "Layout — section (chapter divider)",
    description: "Full-bleed banner with tinted backdrop for major transitions.",
    markdown: `---
layout: section
---
# Part II

Customer Journey`,
  },
  {
    id: "background-image",
    title: "Background — remote image",
    description: "`backgroundImage` URL is sanitized (http/https only; data: rejected per EC-7).",
    markdown: `---
backgroundImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600"
color: "#fff"
---
# usetheo
Build. Deploy. Iterate.`,
  },
  {
    id: "background-gradient",
    title: "Background — CSS gradient",
    description: "`backgroundGradient` validated by prefix; renders as inline style.",
    markdown: `---
backgroundGradient: "linear-gradient(135deg, #6366f1 0%, #c084fc 100%)"
color: "#fff"
---
# Violet Forge

The design system, in one slide.`,
  },
  {
    id: "marpit-bg",
    title: "Marpit `![bg](url)` directive",
    description:
      "Image with alt starting `bg` is extracted from the body and applied as the slide background. Drop into ParsedSlide.extractedBackground (D18).",
    markdown: `![bg cover](https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=1600)

# Field of conifers

Background applied via Marpit-style \`![bg cover](url)\` syntax.`,
  },
  {
    id: "header-footer-paginate",
    title: "Chrome — header, footer, paginate",
    description: "Three frontmatter overlays positioned around the canvas.",
    markdown: `---
header: "Acme Corporation — confidential"
footer: "© 2026 Acme. All rights reserved."
paginate: true
---
# Performance review

| metric | Q1 | Q2 |
| --- | --- | --- |
| latency p50 | 320 ms | 180 ms |
| error rate | 0.4 % | 0.05 % |
| MRR growth | 12 % | 23 % |`,
  },
  {
    id: "emoji-shortcodes",
    title: "Tier 2 — emoji shortcodes (zero peer-deps)",
    description: "`:rocket:`, `:fire:`, `:tada:` → Unicode emoji. Skipped inside code blocks.",
    plugins: ["emoji"],
    markdown: `# Launch day :rocket:

We're shipping! :fire:

:tada: Special thanks to:
- :sparkles: Marina
- :coffee: Rafael
- :hundred: Bruno

\`\`\`python
# Shortcodes INSIDE code blocks are preserved:
def greet(name: str) -> str:
    return f":hello: {name}"
\`\`\``,
  },
  {
    id: "math",
    title: "Tier 2 — KaTeX math",
    description: "`$inline$` and `$$block$$` rendered via real KaTeX.",
    plugins: ["math"],
    markdown: `# Mass-energy equivalence

The classical equation Einstein published in 1905:

$$E = mc^2$$

Where $m$ is rest mass and $c$ is the speed of light in vacuum
($c \\approx 3 \\times 10^8 \\, m/s$). The dimensional analysis: $[kg][m/s]^2 = [J]$.

Quadratic formula:

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$`,
  },
  {
    id: "shiki",
    title: "Tier 2 — Shiki syntax highlighting",
    description: "Real Shiki dual-theme highlighting (github-light / github-dark).",
    plugins: ["shiki"],
    markdown: `# Code with real Shiki highlighting

\`\`\`ts
import { Slide } from "@usetheo/ui/slide";
import { shikiPlugin } from "@usetheo/ui/slide/plugins/shiki";

const plugins = [shikiPlugin({ langs: ["ts", "python"] })];
export default function App() {
  return <Slide markdown={md} plugins={plugins} />;
}
\`\`\`

\`\`\`python
def fib(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
\`\`\``,
  },
  {
    id: "mermaid",
    title: "Tier 2 — Mermaid diagrams",
    description: "`\\`\\`\\`mermaid` fenced block becomes a lazy-loaded SVG diagram (client-only).",
    plugins: ["mermaid"],
    markdown: `# Deployment flow

\`\`\`mermaid
graph LR
  A[Code] --> B(theo deploy)
  B --> C{Build OK?}
  C -->|yes| D[Live URL]
  C -->|no| E[Rollback]
  D --> F[Metrics]
\`\`\``,
  },
  {
    id: "all-features",
    title: "Combined — Tier 1 + Tier 2 in one slide",
    description: "Stacks alerts, layout, header/footer, paginate, emoji, math, shiki, mermaid.",
    plugins: ["emoji", "math", "mermaid", "shiki"],
    markdown: `---
layout: default
header: "Acme — Q2 release"
footer: "May 19, 2026"
paginate: true
backgroundGradient: "linear-gradient(180deg, transparent 0%, color-mix(in srgb, currentColor 4%, transparent) 100%)"
---
# Q2 launch :rocket:

> [!IMPORTANT]
> Migration window opens Friday 22h UTC.

Quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.

\`\`\`ts
const greet = (name: string) => \`Hello, \${name}\`;
\`\`\``,
  },
];
