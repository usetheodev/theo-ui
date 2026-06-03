# RFC 0006 — FAANG-grade density defaults + `useDensity` hook

| Field | Value |
|---|---|
| Author | paulohenriquevn |
| Date | 2026-05-22 |
| Status | **Implemented** (2026-05-22) |
| Plan | `.claude/knowledge-base/plans/faang-density-tightening-plan.md` |
| Edge-case review | `.claude/knowledge-base/reviews/edge-cases/faang-density-tightening-edge-cases-2026-05-22.md` |
| Consumer documented | User request 2026-05-22: "Quero o padrão da indústria para que nosso sistema tenha aparência leve e profissional nível FAANG". The follow-up `docs.usetheo.dev/theoui/theming` live preview (already shipped in RFC 0005) is the canonical surface for consumers to inspect the new defaults. |

## 1. Summary

Realigns the Violet Forge defaults to the FAANG-modern density baseline measured
across shadcn-ui, Linear, Vercel, Stripe, and Mantine. Form-control `md` shrinks
from 40px to 36px, `body-md` typescale goes from 15px to 14px, Card `md` padding
goes from 24px to 20px. A new `useDensity()` hook lets consumers globally switch
between `compact` (32px), `comfortable` (36px — default), and `spacious` (44px)
without rewriting `size` props per call site. Backwards-compat is preserved at
the API level (no prop renames) but the visual default changes — ship as minor
bump `0.3.0-next.0` with a migration note.

## 2. Motivation

**Measured state pre-RFC (2026-05-22 grep + inspector reading):**

- Theo `<Button>` md = **40px**. shadcn `<Button>` = 36px. Mantine `md` button = 36px. Linear app form fields ≈ 36px. Vercel dashboard CTAs ≈ 36px.
- Theo `body-md` = **15px**. shadcn `body` = 14px. Vercel Geist body = 14px. Linear inspector reads 14px. Stripe Dashboard 14px. Mantine `default` body = 14px.
- Theo Card `md` padding = **24px**. Linear cards measured ~16-20px. Vercel cards ≈ 20px.

User feedback verbatim:
> "Os componentes deveriam ser um pouco menos por default talvez 25%."

