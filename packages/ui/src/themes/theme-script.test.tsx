import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeScript } from "./theme-script.js";

describe("ThemeScript", () => {
  it("renders a script with localStorage read for default storage key", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script).not.toBeNull();
    expect(script?.innerHTML).toContain('"theo-ui:theme"');
    expect(script?.innerHTML).toContain('"violet-forge"');
    expect(script?.innerHTML).toContain('"dark"');
  });

  it("respects custom defaultTheme and defaultMode", () => {
    const { container } = render(
      <ThemeScript defaultTheme="aurora-terminal" defaultMode="light" />,
    );
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain('"aurora-terminal"');
    expect(script?.innerHTML).toContain('"light"');
  });

  it("disables persistence read when storageKey is null", () => {
    const { container } = render(<ThemeScript storageKey={null} />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain("null");
    // With null key, the script must still apply defaults.
    expect(script?.innerHTML).toContain('"violet-forge"');
  });

  it("encodes defaults safely (no script injection via theme name)", () => {
    const { container } = render(<ThemeScript defaultTheme={`"><script>x</script>`} />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).not.toContain("</script>x</script>");
  });

  it("escapes `</script>` payload inside defaultTheme (BLOCKER-001)", () => {
    const payload = "</script><script>alert(1)</script>";
    const { container } = render(<ThemeScript defaultTheme={payload} />);
    const script = container.querySelector("script");
    const html = script?.innerHTML ?? "";
    // No literal `</script>` may appear inside the inline script body — the
    // HTML tokenizer would end the script tag there even though the value
    // sits inside a JS string literal. The `<` must be Unicode-escaped.
    expect(html).not.toMatch(/<\/script\s*>/i);
    expect(html).toContain("\\u003c/script");
  });

  it("escapes `</script>` payload inside storageKey (BLOCKER-001)", () => {
    const { container } = render(<ThemeScript storageKey={"</script>"} />);
    const html = container.querySelector("script")?.innerHTML ?? "";
    expect(html).not.toMatch(/<\/script\s*>/i);
    expect(html).toContain("\\u003c/script");
  });
});
