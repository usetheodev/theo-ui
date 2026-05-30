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
 * so a single `@import "@usetheo/ui/styles.css"` in the consumer's CSS
 * pulls in every utility the library uses — no filesystem scanning,
 * no symlink dependency, no package-manager fragility.
 *
 * Why this exists: Tailwind v4's `@source` glob does not follow
 * symlinks. Under pnpm, `node_modules/@usetheo/ui` is a symlink to a
 * deep `.pnpm` content-hash directory, and the consumer-side
 * `@source "node_modules/@usetheo/ui/dist/**\/*.{js,mjs,cjs}"` pattern
 * expands to zero files. Pre-compiling at the library side fixes that
 * for every consumer regardless of package manager.
 *
 * RFC 0008 follow-up #2 (0.6.1-next.0). The output is small (~10-30 KB
 * uncompressed) — only the utilities the library actually uses. Consumer
 * `@theme` overrides still win via the runtime CSS-var cascade.
 */
import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function resolveTailwindCliBinary(): string {
  // The pnpm hoist places the v3 CLI at the root `.bin/` (legacy devDep,
  // still used by Ladle). We need the v4 CLI shipped by `@tailwindcss/cli`,
  // which lives at a deep path under `.pnpm/@tailwindcss+cli@…/`. Resolve
  // via Node's module algorithm so this works regardless of where the
  // tarball gets hoisted to.
  const req = createRequire(import.meta.url);
  const pkgPath = req.resolve("@tailwindcss/cli/package.json");
  const pkgDir = dirname(pkgPath);
  // The binary lives in this package's local `.bin/` (pnpm shadow).
  const binPath = join(pkgDir, "node_modules", ".bin", "tailwindcss");
  if (!existsSync(binPath)) {
    throw new Error(
      `[build-precompiled-css] @tailwindcss/cli binary not found at ${binPath}. Run \`pnpm install\` and retry.`,
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

async function compileUtilities(): Promise<void> {
  const cli = resolveTailwindCliBinary();
  await ensureTailwindV4Resolvable();
  const inputPath = join(ROOT, "src/styles/components-entry.css");
  const outputPath = join(ROOT, "dist/components.css");

  process.stdout.write(`[build-precompiled-css] running ${cli}\n`);
  process.stdout.write(`  input:  ${inputPath}\n`);
  process.stdout.write(`  output: ${outputPath}\n`);

  const result = spawnSync(cli, ["--input", inputPath, "--output", outputPath, "--minify"], {
    cwd: ROOT,
    stdio: "inherit",
    encoding: "utf-8",
  });

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

  // Append at the END so consumer-side `@theme` overrides (which run via
  // the CSS-var cascade at runtime) and earlier `@layer base` rules
  // (declared above in styles.css) keep their precedence.
  const next = `${current.trimEnd()}\n\n/* RFC 0008 follow-up #2 — pre-compiled utility rules. The bytes here\n * are emitted at build time by \`scripts/build-precompiled-css.ts\` so\n * consumers do not depend on Tailwind v4 \`@source\` scanning the\n * library's node_modules tree (which breaks under pnpm symlinks).\n */\n@import "./components.css";\n`;
  await writeFile(stylesPath, next);
  process.stdout.write(
    `[build-precompiled-css] appended @import "./components.css" to dist/styles.css\n`,
  );
}

async function main(): Promise<void> {
  await ensureDistDir();
  await compileUtilities();
  await chainComponentsCssFromStylesCss();
  process.stdout.write("[build-precompiled-css] done\n");
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
  process.exit(1);
});
