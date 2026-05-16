/**
 * import-graph — utilitários compartilhados pelos quality gates.
 *
 * Fornece parsing de imports e resolução de specifiers para a layer do
 * componente (`primitives` | `composites`). Substituiu a heurística por regex
 * literal `(?:primitives|composites)\/` que silenciosamente falhava em imports
 * irmãos da forma `"../button/button.js"` (o specifier não contém o segmento
 * `primitives/` mesmo quando o destino resolvido está em `primitives/<other>`).
 *
 * Filosofia: resolver o specifier para um path absoluto e comparar contra os
 * sets conhecidos de primitives/composites — assim a regra "primitive não
 * importa outro primitive" fica garantida independentemente da convenção de
 * string usada no `from`.
 */

import { dirname, resolve } from "node:path";

export type Layer = "primitives" | "composites";

export interface ParsedImport {
  /** Specifier exato como aparece no `from "..."`. */
  specifier: string;
  /** True quando o import é `import type` ou todo o group é `{ type X }`. */
  isType: boolean;
  /** Linha 1-indexed no arquivo original. */
  line: number;
}

/**
 * Layer membership map. The validator builds this once from the filesystem
 * and passes it to per-file resolution.
 */
export interface LayerMembership {
  primitives: Set<string>;
  composites: Set<string>;
}

/**
 * Resolução de um specifier para a componente Theo correspondente.
 * `null` em ambos os campos quando o specifier não cai em primitives/composites
 * (ex: import de `react`, `../../lib/cn.js`, `../../themes/...`).
 */
export interface ResolvedImport {
  layer: Layer | null;
  name: string | null;
  /** Path absoluto resolvido (para diagnóstico). */
  absolutePath: string | null;
}

const TYPE_ONLY_IMPORT_PATTERN = /^\s*(?:import|export)\s+type\b/;

/**
 * Parse all import/export-from statements in `content`. Distinguishes value
 * imports from type-only imports — type-only is allowed across layers per the
 * architecture doc ("type imports across primitives/composites … don't add
 * code at runtime").
 */
export function parseImports(content: string): ParsedImport[] {
  const out: ParsedImport[] = [];
  const lines = content.split("\n");
  // Use a per-line approach because the cross-line greedy regex misses
  // single-line statements when content has no newlines between them.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    // Match `import ... from "X"`, `import "X"`, `export ... from "X"`.
    const fromMatch = /(?:from\s+|^\s*import\s+|^\s*export\s+\*\s+from\s+)["']([^"']+)["']/.exec(
      line,
    );
    if (!fromMatch) continue;
    const specifier = fromMatch[1];
    if (!specifier) continue;
    const isType =
      TYPE_ONLY_IMPORT_PATTERN.test(line) ||
      // Bare `{ type X }` on the names side counts as a value import (mixed),
      // not a pure type import. Per TS spec, mixed imports are runtime.
      false;
    out.push({ specifier, isType, line: i + 1 });
  }
  return out;
}

/**
 * Same as `parseImports` but with multi-line awareness for the `import { ... }
 * from "X"` shape where the names list spans lines. Used by gates that need
 * exact name-by-name type/value classification.
 */
