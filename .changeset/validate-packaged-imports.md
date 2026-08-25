---
"@theokit/ui": patch
---

Pre-publish gate: every relative import in the tarball must resolve to a file the tarball ships.

`1.4.1` was published with a `dist/index.js` importing four chunk files the package did not
contain — 92 shipped against 96 referenced — and nothing detected it. The existing gates could not:
`test` and `test:contract` import from the working tree, where the chunks were present, and
`validate-exports.mjs` asks whether the entry loads here rather than whether the artefact is whole.
The defect only appeared when a consumer bundled the package (usetheokit/theokit-ui#79).

`validate:packaged` asks the cheaper question of the thing actually published: `npm pack --dry-run
--json` for the file list npm itself computes, then every static relative specifier inside those
files must land on one of them. Offline, no consumer, no network. It runs in `prepublishOnly` and
in `quality:gates`.

Verified against the real defect: removing one chunk from `dist/` fails the gate naming
`dist/index.js → ./chunk-….js`, the same shape as the original report.
