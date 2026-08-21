# Security Policy

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Report it through GitHub's private vulnerability reporting, which is enabled on this
repository:

**[Report a vulnerability](https://github.com/usetheokit/theokit-ui/security/advisories/new)**

That form opens a private thread visible only to the maintainers. It is the only
channel we can promise to read for this — there is no security mailing list, and a DM
or a comment on an unrelated issue will be missed.

If you cannot use the form, open a public issue containing **only** the sentence
"requesting a private channel for a security report" and nothing about the finding
itself, and a maintainer will open the private thread.

### What to include

- Affected version (`@theokit/ui@1.4.1`), and whether the entry point matters — the
  barrel (`@theokit/ui`) and a component subpath (`@theokit/ui/chat-message`) resolve
  to different bundles.
- What an attacker can do, stated concretely — execute script in the consumer's page,
  read a token out of the DOM, navigate the user somewhere they did not choose.
- The smallest reproduction you have. A failing test is ideal; a props payload plus
  the component that renders it is fine.
- Whether it needs a specific configuration (a peer dependency version, a Tailwind
  version, SSR vs client-only), or reproduces on defaults.
- Anything about the impact you are unsure of. An honest "I could inject the node but
  not prove it executes" is more useful than a guess in either direction.

**Never include a real credential in the report.** If a key of yours leaked, rotate it
first, then report the code path that leaked it.

### What to expect

- **Acknowledgement within 3 business days.** If you do not hear back, the report did
  not reach us — please ping the thread.
- **An assessment within 10 business days**: whether we can reproduce it, the severity
  we assign and why, and whether we intend to fix it.
- **A fix in a patch release** for anything we accept as a vulnerability, with a GitHub
  Security Advisory and a CVE where one applies.
- **Credit in the advisory** under the name you choose, unless you prefer not to be
  named.

We do not run a paid bounty programme.

### Disclosure

We ask for coordinated disclosure: give us the assessment window above before going
public, and we will agree a date with you rather than let a report sit indefinitely.
If a fix is going to take longer than expected, we will tell you why instead of going
quiet.

If you find a vulnerability that is already public, or being exploited, say so in the
report — that changes the timeline and we will treat it accordingly.

## Supported versions

| Version | Supported |
| --- | --- |
| `@theokit/ui` 1.x (latest minor) | Yes |
| `@theokit/ui` 1.x (older minors) | Upgrade to the latest 1.x |
| `@theokit/ui` 0.x | No |

Fixes land on the latest minor. We do not backport.

`@usetheo/ui` is a required peer dependency and holds the generic primitives this
package re-exports; a finding in one of those belongs to that project's tracker, not
this one.

## What is in scope

This is a presentation-layer React component library, so the surface is narrower than a
server SDK — but it renders content that arrives from models and tools, which is
untrusted by construction. In scope:

- **Script execution from an inline-script helper.** `<ThemeScript>` interpolates
  consumer-supplied values (`defaultTheme`, `defaultMode`, `defaultDensity`,
  `storageKey`) into an inline `<script>`. Any payload that breaks out of that script
  tag is critical. See § Hardening for the escape it relies on.
- **Script execution from rendered content.** The markdown pipeline and the
  renderer-output components below render HTML they did not author character by
  character. A payload that survives their sanitizer and executes is in scope.
- **Navigation to a dangerous URL.** A `javascript:`, `vbscript:` or `data:text/html`
  URL reaching an `href` we render.
- **Prototype pollution** in utility helpers (`cn`) or in the registry build scripts.
- **Supply-chain risk** in what we publish: the released tarball's contents, the
  `registry/r/*.json` artifacts, or this repository's release workflow. A malicious
  registry descriptor that makes `npx shadcn add` write outside `components/ui/`,
  `components/blocks/` or `lib/` is in scope.
- **Transitive CVEs** in our `dependencies`. We will at minimum update the lockfile or
  pin away from the vulnerable version.

## What is not in scope

- **Passing unsanitized HTML into a `ReactNode` prop.** Primitives such as
  `TerminalPanel`, `DiffViewer`, `ChatMessage` and `AuditLogEntry` render what the
  consumer hands them, by design. Sanitizing that is the consumer's job — this is a
  documentation problem, not a vulnerability in the library.
- Findings that only reproduce in `tests/fixture-shadcn-app/` or the other fixtures
  under `tests/`. Those are gate fixtures with synthetic inputs, not user surfaces.
- Findings in Ladle stories (`*.stories.tsx`) or the demo screens under `src/screens/`.
  Neither ships in the npm tarball, and their data is fictional placeholder content.
- A model producing wrong or harmful text that we then render faithfully. That is a
  model property; this library does not claim to filter it.

When in doubt, report it. Deciding scope is our job, not yours.

## Hardening already in place

- **`<ThemeScript>` rewrites every `<` as the JS escape `\u003c`** on each interpolated
  value, on top of `JSON.stringify` (`safe()` in `src/themes/theme-script.tsx`). The
  rewrite is required, not belt-and-braces: `JSON.stringify` does not escape `/`, so a
  `</script>` payload survives inside the JSON string verbatim, and the browser's HTML
  tokenizer ends the script tag on it before the JS parser ever gets to treat it as a
  string. `\u003c` keeps the value identical to the JS parser while leaving no `<` for
  the tokenizer to find. `src/themes/theme-script.test.tsx` covers that vector. The
  component also accepts a `nonce` so it survives a nonce-based `script-src`.
- **`safeHref()`** (`src/lib/safe-href.ts`) defangs `javascript:`, `vbscript:` and
  `data:text/html`, case-insensitively and tolerant of whitespace, returning `undefined`
  so the caller renders a non-link fallback. Applied wherever we render a URL that came
  from a model or tool response — the `chat-message` `SourceUrlPart` and `FilePart`
  parts, and `fontUrls` in `ThemeProvider`. `src/lib/safe-href.test.ts` covers the
  attack vectors and the safe-protocol allowlist. **It is deliberately not part of the
  public API**: it defends our own rendering, and exporting it would imply a
  general-purpose sanitizer we do not maintain as one.
- **The markdown pipeline sanitizes at the hast layer.** `src/lib/markdown/parser.ts`
  runs `hast-util-sanitize` with `defaultSchema`, widened only for the `className`
  attributes syntax highlighting needs (`code`, `pre`, `span`) — the allowlist is
  narrowed to a `^language-./` pattern on `code`.
- **Five components render `dangerouslySetInnerHTML`, each with a named reason.**
  `ThemeScript` (above) plus four that inject markup produced by a renderer rather
  than by a caller: `src/lib/markdown/math.tsx` (KaTeX `renderToString`),
  `src/lib/markdown/code-block.tsx` (Shiki), and `src/lib/markdown/mermaid.tsx` and
  `src/components/primitives/slide/plugins/mermaid/index.tsx` (Mermaid, initialized
  with `securityLevel: "strict"`). Each carries a `biome-ignore` naming why. A finding
  that the renderer's own output can be made to carry executable markup is in scope.
- **`lint:ci` runs Biome with `noConsole: error` and `noExplicitAny: error`**, which
  reduces accidental information disclosure and untyped surface.
- **The `validateNpmTarball` gate** keeps `.env`, `.git`, test files and the internal
  screens out of the published tarball.
- **No published version carries an npm provenance attestation, and that is worth knowing
  before you rely on one.** `npm view @theokit/ui@<version> dist --json` returns
  `signatures` — which the registry adds to every package automatically and which is not
  provenance — and no `attestations` key, for every version to date. The release workflow
  requests provenance and always has; it never produced one because the npm CLI in the job
  was older than 11.5.1 and therefore had no OIDC support at all, so it published
  unauthenticated and the registry refused. Fixed in the workflow (usetheokit/theokit-ui#46);
  the first version to carry an attestation will be the next one released.

  Versions already on the registry cannot be given one retroactively: an attestation is
  bound to the tarball's integrity hash at publish time, the tarballs are immutable, and
  re-publishing a version is refused. If you need to verify the origin of a build today,
  verify the git tag and the tree it points at rather than the tarball.

- **A pre-commit hook scans staged content with TruffleHog**, fail-closed: a missing
  binary aborts the commit rather than waving it through. `.github/workflows/secret-scan.yml`
  re-runs it on push, so `--no-verify` buys time rather than a hole.
