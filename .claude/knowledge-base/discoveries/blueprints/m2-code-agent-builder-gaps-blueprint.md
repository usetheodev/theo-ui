# Blueprint — M2 Code-agent Builder gap components

Discovery for M2. The **Builder** (`theokit-studio/packages/studio/src/pages/builder/`) is
the fidelity spec: each new component reproduces its DOM / design tokens / behavior so the
studio can adopt the lib with zero UX change (Fase B). Cross-validation source:
`.claude` (this session, 2026-07-16).

## Convention (verified)

- Dir: `src/components/{primitives|composites}/<name>/` with `<name>.tsx`,
  `<name>.stories.tsx`, `<name>.test.tsx`, `index.ts`.
- Barrel: `export { X } from "./components/.../index.js"` in `src/index.ts`.
- Classification: add to `registry/component-classification.json` (primitive = 0 internal
  `@theokit/ui` deps; composite = imports ≥1). Validated by `scripts/classify-components.ts`.
- Registry + subpath exports are generated (`registry:build`, `regen-subpath-exports`).
- Component idioms: `forwardRef`, `data-slot="<name>"`, CVA for variants where they vary,
  Radix for interactive primitives (`@radix-ui/react-dropdown-menu` is a dep), Tailwind
  tokens (`bg-primary`, `border-border`, `text-muted-foreground`, …) — the SAME tokens the
  Builder uses, so fidelity is achievable by construction.

## The 4 components

### 1. `code-review-panel` (composite) — GAP (largest)

Reproduces the Builder `ReviewPanel` (`review.tsx:85-176`) + `FileDiff` (`review.tsx:53-81`).

```ts
interface ReviewFile { path: string; additions: number; deletions: number; diff: string; }
interface CodeReviewPanelProps extends HTMLAttributes<HTMLDivElement> {
  files: ReviewFile[];
  selectedPath?: string | null;      // null/undefined = "All files"
  onSelect?: (path: string | null) => void;
  onClose?: () => void;
  onCommit?: () => void;             // omitted → Commit button disabled (Builder's fake-door)
  commitDisabled?: boolean;
}
```

- Structure: toolbar (`Review` pill + close X + `Unstaged +A -D` counts + `Commit`) → diff
  column (one `FileDiff` per shown file) → `All files` tree sidebar (`w-36`).
- **Diff rendering: self-contained** (own `parseDiff` unified→rows, own row markup) —
  reproduces the Builder exactly. Decision D1: NOT composed from `diff-viewer` in M2, to keep
  M2 independent of the M3 `diff-viewer` unified extension and 1:1 with the Builder. Diff
  line rendering is presentation (~15 lines), not business logic → temporary duplication is
  acceptable per DRY ("duplicate code if needed, never business logic"). M3 may refactor to
  delegate once `diff-viewer` accepts unified strings.
- a11y: close button `aria-label`; tree buttons; `data-testid` parity is a Fase-B concern
  (studio keeps its testids on the wrapper) — the lib component exposes `data-slot`.

### 2. `approval-mode-selector` (primitive) — GAP

Reproduces the Builder approval `Select` (`index.tsx:422-435`): 3 states inline in the composer.

```ts
type ApprovalMode = "ask" | "auto-edits" | "read-only";
interface ApprovalModeSelectorProps {
  value: ApprovalMode;
  onChange: (value: ApprovalMode) => void;
  // labels default to "Ask for approval" / "Auto-approve edits" / "Read-only"
}
```

- Radix dropdown or a native select styled to the Builder's inline chip (Hand icon + label,
  `h-6 border-0 bg-transparent text-xs`). Locked labels; `data-slot="approval-mode-selector"`.

### 3. `work-log` (primitive) — GAP

Reproduces the Builder `WorkLog` (`session-view.tsx:18-47`).

```ts
interface WorkLogProps extends HTMLAttributes<HTMLDivElement> {
  workedFor: string;          // e.g. "2m 30s"
  steps: string[];
  defaultOpen?: boolean;      // default false
}
```

- Collapsible: button (`Clock` + `Worked for {workedFor}` + chevron, `aria-expanded`) → `ul`
  of steps (`border-l pl-3`). `data-slot="work-log"`.

### 4. `model-effort-picker` (composite) — GAP

Reproduces the Builder `ModelPicker` (`model-picker.tsx`): one dropdown, Model radio group
(name + blurb + id) + Reasoning-effort radio group.

```ts
interface ModelEffortOption { id: string; name: string; blurb?: string; }
interface ModelEffortPickerProps {
  models: ModelEffortOption[];
  model: string;                 onModelChange: (id: string) => void;
  effort: string;                effortOptions?: string[];  // default ["Low","Medium","High"]
  onEffortChange: (effort: string) => void;
}
```

- Radix dropdown trigger (Sparkles + `{name}` · `{effort}` + chevron) → `RadioGroup` model,
  `Separator`, `RadioGroup` effort. Reuses `@radix-ui/react-dropdown-menu`. Decision D2: a
  standalone composite (not `model-selector` + `thinking-level-selector`) because the Builder's
  UX is a single combined dropdown; the two existing primitives are separate triggers. The
  new composite MAY internally reuse them later, but fidelity requires the single dropdown.

## Coverage corners

- Integration: each component rendered in a Ladle story + exported from the barrel + in the
  registry; `pnpm quality:gates` (incl. a11y vitest-axe, bundle, structure) green.
- Dependencies: `@radix-ui/react-dropdown-menu` (already a dep), lucide, cn — no new dep.
- Tools: `classify-components`, `build-registry`, `validate-quality-gates`, vitest, Ladle.
- Techniques: TDD (RED test per acceptance), `data-slot`, token-fidelity to the Builder,
  a11y (`aria-expanded`, `aria-label`, radio semantics).

## ADRs

- **D1** — `code-review-panel` self-contained diff rendering in M2 (independent of M3
  `diff-viewer` unified). Alt: compose `diff-viewer` — rejected (would pull M3 scope into M2).
- **D2** — `model-effort-picker` as a standalone composite (single dropdown), not a
  composition of the two existing selectors — fidelity to the Builder's combined UX.
- **D3** — bundle: if `code-review-panel` blows the `quality:bundle` ±5% baseline, isolate it
  to a subpath (`@theokit/ui/code-review-panel`) rather than inflate the barrel. Decide at gate.

## Sources of truth

- Builder: `theokit-studio/packages/studio/src/pages/builder/{review,session-view,model-picker,index}.tsx` + `data/types.ts`.
- theokit-ui conventions: `src/components/**`, `scripts/{classify-components,build-registry,validate-quality-gates}.ts`, `registry/component-classification.json`.
