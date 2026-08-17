---
type: Architecture Decision Record
title: "ADR-0009 — prefers-color-scheme respected by default"
description: The respectSystemMode prop, the precedence rules between OS signal and user override, and the listener cleanup that prevents leaks.
tags: [adr, theming, accessibility, ssr, api, breaking-change]
sources:
  - id: adr
    resource: "archive:94d9b11:docs/adr/0009-prefers-color-scheme-default.md"
    last_modified: "2026-06-03"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

| Field | Value |
| --- | --- |
| Status | **Accepted** |
| Date | 2026-06-03 |

# Context

`<ThemeProvider>` had `defaultMode = "dark"` hardcoded. Consumers who did not change the
prop got dark mode regardless of OS preference. The standard pattern across Next.js,
Linear, Vercel, and GitHub theme libraries is to respect `(prefers-color-scheme: dark)` on
initial hydration when no user preference is stored.

# Decision

A new optional prop `respectSystemMode?: boolean`, defaulting to **`true`**.

1. On mount, when `respectSystemMode === true`, read
   `window.matchMedia('(prefers-color-scheme: dark)').matches`. If the user has not
   explicitly fixed a mode (no stored `localStorage` value, no `setMode()` call), align
   with the OS signal.
2. Subscribe to `change` on the matched MQL. On OS preference change, update the mode — but
   only while the user has still not overridden.
3. The first `setMode()` or `toggleMode()` call marks `userOverrodeModeRef = true`.
   Subsequent OS changes are ignored.
4. Reading a stored mode from `localStorage` on hydration **also** marks the override — a
   stored value implies the user fixed a preference at some point.
5. `respectSystemMode={false}` disables the entire subscribe path; `defaultMode` wins.

EC-12 absorbed: the `useEffect` cleanup calls `mql.removeEventListener('change', onChange)`
on unmount, asserted by `theme-provider-system-mode.test.tsx`. Without it, a micro-frontend
mount/unmount cycle leaks listeners.

# Precedence

| `respectSystemMode` | Stored preference or `setMode()` called | Winner |
| --- | --- | --- |
| `true` | no | **OS** |
| `true` | yes | **User override** |
| `false` | either | **`defaultMode`** |

To lock the mode absolutely regardless of OS: `respectSystemMode={false}` plus
`defaultMode="dark"`.

# Consequences

**Positive.** Matches the industry standard (Next.js `useTheme`, Vercel, Linear, GitHub).
Aligned with WCAG 1.4.13 and the WAI-ARIA APG: light-sensitive users get light, dark-mode
users get dark, automatically. No SSR flash — `<ThemeScript>` mounted in `<head>` reads
`matchMedia` plus `localStorage` before React hydrates.

**Negative — this is a subtle breaking change.** Consumers expecting `defaultMode="dark"`
to be absolute now see light on light-mode systems. Mitigated by `respectSystemMode={false}`
and highlighted in the CHANGELOG. Tests depending on a stable mode must explicitly disable
the prop; the 21 existing `theme-provider.test.tsx` cases were updated in the same change.

# Known limitation

The `defaultMode` prop name survives, though `initialMode` would read better now that it is
an SSR fallback rather than an absolute. The rename is **deferred to a major version** to
avoid breaking consumers twice for a naming improvement.

# Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Opt-in (`respectSystemMode={true}` required) | The behavior is universally expected. Making it opt-in surprises ~90% of consumers. |
| A `defaultMode="system"` literal | Conflates "default" with "system signal". A separate flag keeps the two orthogonal — a consumer can have `defaultMode="dark"` as the SSR fallback (no system signal available server-side) **and** opt into OS sync post-hydration. |
