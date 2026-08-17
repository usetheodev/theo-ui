/**
 * Literal Tailwind color scanner — Phase 1 T1.3 / D3 / ADR-0004.
 *
 * Walks src/components (configurable) and flags any usage of Tailwind's
 * literal color scale (`bg-emerald-500`, `text-amber-600/40`, etc.).
 * Components MUST consume semantic tokens (`bg-primary`, `bg-status-online`,
 * `text-warning`) so theme switching propagates correctly. Literal Tailwind
 * colors bypass the cascade — they are the same hex regardless of the
 * active theme.
 *
 * Pre-T1.2 there were 12 known violations. Post-sweep we expect 0.
 * Run via `pnpm quality:structure` (wired in validate-quality-gates.ts).
 *
 * Honest limitations:
 *   1. Template-literal interpolation (`bg-${color}-500`) is NOT detected.
 *      Add a biome rule if it becomes a real frequency problem; measured
 *      now (2026-06-03), zero occurrences in src/.
 *   2. Inline `style={{ background: '#emerald-ish' }}` is outside scope —
 *      Tailwind class names are the target.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const TAILWIND_PROPERTIES = [
  "bg",
  "text",
  // border can take an optional directional suffix: border-l, border-t, etc.
  "border(?:-[lrtbxyse])?",
  "ring",
  "fill",
  "stroke",
  "from",
  "to",
  "via",
  "outline",
  "divide",
  "shadow",
  "accent",
  "caret",
  "decoration",
  "placeholder",
];

const TAILWIND_COLOR_FAMILIES = [
  "red",
  "blue",
  "green",
  "emerald",
  "amber",
  "indigo",
  "orange",
  "pink",
  "sky",
  "cyan",
  "teal",
  "lime",
  "yellow",
  "fuchsia",
  "rose",
  "violet",
  "purple",
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
];

/**
 * Class-token boundary: a Tailwind utility class is preceded by start-of-string,
 * whitespace, quote, or one of `:[]&_>` (variant separators / arbitrary
 * selector tokens). This catches `hover:bg-red-500`, `data-[state=open]:bg-red-500`,
 * `[&_svg]:bg-red-500`, `md:dark:bg-red-500` etc. without matching identifiers
 * mid-word like `bg-primary-foreground` (different family entirely) or
 * inside JS strings that look like log messages.
 */
const PRECEDING_BOUNDARY = String.raw`(?:^|[\s:\[\]&_>"'\`])`;

export const LITERAL_COLOR_PATTERN = new RegExp(
  `${PRECEDING_BOUNDARY}(${TAILWIND_PROPERTIES.join("|")})-(${TAILWIND_COLOR_FAMILIES.join(
    "|",
  )})-(\\d{2,3})\\b`,
  "g",
);

export interface Violation {
  /** File path relative to scan root. */
  file: string;
  /** 1-indexed line number. */
  line: number;
  /** Matched substring (e.g. `bg-emerald-500`). */
  match: string;
  /** Token family hit (e.g. `emerald`). */
  family: string;
  /** Suggested semantic tokens to replace this. */
  suggestions: string[];
}

export interface ScanOptions {
  /** Root directory to walk. Defaults to `src/components`. */
  rootDir?: string;
  /** Glob-like suffixes to skip (case-insensitive). */
  skipSuffixes?: string[];
  /** Path substrings to skip entirely. */
  skipPathContains?: string[];
}

const DEFAULT_OPTIONS: Required<ScanOptions> = {
  rootDir: "src/components",
  skipSuffixes: [".test.tsx", ".test.ts", ".stories.tsx", ".stories.ts"],
  skipPathContains: ["tests/fixture-", "node_modules", "/__tests__/"],
};

/**
 * Map a Tailwind color family to suggested semantic tokens.
 * Multiple suggestions when both action-result and status semantics are plausible.
 */
function suggestFor(family: string): string[] {
  switch (family) {
    case "red":
    case "rose":
    case "pink":
    case "fuchsia":
      return ["bg-destructive / text-destructive", "bg-status-offline (operational)"];
    case "emerald":
    case "green":
    case "lime":
    case "teal":
      return ["bg-success / text-success", "bg-status-online (operational)"];
    case "amber":
    case "yellow":
    case "orange":
      return ["bg-warning / text-warning", "bg-status-degraded (operational)"];
    case "blue":
    case "sky":
    case "cyan":
    case "indigo":
      return ["bg-info / text-info", "bg-primary (brand)", "bg-status-info (operational)"];
    case "violet":
    case "purple":
      return ["bg-primary / text-primary (Violet Forge default)"];
    case "slate":
    case "gray":
    case "zinc":
    case "neutral":
    case "stone":
      return [
        "bg-muted / text-muted-foreground (background neutrals)",
        "bg-secondary (button neutrals)",
        "bg-card (surface)",
      ];
    default:
      return ["bg-primary or other semantic token — see docs/design-system.md#semantic-tokens"];
  }
}

function shouldSkipFile(absPath: string, opts: Required<ScanOptions>): boolean {
  const lower = absPath.toLowerCase();
  for (const suffix of opts.skipSuffixes) {
    if (lower.endsWith(suffix.toLowerCase())) return true;
  }
  for (const fragment of opts.skipPathContains) {
    if (lower.includes(fragment.toLowerCase())) return true;
  }
  return false;
}

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const stat = statSync(abs);
    if (stat.isDirectory()) {
      yield* walk(abs);
    } else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
      yield abs;
    }
  }
}

export function scan(options: ScanOptions = {}): Violation[] {
  const opts: Required<ScanOptions> = { ...DEFAULT_OPTIONS, ...options };
  const violations: Violation[] = [];

  for (const abs of walk(opts.rootDir)) {
    if (shouldSkipFile(abs, opts)) continue;
    const source = readFileSync(abs, "utf8");
    const lines = source.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      // Use global regex; reset lastIndex per line.
      LITERAL_COLOR_PATTERN.lastIndex = 0;
      let match: RegExpExecArray | null = LITERAL_COLOR_PATTERN.exec(line);
      while (match !== null) {
        const [, _property, family, _shade] = match;
        const matched = match[0].replace(/^[\s:\[\]&_>"'`]/, ""); // strip the boundary char
        violations.push({
          file: relative(process.cwd(), abs),
          line: i + 1,
          match: matched,
          family: family ?? "",
          suggestions: suggestFor(family ?? ""),
        });
        match = LITERAL_COLOR_PATTERN.exec(line);
      }
    }
  }

  return violations;
}

export function formatViolations(violations: Violation[]): string {
  if (violations.length === 0) return "";
  const lines: string[] = [
    `[quality-gates] ${violations.length} literal Tailwind color usage(s) found in src/components.`,
    "",
    "Components MUST consume semantic tokens (--primary, --success, --status-*, etc.) so",
    "theme switching propagates. Literal Tailwind colors bypass the theme cascade.",
    "",
  ];
  for (const v of violations) {
    lines.push(`  ${v.file}:${v.line}`);
    lines.push(`    found: ${v.match}`);
    lines.push("    suggestions:");
    for (const s of v.suggestions) {
      lines.push(`      - ${s}`);
    }
    lines.push("");
  }
  lines.push("See ADR-0004 (docs/adr/0004-no-literal-tailwind-colors-in-source.md).");
  return lines.join("\n");
}
