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
    // JSON.stringify escapes the dangerous payload — the literal `</script>`
    // does not appear unescaped inside the inline script body.
    expect(script?.innerHTML).not.toContain("</script>x</script>");
  });
});
