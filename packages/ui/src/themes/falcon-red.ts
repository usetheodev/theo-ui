import type { Theme } from "./types.js";

/**
 * Falcon Red — the TheoKit brand theme.
 *
 * Identity: the red of the TheoKit falcon mark, #DE2329 — measured from the logo
 * (`images/logo.png`, 10% of its opaque pixels) and corroborated by the badge colour the
 * SDK README already ships (`shields.io/…-DE2329`). In OKLCH that is
 * `oklch(0.579 0.218 26.4)`, and the light mode uses it unmodified: the brand colour is
 * the token, not an approximation of it.
 *
 * Three decisions are worth stating, because each one is a trade-off rather than a preference.
 *
 * **1. Dark mode lightens the primary to `oklch(0.62 …)`, and its foreground is charcoal.**
 * Not a stylistic choice — the alternative is arithmetically impossible. Against the dark
 * background (`oklch(0.146 0 0)`, luminance ≈ 0.0034) a primary needs L ≥ ~0.20 relative
 * luminance to clear 4.5:1, while white text on that same primary needs L ≤ ~0.183. The two
 * constraints do not intersect, so a red that carries body-size text in white AND stays legible
 * as a link on the dark surface does not exist. We keep the link legible (4.89:1 on background,
 * 4.62:1 on card) and put charcoal on the fill (4.89:1). L = 0.62 is the *smallest* lightening
 * that clears both, so the dark primary stays as close to the brand as accessibility allows.
 *
 * **2. `destructive` is carmine (hue 8°), not the brand red.** When the brand is red, the
 * destructive token cannot also be the brand red — "confirm" and "delete this forever" would
 * render identically. Shifting ~18° toward magenta keeps it unmistakably a warning colour while
 * staying in a family that belongs next to the mark. Note this separates them by HUE, not by
 * luminance (they sit at 1.29:1 against each other), so **colour alone is not sufficient**:
 * destructive actions must carry a verb and an icon, exactly as WCAG 1.4.1 requires. The token
 * is a reinforcement, never the signal.
 *
 * **3. `accent` is a deep wine of the same family, not a complementary colour.** A blue accent
 * would collide semantically with `info`, and an amber one with `warning` — both already spoken
 * for. A saturated brand this dominant is better served by a monochrome scale: the accent is
 * separated from the primary by luminance (1.90:1 in light), which reads as depth rather than as
 * a second, competing signal.
 *
 * Neutrals, `success`, `warning` and `info` are inherited from Violet Forge — they are
 * brand-independent and re-tuning them would be change for its own sake.
 *
 * Every pair the contrast gate audits passes at AA, with the two body-text pairs well clear.
 */
export const falconRed: Theme = {
  name: "falcon-red",
  label: "Falcon Red",
  description:
    "TheoKit brand — falcon red primary (#DE2329), deep wine accent, carmine destructive, Geist Sans + Geist Mono.",
  fonts: {
    display: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  light: {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.146 0 0)",
    card: "oklch(1 0 0)",
    "card-foreground": "oklch(0.146 0 0)",
    popover: "oklch(1 0 0)",
    "popover-foreground": "oklch(0.146 0 0)",
    // The brand colour, unmodified. #DE2329.
    primary: "oklch(0.579 0.218 26.4)",
    "primary-foreground": "oklch(1 0 0)",
    secondary: "oklch(0.97 0 0)",
    "secondary-foreground": "oklch(0.146 0 0)",
    // Deep wine — same family, separated by luminance rather than hue.
    accent: "oklch(0.42 0.145 18)",
    "accent-foreground": "oklch(1 0 0)",
    muted: "oklch(0.97 0 0)",
    "muted-foreground": "oklch(0.555 0 0)",
    border: "oklch(0.931 0 0)",
    input: "oklch(0.931 0 0)",
    ring: "oklch(0.579 0.218 26.4)",
    success: "oklch(0.611 0.161 149.7)",
    "success-foreground": "oklch(1 0 0)",
    warning: "oklch(0.67 0.154 60.6)",
    "warning-foreground": "oklch(1 0 0)",
    // Carmine — shifted off the brand hue so it cannot be mistaken for a primary action.
    destructive: "oklch(0.52 0.2 8)",
    "destructive-foreground": "oklch(1 0 0)",
    info: "oklch(0.626 0.186 259.6)",
    "info-foreground": "oklch(1 0 0)",
    "status-online": "oklch(0.611 0.161 149.7)",
    "status-online-foreground": "oklch(1 0 0)",
    "status-offline": "oklch(0.52 0.2 8)",
    "status-offline-foreground": "oklch(1 0 0)",
    "status-degraded": "oklch(0.67 0.154 60.6)",
    "status-degraded-foreground": "oklch(1 0 0)",
    "status-info": "oklch(0.626 0.186 259.6)",
    "status-info-foreground": "oklch(1 0 0)",
  },
  dark: {
    background: "oklch(0.146 0 0)",
    foreground: "oklch(0.97 0 0)",
    card: "oklch(0.182 0 0)",
    "card-foreground": "oklch(0.97 0 0)",
    popover: "oklch(0.182 0 0)",
    "popover-foreground": "oklch(0.97 0 0)",
    // Lightened the minimum needed to clear 4.5:1 on both background and card. See note 1.
    primary: "oklch(0.62 0.218 26.4)",
    // Charcoal, not white — white on this red is 4.05:1, below AA for body text.
    "primary-foreground": "oklch(0.146 0 0)",
    secondary: "oklch(0.227 0 0)",
    "secondary-foreground": "oklch(0.97 0 0)",
    accent: "oklch(0.52 0.15 18)",
    "accent-foreground": "oklch(1 0 0)",
    muted: "oklch(0.227 0 0)",
    "muted-foreground": "oklch(0.683 0 0)",
    border: "oklch(0.28 0 0)",
    input: "oklch(0.34 0 0)",
    ring: "oklch(0.62 0.218 26.4)",
    success: "oklch(0.814 0.192 155.7)",
    "success-foreground": "oklch(0.146 0 0)",
    warning: "oklch(0.77 0.165 70.6)",
    "warning-foreground": "oklch(0.146 0 0)",
    destructive: "oklch(0.68 0.19 8)",
    "destructive-foreground": "oklch(0.146 0 0)",
    info: "oklch(0.732 0.142 254.4)",
    "info-foreground": "oklch(0.146 0 0)",
    "status-online": "oklch(0.814 0.192 155.7)",
    "status-online-foreground": "oklch(0.146 0 0)",
    "status-offline": "oklch(0.68 0.19 8)",
    "status-offline-foreground": "oklch(0.146 0 0)",
    "status-degraded": "oklch(0.77 0.165 70.6)",
    "status-degraded-foreground": "oklch(0.146 0 0)",
    "status-info": "oklch(0.732 0.142 254.4)",
    "status-info-foreground": "oklch(0.146 0 0)",
  },
};
