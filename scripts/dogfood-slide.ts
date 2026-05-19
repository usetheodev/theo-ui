#!/usr/bin/env tsx
/**
 * Dogfood QA for the Slide subpath. Simulates a real consumer:
 *   1. Imports `@usetheo/ui/slide` resolved via the local dist (after `pnpm build`).
 *   2. Feeds it markdown a Claude / GPT agent could realistically emit.
 *   3. Renders to a static HTML string via React's renderToString (SSR path).
 *   4. Asserts the output is well-formed and contains expected elements.
 *   5. Verifies bundle isolation — barrel does not vendor markdown stack.
 *
 * Run with: `pnpm build && pnpm tsx scripts/dogfood-slide.ts`
 */
import * as React from "react";
import { renderToString } from "react-dom/server";

interface ResultEntry {
  name: string;
  ok: boolean;
  detail?: string;
}

const results: ResultEntry[] = [];

function check(name: string, condition: boolean, detail?: string): void {
  results.push({ name, ok: condition, detail });
}

async function main(): Promise<void> {
  // Import from the BUILT subpath, not the source. This proves the bundle,
  // types, and exports actually work end-to-end.
  const distPath = new URL("../dist/slide/index.js", import.meta.url).pathname;
  const mod = await import(distPath);
  check("subpath builds and is importable", typeof mod.Slide === "function");

  // Scenario 1 — Happy path markdown an LLM emits for an "explain this PR" slide.
  const happyMarkdown = `---
theme: default
lang: en-US
---

# Pull Request #142

Adds rate limiting to the public API. Uses a token-bucket algorithm with:

- **Refill rate:** 100 req/sec per client
- **Burst capacity:** 200 tokens
- Sliding-window guard against clock skew

Falls back to a deny response when the bucket is empty.`;

  const happyHtml = renderToString(
    React.createElement(mod.Slide, {
      markdown: happyMarkdown,
      "aria-label": "PR 142 explanation",
    }),
  );
  // Note: initial SSR render returns the section wrapper; parsed tree fills in client-side.
  // We assert the wrapper + theme attribute + aria contract here.
  check("happy path SSR produces output", happyHtml.length > 0);
  check("output contains <section>", happyHtml.includes("<section"));
  // <section> implicitly carries role=region; aria-roledescription distinguishes slide.
  check("aria-roledescription propagates", happyHtml.includes('aria-roledescription="slide"'));
  check("aria-label propagates", happyHtml.includes("PR 142 explanation"));
  check(
    "data-theo-slide-theme attribute set",
    happyHtml.includes('data-theo-slide-theme="default"'),
  );

  // Scenario 2 — Multi-slide input (top-level ---) must NOT crash; render only first slide.
  const multiSlideMarkdown = `# Slide A

Content A.

---

# Slide B

Content B.`;

  const multiHtml = renderToString(
    React.createElement(mod.Slide, {
      markdown: multiSlideMarkdown,
      onValidationError: () => {
        // SSR does not invoke useEffect — validated separately via slide.test.tsx.
      },
    }),
  );
  check("multi-slide input does not throw during SSR", multiHtml.includes("<section"));
  // onValidationError is invoked on the client (useEffect), not during SSR.
  // The dogfood here proves SSR safety; the callback assertion lives in slide.test.tsx.

  // Scenario 3 — Frontmatter with banned theme value. Must render with default fallback and not crash.
  const badThemeMarkdown = `---
theme: nonexistent
---

# Heading`;
  const badThemeHtml = renderToString(
    React.createElement(mod.Slide, { markdown: badThemeMarkdown }),
  );
  check("invalid theme value does not throw during SSR", badThemeHtml.includes("<section"));

  // Scenario 4 — Empty body (frontmatter only).
  const emptyBodyMarkdown = `---
theme: violet-forge
---
`;
  const emptyHtml = renderToString(React.createElement(mod.Slide, { markdown: emptyBodyMarkdown }));
  check("empty body does not throw during SSR", emptyHtml.includes("<section"));

  // Scenario 5 — markdown containing <script> tag. Sanitize must strip; SSR must not crash.
  const scriptMarkdown = `# Title

<script>alert("xss")</script>

Body text.`;
  const scriptHtml = renderToString(React.createElement(mod.Slide, { markdown: scriptMarkdown }));
  check("script-containing markdown does not throw during SSR", scriptHtml.includes("<section"));
  // SSR initial render does NOT yet contain the parsed body (async parse on client), so we don't
  // assert presence/absence of <script> in the SSR output. Banned-tag stripping is covered by
  // unit tests on parseSlide and by the BANNED_TAG callback contract (slide.test.tsx).

  // Bundle isolation runtime-metric proof — D3 of the slide plan.
  const { readFile } = await import("node:fs/promises");
  const barrel = await readFile(new URL("../dist/index.js", import.meta.url).pathname, "utf-8");
  for (const forbidden of [
    "mdast-util-from-markdown",
    "mdast-util-gfm",
    "micromark-extension-gfm",
    "mdast-util-to-hast",
    "hast-util-sanitize",
    "hast-util-to-jsx-runtime",
  ]) {
    check(`barrel dist/index.js does NOT mention ${forbidden}`, !barrel.includes(forbidden));
  }

  // Report.
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  process.stdout.write(`\nDogfood Slide — ${passed}/${results.length} passed\n`);
  for (const r of results) {
    process.stdout.write(`  ${r.ok ? "✓" : "✗"} ${r.name}${r.detail ? ` — ${r.detail}` : ""}\n`);
  }
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
