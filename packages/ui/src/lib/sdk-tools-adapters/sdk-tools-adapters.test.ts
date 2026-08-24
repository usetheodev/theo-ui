import { describe, expect, it } from "vitest";
import {
  adaptApplyPatchResult,
  adaptGitDiffResult,
  adaptListDirResult,
  adaptReadFileResult,
  adaptShellResult,
  parseResult,
  parseUnifiedDiff,
} from "./sdk-tools-adapters.js";

// These unit tests validate the adapters against the documented `{ ok: true, ... }`
// result shapes of the real @theokit/sdk-tools factories (read_file/list_dir/shell/
// git_diff/apply_patch). A live contract test against the real factory modules is
// intentionally NOT run here: theo-ui declares no dependency on @theokit/sdk-tools
// (sibling repo, not on npm), and importing the sibling's built dist under vitest
// fails because the sibling's own transitive deps are absent from theo-ui's
// node_modules. The factory result contract is owned + tested in the SDK repo;
// theo-ui owns the adapter mapping, which is what these tests exercise.

/* ─── T1.1 — parser + result narrowing ───────────────────────────────── */

describe("parseUnifiedDiff (M5-4)", () => {
  it("classifies added/removed/unchanged lines and tracks line numbers", () => {
    const diff =
      "diff --git a/a.ts b/a.ts\n@@ -1,2 +1,2 @@\n-const x = 1\n+const x = 2\n unchanged\n";
    const r = parseUnifiedDiff(diff, "a.ts");
    expect(r.path).toBe("a.ts");
    expect(r.stats).toEqual({ added: 1, removed: 1 });
    expect(r.hunks).toHaveLength(1);
    expect(r.hunks[0]?.lines.map((l) => l.kind)).toEqual(["removed", "added", "unchanged"]);
    expect(r.hunks[0]?.lines[2]).toMatchObject({ kind: "unchanged", oldNumber: 2, newNumber: 2 });
  });
  it("derives the path from the diff header when not passed", () => {
    const diff = "diff --git a/src/b.ts b/src/b.ts\n@@ -1 +1 @@\n-a\n+b\n";
    expect(parseUnifiedDiff(diff).path).toBe("src/b.ts");
  });
  it("returns zero hunks for a diff with no hunk headers", () => {
    expect(parseUnifiedDiff("diff --git a/x b/x\n").hunks).toHaveLength(0);
  });
});

describe("parseResult (M5-4)", () => {
  it("parses a JSON string with ok:true", () => {
    expect(parseResult('{"ok":true,"content":"x"}')).toEqual({ ok: true, content: "x" });
  });
  it("accepts an already-parsed object with ok:true", () => {
    expect(parseResult({ ok: true, diff: "d" })).toEqual({ ok: true, diff: "d" });
  });
  it("returns undefined for ok:false / non-json / non-object", () => {
    expect(parseResult({ ok: false, error: "x" })).toBeUndefined();
    expect(parseResult("not json")).toBeUndefined();
    expect(parseResult(42)).toBeUndefined();
  });
});

/* ─── T2.1 — the 5 adapters ──────────────────────────────────────────── */

describe("adaptReadFileResult (M5-4)", () => {
  it("maps {content} to CodeBlock props with a language from the path", () => {
    expect(adaptReadFileResult({ ok: true, content: "const x=1", size: 9 }, "a.ts")).toEqual({
      code: "const x=1",
      language: "ts",
    });
  });
  it("returns undefined language when no path is known", () => {
    expect(adaptReadFileResult({ ok: true, content: "x", size: 1 })).toEqual({
      code: "x",
      language: undefined,
    });
  });
  it("returns null on an error result", () => {
    expect(adaptReadFileResult({ ok: false, error: "not_found" })).toBeNull();
  });
});

describe("adaptShellResult (M5-4)", () => {
  it("maps stdout/stderr into terminal lines", () => {
    const lines = adaptShellResult({ ok: true, stdout: "hello\nworld", stderr: "", exit_code: 0 });
    expect(lines?.map((l) => l.content)).toContain("hello");
    expect(lines?.some((l) => l.kind === "stdout")).toBe(true);
  });
  it("tags stderr lines and a non-zero exit", () => {
    const lines = adaptShellResult({ ok: true, stdout: "", stderr: "boom", exit_code: 1 });
    expect(lines?.some((l) => l.kind === "stderr" && l.content === "boom")).toBe(true);
  });
  it("returns null on an error result", () => {
    expect(adaptShellResult({ ok: false, error: "timeout" })).toBeNull();
  });
});

describe("adaptListDirResult (M5-4)", () => {
  it("maps entries to data-table rows + columns", () => {
    const t = adaptListDirResult({
      ok: true,
      entries: [{ name: "a.ts", type: "file", size: 10 }],
      truncated: false,
      totalCount: 1,
    });
    expect(t?.rows[0]).toMatchObject({ name: "a.ts", type: "file" });
    expect(t?.columns.map((c) => c.key)).toContain("name");
  });
  it("returns null on an error result", () => {
    expect(adaptListDirResult({ ok: false, error: "not_found" })).toBeNull();
  });
});

