#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
/**
 * Pre-compile utility CSS at LIBRARY BUILD TIME.
 *
 * Runs the Tailwind v4 CLI against `src/styles/components-entry.css`,
 * which `@source`-scans the library's own `src/**` and emits the
 * materialized utility rules (hover/focus/active/data-state variants
 * included) to `dist/components.css`.
 *
 * `dist/styles.css` is then amended to `@import "./components.css"`,
 * so a single `@import "@theokit/ui/styles.css"` in the consumer's CSS
 * pulls in every utility the library uses — no filesystem scanning,
 * no symlink dependency, no package-manager fragility.
 *
 * Why this exists: Tailwind v4's `@source` glob does not follow
 * symlinks. Under pnpm, `node_modules/@theokit/ui` is a symlink to a
 * deep `.pnpm` content-hash directory, and the consumer-side
 * `@source "node_modules/@theokit/ui/dist/**\/*.{js,mjs,cjs}"` pattern
 * expands to zero files. Pre-compiling at the library side fixes that
 * for every consumer regardless of package manager.
 *
 * RFC 0008 follow-up #2 (0.6.1-next.0). The output is small (~10-30 KB
 * uncompressed) — only the utilities the library actually uses. Consumer
 * `@theme` overrides still win via the runtime CSS-var cascade.
 */
import { existsSync, realpathSync, statSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildControlClassFallbackLayer,
  extractControlClasses,
  findUncoveredControlClasses,
} from "./lib/control-class-coverage.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function resolveTailwindCliBinary(): string {
  // We need the v4 CLI shipped by `@tailwindcss/cli` (the root `.bin/tailwindcss`
  // may be the legacy v3 CLI pulled in by `tailwindcss-animate`). Resolve the
  // package's OWN declared `bin` entry (its `dist/index.mjs`) via Node's module
  // algorithm — the only package-manager-agnostic contract. Do NOT look for a
  // nested `@tailwindcss/cli/node_modules/.bin/tailwindcss` shim: pnpm only
  // materializes that in some hoist layouts, so it is absent under CI's
  // `--frozen-lockfile` install and broke the v0.17.0 release build.
  const req = createRequire(import.meta.url);
  const pkgPath = req.resolve("@tailwindcss/cli/package.json");
  const pkgDir = dirname(pkgPath);
  const pkg = req("@tailwindcss/cli/package.json") as { bin?: string | Record<string, string> };
  const binField = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.tailwindcss;
  if (binField === undefined) {
    throw new Error(
      "[build-precompiled-css] @tailwindcss/cli package.json declares no `tailwindcss` bin entry.",
    );
  }
  const binPath = resolve(pkgDir, binField);
  if (!existsSync(binPath)) {
    throw new Error(
      `[build-precompiled-css] @tailwindcss/cli entry not found at ${binPath}. Run \`pnpm install\` and retry.`,
    );
  }
  return binPath;
}

async function ensureDistDir(): Promise<void> {
  await mkdir(join(ROOT, "dist"), { recursive: true });
}

async function ensureTailwindV4Resolvable(): Promise<void> {
  // EC-9 (2026-05-28) — `tailwindcss-animate@1.0.7` peer-dep `tailwindcss@^3`
  // pulls v3 into pnpm's hoist (`node_modules/tailwindcss -> .pnpm/tailwindcss@3.x`).
  // When `@tailwindcss/cli@4` resolves `@import "tailwindcss"` from the input
  // CSS file's directory, it walks UP from `src/styles/` and finds the v3
  // hoist first → "Can't resolve tailwindcss" because v3 isn't the v4 entry
  // shape. Place a v4 symlink AT the input file's directory level so v4
  // wins the resolution race. Idempotent.
  const stylesNm = join(ROOT, "src/styles/node_modules");
  const linkPath = join(stylesNm, "tailwindcss");
  const v4Target = join(ROOT, "node_modules/.pnpm/tailwindcss@4.3.0/node_modules/tailwindcss");
  if (!existsSync(v4Target)) {
    throw new Error(
      `[build-precompiled-css] tailwindcss@4 not found at expected pnpm path ${v4Target}. Run \`pnpm install\`.`,
    );
  }
  await mkdir(stylesNm, { recursive: true });
  if (!existsSync(linkPath)) {
    const { symlinkSync } = await import("node:fs");
    symlinkSync(v4Target, linkPath, "dir");
  }
}

