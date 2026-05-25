# Verb — `theo-ui audit`

Score existing code against the slop-test gates without editing. Produces a ranked punch list.

---

## When to invoke

The user wants to know how well an existing component / page / app uses `@usetheo/ui` before they invest in changes. Or they want to validate a recent PR against the design system contract.

Triggers:

- `theo-ui audit src/app/deployments/page.tsx`
- `theo-ui audit src/components/`
- `theo-ui audit ./apps/dashboard/`
- *"Audit this file against theo-ui"*
- *"Is this using theo-ui correctly?"*
- *"Run the slop test on src/foo.tsx"*

---

## Pipeline

### 1. Resolve the target

The target is a file, directory, or glob. Resolve to a concrete file list:

```bash
# Single file
audit_targets="src/app/deployments/page.tsx"

# Directory — find all .tsx files
audit_targets=$(find src/components -name "*.tsx" -not -name "*.test.tsx" -not -name "*.stories.tsx")

# Glob (passed verbatim by user)
audit_targets=$(find src/app -name "page.tsx")
```

If the resolution yields > 50 files, ask the user to scope:

> *"That's 73 files. Should I audit:*
> *- A — the top 10 by line count (biggest first)*
> *- B — only `page.tsx` / `layout.tsx` (page-level)*
> *- C — only files mentioning `@usetheo/ui`*
> *- D — all 73 (slow but thorough)"*

Default: D (thorough). The audit must be complete by default.

### 2. Pre-flight (silent for audit)

Run the same pre-flight scan as the default verb (read `package.json`, `tailwind.config`, `<ThemeProvider>` mount). The pre-flight context informs which gates apply (e.g., subpath imports only relevant post-0.10).

DO NOT emit the pre-flight block — the audit's primary output is the punch list, not a context dump. Mention key context inline ("Note: pre-0.10 — subpath imports unavailable").

### 3. Per-file scan

For each file in the target, run the 32 universal slop-test gates plus the surface-specific extension gates that apply.

**Surface detection per file** — infer from imports:

- `ChatThread` / `ChatMessage` / `AgentTimeline` → agent-chat surface (load `AC-*` gates)
- `PageShell` / `DataTable` / `DeploymentRow` → cloud-dashboard surface (load `CD-*` gates)
- `DangerZone` / `EnvVarEditor` + lots of `Card` → settings-form surface (load `SF-*` gates)
- `LoginSplit` / `SocialAuthRow` / `PinInput` → auth surface (load `AU-*` gates)
- `HeroBand` patterns + `PlanBadge` → marketing surface (load `MK-*` gates)

If no clear signal, treat as `cloud-dashboard` (most common).

### 4. Score each gate

Each gate gets PASS / FAIL / N/A. Don't infer "warning" — the gate is binary. Borderline cases default to PASS unless there's a clear violation.

### 5. Compute health score

```
health = (passed_gates / applicable_gates) * 100
```

Round to integer. Apply a severity weight:

- **Critical fail** (L-01 hand-rolled button, L-04 hand-rolled dropdown, A-01 missing focus, A-03 `<div onClick>`) — counts as 2 fails.
- **Major fail** (T-* token improvisation, C-* composition skips) — counts as 1.5 fails.
- **Minor fail** (V-* voice issues, R-* responsive fragility on edge breakpoints) — counts as 1 fail.

The weighting biases the score toward the things that matter most for library adoption + a11y.

---

## Output format

A two-section report: **Per-file punch list** + **Overall health summary**.

### Section 1 — Per-file punch list

For each file with any failed gate (skip 100% files unless the user asked for thoroughness):

```markdown
### `src/app/deployments/page.tsx`

**Surface:** cloud-dashboard
**Score:** 24 / 32 (75%)
**Status:** ATTENTION (4 critical, 2 major, 2 minor)

#### Critical fails

- **L-01** · Hand-rolled button at L42 — `<button className="bg-purple-600 …">Deploy</button>` should be `<Button variant="primary">`.
- **L-04** · Hand-rolled dropdown at L78 — `useState(false)` + `absolute` ul should be `<DropdownMenu>`.
- **A-01** · `<div onClick={...}>` at L112 — replace with `<Button>` (no focus ring, no keyboard nav, not announced to screen readers).
- **C-03** · Destructive delete at L145 not wrapped in `<ConfirmDialog>` — calls `handleDelete` directly on click.

#### Major fails

- **T-02** · Raw Tailwind palette at L67 — `bg-purple-50 border-purple-200` should be `bg-primary/10 border-primary/40`.
- **T-05** · Raw text size at L31 — `text-4xl font-bold` should be `text-display-md`.

#### Minor fails

- **V-01** · Invented stat at L88 — `value="47,283"` is hardcoded. Wire to real data or use placeholder.
- **R-04** · DataTable at L96 has 7 columns without `hideBelow` — will horizontal-scroll on mobile.
```

