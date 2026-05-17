# Contributing to `@usetheo/ui`

Welcome — this document is the operational handbook for the library. The
strategic context (mission, narrative, four pillars) lives in the root
`README.md` and `../CLAUDE.md`. This file is about the day-to-day mechanics
of shipping code to `@usetheo/ui`.

---

## TL;DR

1. Branch off `main` (never commit directly to `main`).
2. Add or modify components under `src/components/primitives/` or `src/components/composites/`.
3. Run `pnpm quality:gates` locally — it has to be green before you open a PR.
4. Update `CHANGELOG.md` under `## [Unreleased]` for every visible change.
5. Open a PR. The reviewer will look for: taxonomy compliance, registry
   honesty, design-system fidelity, accessibility evidence, test coverage.

---

## Setup

```bash
git clone https://github.com/usetheo/theo-ui.git
cd theo-ui
pnpm install
pnpm dev   # Ladle on http://localhost:61000
```

Requirements:
- Node.js >= 20
- pnpm 10.x (we pin via `packageManager`)
- A terminal that handles UTF-8 (Geist sample text contains diacritics)

---

## The taxonomy rule (non-negotiable)

A component goes under `primitives/` **if and only if** it does not value-import
another `@usetheo/ui` component. Otherwise it goes under `composites/`.

This is enforced mechanically by `pnpm quality:structure` — there's no
discretionary call. The full spec lives in [`docs/architecture.md`](./docs/architecture.md).

**Allowed imports for primitives:**
- React (`react`, hooks)
- Radix primitives (`@radix-ui/react-*`)
- Icon libraries (`lucide-react`)
- `class-variance-authority`, `clsx`, `tailwind-merge`
- `../../../lib/cn.js`, `../../../types/*.js` (utilities & shared types)
- Type-only imports from another Theo component (e.g. `import type { Skill } from "../skill-card/skill-card.js"`)

**Forbidden in primitives:**
- Value-importing `Button`, `Badge`, `Card`, `Dialog`, etc. from a sibling
  primitive folder — even if it "feels" atomic. Move to composites.

**Allowed exceptions ("Global Provider Primitives"):**
- `Toaster` and `ThemeProvider` are app-wide context providers, traditionally
  classified as primitives across shadcn-aligned design systems. They live in
  `src/components/primitives/toast/` and `src/themes/`. The taxonomy gate has
  an explicit allowlist for these names. Adding a new global provider
  primitive requires an RFC. See `docs/architecture.md` §"Global Provider
  Primitives".

---

## Adding a new component

1. **Decide the public API first.** Sketch the JSX you want consumers to
   write. If it requires reaching for another Theo component, the component
   is a composite — full stop.
2. **Pick the folder:**
   - `src/components/primitives/<kebab-name>/` for atoms.
   - `src/components/composites/<kebab-name>/` for assemblies.
3. **Required files** (gate-enforced):
   ```
   <name>.tsx           // implementation, exports the named component
   <name>.test.tsx      // smoke + behavior + a11y (vitest-axe for interactive)
   <name>.stories.tsx   // Ladle story under `Primitives / <Group> / <Name>` or `Composites / <Group> / <Name>`
   index.ts             // re-export only; one line: export { Component } from "./<name>.js";
   ```
4. **Export from the barrel.** Add a named export to `src/index.ts` in the
   appropriate section (Primitives vs Composites). The `validateArchitectureCensus`
   and `validateCountConsistency` gates enforce that README, architecture
   docs, and welcome stats stay in sync — run `pnpm sync:readme` after the
   export.
5. **Add a registry descriptor.** Create `registry/<name>.json` with the
   shadcn schema. Every `registry:ui` / `registry:block` MUST list
   `tailwind-preset` in `registryDependencies` so the consumer's
   `npx shadcn add <name>` resolves the typescale tokens. Run
   `pnpm tsx scripts/add-tailwind-preset-dep.ts` if you forget.
6. **Run `pnpm quality:gates`** locally before the PR. It's not optional.

---

## Quality gates

`pnpm quality:gates` is the single command that has to be green:

```bash
pnpm format:check        # Biome formatting
pnpm lint:ci             # Biome lint (strict, organize-imports)
pnpm typecheck           # tsc --noEmit
pnpm test                # Vitest run (target ≥453 tests)
pnpm build               # tsup → dist/
pnpm registry:build      # registry/*.json → registry/r/*.json (inlines source)
pnpm registry:validate   # validates the built registry
pnpm quality:structure   # all custom structural gates
pnpm ladle:build         # Ladle SSR build (story smoke)
```

`quality:structure` runs the custom gates:

