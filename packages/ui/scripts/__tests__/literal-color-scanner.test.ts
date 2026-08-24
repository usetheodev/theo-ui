/**
 * Tests for the literal Tailwind color scanner — Phase 1 T1.3.
 *
 * Covers EC-8 (variants) and acceptance criteria from the plan:
 *   - matches bg-red-500, bg-emerald-500/10, text-amber-600, border-blue-500/40
 *   - matches hover:bg-red-500, data-[state=open]:bg-emerald-500, [&_svg]:text-amber-500
 *   - matches border-l-red-500 (directional border)
 *   - does NOT match bg-primary, bg-primary-foreground, bg-success/10
 *   - whitelist by suffix: *.test.tsx, *.stories.tsx
 *   - suggestion engine returns relevant semantic tokens
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { LITERAL_COLOR_PATTERN, formatViolations, scan } from "../lib/literal-color-scanner.js";

function withFixture<T>(files: Record<string, string>, fn: (root: string) => T): T {
  const root = mkdtempSync(join(tmpdir(), "literal-color-scanner-"));
  try {
    for (const [relPath, content] of Object.entries(files)) {
      const abs = join(root, relPath);
      mkdirSync(join(abs, ".."), { recursive: true });
      writeFileSync(abs, content, "utf8");
    }
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("LITERAL_COLOR_PATTERN regex", () => {
  function matchAll(line: string): string[] {
    LITERAL_COLOR_PATTERN.lastIndex = 0;
    const out: string[] = [];
    let m: RegExpExecArray | null = LITERAL_COLOR_PATTERN.exec(line);
    while (m !== null) {
      out.push(m[0].replace(/^[\s:\[\]&_>"'`]/, ""));
      m = LITERAL_COLOR_PATTERN.exec(line);
    }
    return out;
  }

  it("matches plain Tailwind color classes", () => {
    expect(matchAll(`"bg-red-500"`)).toEqual(["bg-red-500"]);
    expect(matchAll(`"text-amber-600"`)).toEqual(["text-amber-600"]);
    expect(matchAll(`"border-blue-500"`)).toEqual(["border-blue-500"]);
  });

  it("matches alpha-modified variants", () => {
    expect(matchAll(`"bg-emerald-500/10"`)).toEqual(["bg-emerald-500"]);
    expect(matchAll(`"border-amber-500/40"`)).toEqual(["border-amber-500"]);
  });

  it("matches Tailwind variant prefixes (EC-8)", () => {
    expect(matchAll(`"hover:bg-red-500"`)).toEqual(["bg-red-500"]);
    expect(matchAll(`"data-[state=open]:bg-emerald-500"`)).toEqual(["bg-emerald-500"]);
    expect(matchAll(`"[&_svg]:text-amber-500"`)).toEqual(["text-amber-500"]);
    expect(matchAll(`"md:dark:text-blue-500"`)).toEqual(["text-blue-500"]);
  });

  it("matches directional border (border-l, border-t, ...)", () => {
    expect(matchAll(`"border-l-red-500"`)).toEqual(["border-l-red-500"]);
    expect(matchAll(`"border-t-emerald-500"`)).toEqual(["border-t-emerald-500"]);
  });

  it("does NOT match semantic tokens with `-foreground` suffix", () => {
    expect(matchAll(`"bg-primary-foreground"`)).toEqual([]);
    expect(matchAll(`"text-card-foreground"`)).toEqual([]);
    expect(matchAll(`"text-status-online-foreground"`)).toEqual([]);
  });

  it("does NOT match semantic tokens", () => {
    expect(matchAll(`"bg-primary"`)).toEqual([]);
    expect(matchAll(`"text-success"`)).toEqual([]);
    expect(matchAll(`"bg-success/10"`)).toEqual([]);
    expect(matchAll(`"bg-status-online"`)).toEqual([]);
  });

  it("matches multiple violations in one line", () => {
    const line = `"border-emerald-500/40 bg-emerald-500/10 text-emerald-600"`;
    expect(matchAll(line).sort()).toEqual(
      ["bg-emerald-500", "border-emerald-500", "text-emerald-600"].sort(),
    );
  });

  it("does not match bare 'gray-' identifier inside JS", () => {
    // `const gray = "foo"` — no Tailwind prefix
    expect(matchAll(`const gray-500 = "foo"`)).toEqual([]);
  });
});

describe("scan() (filesystem walk)", () => {
  it("returns 0 violations for clean fixture", () => {
    withFixture(
      {
        "src/components/clean.tsx": `export const C = () => <div className="bg-primary text-foreground" />;`,
      },
      (root) => {
        const result = scan({ rootDir: join(root, "src/components") });
        expect(result).toEqual([]);
      },
    );
  });

  it("flags violations with file path + line number", () => {
    withFixture(
      {
        "src/components/dirty.tsx": [
          `import { cn } from "../lib/cn.js";`,
          `export const D = () => <div className="bg-emerald-500" />;`,
        ].join("\n"),
      },
      (root) => {
        const result = scan({ rootDir: join(root, "src/components") });
        expect(result).toHaveLength(1);
        const v = result[0];
        expect(v).toBeDefined();
        if (!v) throw new Error("expected one violation");
        expect(v.line).toBe(2);
        expect(v.match).toBe("bg-emerald-500");
        expect(v.family).toBe("emerald");
        expect(v.suggestions).toContain("bg-success / text-success");
        expect(v.suggestions).toContain("bg-status-online (operational)");
      },
    );
  });

  it("skips *.test.tsx and *.stories.tsx files (whitelist)", () => {
    withFixture(
      {
        "src/components/foo/foo.tsx": `export const F = () => <div className="bg-blue-500" />;`,
        "src/components/foo/foo.test.tsx": "// test fixture uses bg-emerald-500 intentionally",
        "src/components/foo/foo.stories.tsx": "// story uses bg-red-500 intentionally",
      },
      (root) => {
        const result = scan({ rootDir: join(root, "src/components") });
        expect(result).toHaveLength(1);
        const v = result[0];
        if (!v) throw new Error("expected one violation");
        expect(v.match).toBe("bg-blue-500");
        expect(v.file).toMatch(/foo\.tsx$/);
        expect(v.file).not.toMatch(/\.test\./);
        expect(v.file).not.toMatch(/\.stories\./);
      },
    );
  });

  it("skips paths containing tests/fixture-", () => {
    withFixture(
      {
        "src/components/foo/foo.tsx": `export const F = () => <div className="bg-primary" />;`,
        "tests/fixture-shadcn-app/src/raw.tsx": "// reproduces upstream bg-blue-500 verbatim",
      },
      (root) => {
        const result = scan({ rootDir: join(root, "src") });
        expect(result).toEqual([]);
      },
    );
  });

  it("formatViolations produces useful diagnostic output", () => {
    const violations = [
      {
        file: "src/components/foo/foo.tsx",
        line: 42,
        match: "bg-emerald-500",
        family: "emerald",
        suggestions: ["bg-success / text-success", "bg-status-online (operational)"],
      },
    ];
    const output = formatViolations(violations);
    expect(output).toContain("src/components/foo/foo.tsx:42");
    expect(output).toContain("bg-emerald-500");
    expect(output).toContain("bg-success / text-success");
    expect(output).toContain("ADR-0004");
  });

  it("formatViolations returns empty string when zero violations", () => {
    expect(formatViolations([])).toBe("");
  });
});
