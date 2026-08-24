# Quality gates

`pnpm quality:gates` runs the full chain. Skipping or bypassing it is not allowed — every
PR ships green. **If a gate fails, fix the root cause. Do not disable the gate. Do not
silence the rule.**

| Concept | What it answers |
| --- | --- |
| [Gate catalog](/quality-gates/gate-catalog.md) | The eleven gates (0 through 10) and what each one blocks. |
| [Structural validator](/quality-gates/structural-validator.md) | Every check inside `validate-quality-gates.ts`. |
| [Registry gate](/quality-gates/registry-gate.md) | What makes a registry item installable in a clean consumer project. |
| [Release readiness](/quality-gates/release-readiness.md) | The chain, the sub-gates, and what is deliberately outside it. |
| [Branch protection](/quality-gates/branch-protection.md) | The GitHub-side contract that makes the gate non-bypassable. |

## The chain

```
format:check → lint:ci → typecheck → quality:knip → test → build → quality:publint
→ registry:build → registry:validate → quality:structure → classify:check
→ quality:bundle → quality:a11y → quality:visual → ladle:build
→ dogfood:{whiteboard, slide, slide-deck, slide-rich, v4-zero-config, precompiled-utilities}
```

`pnpm quality:gates:fast` is the short loop for iteration — format, lint, typecheck, knip,
registry build and validate, structure. It is **not** a substitute for the full chain
before merge.

## Why they are inviolable

The gates are what let the library make specific promises: that a theme switch propagates,
that a registry item installs into a clean project, that the barrel bundle has not silently
grown, that no component ships without a test, that the README does not name a component
that no longer exists. Each of those was a real defect before it became a gate. The
history is in [`/history/index.md`](/history/index.md).
