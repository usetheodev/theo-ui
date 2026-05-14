#!/usr/bin/env tsx
/**
 * One-off: ensure every registry/*.json description is >= 30 characters so
 * the registry catalog reads as a coherent product listing rather than
 * fragmented JSDoc one-liners.
 *
 * Idempotent: re-running on already-long descriptions is a no-op.
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REGISTRY_DIR = join(ROOT, "registry");

const EXPANSIONS: Record<string, string> = {
  badge:
    "Small status / tag indicator with semantic variants (default, primary, success, warning, destructive, info).",
  "chat-message":
    "Single chat turn rendered as user bubble, assistant card, or system callout with accent border.",
  checkbox:
    "Built on Radix Checkbox — accessible binary control with focus ring and indeterminate state support.",
  "cost-meter": "Gauge for token spend that visualizes used vs. budget with color-coded states.",
  "cron-job-card":
    "One scheduled agent job — shows schedule, next run, last status, and toggle / edit actions.",
  input: "Text input primitive with focus ring, error state, and form-field composition support.",
  "login-split":
    "50/50 split shell for authentication screens — form pane on the left, illustration on the right.",
  "progress-checklist":
    "Right-inspector checklist tracking subtask completion with success / running / pending tones.",
  "radio-group":
    "Built on Radix RadioGroup — accessible radio group with roving focus and orientation control.",
  sidebar:
    "Vertical navigation shell with header, sections, items (active / count), and footer slots.",
  switch:
    "Built on Radix Switch — accessible binary toggle with on / off states and disabled support.",
  tabs: "Built on Radix Tabs with active-underline styling and focus-visible ring.",
  "task-header":
    "Title bar for a task pane — composite combining heading, status badge, and chevron menu.",
  tooltip:
    "Built on Radix Tooltip — accessible hover / focus tooltip with delay and side / align controls.",
  topnav:
    "Horizontal app bar (64px) with breadcrumbs, mode switcher (radiogroup), and action slots.",
};

async function main(): Promise<void> {
  const files = (await readdir(REGISTRY_DIR))
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .sort();
  let updated = 0;
  for (const file of files) {
    const path = join(REGISTRY_DIR, file);
    const raw = await readFile(path, "utf-8");
    const descriptor = JSON.parse(raw) as { name: string; description?: string };
    const replacement = EXPANSIONS[descriptor.name];
    if (!replacement) continue;
    if (descriptor.description === replacement) continue;
    descriptor.description = replacement;
    await writeFile(path, `${JSON.stringify(descriptor, null, 2)}\n`);
    updated++;
    process.stdout.write(`+ ${descriptor.name}\n`);
  }
  process.stdout.write(`Updated ${updated} descriptors.\n`);
}

main().catch((err) => {
  process.stderr.write(`${String(err)}\n`);
  process.exit(1);
});
