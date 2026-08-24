#!/usr/bin/env tsx
/**
 * Dogfood QA for the SlideDeck composite engine. Simulates a real consumer:
 *   1. Imports `@theokit/ui/slide-deck` from the local dist.
 *   2. Validates splitDeck behaviour on canonical inputs.
 *   3. Renders deck SSR to verify it doesn't throw + chrome is present.
 *   4. Verifies bundle isolation — barrel does not contain slide-deck markers.
 *
 * Run with: `pnpm build && pnpm tsx scripts/dogfood-slide-deck.ts`
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
  const distPath = new URL("../dist/slide-deck/index.js", import.meta.url).pathname;
  const mod = await import(distPath);
  check("subpath builds and is importable", typeof mod.SlideDeck === "function");
  check("splitDeck exported", typeof mod.splitDeck === "function");
  check("useDeckState exported", typeof mod.useDeckState === "function");
  check("Thumbnails exported", typeof mod.Thumbnails === "function");
  check("PresenterView exported", typeof mod.PresenterView === "function");

  // Scenario 1 — basic markdown split.
  const basicMd = "# Slide A\n\n---\n\n# Slide B\n\n---\n\n# Slide C";
  const basicSplit = await mod.splitDeck(basicMd);
  check("splitDeck splits 3 slides on top-level ---", basicSplit.length === 3);
  check("first slide content correct", basicSplit[0].markdown.includes("Slide A"));
  check("last slide content correct", basicSplit[2].markdown.includes("Slide C"));

  // Scenario 2 — frontmatter strip (D15 / EC-1).
  const fmMd = "---\ntheme: violet-forge\n---\n\n# First\n\n---\n\n# Second";
  const fmSplit = await mod.splitDeck(fmMd);
  check("D15: frontmatter stripped, no phantom empty slide", fmSplit.length === 2);
  check("D15: first slide is 'First' not empty", fmSplit[0].markdown.includes("First"));

  // Scenario 3 — fenced code with --- inside (regression for slide D12).
  const codeMd = "# Heading\n\n```yaml\n---\ntheme: default\n---\n```\n\nDone.";
  const codeSplit = await mod.splitDeck(codeMd);
  check("Fenced code with --- inside is NOT split", codeSplit.length === 1);

  // Scenario 4 — speaker notes extraction.
  const notesMd = "# Slide A\n\n<!-- notes: speaker note A -->\n\n---\n\n# Slide B";
  const notesSplit = await mod.splitDeck(notesMd);
  check("speaker notes extracted from first slide", notesSplit[0].notes === "speaker note A");
  check("no notes on second slide", notesSplit[1].notes === undefined);

  // Scenario 5 — SSR render does not throw.
  const ssrHtml = renderToString(
    React.createElement(mod.SlideDeck, {
      slides: basicMd,
      enableHashRouting: false,
      "aria-label": "Dogfood deck",
    }),
  );
  check("SSR renderToString produces output", ssrHtml.length > 0);
  check("output contains data-theo-slide-deck", ssrHtml.includes("data-theo-slide-deck"));
  check("aria-roledescription propagates", ssrHtml.includes('aria-roledescription="slide deck"'));
  check("aria-label propagates", ssrHtml.includes("Dogfood deck"));

  // Scenario 6 — empty deck does not throw.
  const emptyHtml = renderToString(
    React.createElement(mod.SlideDeck, { slides: [], enableHashRouting: false }),
  );
  check("empty deck SSR does not throw", emptyHtml.includes("data-theo-slide-deck"));

  // Scenario 7 — array form.
  const arrayHtml = renderToString(
    React.createElement(mod.SlideDeck, {
      slides: [{ markdown: "# A" }, { markdown: "# B" }],
      enableHashRouting: false,
    }),
  );
  check("array form SSR does not throw", arrayHtml.includes("data-theo-slide-deck"));

  // Bundle isolation — barrel must not contain slide-deck-specific exports.
  const { readFile } = await import("node:fs/promises");
  const barrel = await readFile(new URL("../dist/index.js", import.meta.url).pathname, "utf-8");
  check("barrel dist/index.js does NOT export SlideDeck", !barrel.includes("SlideDeck"));
  check("barrel dist/index.js does NOT mention slide-deck path", !barrel.includes("slide-deck"));

  // Report.
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  process.stdout.write(`\nDogfood SlideDeck — ${passed}/${results.length} passed\n`);
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
