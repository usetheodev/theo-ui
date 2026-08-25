# Contributing to `@theokit/ui`

Welcome — this document is the operational handbook for the library. The
strategic context (mission, narrative, four pillars) lives in the package's
`packages/ui/README.md`, and the normative knowledge (architecture, design system,
ADRs, RFCs, quality gates) in `packages/ui/wiki/` — see `packages/ui/wiki/index.md`.
This file is about the day-to-day mechanics of shipping code to `@theokit/ui`.

By taking part you agree to the [Code of Conduct](./CODE_OF_CONDUCT.md). Security
problems do **not** go in an issue — see [SECURITY.md](./SECURITY.md).

---

## TL;DR

1. Work on `workspace` — never commit directly to `develop` or `main`, and don't
   create feature branches. See "Branch topology" below.
2. Add or modify components under `packages/ui/src/components/primitives/` or
   `packages/ui/src/components/composites/`.
3. Run `pnpm quality:gates` locally — it has to be green before you open a PR.
4. Update `packages/ui/CHANGELOG.md` under `## [Unreleased]` for every visible change.
5. Run `pnpm changeset` if the change should ship — it is what decides the next
   version number. See "Releases" below.
6. Open a PR. The reviewer will look for: taxonomy compliance, registry
   honesty, design-system fidelity, accessibility evidence, test coverage.

---

## Setup

```bash
git clone https://github.com/usetheokit/theokit-ui.git
cd theokit-ui
pnpm install
pnpm dev   # Ladle on http://localhost:61000
```

Requirements:
- Node.js >= 22.12.0
- pnpm 10.x (we pin via `packageManager`)
- A terminal that handles UTF-8 (Geist sample text contains diacritics)

### Where things live

This repository is a pnpm workspace and the published package is `packages/ui`. The
root carries CI, the git hooks and the workspace manifests; everything else — `src/`,
`tests/`, `scripts/`, `registry/`, `wiki/`, the Ladle config — is inside the package.

**Every relative path in this document is relative to `packages/ui/`**, and so is every
command that is not one of the root-level ones below. `cd packages/ui` first, or reach
them from the root with `pnpm --filter=@theokit/ui run <script>`.

Root-level commands: `pnpm install`, `pnpm build`, `pnpm test`, `pnpm typecheck`,
`pnpm lint`, `pnpm dev`, `pnpm quality:gates`, `pnpm changeset`.

---

## The taxonomy rule (non-negotiable)

A component goes under `primitives/` **if and only if** it does not value-import
another `@theokit/ui` component. Otherwise it goes under `composites/`.

This is enforced mechanically by `pnpm quality:structure` — there's no
discretionary call. The full spec lives in [`wiki/architecture/index.md`](./packages/ui/wiki/architecture/index.md).

**Allowed imports for primitives:**
- React (`react`, hooks)
- Radix primitives (`@radix-ui/react-*`)
- Icon libraries (`lucide-react`)
- `class-variance-authority`, `clsx`, `tailwind-merge`
- `../../../lib/cn.js`, `../../../types/*.js` (utilities & shared types)
- Type-only imports from another Theo component (e.g. `import type { Skill } from "../skill-card/skill-card.js"`)

**Forbidden in primitives:**
- Value-importing `CostMeter`, `ModelCard`, `AgentEvent`, etc. from a sibling
  primitive folder — even if it "feels" atomic. Move to composites.

**Forbidden everywhere in `src/components/**`:**
- **Literal Tailwind color classes** (`bg-emerald-500`, `text-amber-600/40`,
  `border-blue-500`, etc.). Components MUST consume semantic tokens
  (`bg-primary`, `bg-success`, `bg-status-online`, `text-destructive`, ...)
  so theme switching propagates. The build-gate scanner
  (`scripts/lib/literal-color-scanner.ts`) fires on `pnpm quality:structure`
  and prints suggested replacements. See
  [`wiki/decisions/adr-0004-no-literal-tailwind-colors.md`](./packages/ui/wiki/decisions/adr-0004-no-literal-tailwind-colors.md).
- Whitelisted paths: `*.test.tsx`, `*.stories.tsx`, `tests/fixture-*/` (allowed
  to demonstrate raw colors).

