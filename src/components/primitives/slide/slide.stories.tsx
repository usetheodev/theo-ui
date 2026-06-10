import type { Story } from "@ladle/react";
import { useState } from "react";
import type { SlideValidationError } from "./schema.js";
import { Slide } from "./slide.js";

export default {
  title: "Primitives / Engines / Slide",
};

const hostStyle: React.CSSProperties = {
  width: 800,
  height: 450,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#f8fafc",
};

const smallHost: React.CSSProperties = { ...hostStyle, width: 320, height: 180 };
const largeHost: React.CSSProperties = { ...hostStyle, width: 1280, height: 720 };

// 1 — Happy path: simple markdown with h1 + p + list.
export const HappyPath: Story = () => {
  const md = `# Welcome

A simple slide rendered from CommonMark.

- Bullet one
- Bullet two
- Bullet three`;
  return (
    <div style={hostStyle}>
      <Slide markdown={md} />
    </div>
  );
};

// 2 — GFM table.
export const GfmTable: Story = () => {
  const md = `# Quarterly KPIs

| Metric | Q1 | Q2 | Q3 |
| --- | --- | --- | --- |
| Revenue | 1.2M | 1.5M | 1.8M |
| Users | 8k | 12k | 18k |
| NPS | 42 | 48 | 53 |`;
  return (
    <div style={hostStyle}>
      <Slide markdown={md} />
    </div>
  );
};

// 3 — Frontmatter populated (theme switched via frontmatter).
export const WithFrontmatter: Story = () => {
  const md = `---
theme: violet-forge
lang: en-US
---

# Frontmatter Demo

Theme + language come from the YAML block above. Render uses them automatically.`;
  return (
    <div style={hostStyle}>
      <Slide markdown={md} />
    </div>
  );
};

// 4 — Violet Forge theme via prop.
export const VioletForgeTheme: Story = () => {
  const md = `# Violet Forge

The branded palette running on the slide canvas.

> Tokens live in \`@theokit/ui/slide/themes/violet-forge.css\`.

\`\`\`ts
const slide = <Slide markdown={md} theme="violet-forge" />
\`\`\``;
  return (
    <div style={hostStyle}>
      <Slide markdown={md} theme="violet-forge" />
    </div>
  );
};

// 5 — Aspect 4:3 canvas.
export const AspectFourByThree: Story = () => {
  const md = `# 4:3 Aspect

Logical canvas is 960×720. Container fit recomputes scale.`;
  return (
    <div style={hostStyle}>
      <Slide markdown={md} aspectRatio="4:3" />
    </div>
  );
};

// 6 — Multi-slide input truncated.
export const MultiSlideTruncated: Story = () => {
  const md = `# Slide A

This will render.

---

# Slide B

This is dropped — onValidationError fires with MULTIPLE_SLIDES.`;
  const [errors, setErrors] = useState<SlideValidationError[]>([]);
  return (
    <div>
      <div style={hostStyle}>
        <Slide markdown={md} onValidationError={setErrors} />
      </div>
      <pre style={{ marginTop: 12, fontSize: 12 }}>{JSON.stringify(errors, null, 2)}</pre>
    </div>
  );
};

// 7 — Malformed frontmatter triggers INVALID_FRONTMATTER.
export const MalformedFrontmatter: Story = () => {
  const md = `---
theme: : :
---

# Body still renders`;
  const [errors, setErrors] = useState<SlideValidationError[]>([]);
  return (
    <div>
      <div style={hostStyle}>
        <Slide markdown={md} onValidationError={setErrors} />
      </div>
      <pre style={{ marginTop: 12, fontSize: 12 }}>{JSON.stringify(errors, null, 2)}</pre>
    </div>
  );
};

// 8 — Banned <script> tag is silently stripped.
export const BannedScript: Story = () => {
  const md = `# Safe Title

<script>alert("xss")</script>

Body content survives. Script tag is stripped by mdastToHast (allowDangerousHtml:false).`;
  return (
    <div style={hostStyle}>
      <Slide markdown={md} />
    </div>
  );
};

// 9 — Long content (scales down inside the canvas).
export const LongContent: Story = () => {
  const md = `# Lots of content

This slide contains more than the typical pithy bullet — useful for verifying
that the layout does not overflow the logical canvas when content is dense.

- Item one with a longer description that wraps the line at least once
- Item two with another description spanning some characters
- Item three to balance the eye

\`\`\`ts
function example(input: string): number {
  return input.length * 42;
}
\`\`\`

> Pull-quote-style block to round out the test surface.`;
  return (
    <div style={hostStyle}>
      <Slide markdown={md} />
    </div>
  );
};

// 10 — Custom components override (style <pre> blocks).
export const CustomComponents: Story = () => {
  const md = `# Custom pre block

\`\`\`ts
const x = 1;
\`\`\`

The \`<pre>\` element is rendered by a custom component override.`;
  return (
    <div style={hostStyle}>
      <Slide
        markdown={md}
        components={{
          // biome-ignore lint/suspicious/noExplicitAny: third-party override map
          pre: (props: any) => (
            <pre
              data-custom-pre
              style={{
                background: "#1e293b",
                color: "#f3f4f6",
                padding: 16,
                borderRadius: 8,
              }}
            >
              {props.children}
            </pre>
          ),
        }}
      />
    </div>
  );
};

// 11 — Small container forces scale-down via useSlideFit.
export const SmallContainer: Story = () => {
  const md = "# Small container\n\nThis slide is rendered at scale ≈ 0.25 inside a 320×180 host.";
  return (
    <div style={smallHost}>
      <Slide markdown={md} />
    </div>
  );
};

// 12 — Large container keeps scale at 1 (canvas is 1280×720 logical).
export const LargeContainer: Story = () => {
  const md = "# Large container\n\nHost is exactly 1280×720 — no scale applied.";
  return (
    <div style={largeHost}>
      <Slide markdown={md} />
    </div>
  );
};
