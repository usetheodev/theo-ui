import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { parseSlide } from "../../parse.js";
import { MermaidDiagram, mermaidPlugin } from "./index.js";

describe("mermaidPlugin (T8.1)", () => {
  it("returns plugin object with name 'mermaid'", () => {
    const plugin = mermaidPlugin();
    expect(plugin.name).toBe("mermaid");
    expect(plugin.sanitizeSchemaExtension).toBeDefined();
    expect(plugin.components).toBeDefined();
  });

  it("sanitizeSchemaExtension covers ≥30 SVG tags (EC-4)", () => {
    const plugin = mermaidPlugin();
    const ext = plugin.sanitizeSchemaExtension;
    expect(ext?.tagNames?.length ?? 0).toBeGreaterThanOrEqual(30);
    for (const tag of [
      "svg",
      "g",
      "path",
      "rect",
      "circle",
      "ellipse",
      "line",
      "polygon",
      "text",
      "tspan",
      "marker",
      "defs",
      "foreignObject",
      "linearGradient",
      "stop",
    ]) {
      expect(ext?.tagNames).toContain(tag);
    }
  });

  it("sanitizeSchemaExtension declares svg viewBox + path d attributes (EC-4)", () => {
    const plugin = mermaidPlugin();
    const ext = plugin.sanitizeSchemaExtension;
    expect(ext?.attributes?.svg).toContain("viewBox");
    expect(ext?.attributes?.path).toContain("d");
    expect(ext?.attributes?.rect).toContain("width");
  });

  it("hastTransform converts <pre><code class='language-mermaid'> into <theo-mermaid> (T8.1)", async () => {
    const md = "```mermaid\ngraph TD\nA-->B\n```";
    const result = await parseSlide(md, { plugins: [mermaidPlugin()] });
    const json = JSON.stringify(result.tree);
    // The hastTransform replaced <pre> with <theo-mermaid source="...">.
    expect(json).toContain("theo-mermaid");
    // The Mermaid source should be preserved in the props (via React's custom-element-aware rendering).
    // Note: hast-util-to-jsx-runtime may stringify the source onto the element.
  });

  it("non-mermaid code blocks unchanged", async () => {
    const md = "```ts\nconst x = 1;\n```";
    const result = await parseSlide(md, { plugins: [mermaidPlugin()] });
    const json = JSON.stringify(result.tree);
    expect(json).not.toContain("theo-mermaid");
    expect(json).toContain("language-ts");
  });

  it("MermaidDiagram SSR renders placeholder with role=img + aria-label (EC-10)", () => {
    const { container } = render(<MermaidDiagram source="graph TD\nA-->B" />);
    const host = container.querySelector("[data-theo-slide-mermaid]");
    expect(host).toBeTruthy();
    expect(host?.getAttribute("role")).toBe("img");
    expect(host?.getAttribute("aria-label")).toBeTruthy();
    // Source code shown as fallback during loading.
    expect(container.querySelector("pre")?.textContent).toContain("graph TD");
  });

  it("MermaidDiagram error fallback (EC-10) — invalid Mermaid surfaces 'render failed'", async () => {
    // With mermaid INSTALLED (auto-install-peers), invalid Mermaid syntax hits
    // the parse error path; the host enters data-state="error" + aria-label
    // reflects the error message. Source code stays visible as fallback.
    const { container } = render(<MermaidDiagram source="this is not valid mermaid" />);
    await waitFor(() => {
      const host = container.querySelector("[data-state='error']");
      expect(host).toBeTruthy();
    });
    const host = container.querySelector("[data-state='error']");
    expect(host?.getAttribute("role")).toBe("img");
    expect(host?.getAttribute("aria-label")).toMatch(/render failed|not installed/i);
    // Source still visible for debugging / print fallback.
    expect(container.querySelector("pre")?.textContent).toContain("not valid mermaid");
    // No per-test timeout override here on purpose. vitest.config.ts sets 20s precisely
    // because "a cold dynamic import of a heavy barrel can momentarily exceed vitest's 5s
    // default" under full-suite load — this test imports the whole markdown + mermaid stack
    // and is exactly that case. A local 10s undercut the global ceiling that exists for it,
    // and the waitFor carried its own 5s below the 5s set in src/test/setup.ts. Both made
    // the test fail on a loaded machine while the decision meant to prevent that sat unused
    // one file away. See usetheokit/theokit-ui#51.
  });
});