**Allowed exceptions ("Global Provider Primitives"):**
- `Toaster` and `ThemeProvider` are app-wide context providers, traditionally
  classified as primitives across shadcn-aligned design systems. They live in
  `src/components/primitives/toast/` and `src/themes/`. The taxonomy gate has
  an explicit allowlist for these names. Adding a new global provider
  primitive requires an RFC. See `wiki/architecture/index.md` §"Global Provider
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
| `validateArchitectureCensus` | `wiki/architecture/index.md` lists every exported component |
| `validateAxeCoverage` | ≥30 interactive primitives run vitest-axe |
| `validateNoStrayArtifacts` | no `.bak`, `.tmp`, `.orig`, `.rej` files in the tree |
| `validateDesignSystemFidelity` | Geist tokens in tokens.css + preset; type scale |
| `validateNoLiteralTailwindColors` | components MUST consume semantic tokens (ADR-0004) — `bg-emerald-500` etc. blocked |
| `validateThemeContrast` | 10 themes × 2 modes × 8 pairs against WCAG 2.x AA (4.5:1 body / 3:1 large) |
| `validateScriptsAndCi` | required npm scripts + `.github/workflows/ci.yml` |

Additional gates wired into `quality:gates` post-T5.3 / T5.4:

| Gate | Command | Purpose |
|---|---|---|
| Visual snapshot | `pnpm quality:visual` | Playwright snapshot diff (chromium baseline, ADR-0005/0009 cohort) |
| WCAG contrast standalone | `pnpm quality:contrast` | rerun the AA matrix and assert no regression vs `tests/contrast/contrast-baseline.json` |

Relevant ADRs to read before changing visual/theme behavior:

- [ADR-0004 — No literal Tailwind colors in source](./packages/ui/wiki/decisions/adr-0004-no-literal-tailwind-colors.md)
- [ADR-0005 — OKLCH as the canonical color format](./packages/ui/wiki/decisions/adr-0005-oklch-as-canonical-color-format.md)
- [ADR-0006 — Algorithmic tonal derivations via `oklch(from ...)`](./packages/ui/wiki/decisions/adr-0006-algorithmic-tonal-derivations.md)
- [ADR-0007 — Status semantic tokens (operational state group)](./packages/ui/wiki/decisions/adr-0007-status-semantic-tokens.md)
- [ADR-0008 — Forced colors (Windows High Contrast Mode) support](./packages/ui/wiki/decisions/adr-0008-forced-colors-whcm-support.md)
- [ADR-0009 — `prefers-color-scheme` respected by default](./packages/ui/wiki/decisions/adr-0009-prefers-color-scheme-default.md)
- [Migration guide HSL → OKLCH](./packages/ui/wiki/migrations/hsl-to-oklch.md)

A failing gate ≠ broken code — it usually means a doc / count / registry
file is out of sync. The error message tells you exactly how to fix it
(usually one of `pnpm sync:readme`, `pnpm sync:exports`,
`pnpm tsx scripts/add-tailwind-preset-dep.ts`, or
`pnpm registry:build && pnpm registry:validate`).

---

## Registry distribution

Every component is shipped two ways:

1. **As part of the package** — `pnpm add @theokit/ui`, then
   `import { AgentEvent } from "@theokit/ui"`. ESM-only, tree-shakable.
2. **As copy-paste via shadcn CLI** — `npx shadcn add https://usetheokit.github.io/theokit-ui/r/<name>.json` (branded `ui.usetheo.dev` URL pending DNS CNAME).
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
  `wiki/design-system/index.md` and run `pnpm sync:readme`.
- Visual diffs: paste before/after screenshots from Ladle if the visual
  output changes.

---

## Design influences

The design system was shaped by reading widely — Vercel, Linear, Tremor and
Radix Themes are the clearest influences on the neutral surfaces, the density
scale and the token model. Feature-level influences are credited inline: see the
Roadmap table in `README.md` for the engines, and the component doc comments for
the agent surfaces.

Any local scratch clones used during that reading live outside the repository and
are `.gitignore`d. They are not part of the project, not maintained, and not
referenced by any build step.

---

## Branch topology

The repository has **exactly three branches**, all permanent, and they are kept
**at the same commit**:

```
workspace ──PR──> develop ──PR + tag semver──> main
 (todo o trabalho)  (integração)                (release)
```

- **`workspace`** is where every change is born — feature, fix, refactor, docs,
  chore. It is never deleted and never recreated per task. There are **no feature
  branches**; that is why `delete_branch_on_merge` is off on this repository, so
  merging a promotion PR can never delete `workspace`.
