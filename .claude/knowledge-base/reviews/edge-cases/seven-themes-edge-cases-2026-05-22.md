# Edge Case Review — seven-themes

Data: 2026-05-22
Plano: `.claude/knowledge-base/plans/seven-themes-plan.md`
Tasks analisadas: 19 (T0.1 a T11.3)
Edge cases encontrados: 5 (MUST FIX: 1, SHOULD TEST: 2, DOCUMENT: 2)

---

## MUST FIX

### EC-1: Theme names usam marcas registradas — risco de trademark + falsa endorsement

- **Task afetada:** T2.1 (Vercel), T6.1 (Anthropic), T7.1 (OpenAI), T8.1 (Linear)
- **Família:** Format / Permission / Boundary (legal)
- **Cenário:** O plano cria `name: "vercel"`, `name: "anthropic"`, `name: "openai"`, `name: "linear"` — quatro marcas registradas/empresas conhecidas. Consumer que vê `<ThemeProvider defaultTheme="anthropic">` pode razoavelmente concluir que o tema é endossado/licenciado pela Anthropic. Risco em duas dimensões:
  - **Trademark dilution / confusion** — usar o nome próprio sem disclaimer pode ser caracterizado como "false affiliation" sob US TM law (sec 43(a) Lanham Act).
  - **Brand confusion entre consumers** — alguém vê "openai" no DropdownMenu e assume integração oficial.
- **Impacto:** Risco legal (cease-and-desist plausível, principalmente da OpenAI que é agressiva em proteção de marca), e perda de credibilidade técnica ("eles fingem ser parceiros").
- **Fix sugerido:** Renomear name slugs com sufixo `-style` (ou `-inspired`):
  ```
  anthropic     → anthropic-style
  openai        → openai-style    (ou "chatgpt-style" — produto, não marca corporativa)
  vercel        → vercel-mono     (descritivo)
  linear        → linear-glass    (descritivo + visual)
  ```
  Label permanece humano-legível ("Anthropic-style"), description começa com **"Inspired by, not affiliated with [company]."** `dracula`, `one-dark`, `github-dark` ficam como estão (Dracula e One Dark são open-source com nomes deliberadamente reusáveis; "github-dark" é descritivo do produto, não da empresa). Atualizar T0.1 catálogo + T6.1/T7.1/T2.1/T8.1 + T9.1 builtinThemes order + RFC 0007 + CHANGELOG.

---

## SHOULD TEST

### EC-2: Dracula light mode é invenção — upstream não tem

- **Task afetada:** T4.1 (Dracula)
- **Cenário:** O usuário pediu "ambos modos para cada um" (chat 2026-05-22). Dracula spec oficial é **dark-only** — `dracula-theme.github.io` lista zero "light variant". Inventar um Dracula Light é factualmente OK (D2 ADR de generic theming) mas (a) pode ficar visualmente desalinhado com o que comunidade Dracula reconhece como Dracula, (b) o `primary: pink #FF79C6` em fundo claro tem contraste 3.2:1 contra branco — **falha WCAG AA**, vai ser pego pelo `validateThemeContrast` gate em T1.1. Resultado: Phase 4 vai falhar o gate quando tentar criar Dracula Light.
- **Teste sugerido:** `test_dracula_light_uses_darker_primary_to_pass_aa` — em vez do `#FF79C6` (pink) original, usar `#C71585` (medium-violet-red, contraste 4.6:1 em branco) ou `#9D4EDD` (purple shifted darker). Adicionar JSDoc à `src/themes/dracula.ts`:
  ```
  Note: "light" mode is a Theo-original adaptation — Dracula upstream
  spec is dark-only. We darken the signature pink/purple to pass WCAG
  AA against light backgrounds, sacrificing palette purity for
  accessibility.
  ```
  Mesmo risk existe para `one-dark` (Atom One Dark tem "One Light" upstream — usar esse, não inventar) e `github-dark` (GitHub tem "light" + "dark" oficiais — Primer tokens cobrem ambos). T5.1 e T3.1 já estão OK; só T4.1 (Dracula) precisa atenção explícita.

### EC-3: `parseHsl` em `wcag-contrast.ts` precisa robustez

- **Task afetada:** T1.1 (validateThemeContrast)
- **Cenário:** Plano cita `"262 83% 58%"` como input format. Mas as paletas que vamos escrever podem ter (a) trailing whitespace, (b) sem `%` no s/l (vi alguns exemplos no plano sem `%`), (c) negative ou >360 hue, (d) saturation 0% (achromatic — divisão por zero potencial no algoritmo WCAG se tratado errado). Plano lista um teste `test_parseHsl_handles_extra_whitespace` — bom — mas falta cobrir os outros.
- **Teste sugerido:**
  ```
  test_parseHsl_strips_percent_signs    — "0 0% 100%" parsed same as "0 0 100"
  test_parseHsl_clamps_hue_360          — "360 0% 50%" treated as 0
  test_parseHsl_handles_achromatic      — sat 0% returns luminance computed correctly (no NaN)
  ```
  Adicionar 3 testes à T1.1 TDD section.

