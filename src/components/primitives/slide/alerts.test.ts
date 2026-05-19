import type { Root } from "mdast";
import { describe, expect, it } from "vitest";
import { ALERT_TYPES, detectAlerts } from "./alerts.js";
import { parseBody } from "./parse.js";

async function md(input: string): Promise<Root> {
  return parseBody(input);
}

describe("detectAlerts (T1.1)", () => {
  it("detects [!NOTE] blockquote", async () => {
    const tree = await md("> [!NOTE]\n> hello");
    const result = detectAlerts(tree);
    const bq = result.children[0];
    expect(bq?.type).toBe("blockquote");
    expect((bq?.data as { hName?: string })?.hName).toBe("aside");
    const props = (bq?.data as { hProperties?: Record<string, unknown> })?.hProperties;
    expect(props?.["data-theo-slide-alert-type"]).toBe("note");
    expect(props?.className).toEqual(["theo-slide-alert"]);
  });

  it("detects case-insensitive [!warning]", async () => {
    const tree = await md("> [!warning]\n> careful");
    const result = detectAlerts(tree);
    const bq = result.children[0];
    expect(
      (bq?.data as { hProperties?: { "data-theo-slide-alert-type"?: string } })?.hProperties?.[
        "data-theo-slide-alert-type"
      ],
    ).toBe("warning");
  });

  it("regular blockquote unchanged", async () => {
    const tree = await md("> just a quote");
    const result = detectAlerts(tree);
    const bq = result.children[0];
    expect(bq?.type).toBe("blockquote");
    expect((bq?.data as { hName?: string })?.hName).toBeUndefined();
  });

  it("[!INVALID] is left as a regular blockquote", async () => {
    const tree = await md("> [!INVALID]\n> body");
    const result = detectAlerts(tree);
    const bq = result.children[0];
    expect((bq?.data as { hName?: string })?.hName).toBeUndefined();
  });

  it("strips the marker from the rendered text", async () => {
    const tree = await md("> [!NOTE]\n> visible");
    const result = detectAlerts(tree);
    const bq = result.children[0];
    expect(bq?.type).toBe("blockquote");
    // Walk into the first paragraph's text to assert the marker is gone.
    const serialized = JSON.stringify(bq);
    expect(serialized).not.toContain("[!NOTE]");
    expect(serialized).toContain("visible");
  });

  it("supports all 5 GFM alert types", async () => {
    for (const t of ALERT_TYPES) {
      const tree = await md(`> [!${t.toUpperCase()}]\n> body`);
      const result = detectAlerts(tree);
      const bq = result.children[0];
      expect(
        (bq?.data as { hProperties?: { "data-theo-slide-alert-type"?: string } })?.hProperties?.[
          "data-theo-slide-alert-type"
        ],
      ).toBe(t);
    }
  });

  it("idempotent — running twice does not double-annotate", async () => {
    const tree = await md("> [!TIP]\n> good");
    detectAlerts(tree);
    detectAlerts(tree);
    const bq = tree.children[0];
    const props = (bq?.data as { hProperties?: { className?: string[] } })?.hProperties;
    // className remains a flat list of one entry.
    expect(props?.className).toEqual(["theo-slide-alert"]);
  });

  it("sets hName='aside' and className on the blockquote node", async () => {
    const tree = await md("> [!IMPORTANT]\n> heads up");
    const result = detectAlerts(tree);
    const bq = result.children[0];
    expect((bq?.data as { hName?: string })?.hName).toBe("aside");
    expect(
      (bq?.data as { hProperties?: { className?: string[] } })?.hProperties?.className,
    ).toEqual(["theo-slide-alert"]);
  });
});
