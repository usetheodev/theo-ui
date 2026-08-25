---
"@theokit/ui": patch
---

`ToolsList` stays readable in a narrow panel.

The enablement chip was its own `auto` grid column, and an `auto` column never yields width.
Measured in Chrome at a 300px side panel, a row resolved to `32px 63px 104px`: the chip held
104px while the tool name and its description shared 63px between them. The name overflowed onto
the chip and the description wrapped roughly one word per line — 398px tall for a single sentence.
Only the content was ever sacrificed; the chip stayed at 104px at every panel width tested, so the
component needed a ~450px panel to be legible, which is no longer a side panel
(usetheokit/theokit-ui#80).

The chip now shares the content column, inside the wrapping row that already held the name, source
and badge. It keeps its place at the end of that line when there is room and drops to the next line
when there is not, and the description always spans the full content column. The same row at 300px
now resolves to `32px 179px`: the description is 179px wide and 133px tall.

Long tool names break instead of overflowing.
