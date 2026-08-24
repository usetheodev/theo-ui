import { describe, expect, it } from "vitest";
import { safeHref } from "./safe-href.js";

describe("safeHref", () => {
  it("returns undefined for javascript: protocol", () => {
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
  });

  it("rejects case-insensitive javascript:", () => {
    expect(safeHref("JaVaScRiPt:alert(1)")).toBeUndefined();
    expect(safeHref("JAVASCRIPT:alert(1)")).toBeUndefined();
  });

  it("rejects javascript: with leading whitespace", () => {
    expect(safeHref(" javascript:alert(1)")).toBeUndefined();
    expect(safeHref("\tjavascript:void(0)")).toBeUndefined();
    expect(safeHref("\n javascript:alert(1)")).toBeUndefined();
  });

  it("rejects vbscript: protocol", () => {
    expect(safeHref("vbscript:msgbox(1)")).toBeUndefined();
    expect(safeHref("VBScript:msgbox(1)")).toBeUndefined();
  });

  it("rejects data:text/html payloads", () => {
    expect(safeHref("data:text/html,<script>alert(1)</script>")).toBeUndefined();
    expect(safeHref("DATA:text/html,<script>alert(1)</script>")).toBeUndefined();
  });

  it("accepts https URLs unchanged", () => {
    expect(safeHref("https://example.com/path")).toBe("https://example.com/path");
  });

  it("accepts http URLs unchanged", () => {
    expect(safeHref("http://internal.local")).toBe("http://internal.local");
  });

  it("accepts mailto: unchanged", () => {
    expect(safeHref("mailto:dev@theokit.dev")).toBe("mailto:dev@theokit.dev");
  });

  it("accepts tel: unchanged", () => {
    expect(safeHref("tel:+15551234567")).toBe("tel:+15551234567");
  });

  it("accepts relative paths unchanged", () => {
    expect(safeHref("/internal/route")).toBe("/internal/route");
    expect(safeHref("./local")).toBe("./local");
  });

  it("returns undefined for null/undefined/empty input", () => {
    expect(safeHref(null)).toBeUndefined();
    expect(safeHref(undefined)).toBeUndefined();
    expect(safeHref("")).toBeUndefined();
    expect(safeHref("   ")).toBeUndefined();
  });

  it("accepts safe data: subtypes (non-text/html)", () => {
    // data:image/png is fine — no script execution surface.
    expect(safeHref("data:image/png;base64,iVBOR...")).toBe("data:image/png;base64,iVBOR...");
  });
});
