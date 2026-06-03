# ADR-0004 — No Literal Tailwind Colors in Source

| Field | Value |
| --- | --- |
| Status | **Accepted** |
| Date | 2026-06-03 |
| Plan | `.claude/knowledge-base/plans/theo-ui-community-best-practices-alignment-plan.md` |
| Edge-case review | `.claude/knowledge-base/reviews/edge-cases/theo-ui-community-best-practices-alignment-edge-cases-2026-06-03.md` |
| Related ADRs | ADR-0005 (OKLCH as canonical color format), ADR-0007 (status semantic tokens) |
| Cross-refs | D3, D4, T1.1, T1.2, T1.3 |

## Context and Problem Statement

Audit (2026-06-03) found 12 occurrences across 4 component files where Tailwind's literal color scale was used directly: `bg-emerald-500`, `bg-red-500`, `bg-amber-500`, `bg-blue-500`, `border-emerald-500/40`, `text-amber-600 dark:text-amber-400`, etc. These classes resolve to fixed hex values in Tailwind's color palette — independent of the active theme.

Theo UI ships 10 built-in themes via `<ThemeProvider>` (Violet Forge, Classic Paper, Aurora Terminal, Dracula, GitHub Dark, One Dark, Linear Glass, Anthropic Style, OpenAI Style, Vercel Mono) plus arbitrary consumer themes via `defineTheme()` / `registerTheme()`. Each theme defines its own values for `--success`, `--destructive`, `--warning`, `--info`, and (per ADR-0007) the new `--status-online`, `--status-offline`, `--status-degraded`, `--status-info` group.

**Bug**: when a consumer switches from `violet-forge` to `dracula`, components using `bg-emerald-500` still render `#10B981` — the theme switch silently fails to propagate. This is a hidden correctness defect, not a stylistic preference.

## Decision

Components in `src/components/**` MUST consume semantic tokens. Literal Tailwind color utility classes (`bg-emerald-500`, `text-red-600/40`, `border-amber-500`, `ring-blue-500`, etc.) are **banned in source**.

The token vocabulary available is:

- **Brand**: `bg-primary`, `bg-accent` (with `-deep`, `-glow` variants and `-foreground` companions)
- **Surface**: `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-secondary`
- **Action result (semantic)**: `bg-success`, `bg-destructive`, `bg-warning`, `bg-info`
- **Operational state (status, ADR-0007)**: `bg-status-online`, `bg-status-offline`, `bg-status-degraded`, `bg-status-info`
- **Structural**: `border-border`, `ring-ring`, `bg-input`

Choose the token that describes *intent*, not appearance. "What is this color *for*?" not "What hue do I want?".

## Enforcement

Mechanical gate in `scripts/validate-quality-gates.ts` via `validateNoLiteralTailwindColors()`. Implementation in `scripts/lib/literal-color-scanner.ts` walks `src/components/**` with a regex covering every Tailwind color utility prefix (`bg`, `text`, `border`, `ring`, `fill`, `stroke`, `from`, `to`, `via`, `outline`, `divide`, `shadow`, `accent`, `caret`, `decoration`, `placeholder`) cross-product with every Tailwind color family (`red`, `blue`, `green`, `emerald`, `amber`, `indigo`, `orange`, `pink`, `sky`, `cyan`, `teal`, `lime`, `yellow`, `fuchsia`, `rose`, `violet`, `purple`, `slate`, `gray`, `zinc`, `neutral`, `stone`).

Each violation reports file:line, the matched class, and 1-3 suggested semantic tokens. The gate runs as part of `pnpm quality:structure` (and thus `pnpm quality:gates`).

**Whitelisted paths** (not scanned):

- `*.test.tsx`, `*.test.ts` — tests may assert against raw classes
- `*.stories.tsx`, `*.stories.ts` — Ladle stories may demonstrate raw colors
- `tests/fixture-*/` — shadcn upstream fixtures reproduce verbatim

## Consequences

### Positive

- **Theme switching is correct by construction.** Adding a new theme cannot silently break components.
- **New shadcn copy-paste components are immediately consistent.** Convert `bg-emerald-500` to `bg-success` / `bg-status-online` once at copy time; gate enforces.
- **Diagnostic CI output is actionable.** Each violation includes suggested replacements.
- **Forms a foundation for future palette refactors.** When migrating to OKLCH (ADR-0005), only the token definitions change — components do not need touching.

### Negative

- **Migration cost** absorbed once: T1.2 swept 12 violations to semantic tokens.
- **Authoring friction**: developers must consciously choose a semantic token. Documented in `CONTRIBUTING.md` with examples.
- **False positives**: zero observed today; the regex is anchored to recognize variant prefixes (`hover:`, `data-[state=open]:`, `[&_svg]:`) and `-foreground` suffixes correctly. Edge cases tracked in `scripts/__tests__/literal-color-scanner.test.ts`.

### Known limitations

- **Template-literal interpolation** (``` `bg-${color}-500` ```) is not detected by the static scanner. Zero occurrences measured 2026-06-03; revisit only if real frequency emerges.
- **Inline `style={{ background: '#abc' }}`** is outside scope — Tailwind class detection is the surface enforced. Component-level review and code review handle this.

## Alternatives Considered

### A1 — biome custom rule

Pros: integrated with editor + lint. Cons: biome v1.9.4 has no easy mechanism for custom rules without a plugin; rebuild cost vs the 50-LoC standalone scanner is not justified.

### A2 — Tailwind theme override removing literal color families

Pros: physically impossible to use literal classes. Cons: breaks `tests/fixture-shadcn-app/` which intentionally reproduces upstream verbatim; also removes a useful escape hatch for stories.

### A3 — runtime warning (dev-only)

Pros: zero build cost. Cons: catches the bug after the fact; misses 100% of CI gate enforcement; bug ships if developer doesn't open the page.

We chose static analysis at build time (the gate) because correctness is checked before merge, not after deploy. Combined with the suggestion engine, the developer experience is "lint catches it; suggestion tells me what to use."

## References

- Inspired by community pattern documented in shadcn theming guide (sept/2024 OKLCH migration era).
- Internal: `scripts/lib/literal-color-scanner.ts`, `scripts/__tests__/literal-color-scanner.test.ts`, `scripts/validate-quality-gates.ts > validateNoLiteralTailwindColors`.
- Plan: T1.1 (status tokens), T1.2 (sweep), T1.3 (lint rule), T1.4 (this ADR).
