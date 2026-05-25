# Baseline: 7 Themes Palette Catalog (2026-05-22)

Source-of-truth para as paletas que vamos implementar em `seven-themes-plan`.
Cada linha é HEX → HSL string-tuple (formato `ColorScale`).

## vercel-mono (vercel/geist tokens)

| Key | Light hex | Light HSL | Dark hex | Dark HSL |
|---|---|---|---|---|
| background | `#FFFFFF` | `0 0% 100%` | `#0A0A0A` | `0 0% 4%` |
| foreground | `#000000` | `0 0% 0%` | `#EDEDED` | `0 0% 93%` |
| primary | `#0070F3` | `212 100% 47%` | `#0072F5` | `212 100% 48%` |
| accent | `#0070F3` | `212 100% 47%` | `#3291FF` | `212 100% 60%` |
| muted-foreground | `#666666` | `0 0% 40%` | `#999999` | `0 0% 60%` |
| border | `#EBEBEB` | `0 0% 92%` | `#333333` | `0 0% 20%` |
| success | `#50E3C2` | `168 76% 60%` | `#0CCE6B` | `144 89% 43%` |
| warning | `#F5A623` | `34 92% 55%` | `#F7B955` | `34 92% 65%` |
| destructive | `#EE0000` | `0 100% 47%` | `#FF1A1A` | `0 100% 55%` |

## github-dark (primer/primitives tokens)

| Key | Light hex | Light HSL | Dark hex | Dark HSL |
|---|---|---|---|---|
| background | `#FFFFFF` | `0 0% 100%` | `#0D1117` | `215 28% 7%` |
| foreground | `#1F2328` | `213 13% 16%` | `#F0F6FC` | `210 67% 96%` |
| card | `#F6F8FA` | `210 29% 97%` | `#161B22` | `215 21% 11%` |
| primary | `#0969DA` | `212 92% 44%` | `#2F81F7` | `212 92% 57%` |
| accent | `#1F6FEB` | `213 84% 52%` | `#388BFD` | `213 92% 61%` |
| muted-foreground | `#656D76` | `213 8% 43%` | `#8B949E` | `213 9% 59%` |
| border | `#D0D7DE` | `210 14% 84%` | `#30363D` | `213 13% 21%` |
| success | `#1A7F37` | `137 66% 30%` | `#3FB950` | `135 53% 49%` |
| warning | `#9A6700` | `41 100% 30%` | `#D29922` | `41 73% 48%` |
| destructive | `#CF222E` | `355 71% 47%` | `#F85149` | `1 90% 62%` |

## dracula (official MIT spec)

**Dark = canonical.** **Light = Theo-original adaptation** (Dracula upstream is dark-only). Primary darkened in light mode to pass WCAG AA.

| Key | Light hex (adapted) | Light HSL | Dark hex (canonical) | Dark HSL |
|---|---|---|---|---|
| background | `#F8F8F2` | `60 30% 96%` | `#282A36` | `231 15% 18%` |
| foreground | `#282A36` | `231 15% 18%` | `#F8F8F2` | `60 30% 96%` |
| card | `#FFFFFF` | `0 0% 100%` | `#44475A` | `232 14% 31%` |
| primary | `#9D4EDD` | `275 70% 58%` | `#FF79C6` | `326 100% 74%` |
| accent | `#7B2CBF` | `271 63% 46%` | `#BD93F9` | `265 89% 78%` |
| muted-foreground | `#6272A4` | `225 27% 51%` | `#6272A4` | `225 27% 51%` |
| border | `#E5E5E5` | `0 0% 90%` | `#44475A` | `232 14% 31%` |
| success | `#50A361` | `129 33% 47%` | `#50FA7B` | `135 94% 65%` |
| warning | `#B8860B` | `43 89% 38%` | `#F1FA8C` | `65 92% 76%` |
| destructive | `#CC2222` | `0 71% 47%` | `#FF5555` | `0 100% 67%` |
| info | `#0891B2` | `190 88% 36%` | `#8BE9FD` | `191 97% 77%` |

## one-dark (atom/one-dark-syntax MIT + Atom One Light)

| Key | Light hex | Light HSL | Dark hex | Dark HSL |
|---|---|---|---|---|
| background | `#FAFAFA` | `0 0% 98%` | `#282C34` | `220 13% 18%` |
| foreground | `#383A42` | `230 8% 24%` | `#ABB2BF` | `220 14% 71%` |
| card | `#FFFFFF` | `0 0% 100%` | `#21252B` | `220 13% 15%` |
| primary | `#4078F2` | `220 88% 60%` | `#61AFEF` | `207 82% 66%` |
| accent | `#A626A4` | `301 62% 40%` | `#C678DD` | `286 60% 67%` |
| muted-foreground | `#A0A1A7` | `230 4% 64%` | `#5C6370` | `220 8% 40%` |
| border | `#EDEDED` | `0 0% 93%` | `#3E4451` | `220 13% 28%` |
| success | `#50A14F` | `119 34% 47%` | `#98C379` | `95 38% 62%` |
| warning | `#C18401` | `41 99% 38%` | `#D19A66` | `29 54% 61%` |
| destructive | `#E45649` | `5 74% 59%` | `#E06C75` | `355 65% 65%` |
| info | `#0184BC` | `198 99% 37%` | `#56B6C2` | `187 47% 55%` |

