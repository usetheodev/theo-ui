import { describe, expect, it } from "vitest";
import { MAX_RAW_FRONTMATTER, extractFrontmatter } from "./frontmatter.js";

describe("extractFrontmatter", () => {
  it("returns null for markdown without --- block", () => {
    const result = extractFrontmatter("# Just a heading\n\nBody.");
    expect(result.rawFrontmatter).toBeNull();
    expect(result.body).toBe("# Just a heading\n\nBody.");
  });

  it("splits frontmatter and body correctly", () => {
    const md = "---\ntheme: default\n---\n# heading\n";
    const result = extractFrontmatter(md);
    expect(result.rawFrontmatter).toBe("theme: default");
    expect(result.body).toBe("# heading\n");
  });

  it("handles CRLF line endings", () => {
    const md = "---\r\ntheme: default\r\n---\r\n# heading\r\n";
    const result = extractFrontmatter(md);
    expect(result.rawFrontmatter).toBe("theme: default");
    expect(result.body).toBe("# heading\r\n");
  });

  it("strips leading BOM before regex match (EC-4 / D14)", () => {
    const md = "﻿---\ntheme: default\n---\n# heading";
    const result = extractFrontmatter(md);
    expect(result.rawFrontmatter).toBe("theme: default");
    expect(result.body).toBe("# heading");
  });

  it("returns tooLarge:true when raw frontmatter > 10KB (EC-10 / D14)", () => {
    const huge = `key: ${"x".repeat(MAX_RAW_FRONTMATTER + 100)}`;
    const md = `---\n${huge}\n---\n# body`;
    const result = extractFrontmatter(md);
    expect(result.rawFrontmatter).not.toBeNull();
    expect(result.tooLarge).toBe(true);
  });

  it("missing closing --- → rawFrontmatter:null, whole input as body (EC-6)", () => {
    const md = "---\ntheme: foo\n# heading\nwithout closing";
    const result = extractFrontmatter(md);
    expect(result.rawFrontmatter).toBeNull();
    expect(result.body).toBe(md);
  });

  it("preserves empty body when frontmatter is the entire content", () => {
    const md = "---\ntheme: default\n---\n";
    const result = extractFrontmatter(md);
    expect(result.rawFrontmatter).toBe("theme: default");
    expect(result.body).toBe("");
  });

  it("strips BOM even when no frontmatter present", () => {
    const md = "﻿# heading";
    const result = extractFrontmatter(md);
    expect(result.rawFrontmatter).toBeNull();
    expect(result.body).toBe("# heading");
  });
});
