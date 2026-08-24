/**
 * The shipped stylesheet must size @usetheo/ui's controls on ANY peer version in range.
 *
 * Regression: usetheokit/theokit-ui#50. `@usetheo/ui` ships no CSS, so this package
 * precompiles its utilities by scanning that package's dist at build time — and the
 * selectors Tailwind emits match one arbitrary value each. When 0.22.0's
 * `w-[var(--theo-control-h,2.25rem)]` became `2rem` in 0.35.1, the exact selector stopped
 * matching and the icon Button rendered with no width or height at all. Both versions are
 * inside the peer range this package publishes.
 *
 * Asserted against the real `dist/components.css`, not a fixture, because the defect was in
 * what ships. `quality:gates` runs `build` before `quality:visual`, so the file is current.
 */
import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

const css = readFileSync("dist/components.css", "utf-8");

test("controls are sized on scanned, unscanned and future peer versions", async ({ page }) => {
  await page.setContent(
    `<style>${css}</style>
     <button id="scanned" class="w-[var(--theo-control-h,2.25rem)]">0.22.0</button>
     <button id="unscanned" class="w-[var(--theo-control-h,2rem)]">0.35.1</button>
     <button id="future" class="w-[var(--theo-control-h,9rem)]">unreleased</button>
     <button id="unrelated" class="px-2">control</button>`,
  );

  const width = (id: string) => page.$eval(`#${id}`, (el) => getComputedStyle(el).width);

  // The version we built against: the exact rule Tailwind emitted applies.
  expect(await width("scanned")).toBe("36px");

  // The versions we did not: the attribute-substring net applies. Before it existed these
  // fell through to `width: auto` — the squished control this issue is about.
  expect(await width("unscanned")).not.toBe("auto");
  expect(await width("future")).not.toBe("auto");

  // The net must not reach past the classes it is for.
  expect(await width("unrelated")).not.toBe("36px");
});

test("an exact rule still wins over the net where both apply", async ({ page }) => {
  // The net is emitted before Tailwind's output at equal specificity, so source order
  // decides. Without this, a scanned version would silently take our default instead of its
  // own — the net would fix one drift by introducing another.
  await page.setContent(
    `<style>${css}
     @layer utilities { .w-\\[var\\(--theo-control-h\\,2rem\\)\\] { width: var(--theo-control-h, 2rem); } }
     </style>
     <button id="exact" class="w-[var(--theo-control-h,2rem)]">exact</button>`,
  );

  expect(await page.$eval("#exact", (el) => getComputedStyle(el).width)).toBe("32px");
});
