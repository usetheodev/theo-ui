---
type: RFC
title: "RFC 0005 — Theming customization + size standardization"
description: defineTheme with hex/rgb helpers, and a size prop on nine more primitives, both shipped without breaking changes.
tags: [rfc, theming, api, sizes, cva]
sources:
  - id: rfc
    resource: "archive:94d9b11:docs/rfcs/0005-theming-and-sizes.md"
    author: "human:paulohenriquevn"
    last_modified: "2026-05-20"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

| Field | Value |
| --- | --- |
| Author | paulohenriquevn |
| Date | 2026-05-20 |
| Status | **Implemented** (2026-05-20) |

# Motivation — measured, not asserted

Two gaps surfaced from the same conversation ("How are sizes configurable? Is theming
easy?") and both ship without breaking changes.

**Sizes.** `grep -lE 'size: {' src/components/primitives/*/[a-z]*.tsx | wc -l` returned
**2** — Button and Avatar. The other ~100 components either hardcoded heights
(`h-10 px-3 text-body-md` everywhere) or accepted no size knob at all. Tokens existed;
tokens-as-classes is not tokens-as-API. Consumers needing a compact form leaked token names
into `className`.

**Theming.** `Theme` requires `ColorScale` × 2 — **29 mandatory keys each** under
TypeScript. No `defineTheme(partial)` helper. No hex/rgb conversion helpers. Documentation
was a single paragraph. No theme builder.

# Decision — four ADRs

| ID | Decision | Why |
| --- | --- | --- |
| D1 | `size: 'sm' \| 'md' \| 'lg'` (default `md`) via CVA on nine primitives | Consensus 3-tier scale across shadcn / Mantine / Chakra; default `md` preserves prior behavior |
| D2 | `defineTheme(partial)` merges with `violetForge`, not the active theme | Pure deterministic function; ignores call-site context |
| D3 | `hex()` / `rgb()` return a string compatible with `ColorScale` | Drop-in; matches the shadcn convention |
| D4 | Live docs preview uses a nested `<ThemeProvider>`, not an iframe | `data-theme` scopes naturally; an iframe complicates communication for zero gain |

Nine primitives gained `size`: `Input`, `Badge`, `Toast`, `Checkbox`, `Switch`, `Card`,
`FormField`, `Textarea`, `Select.Trigger` — bringing the total to eleven.

The `defineTheme` API and its caveats are documented for consumers in
[`/design-system/themes.md`](/design-system/themes.md). The `size` prop's relationship to
the global density default — explicit `size` always wins — arrived one RFC later in
[`/design-system/density.md`](/design-system/density.md).

# The backwards-compat invariant

**When `size` is omitted, the generated classes are byte-identical to the pre-RFC
version.** Snapshot tests in each primitive's test file enforce this. That invariant is
what let a nine-component API change ship as a non-breaking minor.

# Two type-level guards

**EC-1.** `<Input>` uses `Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>` because the
native HTML `size: number` attribute (text-input column count) **collides** with the CVA
`size: 'sm'|'md'|'lg'`. A `@ts-expect-error` test asserts that `<Input size={20}>` no
longer compiles. Without the Omit, the two meanings silently merge and a consumer passing
`size={20}` gets neither behavior.

**EC-2.** `<Select.Trigger>` was confirmed Radix-only (a `<button>` underneath), so no
`SelectHTMLAttributes` Omit was needed. Verified rather than assumed.

# Documented caveats

- **EC-7.** Overriding only `light.primary` without `dark.primary` leaves the two modes on
  different colors — your override in light, violet-forge in dark. Intentional; pass both
  for parity.
- **EC-3.** `defineTheme({ name: 'violet-forge', … })` overrides the built-in.
  `<ThemeProvider>` deduplicates by name and keeps the last writer. This is the documented
  mechanism for monkey-patching a built-in palette in tests or sandboxes.
- **EC-8.** `Card` and `FormField` subparts inherit size from context only; there is no
  subpart-level override.

# Drawbacks

- `dist/index.d.ts` grew **+6.7%** — TypeScript inlines the new CVA size unions across nine
  primitives plus the helper signatures. Baseline rebased. Runtime `dist/index.js` grew
  under 5%, within the gate.
- The nine primitives now share an implicit invariant that `defaultVariants.size === "md"`.
  Forgetting it on a future primitive would silently regress backwards-compat. Pinning it
  would need a unit-level lint — **explicitly out of scope**, and therefore a live risk.
- `defineTheme` always merges with `violetForge`. A different base requires manual
  spreading. A `defineTheme(partial, base)` overload is a 3-line change waiting on a real
  request.

# Rejected alternatives

| Alternative | Why not |
| --- | --- |
| No prop, only utility classes | Leaks token names into consumer markup; breaks the encapsulation primitives exist to provide |
| `size: number` (px-based) | Removes the design-system constraint, produces visual drift between primitives |
| Five-tier scale (`xs` → `xl`) | No consumer request; inflates bundle and testing |
| Theme builder in a separate repo | Latency-to-build exceeds the value |
| `color` / `chroma-js` for hex conversion | ~50 KB combined for 30 lines of known math |
