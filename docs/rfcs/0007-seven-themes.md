# RFC 0007 — 7 new built-in themes (Vercel / GitHub Dark / Dracula / One Dark / Anthropic-style / OpenAI-style / Linear Glass)

| Field | Value |
|---|---|
| Author | paulohenriquevn |
| Date | 2026-05-22 |
| Status | **Implemented** (2026-05-22) |
| Plan | `.claude/knowledge-base/plans/seven-themes-plan.md` |
| Edge-case review | `.claude/knowledge-base/reviews/edge-cases/seven-themes-edge-cases-2026-05-22.md` |
| Consumer documented | User request (2026-05-22 chat): "Gostaria de mais themes... Crie temas que estão bombando, parecido com Anthropic, OpenAI, theme Dev-friendly". Surface live: `<ThemeSwitcher>` em `docs.usetheo.dev/theoui/theming`. |

## 1. Summary

Cresce o catálogo built-in de **3 → 10** temas, adicionando paletas reconhecíveis no segmento AI/dev: Vercel Mono, GitHub Dark, Dracula, One Dark, Anthropic-style, OpenAI-style, Linear Glass. Cada tema entrega ambos os modos (light + dark) validados por novo gate `validateThemeContrast` (WCAG 2.1 AA — 4.5:1 para body, 3:1 para button labels). Public API ganha 7 named exports; sem visual break em consumers existentes (default permanece `violet-forge`). Ship como minor `0.4.0-next.0`.

## 2. Motivation

**Estado pre-RFC**: `builtinThemes = [violetForge, classicPaper, auroraTerminal]` — 3 itens. Consumer que quer "Dracula" ou "Anthropic look" precisava autorar custom via `defineTheme`.

**Pedido evidence (chat 2026-05-22)**:
> "Gostaria de mais themes é possível? entre 8 a 10 themes... Crie temas que estão bombando, parecido com o Anthropic, OpenAI (ChatGPT), theme Dev-friendly."

Total alvo: 10. Implementado 7 novos.

## 3. Decision

| ID | Decisão | Por quê |
|---|---|---|
| D1 | Fontes seguem Geist em todos os temas | Söhne / Mona Sans / Inter Display custariam ~250 KB extra; cor é >80% do "feels like X" |
| D1.1 | Slugs de marcas usam sufixo descritivo | Evita trademark dilution / false-affiliation (Lanham Act § 43(a)) |
| D2 | Gate `validateThemeContrast` enforces WCAG 2.1 AA | 10 themes × 2 modos × 4 pairs = 80 checks insustentáveis manualmente |
| D3 | `builtinThemes` cresce para 10; default permanece `violet-forge` | Backwards-compat preservada |
| D4 | Ship como `0.4.0-next.0` (minor) | API surface cresce; convenção do projeto |

### D1.1 — Trademark-safe slugs (EC-1)

| Inspiração | Slug | Label |
|---|---|---|
| Vercel | `vercel-mono` | Vercel Mono |
| OpenAI / ChatGPT | `openai-style` | OpenAI-style |
| Anthropic | `anthropic-style` | Anthropic-style |
| Linear | `linear-glass` | Linear Glass |
| Dracula (OSS MIT) | `dracula` | Dracula |
| One Dark (Atom MIT) | `one-dark` | One Dark |
| GitHub Dark (Primer) | `github-dark` | GitHub Dark |

`description` obrigatoriamente começa com **"Inspired by, not affiliated with [Company]."** para os 4 derivative themes.

### D2 — `validateThemeContrast` gate

`scripts/lib/wcag-contrast.ts` (pure JS, 80 LOC):
- `parseHsl("262 83% 58%")` → `{ h, s, l }`. Robusto: strips `%`, clamps hue [0, 360), aceita saturation 0 (achromatic).
- `hslToLuminance(hsl)` → WCAG 2.1 relative luminance.
- `contrastRatio(a, b)` → ratio [1, 21].

