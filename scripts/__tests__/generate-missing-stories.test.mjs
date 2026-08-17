/**
 * EC-5 regression: kebabToPascal helper. Vitest-style assertions but runs as
 * a Node script so we don't introduce a Vitest config change.
 */
import assert from "node:assert/strict";
import { kebabToPascal } from "../generate-missing-stories.mjs";

const cases = [
  ["chat-message", "ChatMessage"],
  ["chat-thread", "ChatThread"],
  ["agent-error-card", "AgentErrorCard"],
  ["slide", "Slide"],
  ["agent-handoff", "AgentHandoff"],
  ["agent-streaming", "AgentStreaming"],
  ["thinking-level-selector", "ThinkingLevelSelector"],
  ["a", "A"],
  ["my-x-y-z", "MyXYZ"],
];

let failed = 0;
for (const [input, expected] of cases) {
  try {
    assert.equal(kebabToPascal(input), expected);
    process.stdout.write(`  ✓ ${input} → ${expected}\n`);
  } catch (_err) {
    failed += 1;
    process.stderr.write(`  ✗ ${input}: expected ${expected}, got ${kebabToPascal(input)}\n`);
  }
}

if (failed > 0) {
  process.stderr.write(`\n[test] ${failed}/${cases.length} FAILED\n`);
  process.exit(1);
}
process.stdout.write(`\n[test] ${cases.length}/${cases.length} PASS\n`);
