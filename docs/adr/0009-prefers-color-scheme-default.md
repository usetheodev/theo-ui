# ADR-0009 — `prefers-color-scheme` Respected by Default

| Field | Value |
| --- | --- |
| Status | **Accepted** |
| Date | 2026-06-03 |
| Plan | `.claude/knowledge-base/plans/theo-ui-community-best-practices-alignment-plan.md` |
| Cross-refs | D6, T5.1, EC-12 |

## Context

Pre-T5.1, `<ThemeProvider>` had `defaultMode = "dark"` hardcoded. Consumers who didn't change the prop got dark mode regardless of OS preference. Standard pattern across Next.js / Linear / Vercel / GitHub theme libs: respect `(prefers-color-scheme: dark)` on initial hydration when no user preference is stored.

## Decision

New optional prop `respectSystemMode?: boolean` (default `true`) on `<ThemeProvider>`. Behavior:

1. On mount, if `respectSystemMode === true`, read `window.matchMedia('(prefers-color-scheme: dark)').matches`. If the user has not explicitly fixed a mode (no stored localStorage value, no `setMode()` called yet), align with the OS signal.
2. Subscribe to `change` events on the matched MQL. On OS preference change, update mode if user has still not overridden.
3. The first call to `setMode()` (or `toggleMode()`) marks `userOverrodeModeRef = true`. Subsequent OS changes are ignored.
4. Reading a stored mode from `localStorage` on hydration also marks the override (the stored value implies a user fixed a preference at some point).
5. `respectSystemMode={false}` disables the entire subscribe path — `defaultMode` wins.

EC-12 absorbed: `useEffect` cleanup calls `mql.removeEventListener('change', onChange)` on unmount. Asserted by `theme-provider-system-mode.test.tsx`.

### Precedence semantics

- `respectSystemMode={true}` + no stored preference + no user setMode → OS wins
- `respectSystemMode={true}` + stored preference OR user setMode → user override wins
- `respectSystemMode={false}` → `defaultMode` always wins

For consumers wanting to absolutely lock the mode regardless of OS: `respectSystemMode={false}` + `defaultMode="dark"`.

## Consequences

### Positive

- Matches industry standard (Next.js `useTheme`, Vercel, Linear, GitHub).
- WCAG 1.4.13 + WAI-ARIA APG-aligned: users with light-sensitivity get light, users with dark-mode preference get dark — automatically.
- No SSR flash: `ThemeScript` (when mounted in `<head>`) reads `matchMedia` + `localStorage` before React hydrates.

### Negative

- Subtle breaking change: consumers expecting `defaultMode="dark"` to be absolute will now see light in light-mode systems. Mitigation: prop `respectSystemMode={false}` restores prior behavior; CHANGELOG entry highlights the change.
- Tests that depend on a stable mode must explicitly disable `respectSystemMode` (existing 21 tests in `theme-provider.test.tsx` already updated).

### Known limitations

- The `defaultMode` prop name remains (would be cleaner as `initialMode`). Rename deferred to a major version to avoid double-breaking.

## Alternatives Considered

### A1 — Opt-in (`respectSystemMode={true}` required)

Rejected. Behavior is universally expected by users; making it opt-in surprises 90% of consumers.

### A2 — `defaultMode="system"` literal

Rejected. Conflates the "default" semantic with the system signal. A separate flag (`respectSystemMode`) keeps the two orthogonal — consumers can have `defaultMode="dark"` as the SSR fallback (no system signal available) AND opt into OS sync post-hydration.

## References

- Implementation: `src/themes/theme-provider.tsx` (`useEffect` block calling `matchMedia` + cleanup).
- Tests: `src/themes/theme-provider-system-mode.test.tsx` (5 cases including EC-12 cleanup).
- Plan: T5.1 (auto-detect implementation), T6.4 (this ADR).
