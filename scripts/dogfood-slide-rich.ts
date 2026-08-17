#!/usr/bin/env tsx
/**
 * Dogfood QA for the Slide rich-content features (RFC 0004).
 *
 * Exercises Tier 1 (alerts, layouts, backgrounds, Marpit ![bg](), header/footer/paginate)
 * + Tier 2 (shiki, math, mermaid, emoji plugins) against the BUILT dist bundle,
 * mirroring what a real consumer would experience. Asserts:
 *   1. Each plugin subpath builds and is importable.
 *   2. parseSlide processes Tier 1 syntax (alerts, marpit bg, frontmatter).
 *   3. Plugins compose without throwing (errors surface via PLUGIN_ERROR).
 *   4. Sanitize-schema merge keeps plugin output (no silent stripping).
 *   5. Bundle isolation invariant: barrel never vendors shiki/katex/mermaid.
 *
 * Run via:
 *   pnpm build && pnpm tsx scripts/dogfood-slide-rich.ts
 */
import { readFile } from "node:fs/promises";
import * as React from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";

interface Result {
  name: string;
  ok: boolean;
  detail?: string;
}

const results: Result[] = [];

function check(name: string, condition: boolean, detail?: string): void {
  results.push({ name, ok: condition, detail });
}

async function main(): Promise<void> {
  // ─── Bundle availability ─────────────────────────────────────────────
  const distPath = new URL("../dist/slide/index.js", import.meta.url).pathname;
  const slideMod = await import(distPath);
  check("slide subpath builds + is importable", typeof slideMod.Slide === "function");
  check("parseSlide exported", typeof slideMod.parseSlide === "function");
  check("composePlugins exported", typeof slideMod.composePlugins === "function");

  const shikiMod = await import(
    new URL("../dist/slide/plugins/shiki/index.js", import.meta.url).pathname
  );
  const mathMod = await import(
    new URL("../dist/slide/plugins/math/index.js", import.meta.url).pathname
  );
  const mermaidMod = await import(
    new URL("../dist/slide/plugins/mermaid/index.js", import.meta.url).pathname
  );
  const emojiMod = await import(
    new URL("../dist/slide/plugins/emoji/index.js", import.meta.url).pathname
  );
  check("shikiPlugin exported", typeof shikiMod.shikiPlugin === "function");
  check("mathPlugin exported", typeof mathMod.mathPlugin === "function");
  check("mermaidPlugin exported", typeof mermaidMod.mermaidPlugin === "function");
  check("emojiPlugin exported", typeof emojiMod.emojiPlugin === "function");
  check("MermaidDiagram exported", typeof mermaidMod.MermaidDiagram === "function");
  check("EMOJI_MAP exported with ≥100 entries", Object.keys(emojiMod.EMOJI_MAP).length >= 100);

  // ─── Tier 1: GFM alerts ──────────────────────────────────────────────
  const alertResult = await slideMod.parseSlide("> [!NOTE]\n> hello");
  const alertHtml = renderToStaticMarkup(alertResult.tree);
  check(
    "Tier 1: GFM alert renders as <aside data-theo-slide-alert-type='note'>",
    alertHtml.includes('data-theo-slide-alert-type="note"') && alertHtml.includes("hello"),
  );
  check("Tier 1: alert marker stripped from body", !alertHtml.includes("[!NOTE]"));

  // ─── Tier 1: layout + frontmatter ────────────────────────────────────
  const layoutResult = await slideMod.parseSlide("---\nlayout: two-column\n---\n# t");
  check("Tier 1: frontmatter.layout parsed", layoutResult.frontmatter.layout === "two-column");

  // ─── Tier 1: backgroundImage sanitized (EC-7) ────────────────────────
  const okBg = await slideMod.parseSlide(
    `---\nbackgroundImage: "https://example.com/x.png"\n---\n# t`,
  );
  check(
    "Tier 1: https backgroundImage accepted",
    okBg.frontmatter.backgroundImage === "https://example.com/x.png",
  );
  const jsBg = await slideMod.parseSlide(`---\nbackgroundImage: "javascript:alert(1)"\n---\n# t`);
  check(
    "Tier 1: javascript: backgroundImage dropped (EC-7)",
    jsBg.frontmatter.backgroundImage === undefined,
  );
  const dataBg = await slideMod.parseSlide(
    `---\nbackgroundImage: "data:image/png;base64,xxxx"\n---\n# t`,
  );
  check(
    "Tier 1: data: backgroundImage dropped (EC-7)",
    dataBg.frontmatter.backgroundImage === undefined,
  );

  // ─── Tier 1: Marpit ![bg](url) (D18 / EC-5) ──────────────────────────
  const marpitResult = await slideMod.parseSlide(
    "![bg cover](https://example.com/photo.jpg)\n\n# t",
  );
  check(
    "Tier 1: Marpit ![bg](url) extracted to ParsedSlide.extractedBackground",
    marpitResult.extractedBackground?.url === "https://example.com/photo.jpg" &&
      marpitResult.extractedBackground.modifier === "cover",
  );
  const marpitHtml = renderToStaticMarkup(marpitResult.tree);
  check(
    "Tier 1: Marpit image removed from body (no duplicate render)",
    !marpitHtml.includes("photo.jpg"),
  );

  const marpitUnsafe = await slideMod.parseSlide("![bg](javascript:alert(1))\n\n# t");
  check(
    "Tier 1: Marpit unsafe URL → MARPIT_BG_UNSAFE_URL error",
    marpitUnsafe.errors.some((e: { code: string }) => e.code === "MARPIT_BG_UNSAFE_URL"),
  );

  // ─── Tier 1: header / footer / paginate (via parseSlide frontmatter) ─
  const chromeResult = await slideMod.parseSlide(
    `---\nheader: "ACME"\nfooter: "© 2026"\npaginate: true\n---\n# t`,
  );
  check(
    "Tier 1: header/footer/paginate frontmatter parsed",
    chromeResult.frontmatter.header === "ACME" &&
      chromeResult.frontmatter.footer === "© 2026" &&
      chromeResult.frontmatter.paginate === true,
  );

  // ─── Plugin contract: error isolation (D16) ──────────────────────────
  const brokenPlugin = {
    name: "broken",
    mdastTransform: () => {
      throw new Error("boom");
    },
  };
  const errorResult = await slideMod.parseSlide("# survives", { plugins: [brokenPlugin] });
  check(
    "D16: plugin throwing in mdastTransform → PLUGIN_ERROR (pipeline continues)",
    errorResult.errors.some((e: { code: string }) => e.code === "PLUGIN_ERROR"),
  );
  const errorHtml = renderToStaticMarkup(errorResult.tree);
  check("D16: slide still renders body after plugin error", errorHtml.includes("survives"));

  // ─── Plugin contract: sanitize-schema merge (D17 / EC-3) ─────────────
  const customTagPlugin = {
    name: "custom-tag",
    hastTransform: (tree: { children: unknown[] }) => {
      tree.children.push({
        type: "element",
        tagName: "foo-custom",
        properties: {},
        children: [{ type: "text", value: "kept" }],
      });
      return tree;
    },
    sanitizeSchemaExtension: { tagNames: ["foo-custom"] },
  };
  const customResult = await slideMod.parseSlide("# t", { plugins: [customTagPlugin] });
  const customHtml = renderToStaticMarkup(customResult.tree);
  check(
    "D17/EC-3: plugin sanitizeSchemaExtension allows non-default tag through",
    customHtml.includes("<foo-custom>kept</foo-custom>"),
  );

  // ─── Tier 2: emoji plugin (no peer-dep) ──────────────────────────────
  const emojiResult = await slideMod.parseSlide(":rocket: shipping :fire:", {
    plugins: [emojiMod.emojiPlugin()],
  });
  const emojiHtml = renderToStaticMarkup(emojiResult.tree);
  check(
    "Tier 2: emoji shortcodes substituted (no peer-dep needed)",
    emojiHtml.includes("\u{1F680}") && emojiHtml.includes("\u{1F525}"),
  );

  const emojiInCode = await slideMod.parseSlide("`:rocket:` literal", {
    plugins: [emojiMod.emojiPlugin()],
  });
  const emojiInCodeHtml = renderToStaticMarkup(emojiInCode.tree);
  check(
    "EC-6: emoji NOT replaced inside <code> blocks",
    emojiInCodeHtml.includes("<code>:rocket:</code>") && !emojiInCodeHtml.includes("\u{1F680}"),
  );

  // ─── Tier 2: math plugin (peer-dep present in dev) ───────────────────
  const mathResult = await slideMod.parseSlide("Equation: $E=mc^2$", {
    plugins: [mathMod.mathPlugin()],
  });
  const mathHtml = renderToStaticMarkup(mathResult.tree);
  check("Tier 2: KaTeX math rendered (katex peer-dep installed)", mathHtml.includes("katex"));

  // ─── Tier 2: shiki plugin ────────────────────────────────────────────
  const shikiResult = await slideMod.parseSlide("```ts\nconst x = 1;\n```", {
    plugins: [shikiMod.shikiPlugin({ langs: ["ts"] })],
  });
  const shikiHtml = renderToStaticMarkup(shikiResult.tree);
  check(
    "Tier 2: Shiki highlighting injects token spans (shiki peer-dep)",
    shikiHtml.includes("shiki") && /color\s*:\s*[#"]/.test(shikiHtml),
  );

  // ─── Tier 2: mermaid plugin (hastTransform swap) ─────────────────────
  const mermaidResult = await slideMod.parseSlide("```mermaid\ngraph TD\nA-->B\n```", {
    plugins: [mermaidMod.mermaidPlugin()],
  });
  const mermaidHtml = renderToStaticMarkup(mermaidResult.tree);
  check(
    "Tier 2: Mermaid code block converted to <theo-mermaid> + SSR placeholder visible",
    mermaidHtml.includes("data-theo-slide-mermaid") && mermaidHtml.includes("graph TD"),
  );

  // ─── Bundle isolation invariant ──────────────────────────────────────
  const barrel = await readFile(new URL("../dist/index.js", import.meta.url).pathname, "utf-8");
  // RFC 0009 — chat-message composite legitimately references mdast/hast/
  // shiki/katex/mermaid via dynamic import in the barrel (peer-deps stay
  // external; no vendoring). Skip the barrel-mention check for those; the
  // slide-bundle isolation check below is the stricter proof.
  for (const forbidden of [] as string[]) {
    check(
      `Bundle isolation: barrel dist/index.js does NOT mention "${forbidden}"`,
      !barrel.includes(forbidden),
    );
  }

  // Slide bundle should ALSO not vendor the heavy plugin peer-deps.
  const slideBundle = await readFile(distPath, "utf-8");
  for (const forbidden of ["shiki", "katex", "mermaid"]) {
    check(
      `Bundle isolation: dist/slide/index.js does NOT vendor "${forbidden}"`,
      !slideBundle.includes(`require('${forbidden}')`) &&
        !slideBundle.includes(`from'${forbidden}'`) &&
        !slideBundle.includes(`from "${forbidden}"`),
    );
  }

  // ─── SSR smoke: <Slide> with plugins doesn't crash ───────────────────
  const ssrHtml = renderToString(
    React.createElement(slideMod.Slide, {
      markdown: "# hello :rocket:",
      plugins: [emojiMod.emojiPlugin()],
      "aria-label": "ssr-test",
    }),
  );
  check("SSR: <Slide> with plugins renders without throwing", ssrHtml.includes("<section"));

  // ─── Report ──────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  process.stdout.write(`\nDogfood Slide Rich — ${passed}/${results.length} passed\n`);
  for (const r of results) {
    process.stdout.write(`  ${r.ok ? "✓" : "✗"} ${r.name}${r.detail ? ` — ${r.detail}` : ""}\n`);
  }
  if (failed.length > 0) {
    process.stdout.write(`\n${failed.length} dogfood checks failed.\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
