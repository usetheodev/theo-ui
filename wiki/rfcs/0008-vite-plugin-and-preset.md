---
type: RFC
title: "RFC 0008 — ./vite-plugin and ./preset subpath exports"
description: Implementing exactly the contract TheoKit specified for zero-config Tailwind v4 wiring, plus the follow-up that fixed v3-shaped artifacts shipping under a v4 peer declaration.
tags: [rfc, vite, tailwind, cross-repo, contract, bugfix]
sources:
  - id: rfc
    resource: "git:94d9b11:docs/rfcs/0008-vite-plugin-and-preset.md"
    author: "human:paulohenriquevn"
    last_modified: "2026-05-22"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

| Field | Value |
| --- | --- |
| Author | paulohenriquevn |
| Date | 2026-05-22 |
| Status | **Implemented** (2026-05-22) |

# Summary

Two subpath exports so TheoKit's `integrateUseTheoUI()` Vite plugin can auto-wire Tailwind
v4 with zero further consumer configuration:

- **`@theokit/ui/vite-plugin`** — a default-export factory returning **one** Vite `Plugin`.
  Dynamic-imports `@tailwindcss/vite` v4 and chains it into the consumer's plugin array via
  the `config()` hook. Degrades via `console.warn` — **never throws** — when the peer is
  missing.
- **`@theokit/ui/preset`** — a Tailwind preset mirroring `tokens.css`.

**This RFC implements exactly the contract TheoKit specified — no more, no less.** Before
it, TheoKit's detection unconditionally returned `[]` and consumers fell back to
hand-authoring a `tailwind.config.ts`.

# Decision — eight ADRs

| ID | Decision | Why |
| --- | --- | --- |
| D1 | Return **one** `Plugin` object, not `Plugin[]` | TheoKit's validator runs `'name' in plugin && typeof plugin.name === 'string'`. An array fails that check. The contract is firm. |
| D2 | Dynamic import via a **stored specifier** | Vite's import-analysis pass tries to resolve static `import()` even with `/* @vite-ignore */`. Holding the specifier in a variable defers resolution to runtime, where the optional peer may be absent. |
| D3 | `tailwindcss`, `@tailwindcss/vite`, `vite` as **optional** peer-deps | Standalone consumers should not be forced into Tailwind v4 |
| D4 | `vite` peer is `^6.0.0 \|\| ^7.0.0` | TheoKit ships on Vite 6+. The Plugin API has been stable since 3.x, so this is the framework-side requirement, not a technical floor. |
| D5 | `./preset` delegates to `src/styles/tailwind-preset.ts` | Single source of truth; the v3 registry preset and the v4 import preset stay aligned |
| D6 | `config()` returns `{ plugins }` despite Vite 5+ types forbidding it | Vite tightened the signature to nudge authors toward `Plugin[]` factories, but the runtime still honors the merge. The contract requires one plugin object, so the cast is honest and documented. |
| D7 | Virtual module `virtual:@theokit/ui/library-sources.css` for `@source` | Tailwind v4 `@source` is CSS-side; a virtual module is the cleanest hook |
| D8 | Minor bump | Convention from RFCs 0005–0007: minor on API-surface additions |

D2 is the non-obvious one. A naive `await import("@tailwindcss/vite")` would fail at
**build** time in a project that legitimately does not have the optional peer, because
Vite's static analysis resolves it eagerly. Storing the specifier in a variable is what
makes "optional" actually optional.

# Validation

TheoKit runs four checks against the published artifact:

- [x] `typeof ui.default === 'function'`
- [x] `typeof plugin === 'object' && plugin !== null`
- [x] `Array.isArray(plugin) === false`
- [x] `'name' in plugin && typeof plugin.name === 'string'`

Locally: 11 unit tests covering factory shape, name slug, `config()` hook presence,
graceful peer-missing degradation, the `tailwind: false` opt-out, and virtual-module
resolution. Plus 8 tests on the preset covering shape, content paths, and token coverage.

The producer-side pre-publish mirror of these checks is
[ADR 0001](/decisions/adr-0001-vite-plugin-subpath-contract.md).

# Follow-up — v4-native CSS artifacts

The initial release declared `tailwindcss@^4` as a peer but **shipped v3-shaped CSS
artifacts internally**. `dist/styles.css` used `@tailwind base/components/utilities`
directives, which Tailwind v4 emits as literal strings with zero utility generation, and
the JS preset relied on `theme.extend.colors`, a no-op in v4.

The symptom in a real consumer boot: **correct SSR HTML, every component unstyled in the
browser.** This is the failure mode a shape check alone does not catch — the exports
resolved, the types matched, and the output was still wrong.

| Bug | Fix |
| --- | --- |
| `dist/styles.css` used v3 `@tailwind` directives | Replaced with `@import "tailwindcss"`. The v3 variant survives at `dist/styles-v3-legacy.css`. |
| `dist/tokens.css` declared v3 vars; Tailwind v4 reads `--color-*` | Added `dist/tokens-v4.css` with `@theme { --color-primary: hsl(var(--primary)); … }` aliases, keeping `tokens.css` unchanged so `<ThemeProvider>`'s runtime cascade still works |
| `dist/preset.js` was a v3 JS preset; Tailwind v4 dropped JS presets | `./preset` now points at `dist/preset.css`. The JS preset stays at `./preset-v3-legacy` |

## Follow-up ADRs

| ID | Decision | Why |
| --- | --- | --- |
| D9 | Keep the v3 runtime vars intact; layer v4 `--color-*` aliases on top via `hsl(var(--*))` indirection | `<ThemeProvider>` injects v3 vars at runtime and six component files read `hsl(var(--primary))` directly. Renaming would break them. The indirection costs one resolution step. |
| D10 | `./preset` becomes CSS; the JS preset moves to `./preset-v3-legacy` | Tailwind v4 dropped JS presets; preserving the JS shape keeps v3 consumers viable |
| D11 | Ship two prebuilt entry stylesheets, v4 and v3-legacy | Same logic — v3 consumers must not break |
| D12 | `dogfood:v4-real-build` exists but stays **outside** the default gate chain | It needs `@tailwindcss/cli@^4`, which conflicts with the local `tailwindcss@^3` Ladle path, and it is slow (~30s with network). Runs in CI under a dedicated job. |
| D13 | Patch bump, not minor or major | Technically breaking for anyone importing the JS preset, but the prior release had been out for hours and was not actually working. **Patch is the honest label for a fix to a release that never functioned.** |

## Verification

- **Shape check** — `pnpm dogfood:v4-zero-config` asserts all 28 `--color-*` aliases, all
  14 `--text-*` tiers, the `@keyframes` declarations, and the export shape. 64 checks.
- **Real build** — `pnpm dogfood:v4-real-build` packs the tarball, installs it in a temp
  project with `@tailwindcss/cli@^4`, runs Tailwind against a fixture, and grep-asserts
  that the expected utility rules appear in the emitted CSS with **zero literal
  `@tailwind ` directives remaining**. 12 assertions.

The second one is the lesson: after shipping artifacts that passed every structural check
and still produced an unstyled page, the verification that mattered was **running the real
toolchain against the real tarball**.
