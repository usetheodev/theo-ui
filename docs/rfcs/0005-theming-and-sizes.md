# RFC 0005 — Theming customization + `size` standardization

| Field | Value |
|---|---|
| Author | paulohenriquevn |
| Date | 2026-05-20 |
| Status | **Implemented** (2026-05-20) |
| Plan | `.claude/knowledge-base/plans/theming-and-sizes-plan.md` |
| Edge-case review | `.claude/knowledge-base/reviews/edge-cases/theming-and-sizes-edge-cases-2026-05-20.md` |
| Consumer documented | Required by the user request 2026-05-20: "user must be able to customize and apply their own themes". The follow-up `docs.usetheo.dev/theoui/theming` page (Phase 4 of the plan) is the canonical consumer surface. |

## 1. Summary

Two related gaps were closed in one RFC because both surfaced from the same chat ("How are sizes configurable? Is theming easy?") and both ship without breaking changes:

1. **Sizes**: `size?: 'sm' | 'md' | 'lg'` is now exposed on 9 additional primitives (`Input`, `Badge`, `Toast`, `Checkbox`, `Switch`, `Card`, `FormField`, `Textarea`, `Select.Trigger`) — bringing the total to 11 primitives with consistent `size` semantics (Button and Avatar already had it). Default `md` preserves backwards-compat.
2. **Theming**: `defineTheme(partial)` + `hex()` / `rgb()` color helpers reduce the boilerplate of creating a custom theme from 58 color keys (29 × `light` + 29 × `dark`) to "just declare the keys you want to change". Merge always uses `violetForge` as the base.

A live `<ThemeBuilder>` lives at `docs.usetheo.dev/theoui/theming` (Phase 4 of the plan) — 3 color pickers + a copy-paste snippet so consumers can author a theme without reading the type definition.

## 2. Motivation

**Sizes — measured state pre-RFC:** `grep -lE 'size: {' src/components/primitives/*/[a-z]*.tsx | wc -l` returned **2** (button, avatar). The other 100 components either hardcoded heights (`h-10 px-3 text-body-md` everywhere) or accepted no size knob at all. Tokens existed (`tailwind-preset.ts` has 16 typescale tiers + 12 spacing steps + 7 radii), but tokens-as-classes != tokens-as-API. Consumers who needed a compact form leaked token names into `className`.

**Theming — measured state pre-RFC:** `Theme` interface requires `ColorScale` × 2 (light + dark) — **29 keys each, all mandatory** under TypeScript. There is no `defineTheme(partial)` helper. There are no hex/rgb conversion helpers. Documentation is a single paragraph in `docs/design-system.md`. No theme builder UI exists.

User feedback verbatim (2026-05-20 chat):
> "Precisamos corrigir esse problemas e o usuário deve conseguir fazer o customizar e aplicar seus próprios temas."

## 3. Decision

Four ADRs govern the design. Full rationale lives in `.claude/knowledge-base/plans/theming-and-sizes-plan.md > ADRs`. Summary:

| ID | Decision | Why in one line |
|---|---|---|
| D1 | `size: 'sm' \| 'md' \| 'lg'` (default `md`) via CVA on 9 primitives | Consensus 3-tier scale across shadcn/Mantine/Chakra; default `md` preserves prior behavior |
| D2 | `defineTheme(partial)` merges with `violetForge` (not active theme) | Pure deterministic function; ignores call-site context |
| D3 | `hex()` / `rgb()` return HSL string-tuple `"H S% L%"`, not an object | Drop-in compatible with `ColorScale`; matches shadcn / `hsl(var(--primary))` convention |
| D4 | Live preview in docs uses nested `<ThemeProvider>` (not iframe) | `data-theme` scopes naturally; iframe complicates communication for zero gain |

## 4. API surface

### `size` prop

```tsx
import { Input, Badge, Toast, Checkbox, Switch, Card, FormField, Textarea, Select } from "@theokit/ui";

<Input size="sm" />
<Input size="md" />  // default — backwards compat
<Input size="lg" />

<Card size="lg">
  <Card.Header>  {/* inherits size="lg" via React Context */}
    <Card.Title>Title at headline tier</Card.Title>
  </Card.Header>
</Card>

<Select>
  <Select.Trigger size="sm">     {/* items inside Select.Content stay md */}
    <Select.Value placeholder="…" />
  </Select.Trigger>
</Select>
```

Per-primitive token mapping (full table in the plan):

| size | Input height | Badge padding | Toast padding | Checkbox box | Switch track |
|---|---|---|---|---|---|
| sm  | `h-8`  | `px-2`   | `p-3` | `size-3.5` + `before:inset-[-5px]` (24px effective tap) | `h-4 w-7` |
| md  | `h-10` | `px-2.5` | `p-4` | `size-4`   | `h-5 w-9` |
| lg  | `h-12` | `px-3`   | `p-5` | `size-5`   | `h-6 w-11` |

**Backwards-compat invariant**: when `size` is omitted, generated classes are identical to the pre-RFC version. Snapshot tests in each primitive's `.test.tsx` enforce this.

