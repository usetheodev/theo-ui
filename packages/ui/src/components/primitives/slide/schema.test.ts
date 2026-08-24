import { describe, expect, it } from "vitest";
import { sanitizeBgUrl, slideFrontmatter, slideInput, slideLayout, slideTheme } from "./schema.js";

describe("slideFrontmatter", () => {
  it("accepts empty object (no directives)", () => {
    const result = slideFrontmatter.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts theme: 'default'", () => {
    const result = slideFrontmatter.safeParse({ theme: "default" });
    expect(result.success).toBe(true);
  });

  it("accepts theme: 'violet-forge'", () => {
    const result = slideFrontmatter.safeParse({ theme: "violet-forge" });
    expect(result.success).toBe(true);
  });

  it("rejects theme not in enum", () => {
    const result = slideFrontmatter.safeParse({ theme: "nonexistent" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown top-level keys via strict()", () => {
    const result = slideFrontmatter.safeParse({ totallyUnknown: true });
    expect(result.success).toBe(false);
  });

  it("accepts BCP-47 lang tags", () => {
    expect(slideFrontmatter.safeParse({ lang: "en" }).success).toBe(true);
    expect(slideFrontmatter.safeParse({ lang: "en-US" }).success).toBe(true);
    expect(slideFrontmatter.safeParse({ lang: "pt-BR" }).success).toBe(true);
  });

  it("rejects malformed lang tags", () => {
    expect(slideFrontmatter.safeParse({ lang: "EN_US" }).success).toBe(false);
    expect(slideFrontmatter.safeParse({ lang: "english" }).success).toBe(false);
  });

  it("accepts CSS color strings up to 64 chars", () => {
    expect(slideFrontmatter.safeParse({ color: "#000" }).success).toBe(true);
    expect(slideFrontmatter.safeParse({ color: "rgb(0,0,0)" }).success).toBe(true);
    expect(slideFrontmatter.safeParse({ color: "x".repeat(64) }).success).toBe(true);
    expect(slideFrontmatter.safeParse({ color: "x".repeat(65) }).success).toBe(false);
  });

  it("accepts backgroundColor + color combined", () => {
    const result = slideFrontmatter.safeParse({
      color: "#fff",
      backgroundColor: "#000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects nested objects (strict on top level catches non-enum)", () => {
    const result = slideFrontmatter.safeParse({ theme: { name: "default" } });
    expect(result.success).toBe(false);
  });
});

describe("slideInput", () => {
  it("composes frontmatter + body", () => {
    const result = slideInput.safeParse({ frontmatter: {}, body: "# heading" });
    expect(result.success).toBe(true);
  });

  it("accepts empty body", () => {
    const result = slideInput.safeParse({ frontmatter: {}, body: "" });
    expect(result.success).toBe(true);
  });

  it("rejects body > 50000 chars", () => {
    const result = slideInput.safeParse({
      frontmatter: {},
      body: "x".repeat(50_001),
    });
    expect(result.success).toBe(false);
  });
});

describe("slideTheme", () => {
  it("includes 'default' and 'violet-forge'", () => {
    expect(slideTheme.safeParse("default").success).toBe(true);
    expect(slideTheme.safeParse("violet-forge").success).toBe(true);
  });
});

describe("slideLayout (T2.1)", () => {
  it("accepts the 7 built-in layouts", () => {
    for (const l of [
      "default",
      "title",
      "two-column",
      "image-right",
      "image-left",
      "code-output",
      "section",
    ]) {
      expect(slideLayout.safeParse(l).success).toBe(true);
    }
  });

  it("rejects unknown layout", () => {
    expect(slideLayout.safeParse("freeform").success).toBe(false);
  });

  it("frontmatter accepts layout: 'two-column'", () => {
    expect(slideFrontmatter.safeParse({ layout: "two-column" }).success).toBe(true);
  });

  it("frontmatter rejects layout: 'unknown'", () => {
    expect(slideFrontmatter.safeParse({ layout: "unknown" }).success).toBe(false);
  });
});

describe("sanitizeBgUrl (T3.1 / EC-7)", () => {
  it("accepts plain https URL", () => {
    expect(sanitizeBgUrl("https://example.com/img.png")).toBe("https://example.com/img.png");
  });

  it("accepts http URL", () => {
    expect(sanitizeBgUrl("http://example.com/x")).toBe("http://example.com/x");
  });

  it("unwraps url(...) wrapper", () => {
    expect(sanitizeBgUrl("url(https://example.com/x.png)")).toBe("https://example.com/x.png");
  });

  it("unwraps url('...') with quotes", () => {
    expect(sanitizeBgUrl("url('https://example.com/x.png')")).toBe("https://example.com/x.png");
  });

  it("rejects javascript: scheme", () => {
    expect(sanitizeBgUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects vbscript: scheme", () => {
    expect(sanitizeBgUrl("vbscript:msgbox")).toBeNull();
  });

  it("rejects ALL data: URLs (EC-7)", () => {
    expect(sanitizeBgUrl("data:text/html,<script>")).toBeNull();
    // Even data:image/png is rejected per EC-7.
    expect(
      sanitizeBgUrl(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=",
      ),
    ).toBeNull();
  });

  it("rejects malformed URL", () => {
    expect(sanitizeBgUrl("not a url")).toBeNull();
    expect(sanitizeBgUrl("file:///etc/passwd")).toBeNull();
  });

  it("frontmatter.backgroundImage strips through sanitize (EC-7)", () => {
    const ok = slideFrontmatter.safeParse({ backgroundImage: "https://x.test/a.png" });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.backgroundImage).toBe("https://x.test/a.png");
    }
    // data: URL — accepted by zod (string ≤ 500_000) but transformed to undefined.
    const dataResult = slideFrontmatter.safeParse({
      backgroundImage: "data:image/png;base64,xxxx",
    });
    expect(dataResult.success).toBe(true);
    if (dataResult.success) {
      expect(dataResult.data.backgroundImage).toBeUndefined();
    }
  });

  it("frontmatter.backgroundImage cap = 500_000 chars (EC-7)", () => {
    const url = `https://x.test/?q=${"x".repeat(499_950)}`;
    expect(url.length).toBeLessThanOrEqual(500_000);
    expect(slideFrontmatter.safeParse({ backgroundImage: url }).success).toBe(true);

    const tooLong = `https://x.test/?q=${"x".repeat(500_000)}`;
    expect(tooLong.length).toBeGreaterThan(500_000);
    expect(slideFrontmatter.safeParse({ backgroundImage: tooLong }).success).toBe(false);
  });

  it("frontmatter.backgroundGradient requires gradient prefix", () => {
    expect(
      slideFrontmatter.safeParse({ backgroundGradient: "linear-gradient(0deg, red, blue)" })
        .success,
    ).toBe(true);
    expect(
      slideFrontmatter.safeParse({ backgroundGradient: "radial-gradient(red, blue)" }).success,
    ).toBe(true);
    expect(slideFrontmatter.safeParse({ backgroundGradient: "url(https://x)" }).success).toBe(
      false,
    );
  });
});

describe("header/footer/paginate (T5.1)", () => {
  it("accepts header strings up to 200 chars", () => {
    expect(slideFrontmatter.safeParse({ header: "Acme" }).success).toBe(true);
    expect(slideFrontmatter.safeParse({ header: "x".repeat(200) }).success).toBe(true);
    expect(slideFrontmatter.safeParse({ header: "x".repeat(201) }).success).toBe(false);
  });

  it("accepts footer strings up to 200 chars", () => {
    expect(slideFrontmatter.safeParse({ footer: "© 2026" }).success).toBe(true);
    expect(slideFrontmatter.safeParse({ footer: "x".repeat(201) }).success).toBe(false);
  });

  it("accepts paginate: true / 'skip' / 'hold'", () => {
    expect(slideFrontmatter.safeParse({ paginate: true }).success).toBe(true);
    expect(slideFrontmatter.safeParse({ paginate: "skip" }).success).toBe(true);
    expect(slideFrontmatter.safeParse({ paginate: "hold" }).success).toBe(true);
  });

  it("rejects paginate: 'unknown'", () => {
    expect(slideFrontmatter.safeParse({ paginate: "always" }).success).toBe(false);
  });
});