---

## DOCUMENT

### EC-4: `builtinThemes` no `<ThemeProvider>` injeta ~60 KB CSS

- **Risco aceito:** Com 10 temas no array, `injectThemeCss()` cria um `<style>` block com ~6 KB × 10 = 60 KB de CSS. Browser parse cold ≈ 30ms. Não é bug — é o trade-off documentado em D3 ADR. Adicionar nota em `docs/design-system.md > Theme system`:
  > Passar `builtinThemes` (10 entradas) injeta ~60 KB de CSS no DOM. Para apps focados em 1-2 temas, prefira `themes={[violetForge, dracula]}` para reduzir CSS payload (~12 KB).

### EC-5: npm 2FA + Cloudflare IP allowlist são pré-condições recorrentes

- **Risco aceito:** T10.4 (npm publish) e T11.3 (wrangler pages deploy) caíram em incident em ambos plans anteriores (theming-and-sizes, faang-density). T10.4 exige token granular com `read+write @theokit/*` e (idealmente) `2FA bypass`. T11.3 exige IP atual na allowlist do Cloudflare token. Adicionar pré-condition explícita em ambos:
  - T10.4 → `curl -sH "Authorization: Bearer $NPM_TOKEN" https://registry.npmjs.org/-/whoami | jq -r .username` deve retornar `usetheodev` antes de tentar publish.
  - T11.3 → `curl -sH "Authorization: Bearer $CLOUDFLARE_API_TOKEN" https://api.cloudflare.com/client/v4/accounts | jq '.success'` deve retornar `true`.

---

## Padrões Sistêmicos Detectados

| Padrão | Encontrado? | Onde |
|---|---|---|
| Implemented but not wired | Não | builtinThemes update em T9.1 wires immediately |
| Correct code in wrong place | Não | — |
| Project name vs ID | N/A | Sem PG / dados estruturados |
| ArgoCD notifiers | N/A | — |
| Backwards compat na fronteira | **Sim, tratado** | D4 ADR — public API só ganha exports |
| Bundle isolation invariant | **Sim, observado** | Engines não tocados; só themes/index.ts |
| Trademark / brand affiliation | **Sim, EC-1 (MUST FIX)** | T6.1, T7.1, T2.1, T8.1 |
| WCAG contrast hard-failures | **Sim, EC-2** | T4.1 Dracula light invention |

---

## Resumo

| Task | Edges | MUST FIX | SHOULD TEST | DOCUMENT |
|---|---|---|---|---|
| T0.1 | 0 | 0 | 0 | 0 |
| T1.1 (gate) | 1 | 0 | 1 (EC-3) | 0 |
| T2.1 (vercel) | 1 | 1 (EC-1) | 0 | 0 |
| T3.1 (github-dark) | 0 | 0 | 0 | 0 |
| T4.1 (dracula) | 1 | 0 | 1 (EC-2) | 0 |
| T5.1 (one-dark) | 0 | 0 | 0 | 0 |
| T6.1 (anthropic) | 1 | 1 (EC-1) | 0 | 0 |
| T7.1 (openai) | 1 | 1 (EC-1) | 0 | 0 |
| T8.1 (linear) | 1 | 1 (EC-1) | 0 | 0 |
| T9.1-9.4 | 1 | 0 | 0 | 1 (EC-4) |
| T10.1-10.4 | 1 | 0 | 0 | 1 (EC-5 — npm) |
| T11.1-11.3 | 1 | 0 | 0 | 1 (EC-5 — cloudflare) |

**Veredicto:** PLANO PRECISA DE AJUSTE — 1 família de MUST FIX (EC-1 afeta 4 tasks: trademark naming). Fix é renomear 4 slugs (anthropic-style, openai-style, vercel-mono, linear-glass) + atualizar descriptions com disclaimer "Inspired by, not affiliated with". Mudança trivial mas obrigatória antes da implementação. Outras 4 edges são preventivas.

---

## Ações concretas para incorporar ao plano

1. **D1 ADR ganha sub-decisão**: "Theme name slugs derivados de marcas registradas usam sufixo `-style`/`-mono`/`-glass`. Descrição obrigatória inclui 'Inspired by, not affiliated with [X]'." Aplica a T6.1, T7.1, T2.1, T8.1.
2. **T1.1 TDD** ganha 3 testes adicionais (parseHsl percent strip, hue 360 clamp, achromatic saturation).
3. **T4.1 Deep Dives** ganha nota sobre Dracula Light = adaptation original Theo + escolha de primary darker para passar AA. Sugerir hex específico (e.g., `#C71585` ou `#9D4EDD`).
4. **T9.1 Deep Dives** ganha nota EC-4 sobre 60 KB CSS payload (documentado também em design-system.md).
5. **T10.4 + T11.3** ganham linha "Pre-condition" antes do comando de deploy.
