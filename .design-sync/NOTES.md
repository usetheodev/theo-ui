# design-sync notes — @theokit/ui (Violet Forge)

Repo-specific gotchas for syncing this design system to claude.ai/design.
Read this before any re-sync.

## Shape & toolchain

- **Shape: `package`** — this repo uses **Ladle** (`.ladle/`, `dev: ladle serve`),
  NOT Storybook. The converter's storybook screenshot harness only drives
  Storybook, so we use the package shape (build `dist/`, author previews from
  usage examples, grade on the absolute rubric).
- Node 22, **pnpm** (`pnpm-lock.yaml`). Build: `pnpm build`
  (`tsup && tsc -p tsconfig.dts.json && …`). `dist/` ships ESM-only.
- Converter entry: `./dist/index.js`. `--node-modules ./node_modules`.
- Render check: install `playwright@1.60.0` into `.ds-sync/node_modules`
  (matches the repo's `@playwright/test@1.60.0`, which pins chromium **1223**,
  already in `~/.cache/ms-playwright/chromium-1223`). No browser download needed.

## Fixes required for this repo (durable)

1. **Top-level `types` in package.json** — the package declared types ONLY via
   `exports["."].types`, with no top-level `types` field. The converter's
   `.d.ts` entry resolver (`findTypesRoot`/`projectFor`) reads `pkgJson.types`,
   so it landed on `dist/types/` (6 stray files) and a nonexistent
   `<root>/index.d.ts` → **0 components discovered**. Fix: added
   `"types": "./dist/index.d.ts"` to package.json (a genuine product
   improvement for classic-resolution consumers — shipped via CHANGELOG).
   Without it, discovery returns 0.