function resolveUsetheoUiDist(): string {
  // The precompiled sheet MUST scan @usetheo/ui's compiled primitives too:
  // @theokit/ui re-exports them (e.g. ChatComposer renders @usetheo/ui's icon
  // Button), so a utility used ONLY by a @usetheo/ui primitive — like the icon
  // Button's `w-[var(--theo-control-h,2.25rem)]` — never materializes if we
  // scan only this repo's `src/`, and consumers get a squished (content-width)
  // icon button (the `h-[…]` twin ships because this repo's own inputs use it).
  //
  // Resolve @usetheo/ui's OWN entry, then realpath it so the path is REAL (not a
  // pnpm symlink): Tailwind v4 `@source` refuses to follow symlinks — the same
  // constraint this whole precompile exists to dodge. `@usetheo/ui`'s `exports`
  // map exposes only the ESM `import` condition (no `require`, no
  // `./package.json`), so CJS `require.resolve` cannot reach it — use the ESM
  // resolver, which honors `import` and lands on `…/dist/index.js`.
  const entryPath = fileURLToPath(import.meta.resolve("@usetheo/ui"));
  const dist = dirname(realpathSync(entryPath));
  if (!existsSync(dist) || !dist.endsWith("dist")) {
    throw new Error(
      `[build-precompiled-css] @usetheo/ui dist not resolvable (got ${dist}). Run \`pnpm install\` (and build @usetheo/ui) and retry.`,
    );
  }
  return dist;
}

async function writeGeneratedEntry(): Promise<string> {
  // Build a throwaway entry = the checked-in `components-entry.css` (relative
  // `@source` globs stay valid because the generated file lives in the SAME
  // `src/styles/` dir) + an ABSOLUTE `@source` for @usetheo/ui's real dist.
  const base = await readFile(join(ROOT, "src/styles/components-entry.css"), "utf-8");
  const usetheoDist = resolveUsetheoUiDist();
  const extra = [
    "",
    "/* Scan @usetheo/ui's compiled primitives so utilities used ONLY there",
    " * (e.g. the icon Button's width) materialize in the precompiled sheet.",
    " * Absolute realpath — Tailwind v4 @source does not follow pnpm symlinks. */",
    `@source "${usetheoDist}/**/*.{js,mjs,cjs}";`,
    `@source not "${usetheoDist}/**/*.test.{js,mjs,cjs}";`,
    "",
  ].join("\n");
  const genPath = join(ROOT, "src/styles/components-entry.generated.css");
  await writeFile(genPath, `${base.trimEnd()}\n${extra}`);
  return genPath;
}

async function compileUtilities(): Promise<void> {
  const cli = resolveTailwindCliBinary();
  await ensureTailwindV4Resolvable();
  const inputPath = await writeGeneratedEntry();
  const outputPath = join(ROOT, "dist/components.css");

  process.stdout.write(`[build-precompiled-css] running ${cli}\n`);
  process.stdout.write(`  input:  ${inputPath}\n`);
  process.stdout.write(`  output: ${outputPath}\n`);

  // Run the resolved ESM entry via the current Node binary — independent of any
  // executable `.bin` shim the package manager may or may not have created.
  const result = spawnSync(
    process.execPath,
    [cli, "--input", inputPath, "--output", outputPath, "--minify"],
    {
      cwd: ROOT,
      stdio: "inherit",
      encoding: "utf-8",
    },
  );

  // Remove the generated entry regardless of outcome — it is a build artifact,
  // never committed (a stale copy would drift from `components-entry.css`).
  await rm(inputPath, { force: true });

  if (result.status !== 0) {
    throw new Error(
      `[build-precompiled-css] @tailwindcss/cli exit ${result.status}. See log above.`,
    );
  }

  if (!existsSync(outputPath)) {
    throw new Error(`[build-precompiled-css] expected output missing: ${outputPath}`);
  }

  const bytes = statSync(outputPath).size;
  process.stdout.write(`[build-precompiled-css] wrote ${bytes} bytes\n`);
}