- **`develop`** only ever advances through the `workspace → develop` PR. No
  direct commit, rebase, reset or cherry-pick, and nothing other than
  `workspace` gets merged into it.
- **`main`** is the release branch. It only receives the `develop → main`
  promotion PR. Reaching `main` does **not** publish: it makes Changesets open a
  "Version Packages" PR, and merging that one publishes and writes the tag. The
  tag is now an OUTPUT of the release rather than its trigger — see "Release
  process". Pushing a `v*` tag by hand publishes nothing.

### Keeping the three at the same commit

A PR merge always leaves the source branch behind the target, so convergence is a
**two-step** promotion. Both steps matter:

1. **Merge the promotion PR with "Create a merge commit"** (`gh pr merge --merge`).
2. **Fast-forward the source branch(es) to the target**, e.g. after the
   `develop → main` merge:
   ```bash
   git push origin origin/main:refs/heads/develop
   git push origin origin/main:refs/heads/workspace
   ```
   No `--force` — the source is an ancestor, so this is a plain fast-forward.

**Do not use "Rebase and merge" or "Squash and merge" on a promotion PR.** Both
*rewrite* the commits, so the target ends up with a different SHA for the same
tree and the source branch stops being an ancestor of it. The branches then
genuinely diverge, and because force-pushing `workspace`, `develop` and `main` is
forbidden, the only way back is an extra merge commit to reconverge. Verified the
hard way: PR #37 was rebase-merged and left `develop` at `721ac07` against
`workspace` at `eaceeac` with an identical tree.

A merge commit keeps the source as an ancestor, which is exactly what makes
step 2 possible. Repairing drift is always a fast-forward — never a back-merge
into `develop`, never a force-push.

---

## Release process

Releases are driven by [Changesets](https://github.com/changesets/changesets), the
same way as the other publishable repositories in the framework (`theokit-sdk`,
`-di`, `-plugins`, `-studio`, `-gateways`).

**You never type a version number.** It is derived:

```bash
pnpm changeset      # pick patch/minor/major, write what changed
```

That writes a small file under `.changeset/`. Commit it with your work. When the
change reaches `main`, the Release workflow opens a "Version Packages" pull
request that applies every pending changeset — bumping `packages/ui/package.json`
and prepending the entry to `packages/ui/CHANGELOG.md`. Merging **that** pull
request is what publishes to npm, tags the commit, and creates the GitHub release.

- Semantic versioning, no exceptions. A breaking change is a `major` changeset.
- Authentication is OIDC trusted publishing — there is no npm token, and the
  binding names `.github/workflows/release.yml` specifically. Renaming that file
  breaks publishing.
- `prepublishOnly` still refuses a version the registry already serves, which is
  the guard that caught the git↔npm drift in usetheokit/theokit-ui#46.

### Why the CHANGELOG has two kinds of section

`## [Unreleased]` is written by hand, per Keep a Changelog, and is where a visible
change is described for a reader. Changesets prepends its generated `## X.Y.Z`
entries above it at version time. Both are written by people — a changeset is
prose an author wrote, not a git-log dump — and the versioned sections of an
already-released version are never edited.

See `packages/ui/wiki/quality-gates/index.md` Gate 9 for the full Release
Readiness checklist.

---

## Local development (cross-repo)

When developing a project that consumes `@theokit/ui` locally (e.g., TheoCode, TheoKit examples):

### Why not `npm link`?

`npm link` (or `npm install ../theokit-ui`) creates a symlink that exposes
theokit-ui's own `node_modules/react` (devDependency), causing dual-React errors
in the consumer project. This is a known Node.js limitation with symlinks +
pnpm strict hoisting. Symptoms: `"useState null"`, `"Element from older version"`.

### Workflow (2 commands)

```bash
# 1. In theokit-ui — build + generate tarball
pnpm dev:pack

# 2. In the consumer project — install the tarball
npm install file:../theokit-ui/dist/theokit-ui-0.14.3.tgz
```

The tarball installs exactly like the npm registry version: no symlinks, no
nested `node_modules`, peerDependencies resolve to the consumer's copies.

After changing theokit-ui components, re-run both commands.

### Prerequisites

Both repos must be under the same parent directory — the `theokit-framework/`
repo group. The absolute location is up to you; the tarball dev flow only needs
them to be siblings.

## Security

See [`SECURITY.md`](./SECURITY.md) for the disclosure policy. In short:
report potential vulnerabilities privately via GitHub Security Advisories;
do NOT open public issues for security matters.