| Gate | Purpose |
|---|---|
| `validateGovernanceFiles` | LICENSE, CHANGELOG, README presence |
| `validateReadmeDrift` | every backticked capitalized word in README is exported |
| `validateDocsTypography` | Geist normative; `fonts.css` self-hosted; `fonts-cdn.css` exists |
| `validateCompositeBarrel` | composites import primitives via `/index.js`, not raw |
| `validateCompoundPattern` | compounds use `Object.assign /*#__PURE__*/`, not mutation |
| `validateComponentStructure` | path-resolved taxonomy rule (BLOCKER-001 fix) |
| `validateRegistryStoriesAndTests` | every `registry:ui`/`registry:block` has `.test.tsx` + `.stories.tsx` |
| `validateRegistryPresetDep` | every `registry:ui`/`registry:block` depends on `tailwind-preset` |
| `validateExportsMap` | `package.json#exports` matches `pnpm sync:exports` canonical set |
| `validateNpmTarball` | `npm pack --dry-run` excludes tests/stories/screens, ≤5 MB |
| `validatePublicExports` | every component exported from `src/index.ts` exists on disk |
| `validateCountConsistency` | README badge ↔ catalog ↔ welcome.stats counts agree |
| `validateArchitectureCensus` | `docs/architecture.md` lists every exported component |
| `validateAxeCoverage` | ≥30 interactive primitives run vitest-axe |
| `validateNoStrayArtifacts` | no `.bak`, `.tmp`, `.orig`, `.rej` files in the tree |
| `validateDesignSystemFidelity` | Geist tokens in tokens.css + preset; type scale |
| `validateScriptsAndCi` | required npm scripts + `.github/workflows/quality-gates.yml` |

A failing gate ≠ broken code — it usually means a doc / count / registry
file is out of sync. The error message tells you exactly how to fix it
(usually one of `pnpm sync:readme`, `pnpm sync:exports`,
`pnpm tsx scripts/add-tailwind-preset-dep.ts`, or
`pnpm registry:build && pnpm registry:validate`).

---

## Registry distribution

Every component is shipped two ways:

1. **As part of the package** — `pnpm add @usetheo/ui`, then
   `import { Button } from "@usetheo/ui"`. ESM-only, tree-shakable.
2. **As copy-paste via shadcn CLI** — `npx shadcn add https://usetheodev.github.io/theo-ui/r/<name>.json` (branded `ui.usetheo.dev` URL pending DNS CNAME).
   The consumer's project receives the source `.tsx` file under
   `components/ui/<name>.tsx` (primitives) or `components/blocks/<name>.tsx`
   (composites).

Both paths must work. The fixture install test (`pnpm test:registry`)
exercises a stratified sample of 14 items end-to-end, including a real
Tailwind CSS build that asserts the typescale utility classes
(`text-body-md`, `text-display-2xl`, `text-label-caps`, …) emerge in the
compiled output. Failures here mean the shadcn path is broken before any
consumer hits it.

When you add a component:
- Always add it to `registry/<name>.json`.
- Always include `tailwind-preset` in `registryDependencies` — without it,
  consumers receive markup using utility classes that vanilla Tailwind
  doesn't ship.
- Run `pnpm registry:build && pnpm registry:validate`.

---

## Submitting a PR

- Branch name: `feat/<thing>`, `fix/<thing>`, `chore/<thing>`,
  `docs/<thing>`. No `wip/`, no `temp/`.
- Commit messages: imperative present tense, scope prefix
  (`feat(button): ...`, `fix(registry): ...`).
- Every PR updates `CHANGELOG.md` under `## [Unreleased]`. Categories:
  `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`,
  `Breaking`. Reference issue or PR number when applicable.
- A PR that touches a component must update that component's `.test.tsx`
  (regression test for bug fixes, behavior test for new features).
- A PR that touches design tokens or the type scale must update
  `docs/design-system.md` and run `pnpm sync:readme`.
- Visual diffs: paste before/after screenshots from Ladle if the visual
  output changes.

---

## Internal exploration archive: `referencia/`

`referencia/` contains design system references collected during the
exploration phases (Vercel, Linear, Tremor, Radix Themes, etc.). It is
NOT maintained, NOT shipped to npm, NOT used at runtime. It exists as a
historical artifact for design decisions. Feel free to add to it, feel
free to ignore it. Future cleanup may move it to a separate read-only
repository.

**Note on the name (NIT-003):** the folder is in pt-BR (`referencia/`)
because the early design phase happened in Portuguese. It is intentionally
not renamed to `references/`: (a) the directory is `.gitignore`d so it
never appears in the published package or in tooling output, (b) all
CHANGELOG and audit cross-references already point at the existing name,
(c) the audit consensus (see deep-review report) is to relocate the
content to a separate repo rather than rename in-place. The name stays
until that move happens.

---

## Release process

The library is pre-1.0 (`0.0.0`). Until 1.0:
- Every release is `0.x.y` under `--tag next` on npm.
- Breaking changes are allowed; document under `### Breaking` in CHANGELOG.
- A minimum 60-90 day window of `--tag next` usage is required before
  promoting to `latest` and tagging `1.0.0`.

`1.0.0` requires:
- ≥3 months of external usage with no regressions (sourced from real
  consumer feedback, not vibes).
- Zero `BLOCKER`/`HIGH` issues open in the most recent deep review.
- Public Quickstart Option B (`npx shadcn add ...`) verified end-to-end
  in Next 14, Vite 5, and Astro 4 vanilla scaffolds.

See `docs/quality-gates.md` Gate 9 for the full Release Readiness checklist.

---

## Security

See [`SECURITY.md`](./SECURITY.md) for the disclosure policy. In short:
report potential vulnerabilities privately via GitHub Security Advisories;
do NOT open public issues for security matters.
