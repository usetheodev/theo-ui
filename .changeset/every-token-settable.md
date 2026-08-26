---
"@theokit/ui": minor
---

Every token the package declares can be set through `Theme`.

Thirteen `--space-*` steps and `--stagger` were declared in `tokens.css` and had no field. Nothing
inside the package reads them, which is what kept it invisible — they exist for a consumer writing
`var(--space-6)` in their own CSS, and a consumer holding a `Theme` object had no way to move them
without writing a stylesheet that outranks ours. That works, and it is not what a design system
should ask of somebody already holding the API.

`space` and `motion.stagger` close it.

The completeness is now a test rather than a claim: `token-coverage.test.ts` reads every `--token`
out of `tokens.css`, emits a theme that sets every field the API exposes, and fails naming any token
the two do not share. A token added tomorrow without a field fails there instead of being found by
whoever needed it.