### Section 2 — Overall health summary

```markdown
## Audit summary

**Target:** `src/app/` (12 files)
**Average score:** 78%
**Files with critical issues:** 3 / 12
**Most common fails:**

1. **T-02** — Raw Tailwind palette colors (7 occurrences across 5 files)
2. **L-01** — Hand-rolled buttons (5 occurrences across 4 files)
3. **C-03** — Destructive actions without ConfirmDialog (4 occurrences)
4. **A-04** — Missing `<Label htmlFor>` on form inputs (3 occurrences)
5. **V-01** — Invented metrics in stat tiles (3 occurrences)

**Quick wins** (low-effort, high-impact):

- Replace `bg-purple-*` / `text-purple-*` with `bg-primary` / `text-primary` (T-02) — 7 finds, ~5 min.
- Convert remaining `<button className="…">` to `<Button variant=…>` (L-01) — 5 finds, ~15 min.

**Structural fixes** (higher effort):

- Wrap delete handlers in `<ConfirmDialog>` (C-03) — needs handler refactor.
- Wire real data to stat tiles or hide bands (V-01) — needs API integration or copy decision.

**Recommended next step:** Run `theo-ui migrate src/app/` to auto-fix the quick wins, then manual review for the structural fixes.
```

---

## Audit verb rules

### Do NOT edit

The audit is a read-only verb. Never write to the target files. If the user wants edits, they invoke `theo-ui migrate` next.

### Do NOT skip files

If a file fires zero failed gates, omit it from Section 1 (don't list it) but include it in the file count in Section 2. Reporting "12 / 12 PASS" is fine for a clean repo.

### Be specific

Every fail must cite a file path + line number. Vague "your code is using too many raw Tailwind colors" is not actionable.

### Cap the punch list per file at 10 items

If a file has 15 failed gates, list the top 10 by severity (critical → major → minor → within bucket by frequency). Add a note: *"+ 5 more minor fails (see full report)"*.

### Don't double-count

A line that fails both T-02 (raw palette) and L-01 (hand-rolled button) counts in both gates but should NOT be listed twice in the punch list — group by the most critical gate.

### Score the file once, not the gate

A file with 24 / 32 gates passing scores 75% regardless of how many lines each gate flagged. The audit is about gate coverage, not line count.

---

## When to break out of audit-only mode

If the user follows up with *"fix it"* / *"apply the changes"* / *"migrate this"* after seeing the audit, hand off to `theo-ui migrate` with the same target.

If the user asks *"what does the migrate verb do?"* — explain it but DO NOT proactively migrate. Wait for explicit invocation.

---

## Stamp format for audit output

The audit output is markdown (no code emit), so no CSS comment stamp. Stamp at the bottom of the report:

```
---
Audit run: theo-ui v1.0.0 · 2026-05-25 · 32 universal gates + cloud-dashboard extensions
```

---

## Edge cases

### Target file doesn't exist

```
Error: target file does not exist: src/app/foo.tsx
```

Don't proceed. Don't infer the user meant something else.

### Target file isn't JSX/TSX

If the target is `.ts` (logic only, no JSX), audit a small set of gates only (L-* skipped since no components emit there). Report only T-* gates that apply to constants / type definitions.

### Target file doesn't import `@usetheo/ui`

Flag it explicitly: *"This file does not import `@usetheo/ui`. The audit applies the universal slop-test gates (token-fidelity, a11y, responsive). For full coverage, migrate the file to use `@usetheo/ui` composites first."*

### Target file is a stories file

Skip Ladle/Storybook story files (`.stories.tsx`). They have different conventions (intentionally minimal, demo-focused). The user can include them with `--include-stories`.

### Target file is a test file

Same as stories — skip `.test.tsx` by default. Tests aren't the user's UI surface.