2. **shiki externalized** — `bundle.mjs` is forked at
   `.design-sync/overrides/bundle.mjs` (declared in `cfg.libOverrides`) to add
   `external: ['shiki', '@shikijs/*']`. shiki is an **optional** peer-dep loaded
   via `await import("shiki")` in `src/lib/markdown/code-block.tsx`. The IIFE
   bundle inlines that dynamic import → +9.4 MB of grammars → 11 MB total,
   over the 5 MB upload cap. Externalized, the bundle is ~1.7 MB. `CodeBlock`
   (and consumers `ChatMessage`, `AgentToolRenderer`) degrade to a plain
   `<pre><code>` with the language label — its documented optional-peer
   fallback (the `import("shiki")` is caught by `getHighlighter()`'s try/catch).
   **Trade-off: code blocks in designs render without syntax-highlight colors.**
   The fork is additive only — the `@ds-bundle` header/namespace are unchanged.

3. **tokens via `tokensPkg: ".."`** — the converter's `copyTokens` requires a
   `tokensPkg` (a separate package), but this DS ships its tokens in its own
   `dist/` (`tokens.css`, `tokens-v4.css`). Setting `tokensPkg: ".."` points it
   at the repo root (parent of `node_modules`) and `tokensGlob: "dist/tokens*.css"`
   copies both. Without this, `tokens/` is empty and every `hsl(var(--primary))`
   rule in `components.css` resolves to nothing → broken colors.
   - `cssEntry: dist/components.css` is the full Tailwind v4 compiled stylesheet
     (preflight + `@layer base` + `--color-*` aliases + utilities + component
     rules). The runtime token VALUES live in `tokens.css`, hence the tokensPkg
     fix completes the closure.
   - styles.css closure = tokens-v4 + tokens + fonts + `_ds_bundle.css`. Verified
     all 4 `@import`s resolve.

## No provider needed

`tokens.css` declares `:root`/`[data-theme]` at the document level (NOT gated
behind a provider), default theme is light. Components render fully styled with
no `cfg.provider`. Confirmed visually on the contact sheets (AgentEditor,
EnvVarEditor, GatewayStatusIndicator, etc. all on-brand Geist + violet).

## Known render warns (triaged — legitimate, NOT new issues)

These render correctly but trip the blank/thin heuristic because they are small
or minimal-by-default controls. They are authoring candidates (an authored
preview with realistic props makes a nicer card), not failures:

- `[RENDER_BLANK]` small form controls (render fine, just small PNGs):
  `Input`, `Checkbox`, `Switch`, `Textarea`, `Progress`, `CopyButton`,
  `PinInput`, `StatusDot`, `StatusIndicator`, `SourceDocumentPart`, `SourceUrlPart`.
- `[RENDER_THIN]` floor-card-thin / minimal renders:
  `ApprovalCard`, `ArtifactPreview`, `DangerZone`, `LoginSplit`, `MetricCard`,
  `PageShell`, `StatTile`.

## Non-blocking warns (accepted)

- `[TOKENS_MISSING]` (42 vars: `--radix-*-height`, `--accordion-panel-height`,
  `--positioner-height`, `--ratio`, `--fd-*`, …) — these are RUNTIME vars Radix
  and components inject via inline styles/JS. Expected absent from static CSS.
- `[FONT_MISSING] "Cambria"` — a system serif fallback inside the stack
  `ui-serif, Georgia, Cambria, "Times New Roman", serif`. NOT a brand font; the
  brand font Geist (Sans + Mono) ships self-hosted via `dist/fonts/`. Accepted —
  prose serif falls back to the system serif.

## Re-sync risks (watch-list)

- **shiki override drift**: on a converter upgrade, diff
  `.design-sync/overrides/bundle.mjs` against `.ds-sync/lib/bundle.mjs` and
  re-apply the `external: ['shiki','@shikijs/*']` line + the `./common.mjs` →
  `../../.ds-sync/lib/common.mjs` import repoint. Recreate the symlink
  `ln -sfn ../.ds-sync/node_modules .design-sync/node_modules` per fresh clone.
- **types field**: if a future package.json refactor drops the top-level
  `types`, discovery silently returns 0 again. The CHANGELOG documents why it's
  there — don't remove it.
- **tokensPkg ".."**: relies on `--node-modules` being `./node_modules` directly
  under the repo root (so `..` = repo). If the converter is run from elsewhere,
  re-point `tokensPkg`.
- **shiki upgrade**: if shiki ever becomes a hard (non-optional) dep or
  CodeBlock loses its try/catch fallback, externalizing would break CodeBlock
  rendering. Re-verify the fallback in `src/lib/markdown/code-block.tsx`.

## Campaign outcome (first sync)

- **158 components total**: 147 with rich authored previews, **11 on honest floor cards**.
- Bundle 1.66 MB, `package-validate` exits 0, 158/158 render cleanly.
- Previews were ported from the repo's own Ladle `*.stories.tsx` (mechanical
  transform: swap import → `@theokit/ui`, drop the Ladle `default`/`Story`
  type, keep named-export compositions). 39 were graded cell-by-cell by eye;
  the rest were verified rendering via the 10 contact sheets + individual review
  sheets (all clean/on-brand). Grades live in the gitignored `.cache/review/`.
- **The 11 floor-card components** (authorable on the next pass — fully
  importable, just no authored example yet):
  - Internal compound parts: `ChatMessageRoot`, `ChatMessageContent`, `DataPart`
    (no standalone story / no verified composition).
  - Non-visual infra: `ThemeProvider`, `ThemeScript`, `ThemeSwitcher`,
    `TheoUIProvider`, `Toaster` (providers / `<script>` injector / portal —
    nothing to render statically).
  - No story, compose-from-source candidates: `TaskNode`, `TopNav`,
    `MCPServerCard`.
- `.design-sync/conventions.md` is the README header (wired via `readmeHeader`);
  all enumerated classes/tokens/components verified present in the build.

## Re-sync risks (forward-looking)

- The 11 floor cards re-verify cheaply next sync; author them then if desired.
- The scripted port (`.ds-sync/port-stories.mjs`, not committed) rewrites ALL
  relative imports in a story to `@theokit/ui`. It worked for 91/91 here because
  those stories import only exported components/parts/types. A future story that
  imports a NON-exported fixture relatively would compile-fail on re-port —
  fix by inlining the fixture (caught by `! preview build failed` in rebuild).
- Upload was NOT performed this session (DesignSync login was unavailable).
  The project has no anchor yet; first upload re-verifies everything.
