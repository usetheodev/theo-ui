#!/usr/bin/env tsx
/**
 * Pre-publish gate: every relative import inside the tarball must resolve to a file the tarball
 * ships — usetheokit/theokit-ui#79.
 *
 * `1.4.1` was published with a `dist/index.js` that imported four chunk files the package did not
 * contain (92 shipped, 96 referenced). Nothing caught it. The existing gates could not: `test` and
 * `test:contract` import from the working tree, where the chunks were present, and
 * `validate-exports.mjs` asks whether the entry loads *here* rather than whether the artefact is
 * whole. The defect only appeared when a consumer bundled the package, which is the most expensive
 * place to find it.
 *
 * This asks the cheaper question, of the thing actually published:
 *
 *   1. `npm pack --dry-run --json` lists the files the tarball will contain — the same computation
 *      npm runs at publish time, honouring `files`, `.npmignore` and its own built-in rules.
 *   2. Every relative specifier inside those JavaScript files must land on one of them.
 *
 * Offline, no consumer, no network. It fails on the artefact instead of on somebody's build.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Files whose imports are worth resolving. Type declarations are checked too. */
const CODE = /\.(js|mjs|cjs|d\.ts|d\.mts|d\.cts)$/;

/**
 * Static specifiers only, in the three forms a bundle uses.
 *
 * A dynamic `import(variable)` cannot be resolved without running the code, and a bundler cannot
 * resolve it either — so it is out of scope here rather than silently reported as missing.
 */
const SPECIFIER_PATTERNS = [
  /\bfrom\s*["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
];

/**
 * Strip comments before looking for imports.
 *
 * Not defensive tidying — without it this gate reports the example inside a JSDoc block as a
 * missing file. `tailwind-preset.d.ts` documents its own usage with `import … from
 * "./styles/tailwind-preset"`, a path that is correct for the consumer and meaningless relative to
 * the declaration, and a regex over raw text cannot tell that from a real import.
 *
 * A character scanner rather than a regex sweep, because `//` inside a string is ordinary — every
 * URL in the bundle contains one, and a naive strip would swallow the rest of those lines along
 * with any imports on them.
 */
function stripComments(source: string): string {
  let out = "";
  let i = 0;
  let quote: string | null = null;

  while (i < source.length) {
    const c = source[i] ?? "";
    const next = source[i + 1] ?? "";

    if (quote !== null) {
      if (c === "\\") {
        out += c + next;
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      out += c;
      i += 1;
      continue;
    }

    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      out += c;
      i += 1;
      continue;
    }

    if (c === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      i = end === -1 ? source.length : end + 2;
      // Keep a separator so `a/*x*/from"y"` does not become a new token.
      out += " ";
      continue;
    }

    if (c === "/" && next === "/") {
      const end = source.indexOf("\n", i + 2);
      i = end === -1 ? source.length : end;
      out += " ";
      continue;
    }

    out += c;
    i += 1;
  }

  return out;
}

interface PackedFile {
  path: string;
}

interface PackResult {
  files?: PackedFile[];
}

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

/**
 * Ask npm which files the tarball will contain.
 *
 * `--dry-run` writes nothing; `--json` gives the file list npm itself computed, which is the only
 * source of truth that already accounts for `files`, `.npmignore` and npm's built-in inclusions.
 * Reading the manifest and reimplementing those rules here would be a second implementation to
 * keep in sync, and it would be the one that is wrong.
 */
function packedFiles(): Set<string> {
  const raw = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: ROOT,
    encoding: "utf-8",
    maxBuffer: 32 * 1024 * 1024,
    // npm writes progress to stderr; only stdout is parsed.
    stdio: ["ignore", "pipe", "ignore"],
  });

  let parsed: PackResult[];
  try {
    parsed = JSON.parse(raw) as PackResult[];
  } catch {
    fail(`could not parse \`npm pack --dry-run --json\` output (${raw.slice(0, 200)}…)`);
  }

  const files = parsed[0]?.files;
  if (!files || files.length === 0) fail("`npm pack --dry-run --json` listed no files.");

  return new Set(files.map((f) => f.path.split("\\").join("/")));
}

