# RFC 0008 — `./vite-plugin` + `./preset` subpath exports (TheoKit zero-config integration)

| Field | Value |
|---|---|
| Author | paulohenriquevn |
| Date | 2026-05-22 |
| Status | **Implemented** (2026-05-22) |
| Plan | (ship-direct, no formal plan — contract authored by TheoKit Phase 3) |
| Cross-repo contract | `theokit/docs/spikes/usetheo-ui-vite-plugin-shape.md` |
| Consumer code | `theokit/packages/theo/src/vite-plugin/integrate-ui.ts` |

## 1. Summary

Add two new subpath exports to `@usetheo/ui` so the TheoKit framework's
`integrateUseTheoUI()` Vite plugin can auto-wire Tailwind v4 for
consumers with zero further configuration:

- **`@usetheo/ui/vite-plugin`** — default-export factory returning ONE
  Vite `Plugin`. Dynamic-imports `@tailwindcss/vite` v4 and chains it
  into the consumer's plugin array via the `config()` hook. Degrades
  via `console.warn` (never throws) when the peer is missing.
- **`@usetheo/ui/preset`** — default-export Tailwind v4 `Partial<Config>`
  mirroring `tokens.css` (colors, fonts, typescale, radii, shadows,
  animations) with `content` paths covering the published artifact
  tree and the `tailwindcss-animate` plugin.

Ships in `0.5.0-next.0` (minor — public API surface grows with two new
subpath specifiers; zero visual break, no runtime behavior change for
existing consumers).

## 2. Motivation

Before this RFC, the TheoKit framework's "consumer adds `@usetheo/ui` →
framework wires Tailwind for free" promise had no implementation path
on the `@usetheo/ui` side. TheoKit's Phase 3 (cross-repo work) shipped
`packages/theo/src/vite-plugin/integrate-ui.ts` which dynamic-imports
`@usetheo/ui/vite-plugin` and validates four shape checks on the
returned plugin. Without these subpath exports, that detection
unconditionally returned `[]` and consumers fell back to manually
authoring a `tailwind.config.ts`.

This RFC implements exactly the contract TheoKit specified — no more,
no less.

## 3. Decision

| ID | Decisão | Por quê |
|---|---|---|
| D1 | `./vite-plugin` returns ONE `Plugin` object | TheoKit's validator runs `'name' in plugin && typeof plugin.name === 'string'` — `Plugin[]` would fail that check. The contract is firm. |
| D2 | Dynamic import of `@tailwindcss/vite` via stored specifier | Vite's import-analysis pass tries to resolve static `import()` calls even with `/* @vite-ignore */`. Holding the specifier in a variable defers resolution to runtime where the optional peer can be absent. |
| D3 | `tailwindcss`, `@tailwindcss/vite`, `vite` declared as OPTIONAL peer-deps | Standalone consumers (no framework) shouldn't be forced into Tailwind v4. TheoKit's own `vite-plugin/integrate-ui.ts` asks for `@tailwindcss/vite` separately, so the framework path covers it. |
| D4 | `vite` peer is `^6.0.0 \|\| ^7.0.0` (literal contract) | TheoKit ships on Vite 6+. Vite Plugin API is stable from 3.x, so this is the framework-side requirement, not a technical floor. The local devDep stays on Vite 5 — the `vite` peer is optional, so the local dev surface is unaffected. |
| D5 | `./preset` delegates to `src/styles/tailwind-preset.ts` | Single source of truth for tokens; the shadcn-registry v3 preset and the v4 import preset stay byte-for-byte aligned. DRY trumps slight code duplication. |
| D6 | `config()` returns `{ plugins }` even though Vite 5+ types forbid it | Vite 5+ tightened the TypeScript signature to nudge authors toward `Plugin[]` factories, but the runtime still honors `plugins` merge from `config()`. The contract requires ONE plugin object, so the cast is honest. |
| D7 | Virtual module `virtual:@usetheo/ui/library-sources.css` for `@source` | Tailwind v4 `@source` directives are CSS-side. A virtual module is the cleanest hook — consumers import it once and Tailwind picks up the library's published JS as content. |
| D8 | Minor bump (`0.4.0-next.0` → `0.5.0-next.0`) | Convention established in RFCs 0005/0006/0007: minor on API-surface additions, even when additive. Patch would be semver-correct but unconventional for this project. |

## 4. Implementation

### 4.1 `src/vite-plugin.ts`

