/**
 * The v1 migration codemod is the official tool for a breaking change, so a silent
 * under-migration is worse than a crash: the caller concludes they migrated and did not.
 *
 * Regression: usetheokit/theokit-ui#41. Run over 192 files in theokit-plugins it printed
 * `codemod applied to 192 file(s)` and left `git diff` empty — the seven imports that
 * needed moving still pointed at `@theokit/ui`.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const CODEMOD = join(dirname(fileURLToPath(import.meta.url)), "../../codemod/split-usetheo.mjs");

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "theokit-codemod-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** Write a fixture and return its path. */
function fixture(name: string, contents: string): string {
  const path = join(dir, name);
  writeFileSync(path, contents);
  return path;
}

/** Run the codemod over the given files, returning its stdout. */
function run(...files: string[]): string {
  return execFileSync("node", [CODEMOD, ...files], { encoding: "utf-8" });
}

describe("split-usetheo codemod", () => {
  it("rewrites an import that ends with a semicolon", () => {
    const file = fixture("semi.tsx", 'import { Button } from "@theokit/ui";\n');

    run(file);

    expect(readFileSync(file, "utf-8")).toContain('from "@usetheo/ui"');
  });

  it("rewrites an import with no semicolon", () => {
    // `semi: false` is a common Prettier setting and is theokit-plugins' own. The original
    // regex ended in `;`, so in such a project the codemod matched nothing at all.
    const file = fixture("no-semi.tsx", "import { Button } from '@theokit/ui'\n");

    run(file);

    expect(readFileSync(file, "utf-8")).toContain("@usetheo/ui");
  });

  it("rewrites a type-only import", () => {
    // MOVED carries as many type names as value names (ButtonProps, AlertIntent, …), and
    // `import type {` never matched `import\s+\{`.
    const file = fixture("types.ts", 'import type { ButtonProps } from "@theokit/ui";\n');

    run(file);

    const out = readFileSync(file, "utf-8");
    expect(out).toContain("@usetheo/ui");
    expect(out).toContain("import type");
  });

  it("splits a mixed import, leaving what did not move", () => {
    const file = fixture("mixed.tsx", 'import { Button, ChatMessage } from "@theokit/ui";\n');

    run(file);
    const out = readFileSync(file, "utf-8");

    expect(out).toMatch(/import \{ ChatMessage \} from ["']@theokit\/ui["']/);
    expect(out).toMatch(/import \{ Button \} from ["']@usetheo\/ui["']/);
  });

  it("reports how many files it CHANGED, not how many it was given", () => {
    // The count was `process.argv.length - 2`. Handed a file with nothing to migrate it
    // still reported it as done, which is the whole defect: success is indistinguishable
    // from no-op.
    const untouched = fixture("untouched.tsx", 'import { ChatMessage } from "@theokit/ui";\n');

    const stdout = run(untouched);

    // The number before "of" is what was changed; the number after is what was inspected.
    expect(stdout).toMatch(/changed 0 of 1 file/);
  });

  it("does not rewrite a file it did not change", () => {
    // Writing every file unconditionally churns mtime on untouched sources, which
    // invalidates build caches for no reason.
    const untouched = fixture("untouched.tsx", 'import { ChatMessage } from "@theokit/ui";\n');
    const before = statSync(untouched).mtimeMs;

    run(untouched);

    expect(statSync(untouched).mtimeMs).toBe(before);
  });

  it("preserves the quote style and semicolon style of the file it edits", () => {
    const file = fixture("style.tsx", "import { Button } from '@theokit/ui'\n");

    run(file);

    expect(readFileSync(file, "utf-8").trim()).toBe("import { Button } from '@usetheo/ui'");
  });
});
