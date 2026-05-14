#!/usr/bin/env tsx
/**
 * test-registry-install — install selected registry items into the fixture app
 * and run `tsc --noEmit` to prove copy-paste consumers will type-check.
 *
 * Selected items: cn, types, tokens, button. These exercise:
 *   - lib/cn import rewriting
 *   - lib/types import rewriting
 *   - tokens CSS-only registry item
 *   - button shadcn-style component (depends on cn + Radix)
 *
 * Failures here mean the registry would ship broken to npx-shadcn consumers.
 */

import { execSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const FIXTURE = join(ROOT, "tests/fixture-shadcn-app");
const SRC = join(FIXTURE, "src");
const REGISTRY_OUT = join(ROOT, "registry/r");

const writeStdout = (m: string): void => {
  process.stdout.write(`${m}\n`);
};

interface RegistryFile {
  path: string;
  target?: string;
  content?: string;
}

interface RegistryItem {
  name: string;
  files: RegistryFile[];
  dependencies?: string[];
  registryDependencies?: string[];
}

const ITEMS_TO_INSTALL = ["cn", "types", "tokens", "button"];

async function readBuiltItem(name: string): Promise<RegistryItem> {
  const raw = await readFile(join(REGISTRY_OUT, `${name}.json`), "utf-8");
  return JSON.parse(raw) as RegistryItem;
}

async function installItem(item: RegistryItem): Promise<void> {
  for (const file of item.files) {
    if (!file.target || !file.content) continue;
    const dest = join(SRC, file.target);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, file.content);
    writeStdout(`+ ${item.name} -> src/${file.target}`);
  }
}

async function main(): Promise<void> {
  writeStdout(`Cleaning fixture src ${SRC}…`);
  await rm(SRC, { recursive: true, force: true });
  await mkdir(SRC, { recursive: true });

  // Install registry items by copying their built content into the fixture.
  for (const name of ITEMS_TO_INSTALL) {
    const item = await readBuiltItem(name);
    await installItem(item);
  }

  // Create a sample consumer file that exercises the Button + cn import paths.
  const mainTsx = `import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function App() {
  return (
    <div className={cn("p-4")}>
      <Button variant="primary" size="md">
        Deploy
      </Button>
    </div>
  );
}
`;
  await writeFile(join(SRC, "App.tsx"), mainTsx);
  writeStdout("+ wrote src/App.tsx (consumer fixture)");

  // Install fixture deps if not present yet (cheap repeat).
  writeStdout("Running pnpm install in fixture…");
  try {
    execSync("pnpm install --silent --ignore-workspace", {
      cwd: FIXTURE,
      stdio: ["ignore", "inherit", "inherit"],
    });
  } catch (e) {
    process.stderr.write(`pnpm install failed: ${String(e)}\n`);
    process.exit(1);
  }

  // Run typecheck.
  writeStdout("Running tsc --noEmit in fixture…");
  try {
    execSync("pnpm typecheck", {
      cwd: FIXTURE,
      stdio: ["ignore", "inherit", "inherit"],
    });
  } catch {
    process.stderr.write(
      "Fixture typecheck FAILED. Registry items would break in a real consumer.\n",
    );
    process.exit(1);
  }

  writeStdout(`\nFixture install test PASSED for ${ITEMS_TO_INSTALL.length} items.`);
}

main().catch((err: unknown) => {
  process.stderr.write(`${String(err)}\n`);
  process.exit(1);
});
