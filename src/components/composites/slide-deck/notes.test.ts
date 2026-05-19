import { describe, expect, it } from "vitest";
import { extractNotes } from "./notes.js";

describe("extractNotes", () => {
  it("returns body unchanged when no notes", () => {
    const md = "# heading\n\nbody";
    const result = extractNotes(md);
    expect(result.body).toBe(md);
    expect(result.notes).toBeUndefined();
  });

  it("extracts notes content from <!-- notes: ... -->", () => {
    const md = "# heading\n\n<!-- notes: remember the deadline -->";
    const result = extractNotes(md);
    expect(result.notes).toBe("remember the deadline");
  });

  it("removes notes comments from body", () => {
    const md = "# heading\n\n<!-- notes: hidden -->\n\nbody";
    const result = extractNotes(md);
    expect(result.body).not.toContain("notes:");
    expect(result.body).not.toContain("hidden");
    expect(result.body).toContain("# heading");
    expect(result.body).toContain("body");
  });

  it("concatenates multiple notes blocks", () => {
    const md = "# a\n\n<!-- notes: first -->\n\nbody\n\n<!-- notes: second -->";
    const result = extractNotes(md);
    expect(result.notes).toBe("first\n\nsecond");
  });

  it("accepts 'note:' singular alias", () => {
    const md = "<!-- note: short alias -->\n# heading";
    const result = extractNotes(md);
    expect(result.notes).toBe("short alias");
  });

  it("handles multi-line notes", () => {
    const md = "<!-- notes:\n  line one\n  line two\n-->\n# heading";
    const result = extractNotes(md);
    expect(result.notes).toContain("line one");
    expect(result.notes).toContain("line two");
  });

  it("returns undefined when notes block is empty", () => {
    const md = "<!-- notes:  -->\n# heading";
    const result = extractNotes(md);
    expect(result.notes).toBeUndefined();
  });
});
