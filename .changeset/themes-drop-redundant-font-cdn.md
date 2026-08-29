---
'@theokit/ui': patch
---

Built-in themes no longer inject a `<link>` to Google Fonts.

Ten of the eleven use Geist and Geist Mono, which this package already self-hosts: `styles.css`
imports `fonts.css`, whose six `@font-face` rules point at woff2 that ship in the tarball. The CDN
link was therefore redundant — and not harmless, because theokit's default CSP is
`style-src 'self' 'unsafe-inline'`, so the browser blocked it and logged a violation on every page
load.

Verified in a browser rather than by reading the bundle: with the link blocked, `document.fonts`
already reported Geist 400/500/600 `loaded` and `body` computed to `Geist, -apple-system, …`. The
fonts were arriving from the package the whole time; the request bought nothing.

`fonts.css` had documented self-hosting as the default since HIGH-002 / D6. The decision landed in
the CSS and never reached the theme registry.

`classicPaper` keeps its `fontUrls`: Inter and JetBrains Mono are not among the self-hosted faces,
so dropping them would leave that theme on system fonts. A consumer choosing it must widen both
`style-src` and `font-src`, and the theme now says so.

Also removed a `fontUrls: input.fontUrls ?? violetForge.fontUrls` fallback in `defineTheme` that
resolved to `undefined` once Violet Forge stopped carrying any, while reading as though a default
existed.
