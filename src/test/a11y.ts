// Shared helpers for accessibility assertions. Components import this in their
// `*.test.tsx` to add an `axe` smoke without re-importing vitest-axe each time.
//
// Why it lives here: the setup file (`src/test/setup.ts`) already extends the
// expect API with vitest-axe matchers, so a primitive's test only needs to
// receive a `container` and assert. The HOC structure also gives us one place
// to tune axe options (e.g. `rules`) project-wide.

import { render } from "@testing-library/react";
import type { JSX } from "react";
import { expect } from "vitest";
import { axe } from "vitest-axe";

/**
 * Render `ui` and assert `axe` reports zero violations against the resulting
 * subtree. Use inside `it("has no a11y violations", async () => { ... })`.
 *
 * The default ruleset is axe-core's WCAG 2.1 AA + best-practice tags.
 *
 * Example:
 *   it("has no a11y violations", async () => {
 *     await expectNoA11yViolations(<Button>Deploy</Button>);
 *   });
 */
export async function expectNoA11yViolations(ui: JSX.Element): Promise<void> {
  const { container } = render(ui);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}
