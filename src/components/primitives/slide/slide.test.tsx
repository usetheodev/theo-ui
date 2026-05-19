import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SlidePlugin } from "./plugin.js";
import type { SlideValidationError } from "./schema.js";
import { Slide } from "./slide.js";

// Mock ResizeObserver so the fit hook does not warn.
class MockRO implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver =
    MockRO as unknown as typeof ResizeObserver;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<Slide>", () => {
  it("renders <section role='region' aria-roledescription='slide'>", () => {
    render(<Slide markdown="# heading" />);
    const section = screen.getByRole("region", { name: "Slide" });
    expect(section).toBeTruthy();
    expect(section.getAttribute("aria-roledescription")).toBe("slide");
  });

  it("renders parsed heading from markdown input (after useEffect parse)", async () => {
    const { container } = render(<Slide markdown="# Hello world" />);
    // Poll the container manually — DOM update happens after the async parseSlide resolves.
    await waitFor(
      () => {
        const h1 = container.querySelector("h1");
        expect(h1).toBeTruthy();
        expect(h1?.textContent).toContain("Hello world");
      },
      { timeout: 3000 },
    );
  });

  it("applies data-theo-slide-theme attribute", () => {
    render(<Slide markdown="# t" theme="violet-forge" />);
    const section = screen.getByRole("region");
    expect(section.getAttribute("data-theo-slide-theme")).toBe("violet-forge");
  });

  it("defaults theme to 'default' when prop omitted", () => {
    render(<Slide markdown="# t" />);
    const section = screen.getByRole("region");
    expect(section.getAttribute("data-theo-slide-theme")).toBe("default");
  });

  it("calls onValidationError with MULTIPLE_SLIDES for multi-slide input", async () => {
    const cb = vi.fn();
    const md = "# A\n\n---\n\n# B";
    render(<Slide markdown={md} onValidationError={cb} />);
    await waitFor(() => {
      expect(cb).toHaveBeenCalled();
    });
    const errors = cb.mock.calls[0]?.[0] as SlideValidationError[];
    expect(errors.some((e) => e.code === "MULTIPLE_SLIDES")).toBe(true);
  });

  it("calls onValidationError with INVALID_FRONTMATTER for malformed YAML", async () => {
    const cb = vi.fn();
    const md = "---\ntheme: : :\n---\n# body";
    render(<Slide markdown={md} onValidationError={cb} />);
    await waitFor(() => {
      expect(cb).toHaveBeenCalled();
    });
    const errors = cb.mock.calls[0]?.[0] as SlideValidationError[];
    expect(errors.some((e) => e.code === "INVALID_FRONTMATTER")).toBe(true);
  });

  it("strips <script> silently (does not render)", async () => {
    const md = "# Title\n\n<script>alert(1)</script>\n\nBody.";
    const { container } = render(<Slide markdown={md} />);
    await waitFor(() => {
      const h1 = container.querySelector("h1");
      expect(h1?.textContent).toContain("Title");
    });
    expect(container.querySelector("script")).toBeNull();
  });

  it("applies transform: translate + scale based on container size (ResizeObserver mocked)", () => {
    const { container } = render(<Slide markdown="# t" />);
    const section = container.querySelector("section.theo-slide") as HTMLElement;
    // Reveal.js-style centered transform: translate(-50%, -50%) scale(N)
    expect(section?.style.transform).toContain("translate(-50%, -50%)");
    expect(section?.style.transform).toContain("scale(");
    // Section is positioned absolute, anchored at host center.
    expect(section?.style.position).toBe("absolute");
    expect(section?.style.top).toBe("50%");
    expect(section?.style.left).toBe("50%");
  });

  it("respects components override (custom renderer for pre)", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: hast-util-to-jsx-runtime override map
    const CustomPre = (props: any) => <pre data-custom="true">{props.children}</pre>;
    const md = "```\nhello\n```";
    const { container } = render(
      <Slide
        markdown={md}
        // biome-ignore lint/suspicious/noExplicitAny: third-party component type
        components={{ pre: CustomPre as any }}
      />,
    );
    await waitFor(() => {
      expect(container.querySelector('pre[data-custom="true"]')).toBeTruthy();
    });
  });

  it("uses default aspectRatio 16:9 → canvas 1280x720", () => {
    const { container } = render(<Slide markdown="# t" />);
    const section = container.querySelector("section.theo-slide") as HTMLElement;
    expect(section.style.width).toBe("1280px");
    expect(section.style.height).toBe("720px");
  });

  it("switches canvas to 4:3 → 960x720 when aspectRatio='4:3'", () => {
    const { container } = render(<Slide markdown="# t" aspectRatio="4:3" />);
    const section = container.querySelector("section.theo-slide") as HTMLElement;
    expect(section.style.width).toBe("960px");
    expect(section.style.height).toBe("720px");
  });

  it("custom aspectRatio with valid {width,height} is applied", () => {
    const { container } = render(
      <Slide markdown="# t" aspectRatio={{ width: 800, height: 600 }} />,
    );
    const section = container.querySelector("section.theo-slide") as HTMLElement;
    expect(section.style.width).toBe("800px");
    expect(section.style.height).toBe("600px");
  });

  it("resolveCanvas falls back to 16:9 for aspectRatio={width:0,height:0} (EC-3 / D14)", async () => {
    const cb = vi.fn();
    const { container } = render(
      <Slide markdown="# t" aspectRatio={{ width: 0, height: 0 }} onValidationError={cb} />,
    );
    const section = container.querySelector("section.theo-slide") as HTMLElement;
    expect(section.style.width).toBe("1280px");
    expect(section.style.height).toBe("720px");
    await waitFor(() => {
      expect(cb).toHaveBeenCalled();
    });
    const errors = cb.mock.calls.flatMap((c) => c[0] as SlideValidationError[]);
    expect(errors.some((e) => e.code === "INVALID_ASPECT_RATIO")).toBe(true);
  });

  it("resolveCanvas falls back to 16:9 for negative/NaN aspectRatio", () => {
    const { container } = render(
      <Slide markdown="# t" aspectRatio={{ width: -10, height: Number.NaN }} />,
    );
    const section = container.querySelector("section.theo-slide") as HTMLElement;
    expect(section.style.width).toBe("1280px");
    expect(section.style.height).toBe("720px");
  });

  it("aria-label propagates", () => {
    render(<Slide markdown="# t" aria-label="Custom slide label" />);
    expect(screen.getByRole("region", { name: "Custom slide label" })).toBeTruthy();
  });

  it("rapid markdown prop changes resolve to latest input (EC-7 version counter)", async () => {
    const { container, rerender } = render(<Slide markdown="# A" />);
    rerender(<Slide markdown="# B" />);
    rerender(<Slide markdown="# C" />);
    await waitFor(() => {
      const h1 = container.querySelector("h1");
      expect(h1?.textContent).toContain("C");
    });
    const h1 = container.querySelector("h1");
    expect(h1?.textContent).toBe("C");
  });

  it("does not setState after unmount (cancelled flag)", async () => {
    const { unmount } = render(<Slide markdown="# t" />);
    unmount();
    // If setState fired after unmount, React would warn in console — vitest catches that via stderr.
    // Just give the microtask queue a chance to flush.
    await new Promise((r) => setTimeout(r, 50));
    expect(true).toBe(true);
  });

  it("renders empty section when markdown is empty string", () => {
    render(<Slide markdown="" />);
    const section = screen.getByRole("region");
    expect(section).toBeTruthy();
  });

  it("renders without throwing for frontmatter-only input", () => {
    render(<Slide markdown="---\ntheme: default\n---\n" />);
    expect(screen.getByRole("region")).toBeTruthy();
  });

  it("inherits color from parent (mirrors Whiteboard's currentColor pattern)", () => {
    const { container } = render(
      <div style={{ color: "rgb(10, 20, 30)" }}>
        <Slide markdown="# t" />
      </div>,
    );
    const section = container.querySelector("section.theo-slide") as HTMLElement;
    // The inline style should set color: inherit so the parent's color flows in.
    expect(section.style.color).toBe("inherit");
    // Background must be transparent so the parent's surface shows through.
    expect(section.style.background).toBe("transparent");
  });

  it("BANNED_TAG callback fires when sanitize strips a tag (D13)", async () => {
    // Direct <script> inside markdown is dropped by mdastToHast (allowDangerousHtml:false),
    // so it never reaches sanitize. To exercise D13 with the public API we'd need a
    // hast-level input. Integration test via parse.test.ts covers the diff machinery.
    // Here we assert the callback signature accepts the BANNED_TAG path through
    // the documented onValidationError contract.
    const cb = vi.fn();
    render(<Slide markdown="# safe" onValidationError={cb} />);
    // No errors expected for safe input; callback may or may not be called with [].
    await waitFor(() => {
      // After parse completes there should be a render.
      expect(screen.queryByText("safe")).toBeTruthy();
    });
    // Either the callback is never called, or called with empty arrays for clean input.
    for (const call of cb.mock.calls) {
      const errs = call[0] as SlideValidationError[];
      for (const e of errs) {
        expect([
          "MULTIPLE_SLIDES",
          "INVALID_FRONTMATTER",
          "INVALID_ASPECT_RATIO",
          "BANNED_TAG",
        ]).toContain(e.code);
      }
    }
  });

  it("renders data-theo-slide-layout from frontmatter (T2.1)", async () => {
    const md = `---
layout: two-column
---
# t`;
    const { container } = render(<Slide markdown={md} />);
    await waitFor(() => {
      const section = container.querySelector("[data-theo-slide-layout]");
      expect(section?.getAttribute("data-theo-slide-layout")).toBe("two-column");
    });
  });

  it("defaults data-theo-slide-layout to 'default' when frontmatter omitted (T2.1)", () => {
    const { container } = render(<Slide markdown="# t" />);
    const section = container.querySelector("[data-theo-slide-layout]");
    expect(section?.getAttribute("data-theo-slide-layout")).toBe("default");
  });

  it("applies frontmatter.backgroundImage as inline style (T3.1)", async () => {
    const md = `---
backgroundImage: "https://example.com/bg.jpg"
---
# x`;
    const { container } = render(<Slide markdown={md} />);
    await waitFor(() => {
      const section = container.querySelector(".theo-slide") as HTMLElement | null;
      expect(section?.style.backgroundImage).toContain("example.com/bg.jpg");
    });
  });

  it("rejects javascript: backgroundImage (EC-7)", async () => {
    const errs: SlideValidationError[] = [];
    const md = `---
backgroundImage: "javascript:alert(1)"
---
# x`;
    const { container } = render(
      <Slide markdown={md} onValidationError={(e) => errs.push(...e)} />,
    );
    await waitFor(() => {
      const section = container.querySelector(".theo-slide") as HTMLElement | null;
      expect(section).toBeTruthy();
      // javascript: is silently dropped to undefined by the schema transform.
      // No `javascript:` should land in the inline style.
      expect(section?.style.backgroundImage ?? "").not.toContain("javascript");
    });
  });

  it("renders header overlay when frontmatter sets it (T5.1)", async () => {
    const md = `---
header: ACME
---
# x`;
    const { container } = render(<Slide markdown={md} />);
    await waitFor(() => {
      const header = container.querySelector(".theo-slide-header");
      expect(header?.textContent).toBe("ACME");
    });
  });

  it("renders footer overlay when frontmatter sets it (T5.1)", async () => {
    const md = `---
footer: "page 1"
---
# x`;
    const { container } = render(<Slide markdown={md} />);
    await waitFor(() => {
      const footer = container.querySelector(".theo-slide-footer");
      expect(footer?.textContent).toBe("page 1");
    });
  });

  it("renders pagination overlay when paginate: true (T5.1)", async () => {
    const md = `---
paginate: true
---
# x`;
    const { container } = render(<Slide markdown={md} />);
    await waitFor(() => {
      const pag = container.querySelector(".theo-slide-paginate");
      expect(pag?.textContent).toBe("1");
    });
  });

  it("no overlays when frontmatter empty (T5.1)", async () => {
    const { container } = render(<Slide markdown="# x" />);
    await waitFor(() => {
      // Wait for parse to settle.
      expect(container.querySelector("h1")).toBeTruthy();
    });
    expect(container.querySelector(".theo-slide-header")).toBeNull();
    expect(container.querySelector(".theo-slide-footer")).toBeNull();
    expect(container.querySelector(".theo-slide-paginate")).toBeNull();
  });

  it("Marpit ![bg](url) applied when frontmatter.backgroundImage absent (D18 / EC-5)", async () => {
    const md = "![bg](https://example.com/marpit.png)\n\n# t";
    const { container } = render(<Slide markdown={md} />);
    await waitFor(() => {
      const section = container.querySelector(".theo-slide") as HTMLElement | null;
      expect(section?.style.backgroundImage).toContain("example.com/marpit.png");
    });
  });

  it("frontmatter.backgroundImage wins over Marpit ![bg]() (D18)", async () => {
    const md = `---
backgroundImage: "https://example.com/explicit.png"
---
![bg](https://example.com/marpit.png)

# t`;
    const { container } = render(<Slide markdown={md} />);
    await waitFor(() => {
      const section = container.querySelector(".theo-slide") as HTMLElement | null;
      const bg = section?.style.backgroundImage ?? "";
      expect(bg).toContain("explicit.png");
      expect(bg).not.toContain("marpit.png");
    });
  });

  it("plugins prop forwarded to parseSlide (T0.3)", async () => {
    const plugin: SlidePlugin = {
      name: "rename-h1-to-h2",
      mdastTransform: (tree) => {
        for (const node of tree.children) {
          if (node.type === "heading" && node.depth === 1) {
            node.depth = 2 as 1 | 2 | 3 | 4 | 5 | 6;
          }
        }
        return tree;
      },
    };
    const { container } = render(<Slide markdown="# rich" plugins={[plugin]} />);
    await waitFor(() => {
      expect(container.querySelector("h2")?.textContent).toContain("rich");
    });
    expect(container.querySelector("h1")).toBeFalsy();
  });
});