/**
 * Resolve a relative specifier the way the importing file's own resolver does.
 *
 * The `.js` → `.d.ts` rewrite is not a convenience: under `moduleResolution: NodeNext`,
 * declaration files import each other with the *runtime* extension, so `./x.js` inside a `.d.ts`
 * is satisfied by `x.d.ts` alone, and a package that ships types beside no JavaScript for a given
 * module is correct. Without this branch the gate reports 327 missing files that are all present
 * — which is worse than no gate, because a noisy gate gets skipped.
 *
 * Extensionless and directory-index forms are tried for the same reason: to report only what a
 * real resolver would fail to find.
 */
function resolveCandidates(fromFile: string, specifier: string): string[] {
  const base = posix.normalize(posix.join(posix.dirname(fromFile), specifier));
  const fromDeclaration = /\.d\.(ts|mts|cts)$/.test(fromFile);

  if (/\.(js|mjs|cjs)$/.test(base)) {
    const stem = base.replace(/\.(js|mjs|cjs)$/, "");
    return fromDeclaration ? [base, `${stem}.d.ts`, `${stem}.d.mts`, `${stem}.d.cts`] : [base];
  }
  if (/\.(json|css|d\.ts|d\.mts|d\.cts)$/.test(base)) return [base];

  return [
    base,
    `${base}.js`,
    `${base}.mjs`,
    `${base}.cjs`,
    `${base}.d.ts`,
    `${base}/index.js`,
    `${base}/index.mjs`,
    `${base}/index.d.ts`,
  ];
}

function main(): void {
  const shipped = packedFiles();
  const code = [...shipped].filter((f) => CODE.test(f));

  if (code.length === 0)
    fail("the tarball contains no JavaScript or type files — is `dist/` built?");

  const missing: { file: string; specifier: string }[] = [];
  let checked = 0;

  for (const file of code) {
    const onDisk = resolve(ROOT, file);
    // A packed path that is not on disk is itself a failure worth naming.
    if (!existsSync(onDisk)) {
      missing.push({ file, specifier: "(the packed file is not on disk)" });
      continue;
    }

    const source = stripComments(readFileSync(onDisk, "utf-8"));
    const seen = new Set<string>();

    for (const pattern of SPECIFIER_PATTERNS) {
      pattern.lastIndex = 0;
      let match = pattern.exec(source);
      while (match !== null) {
        const specifier = match[1];
        if (specifier?.startsWith(".") === true && !seen.has(specifier)) {
          seen.add(specifier);
          checked += 1;
          const candidates = resolveCandidates(file, specifier);
          if (!candidates.some((c) => shipped.has(c))) missing.push({ file, specifier });
        }
        match = pattern.exec(source);
      }
    }
  }

  if (missing.length > 0) {
    console.error(
      `✗ ${String(missing.length)} relative import(s) in the tarball resolve to files it does not ship.\n  A consumer bundling this package fails at build; installing it may appear to work.\n`,
    );
    for (const { file, specifier } of missing.slice(0, 40)) {
      console.error(`    ${file} → ${specifier}`);
    }
    if (missing.length > 40) console.error(`    …and ${String(missing.length - 40)} more.`);
    console.error(
      "\n  A partial `dist/` from an interrupted or reused build is the usual cause — rebuild from clean.",
    );
    process.exit(1);
  }

  console.log(
    `✓ packaged imports resolve: ${String(checked)} relative specifier(s) across ` +
      `${String(code.length)} file(s), all present in the tarball.`,
  );
}

/*
 * Only run the gate when this file IS the process entry. Without the guard, importing it from a
 * test — the only way to unit-test the resolver — runs `npm pack` as a side effect of the import.
 */
if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

export { main, resolveCandidates, stripComments };