`scripts/validate-quality-gates.ts > validateThemeContrast` itera os 10 temas × 2 modos:
- **Body pairs** (`foreground`/`background`, `card-foreground`/`card`): exige **4.5:1** (AA body).
- **Large pairs** (`primary-foreground`/`primary`, `accent-foreground`/`accent`): exige **3:1** (AA large text — button labels qualifying).

Roda em <50ms; pega regressões logo no dev-loop.

## 4. API surface

```ts
import {
  ThemeProvider,
  builtinThemes,
  vercelMono,
  githubDark,
  dracula,
  oneDark,
  anthropicStyle,
  openaiStyle,
  linearGlass,
} from "@usetheo/ui";

<ThemeProvider themes={builtinThemes} defaultTheme="dracula">
  {children}
</ThemeProvider>

// Or pick a subset:
<ThemeProvider themes={[violetForge, dracula, oneDark]}>
  {children}
</ThemeProvider>
```

## 5. WCAG audit results

All 10 themes pass on the gate at commit time. Highlights from `validateThemeContrast`:

| Theme | Light body fg/bg | Dark body fg/bg | Primary label (large 3:1) |
|---|---|---|---|
| violet-forge | 19.6:1 | 16.1:1 | ✅ (light 4.0+, dark 4.0+) |
| classic-paper | 15.0:1 | 14.7:1 | ✅ (accent darkened to fix AA) |
| aurora-terminal | 17.2:1 | 13.4:1 | ✅ |
| vercel-mono | 21.0:1 | 17.5:1 | ✅ |
| github-dark | 14.7:1 | 17.0:1 | ✅ |
| dracula | 13.2:1 | 13.2:1 | ✅ |
| one-dark | 11.0:1 | 7.3:1 | ✅ |
| anthropic-style | 16.4:1 | 15.0:1 | ✅ |
| openai-style | 16.1:1 | 14.0:1 | ✅ (primary darkened to fix AA) |
| linear-glass | 16.3:1 | 16.3:1 | ✅ |

## 6. Drawbacks

- **Bundle size**: 10 temas × ~6 KB CSS injetado em `<style id="theo-ui-theme-vars">` ≈ 60 KB DOM payload se consumer passar `builtinThemes`. Documentado; alternativa via `themes={[violetForge, dracula]}` (~12 KB).
- **Dracula light é Theo-original** — Dracula upstream é dark-only. Adaptamos darkening primary pink → purple-darker pra passar AA. JSDoc explícito.
- **Derivative themes não-pixel-perfect** — Anthropic, OpenAI, Linear sem ref oficial pública. Aceitamos "visualmente reconhecível" sem replicar identidade exata.

## 7. Alternatives considered

- **Apenas 3 dev themes (Dracula / One Dark / GitHub Dark)** sem inspirações corporate: simples, sem trademark risk, mas perde o "AI-modern feel" pedido.
- **Replicar fontes (Söhne, Inter)**: ~250 KB extra, custo desproporcional.
- **Empacotar temas como subpath separado (`@usetheo/ui/themes/dracula`)**: bundle isolation real mas DX pior (4 imports vs 1). Rejeitado em favor de barrel.

## 8. Unresolved questions

None.

## 9. References

- Plan: `.claude/knowledge-base/plans/seven-themes-plan.md`
- Edge cases: `.claude/knowledge-base/reviews/edge-cases/seven-themes-edge-cases-2026-05-22.md`
- Catalog: `.claude/knowledge-base/architecture/usetheo-ui/baseline-2026-05-22-themes.md`
- Source repos canonical:
  - Dracula: [dracula/dracula-theme.github.io](https://github.com/dracula/dracula-theme.github.io) (MIT)
  - One Dark: [atom/one-dark-syntax](https://github.com/atom/one-dark-syntax) (MIT)
  - GitHub Dark: [primer/primitives](https://github.com/primer/primitives) (MIT)
  - Vercel: [vercel/geist](https://github.com/vercel/geist) (MIT)
