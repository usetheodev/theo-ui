import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MathBlock, MathInline } from "./math.js";

describe("MathInline", () => {
  it("renders the raw TeX as fallback before KaTeX loads", () => {
    render(<MathInline tex="x + y" />);
    expect(screen.getByText("x + y")).toBeInTheDocument();
  });

  it("renders KaTeX HTML when peer-dep present (waits for effect)", async () => {
    const { container } = render(<MathInline tex="\\frac{1}{2}" />);
    // KaTeX is installed as peer-dep; render output should appear once the
    // effect settles. Wait for the `.katex-inline` wrapper to gain content.
    await new Promise<void>((resolve) => {
      const settled = (): boolean => {
        const node = container.querySelector(".katex-inline");
        return !!node && (node.innerHTML?.length ?? 0) > 0;
      };
      if (settled()) return resolve();
      const observer = new MutationObserver(() => {
        if (settled()) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(container, { childList: true, subtree: true, attributes: true });
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 1500);
    });
    const wrapper = container.querySelector(".katex-inline");
    expect(wrapper).not.toBeNull();
    expect((wrapper as HTMLElement).innerHTML.length).toBeGreaterThan(0);
  });
});

describe("MathBlock", () => {
  it("renders the raw TeX as fallback (display tag is <pre>)", () => {
    const { container } = render(<MathBlock tex="\\sum_i x_i" />);
    expect(container.querySelector("pre")).toBeInTheDocument();
    expect(screen.getByText(/sum_i x_i/)).toBeInTheDocument();
  });

  it("renders KaTeX HTML when peer-dep present", async () => {
    const { container } = render(<MathBlock tex="\\sum_{i=1}^{n} x_i" />);
    // Wait for the KaTeX-emitted div with class `katex-block`
    const wrapper = await new Promise<Element | null>((resolve) => {
      const check = (): Element | null => container.querySelector(".katex-block");
      if (check()) return resolve(check());
      const observer = new MutationObserver(() => {
        if (check()) {
          observer.disconnect();
          resolve(check());
        }
      });
      observer.observe(container, { childList: true, subtree: true, attributes: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(check());
      }, 1500);
    });
    expect(wrapper).not.toBeNull();
  });
});
