---
type: Architecture Decision Record
title: "ADR-0004 — No literal Tailwind colors in source"
description: A theme switch that silently fails to propagate is a correctness defect, not a style preference; the ban is enforced by a static scanner with suggestions.
tags: [adr, tokens, color, theming, gated, correctness]
sources:
  - id: adr
    resource: "archive:94d9b11:docs/adr/0004-no-literal-tailwind-colors-in-source.md"
    last_modified: "2026-06-03"
  - id: scanner
    resource: "scripts/lib/literal-color-scanner.ts"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

| Field | Value |
| --- | --- |
| Status | **Accepted** |
| Date | 2026-06-03 |
| Related | [ADR-0005](/decisions/adr-0005-oklch-as-canonical-color-format.md), [ADR-0007](/decisions/adr-0007-status-semantic-tokens.md) |

# Context

A 2026-06-03 audit found **12 occurrences across 4 component files** using Tailwind's
literal color scale directly: `bg-emerald-500`, `bg-red-500`, `bg-amber-500`,
`bg-blue-500`, `border-emerald-500/40`, `text-amber-600 dark:text-amber-400`, and others.
These classes resolve to fixed hex values in Tailwind's palette — **independent of the
active theme**.

`@theokit/ui` ships ten built-in themes plus arbitrary consumer themes via `defineTheme()`
/ `registerTheme()`. Each theme defines its own `--success`, `--destructive`, `--warning`,
`--info`, and the `--status-*` group.

**The bug:** when a consumer switches from `violet-forge` to `dracula`, a component using
`bg-emerald-500` still renders `#10B981`. The theme switch silently fails to propagate.
This is a hidden correctness defect, not a stylistic preference — which is why it became a
gate rather than a lint suggestion.

# Decision

Components in `src/components/**` **must** consume semantic tokens. Literal Tailwind color
utility classes are **banned in source**.

The available vocabulary, and the question that picks between the groups, is in
[`/design-system/color-tokens.md`](/design-system/color-tokens.md). The short form: choose
the token that describes **intent**, not appearance. "What is this color *for*?" — never
"what hue do I want?"

# Enforcement

`validateNoLiteralTailwindColors()` in `scripts/validate-quality-gates.ts`, implemented in
`scripts/lib/literal-color-scanner.ts`. It walks `src/components/**` with a regex covering
every Tailwind color utility prefix (`bg`, `text`, `border`, `ring`, `fill`, `stroke`,
`from`, `to`, `via`, `outline`, `divide`, `shadow`, `accent`, `caret`, `decoration`,
`placeholder`) crossed with every Tailwind color family (`red`, `blue`, `green`, `emerald`,
`amber`, `indigo`, `orange`, `pink`, `sky`, `cyan`, `teal`, `lime`, `yellow`, `fuchsia`,
`rose`, `violet`, `purple`, `slate`, `gray`, `zinc`, `neutral`, `stone`).

Each violation reports `file:line`, the matched class, and **1–3 suggested semantic
tokens**. The suggestion engine is what makes the gate teach rather than merely block.

Whitelisted paths (not scanned): `*.test.tsx`, `*.test.ts` (tests may assert raw classes),
`*.stories.tsx`, `*.stories.ts` (stories may demonstrate raw colors), `tests/fixture-*/`
(shadcn upstream fixtures reproduce verbatim).

# Consequences

**Positive.** Theme switching becomes correct by construction — adding a theme cannot
silently break a component. New shadcn copy-paste components are converted once at copy
time. CI output is actionable. The [OKLCH migration](/decisions/adr-0005-oklch-as-canonical-color-format.md)
became a token-definition change only; no component needed touching.

**Negative.** A one-time migration cost (12 violations swept). Authoring friction —
developers must consciously pick a semantic token. Zero false positives observed; the regex
is anchored to handle variant prefixes (`hover:`, `data-[state=open]:`, `[&_svg]:`) and
`-foreground` suffixes.

# Known limitations

- **Template-literal interpolation** (`` `bg-${color}-500` ``) is not detected by the
  static scanner. Zero occurrences measured; revisit only if real frequency emerges.
- **Inline `style={{ background: '#abc' }}`** is out of scope. Tailwind class detection is
  the enforced surface; component review handles the rest.

# Rejected alternatives

| Alternative | Why not |
| --- | --- |
| A biome custom rule | Editor-integrated, but biome 1.9.4 has no easy custom-rule mechanism without a plugin. Rebuild cost exceeds a 50-LOC standalone scanner. |
| Tailwind theme override removing literal color families | Makes violations physically impossible, but breaks `tests/fixture-shadcn-app/` which reproduces upstream verbatim, and removes a useful escape hatch for stories. |
| Dev-only runtime warning | Zero build cost, but catches the bug *after* the fact and misses 100% of CI enforcement. The bug ships if nobody opens the page. |

Static analysis at build time was chosen because correctness is checked **before merge,
not after deploy**.
