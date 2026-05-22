/**
 * `@usetheo/ui/vite-plugin` — auto-wire Tailwind v4 for consumers.
 *
 * Default export is a factory returning ONE Vite Plugin. Internally:
 *   1. chains `@tailwindcss/vite` v4 via the `config()` hook when resolvable
 *      and `opts.tailwind !== false`,
 *   2. exposes a virtual module `virtual:@usetheo/ui/library-sources.css`
 *      whose contents register `@source` directives covering the library's
 *      published files, so consumer-side Tailwind scans `@usetheo/ui` JSX
 *      and emits its utility classes,
 *   3. degrades gracefully via `console.warn` (never throws) when
 *      `@tailwindcss/vite` is not installed — the surface stays usable in
 *      CSS-only mode via the pre-built `@usetheo/ui/styles.css` subpath.
 *
 * This is the cross-repo contract TheoKit's `integrateUseTheoUI()` probes
 * for. See `docs/rfcs/0008-vite-plugin-and-preset.md`.
 */
import type { Plugin, UserConfig } from "vite";

export interface UseTheoUIPluginOptions {
  /** Disable Tailwind v4 auto-chain. Default: `true`. */
  tailwind?: boolean;
  /** Extra `@source` globs merged into the library defaults. */
  contentExtra?: string[];
}

const PLUGIN_NAME = "@usetheo/ui/vite-plugin";
const VIRTUAL_ID = "virtual:@usetheo/ui/library-sources.css";
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`;

function buildLibrarySourcesCss(extra: string[] = []): string {
  // `@source` paths are resolved relative to the importing CSS file in
  // Tailwind v4. The library defaults below cover the published artifact
  // tree under the consumer's `node_modules/@usetheo/ui/dist/`. Extra globs
  // are appended verbatim — consumers can register additional roots.
  const defaults = [
    '"../node_modules/@usetheo/ui/dist/**/*.{js,mjs,cjs}"',
    '"./node_modules/@usetheo/ui/dist/**/*.{js,mjs,cjs}"',
  ];
  const all = [...defaults, ...extra.map((g) => JSON.stringify(g))];
  return `${all.map((src) => `@source ${src};`).join("\n")}\n`;
}

export default function useTheoUIVite(opts: UseTheoUIPluginOptions = {}): Plugin {
  const wantsTailwind = opts.tailwind !== false;
  const extra = opts.contentExtra ?? [];

  let warned = false;
  const warnMissingPeer = (): void => {
    if (warned) return;
    warned = true;
    // biome-ignore lint/suspicious/noConsole: TheoKit cross-repo contract requires `console.warn` (not throw) when the optional `@tailwindcss/vite` peer is missing. See RFC 0008 §3 D1.
    console.warn(
      `[${PLUGIN_NAME}] @tailwindcss/vite was not resolvable; falling back to CSS-only mode. Install \`@tailwindcss/vite@^4\` to get the utility-driven design tokens, or import \`@usetheo/ui/styles.css\` directly for the pre-built surface.`,
    );
  };

  return {
    name: PLUGIN_NAME,

    // Vite's typing for `config()` since 5.x explicitly omits `plugins` from
    // the allowed return shape to nudge authors toward `Plugin[]` factories.
    // The runtime still honors `{ plugins }` merge, and the TheoKit contract
    // requires ONE Plugin object (so we can't return `Plugin[]` here).
    // The cast keeps the public surface honest and the type-checker quiet.
    async config(_userConfig, _env): Promise<Omit<UserConfig, "plugins"> | undefined> {
      if (!wantsTailwind) {
        return undefined;
      }

      try {
        // Dynamic import keeps `@tailwindcss/vite` as an OPTIONAL peer. The
        // specifier is held in a variable so Vite's import-analysis pass
        // leaves it alone — at runtime the consumer's resolver does the
        // actual resolution. Resolution failure must not crash the build.
        const specifier = "@tailwindcss/vite";
        const mod = await import(/* @vite-ignore */ specifier);
        const factory = (mod as { default?: unknown }).default;
        if (typeof factory !== "function") {
          warnMissingPeer();
          return undefined;
        }
        const tw = (factory as () => Plugin | Plugin[])();
        const tailwindPlugins = Array.isArray(tw) ? tw : [tw];
        return { plugins: tailwindPlugins } as unknown as Omit<UserConfig, "plugins">;
      } catch {
        warnMissingPeer();
        return undefined;
      }
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) {
        return RESOLVED_VIRTUAL_ID;
      }
      return undefined;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_ID) {
        return buildLibrarySourcesCss(extra);
      }
      return undefined;
    },
  };
}