## anthropic-style (claude.ai-inspired)

> Inspired by, not affiliated with Anthropic.

| Key | Light hex | Light HSL | Dark hex | Dark HSL |
|---|---|---|---|---|
| background | `#F9F9F5` | `60 27% 97%` | `#1A1A1A` | `0 0% 10%` |
| foreground | `#1A1A1A` | `0 0% 10%` | `#F4F1EB` | `36 28% 93%` |
| card | `#FFFFFF` | `0 0% 100%` | `#262626` | `0 0% 15%` |
| primary | `#C96442` | `15 54% 53%` | `#D97757` | `16 62% 60%` |
| accent | `#8B5E3C` | `26 39% 39%` | `#A87655` | `21 33% 50%` |
| muted-foreground | `#646464` | `0 0% 39%` | `#A8A29E` | `30 6% 64%` |
| border | `#E8E5DC` | `45 22% 87%` | `#3F3F3F` | `0 0% 25%` |
| success | `#3F8147` | `127 35% 38%` | `#4ADE80` | `142 71% 58%` |
| warning | `#A87523` | `35 65% 40%` | `#FCD34D` | `45 96% 65%` |
| destructive | `#B23A2D` | `5 60% 44%` | `#EF4444` | `0 84% 60%` |

## openai-style (chatgpt.com-inspired)

> Inspired by, not affiliated with OpenAI.

| Key | Light hex | Light HSL | Dark hex | Dark HSL |
|---|---|---|---|---|
| background | `#FFFFFF` | `0 0% 100%` | `#212121` | `0 0% 13%` |
| foreground | `#212121` | `0 0% 13%` | `#ECECEC` | `0 0% 93%` |
| card | `#F7F7F8` | `240 5% 97%` | `#2F2F2F` | `0 0% 18%` |
| primary | `#10A37F` | `165 82% 35%` | `#19C37D` | `155 78% 43%` |
| accent | `#10A37F` | `165 82% 35%` | `#19C37D` | `155 78% 43%` |
| muted-foreground | `#6E6E80` | `240 7% 47%` | `#9B9B9B` | `0 0% 61%` |
| border | `#E5E5E5` | `0 0% 90%` | `#424242` | `0 0% 26%` |
| success | `#10A37F` | `165 82% 35%` | `#19C37D` | `155 78% 43%` |
| warning | `#D97706` | `30 91% 44%` | `#F59E0B` | `38 92% 50%` |
| destructive | `#DC2626` | `0 73% 50%` | `#EF4444` | `0 84% 60%` |

## linear-glass (linear.app-inspired)

> Inspired by, not affiliated with Linear.

| Key | Light hex | Light HSL | Dark hex | Dark HSL |
|---|---|---|---|---|
| background | `#FFFFFF` | `0 0% 100%` | `#0F0F12` | `240 9% 6%` |
| foreground | `#1C1C1F` | `240 5% 12%` | `#E6E6E6` | `0 0% 90%` |
| card | `#F8F9FB` | `220 25% 98%` | `#1A1A1F` | `240 8% 11%` |
| primary | `#5E6AD2` | `233 56% 60%` | `#7B72E0` | `245 60% 67%` |
| accent | `#7B72E0` | `245 60% 67%` | `#9B8CFF` | `253 100% 78%` |
| muted-foreground | `#6C6C73` | `240 4% 44%` | `#A8A8AF` | `240 5% 67%` |
| border | `#ECECEE` | `240 9% 93%` | `#2A2A2E` | `240 6% 17%` |
| success | `#26A269` | `155 62% 39%` | `#4CC38A` | `147 49% 53%` |
| warning | `#E5A642` | `35 76% 58%` | `#FFB454` | `32 100% 66%` |
| destructive | `#E5484D` | `358 75% 59%` | `#FF6369` | `357 100% 70%` |

## WCAG AA check matrix (pre-validation)

Vai ser validado em runtime pelo `validateThemeContrast` (T1.1). Spot-check manual aqui só pra contrast crítico (foreground/background):

| Theme | Light fg/bg | Dark fg/bg | Status |
|---|---|---|---|
| vercel-mono | #000 on #FFF = 21:1 | #EDEDED on #0A0A0A = 17.5:1 | ✅ |
| github-dark | #1F2328 on #FFF = 14.7:1 | #F0F6FC on #0D1117 = 17.0:1 | ✅ |
| dracula | #282A36 on #F8F8F2 = 13.2:1 | #F8F8F2 on #282A36 = 13.2:1 | ✅ |
| one-dark | #383A42 on #FAFAFA = 11.0:1 | #ABB2BF on #282C34 = 7.3:1 | ✅ |
| anthropic-style | #1A1A1A on #F9F9F5 = 16.4:1 | #F4F1EB on #1A1A1A = 15.0:1 | ✅ |
| openai-style | #212121 on #FFF = 16.1:1 | #ECECEC on #212121 = 14.0:1 | ✅ |
| linear-glass | #1C1C1F on #FFF = 16.3:1 | #E6E6E6 on #0F0F12 = 16.3:1 | ✅ |

Todos os 7 temas passam AA com folga em `foreground`/`background`. Primary contrast vai ser validado runtime.