```typescript
import type { Plugin, UserConfig } from "vite";

export interface UseTheoUIPluginOptions {
  tailwind?: boolean;
  contentExtra?: string[];
}

export default function useTheoUIVite(opts: UseTheoUIPluginOptions = {}): Plugin {
  return {
    name: "@usetheo/ui/vite-plugin",
    async config(_userConfig, _env): Promise<Omit<UserConfig, "plugins"> | undefined> {
      if (opts.tailwind === false) return undefined;
      try {
        const specifier = "@tailwindcss/vite";
        const mod = await import(/* @vite-ignore */ specifier);
        const factory = mod.default;
        if (typeof factory !== "function") return undefined;
        const tw = factory();
        return { plugins: Array.isArray(tw) ? tw : [tw] } as Omit<UserConfig, "plugins">;
      } catch {
        console.warn("[@usetheo/ui/vite-plugin] @tailwindcss/vite was not resolvable; falling back to CSS-only mode.");
        return undefined;
      }
    },
    resolveId(id) {
      if (id === "virtual:@usetheo/ui/library-sources.css")
        return "\0virtual:@usetheo/ui/library-sources.css";
    },
    load(id) {
      if (id === "\0virtual:@usetheo/ui/library-sources.css") {
        return `@source "../node_modules/@usetheo/ui/dist/**/*.{js,mjs,cjs}";\n`;
      }
    },
  };
}
```

### 4.2 `src/preset.ts`

```typescript
import type { Config } from "tailwindcss";
import { theoUIPreset } from "./styles/tailwind-preset.js";

const preset: Partial<Config> = {
  ...theoUIPreset,
  content: [
    "./node_modules/@usetheo/ui/dist/**/*.{js,mjs,cjs}",
    "./node_modules/@usetheo/ui/dist/**/*.{ts,tsx}",
  ],
};

export default preset;
```

### 4.3 `tsup.config.ts`

```typescript
entry: {
  // … existing entries …
  "vite-plugin": "src/vite-plugin.ts",
  preset: "src/preset.ts",
},
external: [
  // … existing externals …
  "vite",
  "@tailwindcss/vite",
  "tailwindcss",
  "tailwindcss-animate",
],
```

### 4.4 `package.json`

```jsonc
{
  "exports": {
    // … existing exports …
    "./vite-plugin": {
      "types": "./dist/vite-plugin.d.ts",
      "import": "./dist/vite-plugin.js"
    },
    "./preset": {
      "types": "./dist/preset.d.ts",
      "import": "./dist/preset.js"
    }
  },
  "peerDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "vite": "^6.0.0 || ^7.0.0"
    // … existing peers …
  },
  "peerDependenciesMeta": {
    "@tailwindcss/vite": { "optional": true },
    "tailwindcss": { "optional": true },
    "vite": { "optional": true }
    // … existing optional peers …
  }
}
```

## 5. Validation

TheoKit's `integrateUseTheoUI()` runs these four checks against the
published artifact:

1. `typeof ui.default === 'function'` — the default export is callable
2. `typeof plugin === 'object' && plugin !== null` — the factory returns
   an object
3. `Array.isArray(plugin) === false` — single plugin, not an array
4. `'name' in plugin && typeof plugin.name === 'string'` — `name` field
   present and string-typed

Local validation: 11 unit tests in `src/vite-plugin.test.ts` covering
factory shape, name slug, `config()` hook presence, graceful
peer-missing degradation, `opts.tailwind === false` opt-out, and the
virtual module resolution path. 8 unit tests in `src/preset.test.ts`
covering preset shape, content paths, color/font/typescale/animation
token coverage, and plugin array presence.

## 6. Consequences

- **TheoKit's Phase 3 unblocked.** Their gated tests in
  `tests/unit/example-tailwind-files-deleted.test.ts` flip from
  `it.skip` to `it`; the example app's `tailwind.config.ts` +
  `postcss.config.js` can be deleted; the "ZERO consumer-side Tailwind
  config" promise lands.
- **Standalone consumers unaffected.** The new subpaths are additive.
  Existing v3 setups continue to work via
  `registry/r/tailwind-preset.json` and the pre-built
  `@usetheo/ui/styles.css`.
- **Bundle.** `dist/vite-plugin.js` ~2.4 KB; `dist/preset.js` ~5.8 KB.
  Both isolated subpaths — the main barrel is untouched. Quality-gate
  bundle baseline gets two new entries.

## 7. References