async function chainComponentsCssFromStylesCss(): Promise<void> {
  const stylesPath = join(ROOT, "dist/styles.css");
  if (!existsSync(stylesPath)) {
    throw new Error(
      "[build-precompiled-css] dist/styles.css missing — tsup must run first (onSuccess order).",
    );
  }

  const current = await readFile(stylesPath, "utf-8");
  const importLine = '@import "./components.css";';
  if (current.includes(importLine)) {
    process.stdout.write(
      "[build-precompiled-css] dist/styles.css already chains components.css (idempotent)\n",
    );
    return;
  }

  // Insert among the LEADING `@import`s (right after `@import "tailwindcss";`), NOT at the end:
  // CSS forbids `@import` after any other statement (`@layer base { … }` sits below), so an
  // end-appended import is invalid and a spec-correct PostCSS pipeline (a vanilla `vite` frontend, e.g.
  // the `--surface desktop` webview) hard-errors: "@import must precede all other statements". Placing it
  // among the other imports is valid everywhere; layer precedence is unaffected (Tailwind's `utilities`
  // layer still outranks `base` by layer order, not source order) and consumer `@theme` overrides cascade
  // at runtime via the `--*` CSS vars regardless of import position.
  const anchor = '@import "tailwindcss";';
  if (!current.includes(anchor)) {
    throw new Error(
      `[build-precompiled-css] dist/styles.css missing the '${anchor}' anchor — cannot place the components.css import at a valid position.`,
    );
  }
  const chained = `/* RFC 0008 follow-up #2 — pre-compiled utility rules, emitted at build time by\n   scripts/build-precompiled-css.ts so consumers do not depend on Tailwind v4 @source\n   scanning node_modules (breaks under pnpm symlinks). Kept among the leading @imports —\n   CSS forbids @import after other statements. */\n@import "./components.css";`;
  const next = current.replace(anchor, `${anchor}\n${chained}`);
  await writeFile(stylesPath, next);
  process.stdout.write(
    `[build-precompiled-css] chained @import "./components.css" after the tailwindcss import\n`,
  );
}

/**
 * Refuse to ship a stylesheet that does not cover the peer it was built against.
 *
 * `@usetheo/ui` ships no CSS of its own, so the emitted selectors carry the literal class
 * strings of whichever version was resolved at build time — and those strings inline a
 * default value. Between 0.22.0 and 0.35.1 the icon Button went from
 * `w-[var(--theo-control-h,2.25rem)]` to `w-[var(--theo-control-h,2rem)]`, and an
 * exact-match selector for the first does nothing for the second: the button loses its
 * width and height. Both versions are inside the peer range we publish.
 *
 * This does not resolve that coupling — usetheokit/theokit-ui#50 holds the options, and
 * choosing between them is a design call. It makes the mismatch a build failure instead of
 * CSS that ships wrong, so it cannot reach a consumer silently.
 */
async function assertControlClassCoverage(): Promise<void> {
  const dist = resolveUsetheoUiDist();
  const sources = await Promise.all(
    (await readdir(dist))
      .filter((f) => /\.(js|mjs|cjs)$/.test(f) && !f.includes(".test."))
      .map((f) => readFile(join(dist, f), "utf-8")),
  );

  // Fail on an empty sweep rather than pass it: a resolver landing somewhere without
  // compiled JS would otherwise report full coverage having compared nothing.
  if (sources.length === 0) {
    throw new Error(
      `[build-precompiled-css] found no compiled JS under ${dist}; refusing to report \
control-class coverage over an empty scan.`,
    );
  }

  const cssPath = join(ROOT, "dist/components.css");
  const css = await readFile(cssPath, "utf-8");
  const uncovered = findUncoveredControlClasses(sources, css);

  if (uncovered.length > 0) {
    throw new Error(
      [
        "[build-precompiled-css] dist/components.css does not cover every control class the",
        `resolved @usetheo/ui renders (${uncovered.length} uncovered):`,
        ...uncovered.map((c) => `  ${c}`),
        "",
        "The peer changed a design-system default embedded in its class names, so our",
        "exact-match selectors no longer apply and the affected controls render unstyled.",
        "See usetheokit/theokit-ui#50 — do not silence this by loosening the check.",
      ].join("\n"),
    );
  }

  // Prepend the version-independent net. It is written AFTER the coverage assertion on
  // purpose: the assertion must judge what Tailwind emitted from the resolved peer, not a
  // file this step just widened. A gate that grades its own output is the failure mode this
  // whole module exists to close.
  const net = buildControlClassFallbackLayer(extractControlClasses(sources));
  if (net.length > 0 && !css.includes("Version-independent net")) {
    await writeFile(cssPath, `${net}${css}`);
  }

  process.stdout.write(
    `[build-precompiled-css] control-class coverage OK (${extractControlClasses(sources).length} class(es) checked, net emitted for unseen peer versions)\n`,
  );
}

async function main(): Promise<void> {
  await ensureDistDir();
  await compileUtilities();
  await chainComponentsCssFromStylesCss();
  await assertControlClassCoverage();
  process.stdout.write("[build-precompiled-css] done\n");
}

export { resolveTailwindCliBinary, resolveUsetheoUiDist };

// Only run main when invoked as the entrypoint (CLI). Importers (the regression
// test) get the pure resolver without side effects.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err: unknown) => {
    process.stderr.write(`${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
    process.exit(1);
  });
}
