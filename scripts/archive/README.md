# scripts/archive/

One-off migration scripts that ran during specific remediation sprints.
**Not wired to `package.json`**, not part of any `quality:gates` chain.
Preserved for reference and reproducibility; deleting them would lose
the audit trail.

| Script | Original purpose | Sprint |
|---|---|---|
| `generate-registry-stubs.ts` | Seeded `registry/<name>.json` skeletons when the registry layout was first introduced. | 2026-04 |
| `seed-a11y-tests.ts` | Bootstrapped axe assertions across primitives during the a11y pass. | 2026-04 |
| `add-tailwind-preset-dep.ts` | Patched `registryDependencies` on every `registry:ui`/`registry:block` item to include `tailwind-preset` (BLOCKER-002/003 remediation). Ran once after introducing the preset; 99 descriptors patched, 12 skipped. | 2026-05 |
| `expand-short-descriptions.ts` | Inflated overly-terse descriptions to satisfy registry quality gate during the description audit. | 2026-05 |
| `refine-registry-descriptions.ts` | Editorial pass over registry descriptions. | 2026-05 |

If you need to re-run any of these, copy them out of `archive/`, adjust to current code, and add a `package.json#scripts` entry. Don't import them from operational paths.

Moved here on 2026-05-16 as part of T7.3 (agent-team-audit-fixes plan).
