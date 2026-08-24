/**
 * Post-build RSC directive injection.
 *
 * esbuild strips module-level `"use client"` directives when `splitting: true`
 * (it emits "Module level directives cause errors when bundled ... was ignored"
 * and drops them). The `esbuild-plugin-preserve-directives` plugin cannot win
 * that fight because the strip happens during esbuild's own bundle pass, after
 * the plugin re-adds the directive.
 *
 * The robust, deterministic fix for a compiled component library whose output
 * is a per-component re-export shim (`dist/<layer>/<name>/index.js` →
 * `export { X } from '../../chunk-Y.js'`): post-build, prepend `"use client"`
 * to (a) every client component's entry shim and (b) the component-code chunk
 * each shim RE-EXPORTS from. Shared side-effect chunks (e.g. the `cn` util,
 * imported via `import '../../chunk-Z.js'`) are intentionally LEFT CLEAN so
 * server-only consumers of those exports are not tainted as client.
 *
 * This makes BOTH consumption paths RSC-correct:
 *   - subpath:  `@theokit/ui/agent-event` → the entry shim is `"use client"`
 *   - barrel:   `@theokit/ui` → re-exports from the same client chunk, which
 *               now carries the directive, so the client boundary is at the chunk
 *
 * See plan ADR D2 + community-standard-componentization blueprint.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIRECTIVE = '"use client";';
const DIST = "dist";
const LAYERS = ["primitives", "composites"] as const;
// Engine subpaths whose source root carries `"use client"`.
const ENGINE_ENTRIES = ["whiteboard", "slide", "slide-deck"];

const hookRe =
  /\b(useState|useEffect|useRef|useContext|useReducer|useImperativeHandle|useId|useLayoutEffect|useSyncExternalStore|createContext)\b/;

/** A component dir is "client" if any of its source .ts/.tsx files declares the directive OR uses a hook. */
function sourceIsClient(srcDir: string): boolean {
  if (!existsSync(srcDir)) return false;
  const stack = [srcDir];
  while (stack.length > 0) {
    const dir = stack.pop();
    if (dir === undefined) break;
    for (const dirent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, dirent.name);
      if (dirent.isDirectory()) {
        stack.push(p);
        continue;
      }
      // Scan .tsx components AND .ts modules — a client hook in a `.ts` file
      // (e.g. scroll-area/use-stick-to-bottom.ts) is just as client as a .tsx
      // component, and its code lands in the same emitted chunk.
      if (!dirent.name.endsWith(".tsx") && !dirent.name.endsWith(".ts")) continue;
      if (dirent.name.includes(".test.") || dirent.name.includes(".stories.")) continue;
      const txt = readFileSync(p, "utf8");
      const head = txt.split("\n").slice(0, 2).join("\n");
      if (head.includes("use client") || hookRe.test(txt)) return true;
    }
  }
  return false;
}

/** Prepend the directive once (idempotent). Returns true if it modified the file. */
function prepend(file: string): boolean {
  if (!existsSync(file)) return false;
  const txt = readFileSync(file, "utf8");
  if (txt.startsWith('"use client"') || txt.startsWith("'use client'")) return false;
  writeFileSync(file, `${DIRECTIVE}\n${txt}`, "utf8");
  return true;
}

/** Chunks RE-EXPORTED by the shim (component code), NOT pure side-effect imports. */
function reexportedChunks(shimFile: string): string[] {
  const txt = readFileSync(shimFile, "utf8");
  const chunks = new Set<string>();
  // `export { X } from '../../chunk-Y.js'`  OR  `export * from '../../chunk-Y.js'`
  const re = /export\s+(?:\*|\{[^}]*\})\s+from\s+['"][^'"]*?(chunk-[A-Z0-9]+\.js)['"]/g;
  for (const match of txt.matchAll(re)) {
    if (match[1]) chunks.add(join(DIST, match[1]));
  }
  return [...chunks];
}

function main(): void {
  const clientEntries: string[] = [];

  for (const layer of LAYERS) {
    const layerDist = join(DIST, layer);
    const layerSrc = join("src/components", layer);
    if (!existsSync(layerDist)) continue;
    for (const dirent of readdirSync(layerDist, { withFileTypes: true })) {
      if (!dirent.isDirectory()) continue;
      const name = dirent.name;
      if (!sourceIsClient(join(layerSrc, name))) continue;
      const shim = join(layerDist, name, "index.js");
      if (existsSync(shim)) clientEntries.push(shim);
    }
  }

  for (const eng of ENGINE_ENTRIES) {
    const shim = join(DIST, eng, "index.js");
    if (existsSync(shim) && sourceIsClient(join("src/components", "primitives", eng)))
      clientEntries.push(shim);
    else if (existsSync(shim) && sourceIsClient(join("src/components", "composites", eng)))
      clientEntries.push(shim);
  }

  const chunks = new Set<string>();
  let entriesMarked = 0;
  for (const shim of clientEntries) {
    if (prepend(shim)) entriesMarked++;
    for (const c of reexportedChunks(shim)) chunks.add(c);
  }

  let chunksMarked = 0;
  for (const c of chunks) {
    if (prepend(c)) chunksMarked++;
  }

  console.log(
    `inject-use-client: ${entriesMarked} entry shim(s) + ${chunksMarked} component chunk(s) marked "use client" (${clientEntries.length} client components).`,
  );
}

main();
