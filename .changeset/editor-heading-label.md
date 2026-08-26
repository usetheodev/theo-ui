---
"@theokit/ui": patch
---

The editor's heading honours `labels.heading`.

`1.7.0` added the label, documented it, and left the JSX rendering the literal `"Theme"` — so a
translated editor showed one English word in its title. A label that is defined and never read looks
like support for translation and is not.

The test that now covers it overrides every label with a marker and asserts no default string
survives in the rendered output, which catches any label added later and forgotten in the same way.
Its markers deliberately avoid the English words themselves: `«needs»` would match the very
assertion looking for `needs` and report the test's own marker as a defect.