describe("adaptApplyPatchResult (M5-4)", () => {
  it("maps files_patched to CreatedFile rows", () => {
    const r = adaptApplyPatchResult({ ok: true, files_patched: ["src/a.ts", "b.ts"] });
    expect(r?.files[0]).toMatchObject({ id: "src/a.ts", name: "a.ts" });
    expect(r?.files[1]).toMatchObject({ id: "b.ts", name: "b.ts" });
  });
  it("returns null on an error result", () => {
    expect(adaptApplyPatchResult({ ok: false, error: "parse_error" })).toBeNull();
  });
});

describe("adaptGitDiffResult (M5-4)", () => {
  it("parses the diff string into DiffViewer props", () => {
    const r = adaptGitDiffResult({
      ok: true,
      diff: "diff --git a/a.ts b/a.ts\n@@ -1 +1 @@\n-a\n+b\n",
    });
    expect(r?.path).toBe("a.ts");
    expect(r?.hunks).toHaveLength(1);
  });
  it("returns null when the diff has no parseable hunks", () => {
    expect(adaptGitDiffResult({ ok: true, diff: "" })).toBeNull();
  });
  it("returns null on an error result", () => {
    expect(adaptGitDiffResult({ ok: false, error: "not_a_repo" })).toBeNull();
  });
});

/* ─── review fixes — multi-hunk/multi-file parser + edge cases ───────── */

describe("parseUnifiedDiff multi-hunk / multi-file (review)", () => {
  it("parses multiple hunks of one file with independent line numbers", () => {
    const diff = [
      "diff --git a/a.ts b/a.ts",
      "@@ -1,2 +1,2 @@",
      "-const x = 1",
      "+const x = 2",
      " keep",
      "@@ -10,1 +10,1 @@",
      "-const y = 1",
      "+const y = 2",
      "",
    ].join("\n");
    const r = parseUnifiedDiff(diff);
    expect(r.hunks).toHaveLength(2);
    expect(r.stats).toEqual({ added: 2, removed: 2 });
    // second hunk's numbering starts at the @@ -10 +10 header, not continuing from hunk 1
    expect(r.hunks[1]?.lines[0]).toMatchObject({ kind: "removed", oldNumber: 10 });
    expect(r.hunks[1]?.lines[1]).toMatchObject({ kind: "added", newNumber: 10 });
  });

  it("parses the FIRST file only of a multi-file diff and never reads the preamble as content", () => {
    const diff = [
      "diff --git a/one.ts b/one.ts",
      "--- a/one.ts",
      "+++ b/one.ts",
      "@@ -1 +1 @@",
      "-a",
      "+A",
      "diff --git a/two.ts b/two.ts",
      "--- a/two.ts",
      "+++ b/two.ts",
      "@@ -1 +1 @@",
      "-c",
      "+C",
      "",
    ].join("\n");
    const r = parseUnifiedDiff(diff);
    expect(r.path).toBe("one.ts");
    expect(r.hunks).toHaveLength(1); // second file dropped (DiffViewer is single-file)
    // stats reflect ONLY real content lines — the +++/--- preamble of file 2 is not counted
    expect(r.stats).toEqual({ added: 1, removed: 1 });
    // no diff line content begins with the +++/--- file markers
    const contents = r.hunks.flatMap((h) => h.lines.map((l) => l.content));
    expect(contents.some((c) => c.startsWith("++ ") || c.startsWith("-- "))).toBe(false);
  });
});

describe("adapter edge cases (review)", () => {
  it("adaptReadFileResult returns undefined language for a dotfile or extension-less path", () => {
    expect(
      adaptReadFileResult({ ok: true, content: "x", size: 1 }, ".gitignore")?.language,
    ).toBeUndefined();
    expect(
      adaptReadFileResult({ ok: true, content: "x", size: 1 }, "Makefile")?.language,
    ).toBeUndefined();
  });

  it("adaptGitDiffResult honors an explicit path override", () => {
    const r = adaptGitDiffResult({ ok: true, diff: "@@ -1 +1 @@\n-a\n+b\n" }, "given/path.ts");
    expect(r?.path).toBe("given/path.ts");
  });

  it("adaptListDirResult unions columns across heterogeneous rows", () => {
    const t = adaptListDirResult({
      ok: true,
      entries: [
        { name: "dir", type: "directory" },
        { name: "f.ts", type: "file", size: 10 },
      ],
      truncated: false,
      totalCount: 2,
    });
    // `size` appears only on the 2nd row but must still be a column
    expect(t?.columns.map((c) => c.key)).toContain("size");
  });
});

/* ─── T3.1 — subpath barrel wiring ───────────────────────────────────── */

describe("@theokit/ui/sdk-tools-adapters subpath (M5-4 wiring)", () => {
  it("exposes the adapters + parser through the subpath barrel", async () => {
    const mod = await import("./index.js");
    expect(typeof mod.adaptGitDiffResult).toBe("function");
    expect(typeof mod.adaptReadFileResult).toBe("function");
    expect(typeof mod.adaptShellResult).toBe("function");
    expect(typeof mod.adaptListDirResult).toBe("function");
    expect(typeof mod.adaptApplyPatchResult).toBe("function");
    expect(typeof mod.parseUnifiedDiff).toBe("function");
  });
});
