/**
 * Shared guard for the three suites that assert against the BUILT `dist/`:
 * `tests/contract`, `tests/rsc-smoke` and `tests/types`.
 *
 * Those suites cannot run before a build exists, so they skip when `dist/` is
 * absent — otherwise the pre-build `pnpm test` sweep would be red for a reason
 * that is not a defect.
 *
 * The danger is that the same skip also applies at the publish gate, where a
 * missing `dist/` means the gate passes while asserting nothing. That is a
 * silently vacuous gate: the worst possible outcome for a check whose whole job
 * is to protect the tarball.
 *
 * `THEOKIT_REQUIRE_DIST=1` — set by `pnpm test:contract`, which always runs
 * after `pnpm build` — turns the silent skip into a hard failure.
 */
export const distRequired = process.env.THEOKIT_REQUIRE_DIST === "1";

/**
 * Fail loudly when a dist artifact the caller is about to assert on is missing
 * AND the caller is running as the publish gate. No-op otherwise, leaving the
 * caller free to skip.
 */
export function assertDistPresent(present: boolean, artifact: string): void {
  if (distRequired && !present) {
    throw new Error(
      `${artifact} is missing while THEOKIT_REQUIRE_DIST=1. Run \`pnpm build\` before ` +
        "the publish gate — refusing to report a dist contract suite as passing when it " +
        "would assert nothing.",
    );
  }
}
