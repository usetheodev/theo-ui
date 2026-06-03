import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useTheoUIVite from "./vite-plugin.js";

describe("useTheoUIVite — factory shape (TheoKit contract)", () => {
  it("is a callable default export", () => {
    expect(typeof useTheoUIVite).toBe("function");
  });

  it("returns exactly ONE Vite Plugin object (not array, not null)", () => {
    const plugin = useTheoUIVite();
    expect(plugin).toBeTypeOf("object");
    expect(plugin).not.toBeNull();
    expect(Array.isArray(plugin)).toBe(false);
  });

  it("returned plugin has `name` of type string", () => {
    const plugin = useTheoUIVite();
    expect(typeof plugin.name).toBe("string");
    expect(plugin.name.length).toBeGreaterThan(0);
  });

  it("uses the documented name slug", () => {
    const plugin = useTheoUIVite();
    expect(plugin.name).toBe("@theokit/ui/vite-plugin");
  });

  it("exposes a config() hook", () => {
    const plugin = useTheoUIVite();
    expect(typeof plugin.config).toBe("function");
  });
});

describe("useTheoUIVite — graceful peer-dep handling", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("does NOT throw when @tailwindcss/vite is unresolvable", async () => {
    // Mock the dynamic import to simulate a consumer environment where the
    // optional peer-dep `@tailwindcss/vite` is not installed. The config()
    // hook must degrade gracefully via console.warn instead of throwing —
    // TheoKit's integrateUseTheoUI() expects this contract.
    vi.doMock("@tailwindcss/vite", () => {
      throw new Error("Cannot find module '@tailwindcss/vite'");
    });
    const plugin = useTheoUIVite();
    const config = plugin.config as (
      // biome-ignore lint/suspicious/noExplicitAny: vite Plugin config hook
      arg?: any,
      // biome-ignore lint/suspicious/noExplicitAny: vite env arg
      env?: any,
    ) => Promise<unknown> | unknown;
    await expect(
      Promise.resolve(config({}, { command: "serve", mode: "development" })),
    ).resolves.not.toThrow();
    vi.doUnmock("@tailwindcss/vite");
  });

  it("warns the consumer when @tailwindcss/vite is missing", async () => {
    // Force the dynamic import to fail so we exercise the graceful-degrade
    // code path regardless of whether the peer-dep is installed locally.
    vi.doMock("@tailwindcss/vite", () => {
      throw new Error("Cannot find module '@tailwindcss/vite'");
    });
    const plugin = useTheoUIVite();
    // biome-ignore lint/suspicious/noExplicitAny: vite Plugin config hook
    const config = plugin.config as (arg?: any, env?: any) => Promise<unknown>;
    await config({}, { command: "serve", mode: "development" });
    expect(warnSpy).toHaveBeenCalled();
    const message = warnSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(message).toMatch(/@tailwindcss\/vite/);
    vi.doUnmock("@tailwindcss/vite");
  });

  it("when opts.tailwind === false, does NOT warn and does NOT attempt resolution", async () => {
    const plugin = useTheoUIVite({ tailwind: false });
    // biome-ignore lint/suspicious/noExplicitAny: vite Plugin config hook
    const config = plugin.config as (arg?: any, env?: any) => Promise<unknown>;
    await config({}, { command: "serve", mode: "development" });
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("useTheoUIVite — virtual library-sources module", () => {
  it("resolves `virtual:@theokit/ui/library-sources.css` via resolveId", () => {
    const plugin = useTheoUIVite();
    const resolveId = plugin.resolveId as (id: string) => string | undefined;
    expect(typeof resolveId).toBe("function");
    const resolved = resolveId("virtual:@theokit/ui/library-sources.css");
    expect(resolved).toBeTruthy();
  });

  it("load() returns CSS for the virtual module (RFC 0008 follow-up #2: emits only consumer extra globs; default @source is gone — pre-compiled into dist/components.css)", () => {
    const plugin = useTheoUIVite();
    const resolveId = plugin.resolveId as (id: string) => string | undefined;
    const load = plugin.load as (id: string) => string | undefined;
    const id = resolveId("virtual:@theokit/ui/library-sources.css") as string;
    const css = load(id);
    expect(css).toBeTruthy();
    // Default (no contentExtra) emits an explanatory comment block, NOT
    // the broken `@source "node_modules/@theokit/ui/..."` glob.
    expect(css).toMatch(/pre-compiled utility CSS/);
    expect(css).toContain("dist/components.css");
  });

  it("load() emits @source for consumer-supplied contentExtra globs only", () => {
    const plugin = useTheoUIVite({ contentExtra: ["./my-app/**/*.tsx"] });
    const resolveId = plugin.resolveId as (id: string) => string | undefined;
    const load = plugin.load as (id: string) => string | undefined;
    const id = resolveId("virtual:@theokit/ui/library-sources.css") as string;
    const css = load(id);
    expect(css).toMatch(/@source "\.\/my-app\/\*\*\/\*\.tsx";/);
  });

  it("returns undefined for unrelated ids (no global side effects)", () => {
    const plugin = useTheoUIVite();
    const resolveId = plugin.resolveId as (id: string) => string | undefined;
    expect(resolveId("/some/other/file.css")).toBeUndefined();
    expect(resolveId("react")).toBeUndefined();
  });
});