export function parseImportsDetailed(content: string): ParsedImport[] {
  const out: ParsedImport[] = [];
  // Cross-line tolerant: the names body may span multiple lines (e.g.
  // `import {\n  type X,\n  Y,\n} from "..."`). Use [^"';] (no semicolon, no
  // quote) repeated to bridge newlines, but bounded by the next `from "..."`.
  const pattern = /(?:^|\n)\s*(import|export)\s+(type\s+)?(?:[^"';]*?\s+from\s+)?["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  match = pattern.exec(content);
  while (match !== null) {
    const specifier = match[3];
    if (specifier) {
      const isType = !!match[2];
      // Compute 1-indexed line of the match start.
      const upto = content.slice(0, match.index);
      const line = upto.split("\n").length;
      out.push({ specifier, isType, line });
    }
    match = pattern.exec(content);
  }
  return out;
}

/**
 * Resolve a specifier to its Theo layer + name, if any.
 *
 * Algorithm:
 *  1. If the specifier is not relative (doesn't start with `.`), skip.
 *  2. Resolve `path.resolve(dirname(file), specifier)` to absolute.
 *  3. Walk up looking for the segments `components/primitives/<name>` or
 *     `components/composites/<name>`.
 *  4. Match `<name>` against the membership sets.
 */
export function resolveSpecifierToLayer(
  fromFile: string,
  specifier: string,
  layers: LayerMembership,
): ResolvedImport {
  if (!specifier.startsWith(".")) {
    return { layer: null, name: null, absolutePath: null };
  }
  const abs = resolve(dirname(fromFile), specifier);
  // Normalize separators to `/` for matching on Windows too.
  const norm = abs.split("\\").join("/");
  const match = /\/components\/(primitives|composites)\/([^/]+)(?:\/|$)/.exec(norm);
  if (!match) return { layer: null, name: null, absolutePath: abs };
  const [, layerStr, name] = match;
  const layer = layerStr as Layer;
  const memberSet = layers[layer];
  if (!name || !memberSet.has(name)) {
    return { layer: null, name: null, absolutePath: abs };
  }
  return { layer, name, absolutePath: abs };
}

/**
 * Global provider primitives — exceções nomeadas à regra "primitive não
 * importa outro Theo component". Documentado em `docs/architecture.md`
 * (seção "Global Provider Primitives") por D7. Edição requer RFC.
 *
 * NOTE: ThemeProvider lives at `src/themes/theme-provider.tsx`, NOT in
 * `src/components/primitives/`. The previous `"theme-provider"` allowlist
 * entry was dead code (the path resolver scans the primitives folder
 * only). Removed in re-audit cleanup. If a future provider lands as a
 * components/primitives/* folder, add it here with an RFC reference.
 */
export const GLOBAL_PROVIDER_PRIMITIVES: ReadonlySet<string> = new Set([
  "toast", // Toaster provider lives here
]);

/**
 * Check whether a primitive at `componentName` has any cross-primitive
 * value-import (after filtering out global provider primitives).
 *
 * Returns the list of offending sibling primitive names (empty when clean).
 */
export interface CrossLayerOffense {
  /** Sibling primitive imported. */
  targetName: string;
  /** Line in the source file (1-indexed). */
  line: number;
  /** True if the import was type-only — currently we surface but do not fail. */
  isType: boolean;
}

export function findPrimitiveOffenses(
  fromFile: string,
  fromName: string,
  content: string,
  layers: LayerMembership,
): CrossLayerOffense[] {
  if (GLOBAL_PROVIDER_PRIMITIVES.has(fromName)) return [];
  const offenses: CrossLayerOffense[] = [];
  for (const imp of parseImportsDetailed(content)) {
    const resolved = resolveSpecifierToLayer(fromFile, imp.specifier, layers);
    if (resolved.layer !== "primitives") continue;
    if (!resolved.name || resolved.name === fromName) continue;
    if (GLOBAL_PROVIDER_PRIMITIVES.has(resolved.name)) continue;
    if (imp.isType) continue; // type-only is allowed by architecture.md
    offenses.push({ targetName: resolved.name, line: imp.line, isType: imp.isType });
  }
  return offenses;
}

/**
 * Check whether a composite imports from `src/screens/` (forbidden).
 */
export function importsScreen(fromFile: string, content: string): boolean {
  for (const imp of parseImportsDetailed(content)) {
    if (!imp.specifier.startsWith(".")) continue;
    const abs = resolve(dirname(fromFile), imp.specifier);
    if (/\/src\/screens\//.test(abs.split("\\").join("/"))) return true;
  }
  return false;
}
