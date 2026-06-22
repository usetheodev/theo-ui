import type { CreatedFile } from "../../components/primitives/created-files-card/index.js";
/**
 * `@theokit/ui/sdk-tools-adapters` (M5-4) — pure converters from
 * `@theokit/sdk-tools` tool results into theo-ui rich-primitive props.
 *
 * Each adapter takes a tool's result (a JSON STRING or an already-parsed object
 * of shape `{ ok: true, ... }`) and returns the matching primitive's props, or
 * `null` when the result is an error / wrong shape / unparseable — so the caller
 * keeps the `<ToolCallPart>` fallback (ADR D1). The adapters are PURE and import
 * NOTHING from `@theokit/sdk-tools` at runtime (ADR D2) — consumers of this
 * subpath gain zero new runtime dependency. The contract test (dev-only) imports
 * the real factories to guard against result-shape drift.
 */
import type { DiffHunk, DiffLine } from "../../components/primitives/diff-viewer/index.js";
import type { TerminalLine } from "../../components/primitives/terminal-panel/index.js";

/* ─── result narrowing ───────────────────────────────────────────────── */

/**
 * Narrow a tool result (string or object) to its `{ ok: true, ... }` payload.
 * Returns `undefined` for `{ ok: false }`, non-`ok` objects, non-JSON strings,
 * or non-objects. Never throws.
 */
export function parseResult(result: unknown): Record<string, unknown> | undefined {
  let obj: unknown = result;
  if (typeof result === "string") {
    try {
      obj = JSON.parse(result);
    } catch {
      return undefined;
    }
  }
  if (typeof obj !== "object" || obj === null) return undefined;
  const rec = obj as Record<string, unknown>;
  return rec.ok === true ? rec : undefined;
}

function basename(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  const slash = trimmed.lastIndexOf("/");
  return slash >= 0 ? trimmed.slice(slash + 1) : trimmed;
}

function extension(path: string): string | undefined {
  const name = basename(path);
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1) : undefined;
}

/* ─── unified-diff parser (ADR D3) ───────────────────────────────────── */

const HUNK_HEADER = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;
const GIT_HEADER_PATH = /^diff --git a\/(.+?) b\//;
const PLUS_PATH = /^\+\+\+ b\/(.+)$/;

export interface ParsedDiff {
  path: string;
  stats: { added: number; removed: number };
  hunks: DiffHunk[];
}

/**
 * Parse a unified-diff string (as produced by `git diff`) into the bespoke
 * `DiffHunk[]` shape `<DiffViewer>` consumes. Single-file scope: the common
 * format git_diff emits. Returns zero hunks when the input has no hunk headers
 * (the caller then degrades to `<ToolCallPart>`).
 */
export function parseUnifiedDiff(diff: string, path?: string): ParsedDiff {
  const lines = diff.split(/\r?\n/);
  const hunks: DiffHunk[] = [];
  let derivedPath = path;
  let added = 0;
  let removed = 0;
  let current: DiffHunk | undefined;
  let oldNo = 0;
  let newNo = 0;

  for (const line of lines) {
    // A new `diff --git` header starts a new file. `<DiffViewer>` renders a
    // single file, so we parse the FIRST file only and stop at the second
    // (rather than conflating multiple files' hunks under one path). The header
    // also closes the current hunk so the file preamble (`index`/`---`/`+++`)
    // that follows is never mis-read as content.
    if (line.startsWith("diff --git ")) {
      if (hunks.length > 0) break;
      current = undefined;
      const g = GIT_HEADER_PATH.exec(line);
      if (g?.[1] && derivedPath === undefined) derivedPath = g[1];
      continue;
    }
    const header = HUNK_HEADER.exec(line);
    if (header) {
      oldNo = Number(header[1]);
      newNo = Number(header[2]);
      current = { id: `hunk-${hunks.length}`, header: line, lines: [] };
      hunks.push(current);
      continue;
    }
    if (!current) {
      // Pre-hunk preamble (`index`/`--- a/`/`+++ b/`): never content. Derive the
      // path from `+++ b/<path>` when the git header was absent or path-less.
      if (derivedPath === undefined) {
        const g = PLUS_PATH.exec(line);
        if (g?.[1]) derivedPath = g[1];
      }
      continue;
    }
    const kind = lineKind(line);
    if (kind === undefined) continue; // "\ No newline at end of file", etc.
    const content = line.slice(1);
    const entry: DiffLine = { kind, content };
    if (kind === "added") {
      entry.newNumber = newNo++;
      added++;
    } else if (kind === "removed") {
      entry.oldNumber = oldNo++;
      removed++;
    } else {
      entry.oldNumber = oldNo++;
      entry.newNumber = newNo++;
    }
    current.lines.push(entry);
  }

  return { path: derivedPath ?? "", stats: { added, removed }, hunks };
}