**EC-1 guard**: `<Input>` uses `Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>` because the native HTML `size: number` attribute (text-input column count) collides with the CVA `size: 'sm'|'md'|'lg'`. A `@ts-expect-error` test asserts that `<Input size={20}>` no longer compiles.

**EC-2 guard**: `<Select.Trigger>` confirmed Radix-only (`<button>` underneath), so no `SelectHTMLAttributes` Omit was needed.

### `defineTheme(partial)`

```tsx
import { defineTheme, hex, rgb, ThemeProvider, builtinThemes } from "@theokit/ui";

const corp = defineTheme({
  name: "corp",
  label: "Corp Dark",
  light: {
    primary: hex("#0EA5E9"),
    accent: hex("#F59E0B"),
  },
  dark: {
    primary: hex("#38BDF8"),
    accent: hex("#FBBF24"),
  },
});

<ThemeProvider themes={[...builtinThemes, corp]} defaultTheme="corp">
  {/* All untouched keys inherit from violetForge. */}
</ThemeProvider>
```

**Input shape:**

```ts
interface DefineThemeInput {
  name: string;                  // required, matches /^[a-z][a-z0-9-]*$/i
  label?: string;                // defaults to capitalize(name)
  description?: string;
  light?: Partial<ColorScale>;
  dark?: Partial<ColorScale>;
  fonts?: Partial<ThemeFonts>;
  fontUrls?: string[];           // defaults to violetForge.fontUrls
}
```

**EC-7 caveat (documented in JSDoc):** overriding only `light.primary` without also overriding `dark.primary` leaves the two modes using different colors (your override in light, violet-forge in dark). Intentional. Pass both to keep parity.

**EC-3 (last-writer-wins):** passing `defineTheme({ name: 'violet-forge', light: { primary: '0 0% 0%' } })` overrides the built-in. `<ThemeProvider>` already deduplicates by name and keeps the last writer — this is the documented mechanism for "monkey-patching" a built-in palette in tests or sandbox surfaces.

### `hex()` / `rgb()`

```ts
hex("#7C3AED")        // "262 83% 58%"
hex("#7c3aed")        // "262 83% 58%" (case-insensitive — EC-4)
hex("#abc")           // expanded to "#aabbcc"
hex("#7C3AED80")      // alpha discarded (opaque ColorScale only)
hex("#abc4")          // 4-char short with alpha — EC-5
rgb(124, 58, 237)     // "262 83% 58%"
```

Out-of-range or malformed input throws with a message that names the offending value — never returns garbage.

## 5. Drawbacks

- Bundle: `dist/index.d.ts` grew **+6.7%** because TypeScript inlines the new CVA size variant unions in 9 primitives plus the `defineTheme` / `hex` / `rgb` signatures. Baseline rebased in `scripts/baselines/bundle-sizes.json`. Runtime `dist/index.js` grew under 5% (within the gate).
- The 9 primitives now share an implicit invariant that `defaultVariants.size === "md"`. Forgetting to set it on a future primitive would silently regress backwards-compat. Pinning would require a unit-level lint, which is **not in scope** of this RFC.
- `defineTheme` always merges with `violetForge`. If a consumer prefers a different base (say `classicPaper`), they must currently spread it manually. Considered acceptable: the base-theme-selection feature is a 3-line change to the helper if a real consumer requests it.

## 6. Alternatives considered

- **No prop, only utility classes.** Rejected: leaks token names into consumer markup, breaks the encapsulation primitives are meant to provide.
- **`size: number` (px-based).** Rejected: removes the design-system constraint and produces visual drift between primitives.
- **5-tier scale (`xs` → `xl`).** Rejected: no consumer request for `xs`/`xl`; carrying them would inflate the bundle and complicate testing.
- **Theme builder app in a separate repo.** Rejected: latency-to-build > value. The live preview at `docs.usetheo.dev/theoui/theming` is good enough.
- **Use `color`/`chroma-js` for hex conversion.** Rejected: ~50KB combined for 30 lines of math we already know how to write.

## 7. Unresolved questions

None. The plan was implemented end-to-end, edge cases addressed, quality gates green.

## 8. Future work

- **Subpart-level `size` override** for `Card` / `FormField` if a real consumer reports a use case where `<Card size="lg"><Card.Header size="sm">` is needed. Currently subparts inherit from context only (EC-8 documented).
- **`defineTheme(partial, base)`** — second argument to pick a different base theme. 3 LOC change, opt-in.
- **Generated theme types** — emit a `ThemeName` literal union when the consumer's `<ThemeProvider themes={[...]}>` is type-narrowed. Requires a `ts-plugin` or codegen; out of scope.

## 9. References

- Plan: `.claude/knowledge-base/plans/theming-and-sizes-plan.md`
- Edge cases: `.claude/knowledge-base/reviews/edge-cases/theming-and-sizes-edge-cases-2026-05-20.md`
- Source files: `src/themes/define.ts`, `src/themes/color.ts`, `src/components/primitives/*/[size-bearing primitives].tsx`, `src/lib/cn.ts`
- Live preview: <https://docs.usetheo.dev/theoui/theming> (Phase 4 of the plan)