**Honest recalibration:** 25% (Button 40 → 30px) sits below the WCAG 2.5.8 AA
minimum confortável (24px effective + padding) and outside the range of every
mainstream design system. The *intent* of the request ("FAANG-modern, light,
professional") maps to the **measured** industry delta of ~10% — exactly what
this RFC ships. Documented as ADR D1.

## 3. Decision

Five ADRs govern the change. Rationale lives in
`.claude/knowledge-base/plans/faang-density-tightening-plan.md > ADRs`. Summary:

| ID | Decision | Why in one line |
|---|---|---|
| D1 | Tightening of 10% (40 → 36px), not 25% | 25% falls below WCAG 2.5.8 AA + no DS mainstream uses it |
| D2 | `body-md` recalibrated 15px → 14px | shadcn / Vercel / Linear / Stripe / Mantine all use 14px |
| D3 | `useDensity()` hook + CSS vars on `:root` (NOT class modifiers) | Class modifier approach broke "explicit size wins" via specificity (EC-1) |
| D4 | Card `md` padding 24px → 20px | Linear ~20, Vercel ~20; matches the new control height ratio |
| D5 | Ship as `0.3.0-next.0` (minor) with Migration note | Visual default changed; minor bump is honest semver |

## 4. API surface

### Density

```tsx
import { ThemeProvider, builtinThemes, useDensity } from "@theokit/ui";

// At the app root:
<ThemeProvider themes={builtinThemes} defaultDensity="comfortable">
  {children}
</ThemeProvider>

// Anywhere downstream:
function DensityToggle() {
  const { density, setDensity } = useDensity();
  return (
    <button onClick={() => setDensity(density === "compact" ? "spacious" : "compact")}>
      {density}
    </button>
  );
}
```

The hook exposes:
```ts
interface DensityContextValue {
  density: "compact" | "comfortable" | "spacious";
  setDensity: (next: Density) => void;
}
```

### Form-control variants by density

| size | height | Affected by density? |
|---|---|---|
| `sm` | 32px (`h-8`) hardcoded | **No** (explicit prop wins) |
| `md` (default) | `h-[var(--theo-control-h)]` | **Yes** — drives the 32 / 36 / 44 px scale |
| `lg` | 44px (`h-11`) hardcoded | **No** (explicit prop wins) |
| `icon` | mirrors `md` | Yes (square) |

### Card padding

Card `md` (default): `p-5` (20px). `sm` stays `p-3`, `lg` recalibrated to `p-6`
(was `p-7`). Subparts inherit via Context as before (EC-8 from RFC 0005).

### `body-md`

`text-body-md` class now renders 14px (was 15px). Consumers that wrote
`<p class="text-body-md">` automatically pick up the new value. Consumers
that depended on the old 15px should migrate to `text-body-lg` (18px) or
declare a custom typescale token.

## 5. EC-1 enforcement detail

The first cut of D3 (in the plan draft) routed density through Tailwind class
modifiers like `data-[density=compact]:h-8`. Edge-case review flagged this:
Tailwind compiles that to `[data-density="compact"] .h-8` which has CSS
specificity `(0,1,1)` while the cva variant `.h-9` is `(0,1,0)`. Density would
silently override an explicit `<Button size="md">` even when the consumer asked
for the default — wrong.

The shipped approach (EC-1 fix):
- ThemeProvider injects `<style id="theo-ui-density-vars">` with three blocks:
  ```css
  [data-density="compact"]     { --theo-control-h: 2rem;    --theo-control-px: 0.75rem; }
  [data-density="comfortable"] { --theo-control-h: 2.25rem; --theo-control-px: 0.875rem; }
  [data-density="spacious"]    { --theo-control-h: 2.75rem; --theo-control-px: 1rem; }
  ```
- Only the `md` variant reads from the var:
  ```ts
  md: "h-[var(--theo-control-h,2.25rem)] px-[var(--theo-control-px,0.875rem)] text-body-sm"
  ```
- `sm` and `lg` stay hardcoded.

Result: `<Button size="sm">` in `data-density="spacious"` still renders 32px.
`<Button>` (default md) renders 32 / 36 / 44 according to density. Contract
held.

## 6. Drawbacks

- **Visual delta is perceptible.** Every consumer in 0.2.x will see tighter
  forms and cards after upgrading. Documented in CHANGELOG migration note.
- **`text-body-md` size change is global.** 14 components have hardcoded
  `text-body-md` (grep audit) — all absorb the 15 → 14px change automatically.
  No layout broke in playground smoke; could still affect external consumers
  with custom container widths tuned to 15px.
- **Type bundle delta** ~+500 bytes for the new `Density` / `DensityContextValue`
  type union exports. Acceptable.

## 7. Alternatives considered

- **No tightening, only documentation.** Rejected: user explicitly requested
  visual change. Doc-only would not satisfy the "FAANG-modern" goal.
- **25% tightening as requested.** Rejected: WCAG 2.5.8 AA fails at 30px.
  Calibrated to 10% which matches industry.
- **5-tier density (`xs / s / m / l / xl`).** Rejected: no consumer use case;
  carrying 5 tiers explodes the var-var-var math without benefit. Material
  3 / Linear / Vercel all converged on 3 tiers.
- **Per-component density override prop.** Rejected: that's what `size` is
  for. Density is the global default — `size` is the per-call override.

## 8. Unresolved questions

None. Plan implemented end-to-end, edge cases addressed (EC-1, EC-2 visual
smoke, EC-3 storage failure, EC-4 atomic commit, EC-5 token pre-condition).

## 9. References

- Plan: `.claude/knowledge-base/plans/faang-density-tightening-plan.md`
- Edge cases: `.claude/knowledge-base/reviews/edge-cases/faang-density-tightening-edge-cases-2026-05-22.md`
- Source files: `src/themes/density.ts`, `src/themes/theme-provider.tsx`,
  `src/components/primitives/{button,input,select,textarea,card}/[name].tsx`,
  `src/styles/tailwind-preset.ts`, `docs/design-system.md`
- Playground demo: `playground/density-demo.tsx` (mount via `?view=density`)
- Live preview: <https://docs.usetheo.dev/theoui/theming> (live preview already
  reflects the new defaults via the `@theokit/ui@0.3.0-next.0` upgrade in
  theo-opendocs)
