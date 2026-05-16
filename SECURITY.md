# Security Policy

## Supported Versions

`@usetheo/ui` is pre-1.0 (currently `0.0.0`). Security fixes are applied to
`main` and the most recent `0.x` release on the `--tag next` channel. Once
`1.0.0` ships, this section will list a supported-versions matrix.

| Version | Supported          |
|---------|--------------------|
| `0.x`   | Yes (latest only)  |
| `< 0.x` | No                 |

## Reporting a Vulnerability

**Do NOT open public GitHub issues for security vulnerabilities.**

Use GitHub's private vulnerability reporting:
- Go to the [Security tab](https://github.com/usetheo/theo-ui/security) on
  the repository.
- Click "Report a vulnerability".
- Provide a clear repro, affected versions, and (ideally) a patch suggestion.

We aim to acknowledge reports within 3 business days and ship a patch
release within 14 days for `HIGH` / `CRITICAL` issues.

## What counts as a vulnerability

`@usetheo/ui` is a presentation-layer React component library. The
security surface is narrower than a server SDK, but the following classes
are in scope:

- **XSS via inline-script SSR helpers** — e.g. `ThemeScript` interpolates
  user-controlled values (`defaultTheme`, `defaultMode`, `storageKey`) into
  an inline `<script>` block. We escape `<` to `<` so a payload
  containing `</script>` cannot break out of the script tag at the HTML
  tokenizer layer. This was hardened in the `Unreleased > Security` of
  the current CHANGELOG (BLOCKER-001 from the 2026-05-13 audit). Any
  bypass of this escape is a critical vulnerability.
- **XSS via component-rendered content** — primitives that accept
  `ReactNode` props (e.g. `TerminalPanel`, `DiffViewer`, `ChatMessage`,
  `AuditLogEntry`) render the consumer's content as-is. The consumer is
  responsible for sanitizing untrusted input. Components that perform
  unsafe HTML interpolation themselves (e.g. `dangerouslySetInnerHTML`
  with raw input) are vulnerabilities.
- **Prototype pollution** in utility helpers (`cn`, registry-build script
  paths).
- **Supply-chain risks** introduced by transitive dependencies — we accept
  reports about CVEs in our `dependencies` even when the surface is
  third-party (we will at minimum update the lockfile or pin away from
  vulnerable versions).
- **Registry tarball integrity** — the registry pipeline inlines source
  files into `registry/r/*.json`. A vulnerability where a malicious
  `registry/<name>.json` could cause `npx shadcn add` to write to paths
  outside `components/ui/`, `components/blocks/`, or `lib/` would be in
  scope.

## Out of scope

- Misuse of the components by consumers (e.g. passing unsanitized HTML
  into a `<TerminalPanel>` `content` prop). These are documentation
  issues, not vulnerabilities in the library.
- Issues in `referencia/` (internal exploration archive, not shipped).
- Issues only reproducible in `playground/` or `tests/fixture-shadcn-app/`
  with synthetic inputs — those are gate fixtures, not user surfaces.

## Hardening already in place

- `ThemeScript`: explicit `<` → `<` escape on every interpolated
  value. Test coverage in `src/themes/theme-script.test.tsx` includes
  the `</script>` payload vector.
- No component uses `dangerouslySetInnerHTML` outside `ThemeScript`.
- `lint:ci` runs Biome with `noConsole: error` and `noExplicitAny: error`,
  reducing accidental information disclosure and untyped surface.
- `validateNpmTarball` gate ensures `.env`, `.git`, test files, and
  internal screens never enter the published tarball.
- **`safeHref()`** (`src/lib/safe-href.ts`, T3.3): every composite that
  renders consumer-supplied URLs as `<a href>` (currently `ProjectCard`,
  `PreviewEnvCard`) defangs `javascript:`, `vbscript:`, and
  `data:text/html` payloads via `safeHref()`. Case-insensitive,
  whitespace-tolerant. Returns `undefined` for dangerous protocols, so
  the consumer renders a non-link fallback automatically. Test coverage
  in `src/lib/safe-href.test.ts` covers the canonical attack vectors
  plus the safe-protocol allowlist.
