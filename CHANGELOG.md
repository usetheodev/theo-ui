# Changelog

All notable changes to `@usetheo/ui` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `LICENSE` file (Apache-2.0) at repository root.
- `CHANGELOG.md` (this file).
- `<ThemeScript>` component for SSR-safe theme initialization in Next/Astro/Remix.
- Global `@media (prefers-reduced-motion: reduce)` rules in `tokens.css` neutralizing animations for users with vestibular sensitivity.
- `BuildLogStream` `maxLines` prop (default 2000) for high-volume log truncation.
- `TokenUsageChart` `maxBars` prop for time-series binning.
- `vitest-axe` integration for accessibility assertions in primitive tests.
- Quality gates: `validateGovernanceFiles` (LICENSE / CHANGELOG presence), `validateReadmeDrift` (README ↔ exports parity), `validateDocsTypography` (font drift), `validateCompositeBarrel` (composites must import primitives via barrel).
- `tests/fixture-shadcn-app/` integration test exercising registry copy-paste install.
- `scripts/sync-readme.ts` to keep README counts and component catalog generated from source.

### Changed
- `ThemeProvider` `defaultMode` flipped from `"light"` to `"dark"` to match the library's "dark-first" positioning. **Migration**: pass `defaultMode="light"` explicitly if previously relying on the default.
- `TopNav.ModeSwitcher` ARIA semantics: `role="tablist"` → `role="radiogroup"`, `role="tab"` → `role="radio"` with full keyboard navigation (Arrow/Home/End + roving tabindex).
- `CommandPalette` re-implemented on top of `cmdk` — adds keyboard navigation (Up/Down/Enter/Escape), fuzzy ranking, and active-item highlight. Public API is preserved.
- `Card.Title` and `Dialog.Title` accept `asChild` (Radix Slot) for heading-level override.
- `ChatComposer` no longer renders mic/attach buttons by default; consumer must pass `onVoiceInput` / `onAttach` to opt in.
- `JSX.Element` global namespace references replaced by `import type { JSX } from "react"` in `theme-provider.tsx`, `theme-switcher.tsx`, `toaster.tsx` (forward-compatible with React 19).
- Replace `dot-namespace` mutation pattern (`Card.Header = Header`) with `/*#__PURE__*/ Object.assign(...)` in `Card`, `Dialog`, `Sidebar`, `TopNav`, `Tabs` for safer tree-shaking.
- `aria-hidden` codemod: all 15 boolean uses now declare `aria-hidden="true"` explicitly.
- `validate-quality-gates.ts` calls four new gates in sequence; CI fails on README/docs/governance drift.

### Fixed
- `dist/styles.css` referenced `./fonts.css` that was not copied to `dist/`. `tsup.config.ts` now copies `fonts.css` alongside `tokens.css` and `styles.css`; `package.json#exports` exposes all three.
- `registry/tokens.json` shipped `cssVars` with the old warm-violet palette while the embedded `tokens.css` content used the current Vercel-grayscale palette. The `cssVars` block was removed; `files[].content` is now the single source of truth.
- `src/themes/violet-forge.ts` JSDoc claimed "Boska + Switzer + JetBrains Mono" while the `fonts` object used Geist. JSDoc rewritten; `registry/r/theme-provider.json` regenerated.
- `README.md` declared "84 components / 162 tests / 12 composites / 33 registry items" and listed six non-existent components (`ToolPalette`, `TerminalPane`, `TerminalLine`, `TaskBreadcrumbs`, `TaskStatusPill`, `ShellCommandCard`). Counts now derived from source; phantom components removed.
- `docs/design-system.md` described the abandoned Boska/Switzer direction. Rewritten to match the active Geist + Vercel-grayscale state. Historical exploration moved to `docs/audit/2026-05-decisions.md`.
- `docs/agent-screens-composition.md` was a 354-line implementation roadmap referencing legacy product names ("TheoKit", "TheoBrutal") and components that no longer exist. Archived to `docs/audit/2026-05-screens-history.md`; replaced by a slim `docs/screens.md` index.
- `PermissionMatrix`: JSDoc promised `toolOptions={[]}` hides the add form, but `[]` is truthy in JS — the form was always shown. Condition fixed to check `length > 0`.
- `Dialog` overlay JSDoc claimed "violet-tinted 60%" backdrop but code used `bg-background/80`. JSDoc aligned with code.
- `agent-timeline` composite imported `../primitives/agent-event/agent-event.js` directly (bypassing barrel); switched to `../primitives/agent-event/index.js`. Gate added.
- Stories with `console.log` / `console.warn` annotated with `biome-ignore` to keep `noConsole` Biome rule meaningful in production code.

### Security
- N/A this release.

## [0.0.0]

Initial unpublished baseline. See `git log` between this entry and `5c95373` for the bootstrap work.
