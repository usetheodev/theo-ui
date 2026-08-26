---
"@theokit/ui": minor
---

`deriveColorScale` builds a whole palette from one colour, and the editor offers it.

Asking somebody to choose twenty-nine colours is asking them to be a designer. Choosing one and
deriving the rest is what Radix and Material 3 do, and it only works in a perceptual space —
lightening in HSL changes how saturated a colour *looks*, so a scale built that way drifts in ways
the numbers do not show. Every step here moves OKLCH lightness and leaves hue alone.

**The pairs that carry text are solved, not assigned.** `primary-foreground` is whichever of
near-black and near-white clears the threshold against `primary`; when neither does, `primary` is
walked in lightness — 0.02 at a time, away from the mode's own background — until one of them does.
A derived palette that fails WCAG is exactly what the audit exists to reject, so producing one would
be a strange thing for this package to do.

**It targets 4.5:1 where labels sit**, above the 3:1 the audit demands of those surfaces. The audit's
threshold is right for judging a hand-written theme and too loose for generating one. It is also
what makes the walk do anything: at 3:1 there is no lightness where neither near-black nor
near-white reads, so a derivation aiming only at the floor would never move a surface.

Semantic colours keep fixed hues — a destructive action does not turn green because the brand did —
and the neutrals carry a trace of the brand's hue, which is what stops a palette reading as "a
colour on top of Bootstrap".

Covered by a sweep of eleven seeds across two modes, including yellow, near-black, near-white, and
one measured to sit inside the band where neither text candidate works.
