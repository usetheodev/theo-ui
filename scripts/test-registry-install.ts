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

// Stratified sample (T5.2) — one representative per dependency profile.
// Covers the realistic failure modes a consumer hits, without paying the
// 110-item full-suite cost on every CI run.
//
// Items + their registryDependencies are listed here in topo order so that a
// later item's deps are already on disk by the time we install it.
//
//   cn               lib zero-deps
//   types            lib types-only
//   chat-types       types from src/types/ (path rewriting)
//   tokens           CSS-only
//   badge            CVA only (dep of deployment-row)
//   button           CVA + Radix Slot + cn (most common shape)
//   card             compound component via Object.assign
//   dialog           Radix Portal + multi-subpart compound
//   avatar           Radix simple compound
//   toast            Radix Toast + multi-file (toast.tsx + toaster.tsx)
//   tabs             Radix compound with roving focus
//   deployment-row   composite that imports badge + types (registry:block → /blocks/)
//   command-palette  composite using cmdk + dialog (cross-layer)
const ITEMS_TO_INSTALL = [
  "cn",
  "types",
  "chat-types",
  "tokens",
  "badge",
  "button",
  "card",
  "dialog",
  "avatar",
  "toast",
  "tabs",
  "deployment-row",
  "command-palette",
];

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

  // Create a sample consumer file that exercises the stratified item set —
  // every dependency profile (zero-deps lib, CVA, Radix Portal, cmdk, composite)
  // is touched so `tsc --noEmit` catches path-rewrite or peer-resolution bugs.
  const mainTsx = `import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CommandPalette } from "@/components/ui/command-palette";
import { type Deployment, DeploymentRow } from "@/components/blocks/deployment-row";
import { Dialog } from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";
import { Toast } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/cn";
import type { Message } from "@/types/chat";
import type { IconComponent } from "@/lib/types";
import { useState } from "react";

const sample: Deployment = {
  id: "d1",
  status: "live",
  environment: "production",
  branch: "main",
  commitSha: "abc123",
  commitMessage: "feat",
  author: { name: "you" },
  duration: "1m",
  timeAgo: "1m ago",
};

const message: Message = { id: "m1", role: "user", content: "hi" };

export function App() {
  const [open, setOpen] = useState(false);
  // Touch every type to prove the rewrites resolved.
  const icon: IconComponent | undefined = undefined;
  return (
    <Toaster>
      <Card>
        <Card.Header>
          <Card.Title>Smoke</Card.Title>
        </Card.Header>
        <Card.Body className={cn("p-4")}>
          <Avatar size="md">
            <Avatar.Fallback>YO</Avatar.Fallback>
          </Avatar>
          <Button variant="primary" size="md" onClick={() => setOpen(true)}>
            Deploy
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <Dialog.Content>
              <Dialog.Title>Title</Dialog.Title>
            </Dialog.Content>
          </Dialog>
          <Tabs defaultValue="a">
            <Tabs.List>
              <Tabs.Trigger value="a">A</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="a">Hello {message.content}</Tabs.Content>
          </Tabs>
          <DeploymentRow deployment={sample} />
          <CommandPalette
            open={false}
            onOpenChange={() => {}}
            items={[{ id: "x", label: "X", icon }]}
            onSelect={() => {}}
          />
          <Toast.Provider>
            <Toast.Viewport />
          </Toast.Provider>
        </Card.Body>
      </Card>
    </Toaster>
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
