/**
 * Migrate HSL-split tokens to OKLCH — Phase 2 T2.2.
 *
 * Walks:
 *   - src/styles/tokens.css     :root + .dark color declarations
 *   - src/themes/<theme>.ts     light{} / dark{} object values
 *
 * EC-4 absorbed: ONLY converts lines that declare a pure color token
 * (e.g. `--primary: 262 83% 58%;`). Lines that USE a token in a composed
 * value (shadows: `0 1px hsl(var(--foreground) / 0.06)`, texture utilities,
 * gradients) are SKIPPED — those convert manually in T2.5.
 *
 * Atomic write: each file backed up to `<file>.bak` before overwrite.
 * Run with `--dry-run` for diff preview.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { hslSplitToOklch } from "./lib/color.js";

const ROOT = process.cwd();
const DRY_RUN = process.argv.includes("--dry-run");

// CSS token declaration: `  --token-name: H S% L%;` — any indent, possibly
// trailing inline comment. Captures: 1=name+colon+space, 2=HSL-split value,
// 3=trailing (comment + ; or just ;).
const CSS_TOKEN_DECL =
  /^(\s*--[a-z][a-z0-9-]*:\s*)((?:-?\d+(?:\.\d+)?)\s+(?:-?\d+(?:\.\d+)?)%\s+(?:-?\d+(?:\.\d+)?)%)(\s*;.*)?$/gm;

// TS theme entry: `    "key": "H S% L%",` OR `    key: "H S% L%",` (TS shorthand allows unquoted identifiers).
const TS_ENTRY =
  /^(\s*"?[a-zA-Z][a-zA-Z0-9-]*"?:\s*")((?:-?\d+(?:\.\d+)?)\s+(?:-?\d+(?:\.\d+)?)%\s+(?:-?\d+(?:\.\d+)?)%)(",?\s*)$/gm;

interface FileChange {
  path: string;
  before: string;
  after: string;
  conversions: number;
}

function convertCss(content: string): { content: string; count: number } {
  let count = 0;
  const next = content.replace(CSS_TOKEN_DECL, (_full, prefix, value, suffix) => {
    const oklch = hslSplitToOklch(value);
    if (oklch === undefined) return _full; // safety: unreachable given the regex
    count++;
    return `${prefix}${oklch}${suffix ?? ";"}`;
  });
  return { content: next, count };
}

function convertTs(content: string): { content: string; count: number } {
  let count = 0;
  const next = content.replace(TS_ENTRY, (_full, prefix, value, suffix) => {
    const oklch = hslSplitToOklch(value);
    if (oklch === undefined) return _full;
    count++;
    return `${prefix}${oklch}${suffix}`;
  });
  return { content: next, count };
}

function processFile(path: string, kind: "css" | "ts"): FileChange | null {
  if (!existsSync(path)) {
    console.warn(`[migrate] skip ${path} (not found)`);
    return null;
  }
  const before = readFileSync(path, "utf8");
  const { content: after, count } = kind === "css" ? convertCss(before) : convertTs(before);
  if (count === 0) {
    return null;
  }
  return { path, before, after, conversions: count };
}

function applyChange(change: FileChange): void {
  if (DRY_RUN) {
    console.log(`[dry-run] ${change.path}: would convert ${change.conversions} value(s)`);
    return;
  }
  // Backup, then overwrite. T2.2 deep-dive: backups cleaned manually after commit.
  writeFileSync(`${change.path}.bak`, change.before, "utf8");
  writeFileSync(change.path, change.after, "utf8");
  console.log(`[ok] ${change.path}: ${change.conversions} value(s) → oklch`);
}

const TARGETS: Array<{ path: string; kind: "css" | "ts" }> = [
  { path: join(ROOT, "src/styles/tokens.css"), kind: "css" },
  ...[
    "violet-forge",
    "classic-paper",
    "aurora-terminal",
    "anthropic-style",
    "openai-style",
    "dracula",
    "github-dark",
    "linear-glass",
    "one-dark",
    "vercel-mono",
  ].map((name) => ({ path: join(ROOT, `src/themes/${name}.ts`), kind: "ts" as const })),
];

let totalConversions = 0;
let totalFiles = 0;
for (const target of TARGETS) {
  const change = processFile(target.path, target.kind);
  if (change === null) continue;
  applyChange(change);
  totalFiles++;
  totalConversions += change.conversions;
}

console.log(
  `\n${DRY_RUN ? "[dry-run] " : ""}migrate-themes-to-oklch: ${totalConversions} value(s) across ${totalFiles} file(s).`,
);

if (totalConversions === 0) {
  console.log("(Nothing to migrate — either already-OKLCH or pattern miss.)");
}