function lineKind(line: string): "added" | "removed" | "unchanged" | undefined {
  if (line.startsWith("+")) return "added";
  if (line.startsWith("-")) return "removed";
  if (line.startsWith(" ")) return "unchanged";
  return undefined;
}

/* ─── adapters ───────────────────────────────────────────────────────── */

export interface CodeBlockAdapterProps {
  code: string;
  language: string | undefined;
}

/** `read_file` `{ok,content}` → `<CodeBlock>` props. */
export function adaptReadFileResult(result: unknown, path?: string): CodeBlockAdapterProps | null {
  const r = parseResult(result);
  if (r === undefined || typeof r.content !== "string") return null;
  return { code: r.content, language: path ? extension(path) : undefined };
}

/** `shell_exec` `{ok,stdout,stderr,exit_code}` → `<TerminalPanel>` lines. */
export function adaptShellResult(result: unknown): TerminalLine[] | null {
  const r = parseResult(result);
  if (r === undefined) return null;
  const lines: TerminalLine[] = [];
  const push = (text: string, kind: TerminalLine["kind"]) => {
    if (text.length === 0) return;
    for (const [i, content] of text.split(/\r?\n/).entries()) {
      lines.push({ id: `${kind}-${i}`, kind, content });
    }
  };
  if (typeof r.stdout === "string") push(r.stdout, "stdout");
  if (typeof r.stderr === "string") push(r.stderr, "stderr");
  const exit = typeof r.exit_code === "number" ? r.exit_code : 0;
  lines.push({
    id: "exit",
    kind: exit === 0 ? "ok" : "stderr",
    content: `exit ${exit}`,
  });
  return lines;
}

export interface DataTableAdapterProps {
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, unknown>>;
}

/** `list_dir` `{ok,entries}` → `<DataTable>` columns + rows. */
export function adaptListDirResult(result: unknown): DataTableAdapterProps | null {
  const r = parseResult(result);
  if (r === undefined || !Array.isArray(r.entries)) return null;
  const rows = r.entries.filter(
    (e): e is Record<string, unknown> => typeof e === "object" && e !== null,
  );
  // Union keys across ALL rows so heterogeneous entries (e.g. files with `size`,
  // dirs without) never drop a column present only in a later row.
  const keys = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) keys.add(key);
  }
  if (keys.size === 0) {
    keys.add("name");
    keys.add("type");
  }
  return { columns: [...keys].map((key) => ({ key, label: key })), rows };
}

export interface CreatedFilesAdapterProps {
  files: CreatedFile[];
}

/** `apply_patch` `{ok,files_patched}` → `<CreatedFilesCard>` files. */
export function adaptApplyPatchResult(result: unknown): CreatedFilesAdapterProps | null {
  const r = parseResult(result);
  if (r === undefined || !Array.isArray(r.files_patched)) return null;
  const files = r.files_patched
    .filter((p): p is string => typeof p === "string")
    .map((p) => ({ id: p, name: basename(p) }));
  return { files };
}

/** `git_diff` `{ok,diff}` → `<DiffViewer>` props, or `null` when no hunks. */
export function adaptGitDiffResult(result: unknown, path?: string): ParsedDiff | null {
  const r = parseResult(result);
  if (r === undefined || typeof r.diff !== "string") return null;
  const parsed = parseUnifiedDiff(r.diff, path);
  return parsed.hunks.length > 0 ? parsed : null;
}