- Cross-repo contract: `theokit/docs/spikes/usetheo-ui-vite-plugin-shape.md`
- TheoKit consumer code: `theokit/packages/theo/src/vite-plugin/integrate-ui.ts`
- TheoKit auto-detect: `theokit/packages/theo/src/vite-plugin/auto-detect.ts`
- TheoKit gated tests: `theokit/tests/unit/example-tailwind-files-deleted.test.ts` (lines 23-31)

## 8. Follow-up (2026-05-22) — v4-native CSS artifacts (`0.5.1-next.0`)

The initial 0.5.0-next.0 release declared `tailwindcss@^4` as a peer dep
but shipped v3-shaped CSS artifacts internally — `dist/styles.css` used
`@tailwind base/components/utilities` directives (which Tailwind v4
emits as literal strings, zero utility generation) and the JS preset
relied on `theme.extend.colors` (a no-op for v4). Real TheoKit consumer
boot showed correct SSR HTML but every component unstyled in the browser.

Patched in 0.5.1-next.0:

| Bug | Fix |
|---|---|
| `dist/styles.css` used v3 `@tailwind` directives | Replaced with `@import "tailwindcss"`. v3 variant preserved at `dist/styles-v3-legacy.css`. |
| `dist/tokens.css` declared v3 `--primary` etc. (Tailwind v4 reads `--color-*`) | Added `dist/tokens-v4.css` with `@theme { --color-primary: hsl(var(--primary)); … }` aliases (Option A from the bug report). Kept `tokens.css` unchanged so `<ThemeProvider>`'s runtime `[data-theme]` cascade still mutates the v3 var layer; v4 utilities resolve through the indirection. |
| `dist/preset.js` was a v3 JS preset (Tailwind v4 dropped JS presets) | `./preset` subpath now points to `dist/preset.css` which chains `@import "./tokens.css"` + `@import "./tokens-v4.css"`. The JS preset stays available at `./preset-v3-legacy` for any tailwindcss@^3 consumer. |

Verification:

- **Shape check** — `pnpm dogfood:v4-zero-config` asserts all 28 `--color-*`
  aliases, all 14 `--text-*` tiers, `@keyframes` declarations, and the
  package.json export shape (64 checks).
- **Real build** — `pnpm dogfood:v4-real-build` packs the tarball,
  installs it in a tmp project alongside `@tailwindcss/cli@^4`, runs
  Tailwind v4 against `tests/fixtures/v4-zero-config/`, and grep-asserts
  the expected utility rules (`bg-primary`, `text-muted-foreground`,
  `text-body-sm`, `text-body-md`, `max-w-md`, `border-border`, `bg-card`,
  `text-accent-foreground`, `text-display-2xl`, `font-mono`, `shadow-md`)
  appear in the emitted CSS plus zero literal `@tailwind ` directives
  remain — 12 assertions, all passing.

### Follow-up ADRs

| ID | Decisão | Por quê |
|---|---|---|
| D9 | Keep v3 runtime vars (`--primary`, …) intact; layer v4 `--color-*` aliases on top via `hsl(var(--*))` indirection (bug report's Option A) | `<ThemeProvider>` injects v3 vars at runtime; 6 component files (token-usage-chart SVG, scroll-area, tabs inline shadows) read `hsl(var(--primary))` directly. Renaming would break them. The indirection is a one-token cost on resolution. |
| D10 | `./preset` becomes CSS (not JS); JS preset stays under `./preset-v3-legacy` | Tailwind v4 dropped JS presets; CSS is the canonical surface. Preserving the JS shape under a legacy name keeps shadcn-style v3 consumers viable. |
| D11 | Ship two prebuilt entry stylesheets: `dist/styles.css` (v4) and `dist/styles-v3-legacy.css` (v3) | Same as D10 logic — v3 consumers shouldn't break when 0.5.x ships. |
| D12 | Add `dogfood:v4-real-build` shell script (NOT in `quality:gates` by default) | The real build needs `@tailwindcss/cli@^4` installed; adding it to local devDeps conflicts with our existing `tailwindcss@^3` Ladle path. The script runs in an isolated tmp dir. Slow (~30s w/ network). Opt-in for local verification; runs in CI under a dedicated job. |
| D13 | Bump to `0.5.1-next.0` (patch, not minor/major) | Technically breaking for any 0.5.0-next.0 consumer using `import preset from "@usetheo/ui/preset"` (JS) — but TheoKit reverted away by the time this shipped, and 0.5.0-next.0 was out for only hours. Patch is honest: this is a bug fix on a release that wasn't actually working. |
