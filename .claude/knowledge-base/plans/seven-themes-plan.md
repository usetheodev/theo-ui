# Plan: 7 new built-in themes (Anthropic / OpenAI / Vercel / Linear / GitHub Dark / Dracula / One Dark)

> **Version 1.0** — Cresce o catálogo de temas built-in de **3** (`violet-forge`, `classic-paper`, `aurora-terminal`) para **10**, adicionando paletas reconhecíveis no segmento AI/dev: Anthropic (claude.ai), OpenAI (chatgpt.com), Vercel (Geist), Linear (linear.app), GitHub Dark (Primer), Dracula (official MIT), e One Dark (Atom MIT). Cada tema entrega ambos os modos (`light` + `dark`). Mantém o pattern existente: arquivo `src/themes/<slug>.ts` exportando `Theme` shape, registrado em `builtinThemes`. Outcome esperado: consumer escolhe entre 10 paletas familiares no `<ThemeSwitcher>` ou via `defaultTheme="dracula"` no `<ThemeProvider>`, sem precisar autorar custom theme.

## Context

**Estado atual (verificado via `src/themes/index.ts`):**

- `builtinThemes = [violetForge, classicPaper, auroraTerminal]` — 3 itens.
- Pattern por tema: arquivo `<slug>.ts` (~85 linhas) com `Theme` shape — `name`, `label`, `description`, `fonts`, `fontUrls`, `light` + `dark` (29 keys cada).
- ThemeProvider já injeta CSS vars por tema via `injectThemeCss(themes)`. Múltiplos themes = múltiplos `[data-theme="<name>"] { ... }` blocks no `<style id="theo-ui-theme-vars">`.
- `defineTheme(partial)` (RFC 0005) já permite ao consumer criar custom — mas requer 29×2 cor keys ou inheritance de violetForge.

**Demanda evidence (chat 2026-05-22):**
- Usuário: "Gostaria de mais themes é possível? entre 8 a 10 themes."
- Usuário (refinement): "Crie temas que estão bombando, Parecido com o Antropic, OpenAI (ChatGPT), theme Dev-friendly."

**Fontes canonical (decisão do usuário): repos open-source com MIT/derivative-friendly licenses:**

| Tema | Fonte | Status |
|---|---|---|
| Dracula | [dracula/dracula-theme.github.io](https://github.com/dracula/dracula-theme.github.io) | Spec direto |
| One Dark | [atom/one-dark-syntax](https://github.com/atom/one-dark-syntax) | Spec direto |
| GitHub Dark | [primer/primitives](https://github.com/primer/primitives) (Primer tokens oficiais) | Spec direto |
| Vercel | [vercel/geist](https://github.com/vercel/geist) (Geist Design tokens) | Spec direto |
| Anthropic | inspeção visual de claude.ai | Derivative — não há ref pública oficial |
| OpenAI | inspeção visual de chatgpt.com (ChatGPT green `#10A37F` doc'd) | Derivative |
| Linear | inspeção visual de linear.app | Derivative |

**Bundle/perf considerations (medidos via bundle baseline atual):**
- Cada tema adiciona ~6 KB CSS no `<style id="theo-ui-theme-vars">` quando passado em `themes`.
- 10 temas no `builtinThemes` = ~60 KB de CSS injetado se consumer usar todos.
- ~2 KB JS por tema source (29×2 + metadata).
- Total estimate: barrel `dist/index.js` cresce ~14 KB (7 themes × 2 KB), `dist/styles.css` inalterado (CSS injetado runtime via `<style>`).

## Objective

**Done = `import { dracula, oneDark, anthropic, openai, vercel, linear, githubDark } from "@theokit/ui"` resolve, cada tema é um `Theme` válido (passa Zod-style runtime shape check), `<ThemeProvider themes={builtinThemes}>` registra 10 entries no `<ThemeSwitcher>`, e cada tema renderiza um Button + Card + Input sem violações WCAG 2.5.8 AA contrast (4.5:1 body / 3:1 large) em ambos os modos.**

Concretamente:

1. **7 novos arquivos** `src/themes/<slug>.ts` exportando `Theme` válido.
2. **`builtinThemes`** atualizado para 10 itens.
3. **`src/index.ts`** re-exporta os 7 novos.
4. **`validateThemeContrast` (NEW gate)** verifica WCAG AA em cada par `light` / `dark` × 4 high-stakes pairs (`background`/`foreground`, `card`/`card-foreground`, `primary`/`primary-foreground`, `accent`/`accent-foreground`).
5. **`<ThemeSwitcher>` smoke**: stories Ladle mostram todos 10 com Button + Card + Input.
6. **RFC 0007** com 4 ADRs.
7. **Bump `0.4.0-next.0`** (minor — adiciona API exports + 7 themes; sem break).
8. **Live em `docs.usetheo.dev/theoui/theming`** — `<ThemeBuilder>` lista todos 10 no preview switcher.

## ADRs

### D1 — Fontes seguem Geist (não recriar Söhne / Inter por tema)

- **Decisão:** Todos os 7 novos temas usam **Geist** (sans + mono), mesmo que a identidade original use outra fonte (Anthropic → Söhne, OpenAI → Söhne, Linear → Inter Display, GitHub → Mona Sans). O `fonts` field referencia Geist via mesma `fontUrls` que `violetForge`.
- **Rationale:** Recriar a fonte exata de cada produto exige (a) licença de Söhne (proprietária, paga), (b) Mona Sans (Apache-2.0, ~120 KB), (c) Inter Display (OFL, ~50 KB). Cada fonte adicional infla o bundle e fragmenta a identidade Theo. Geist (já no projeto, OFL) é "tech-modern sans" suficiente — a paleta é o que carrega a identidade visual, não a fonte. Consumer que QUER a fonte original passa `fonts` override via `defineTheme`.
- **Consequences:** Identidade reconhecível pela cor (que é >80% do "feels like X"), não pela tipografia. Bundle inalterado em fontes. `dracula` e `one-dark` ainda exibem o Geist Mono no `<code>` — coerente com tipografia code-monospaced que esses temas usam upstream.

### D1.1 — Theme slugs derivados de marcas registradas usam sufixo descritivo (EC-1 fix)

- **Decisão:** Temas inspirados em produtos comerciais (Anthropic, OpenAI/ChatGPT, Vercel, Linear) **NÃO** usam o nome puro como `name` slug. Em vez:
  ```
  anthropic   → anthropic-style    (label: "Anthropic-style")
  openai      → openai-style       (label: "OpenAI-style")
  vercel      → vercel-mono        (label: "Vercel Mono")
  linear      → linear-glass       (label: "Linear Glass")
  ```
  Description obrigatoriamente começa com **"Inspired by, not affiliated with [Company]."** `dracula`, `one-dark`, `github-dark` permanecem (Dracula e One Dark são OSS com nomes deliberadamente reusáveis; "github-dark" é descritivo de feature, não marca corporativa).
- **Rationale:** Evita risco de trademark dilution / false affiliation (Lanham Act § 43(a)). Reduz chance de cease-and-desist (OpenAI é particularmente agressiva). Disclaimer no description é honesto e cobre intenção. Sufixo `-style` / `-mono` / `-glass` é semântico — comunica "look-and-feel inspirado", não "produto oficial".
- **Consequences:** Consumer escreve `<ThemeProvider defaultTheme="anthropic-style">`. DX levemente mais verboso mas semanticamente honesto. Atualiza T0.1 catálogo, T6.1/T7.1/T2.1/T8.1 deep dives, T9.1 builtinThemes array, RFC 0007, CHANGELOG.

### D2 — Gate automático `validateThemeContrast` enforces WCAG 2.5.8 AA

- **Decisão:** Adicionar nova função `validateThemeContrast` em `scripts/validate-quality-gates.ts` que valida 4 pares cor por tema × 2 modos via algoritmo WCAG contrast ratio (`(L1 + 0.05) / (L2 + 0.05)`, onde L é luminância relativa). Falha se qualquer par < 4.5:1 (body) ou < 3:1 (large). Implementação: ~40 linhas pure-JS no script (não nova dep — algoritmo é trivial).
- **Rationale:** 10 temas multiplica a probabilidade de drift. Validação manual de contraste em 10 × 2 modos × 4 pairs = 80 checks é insustentável. Gate automático pega regressão na primeira CI run. Dracula e One Dark upstream JÁ passam WCAG (validated por suas comunidades); Anthropic/OpenAI/Linear/Vercel são inspirações nossas — precisam validation.
- **Consequences:** Hard guarantee: nenhum tema com contraste inacessível chega ao registry. Custa ~50ms em quality:gates. Se algum par falhar, ou ajustamos a paleta ou documentamos exception explícita (impossível em D2 strict — sem exceptions).

### D3 — `builtinThemes` cresce para 10; consumer-friendly default permanece `violet-forge`

- **Decisão:** Atualizar `builtinThemes = [violetForge, classicPaper, auroraTerminal, anthropic, openai, vercel, linear, githubDark, dracula, oneDark]`. `<ThemeProvider defaultTheme="violet-forge">` continua sendo o default. `<TheoUIProvider>` (que automaticamente passa `builtinThemes`) agora oferece 10 escolhas.
- **Rationale:** Consumer que importa `builtinThemes` está optando pelo bundle completo — é o caso "show all". Quem quer um subset cria array próprio: `themes={[violetForge, dracula]}`. Manter `violet-forge` como default preserva backwards-compat (consumers em 0.3.x não veem mudança visual).
- **Consequences:** Bundle de quem importa `builtinThemes` cresce ~60 KB CSS injection + ~14 KB JS. Tree-shaking continua removendo themes não usados (cada `.ts` é named export). Documentado em CHANGELOG.

### D4 — Ship como `0.4.0-next.0` (minor)

- **Decisão:** Bump `0.3.0-next.0` → `0.4.0-next.0`. Public API ganha 7 named exports (`anthropic`, `openai`, `vercel`, `linear`, `githubDark`, `dracula`, `oneDark`). Sem mudança em prop signatures, sem visual break.
- **Rationale:** Minor bump quando a API surface cresce (mesmo que aditivo). Patch (0.3.x) seria semverr-correto também, mas convenção do projeto (RFC 0005/0006) usa minor para "feature additions visible to consumers". 0.4 sinaliza "novos temas disponíveis".
- **Consequences:** CHANGELOG ganha section `[0.4.0-next.0]`. Migration note: zero — não há nada para migrar. Cataloga "novos temas built-in" em `### Added`.

## Dependency Graph

```
Phase 0 (Baseline) ──▶ Phase 1 (validateThemeContrast gate)
                              │
                              ▼
                       Phase 2 (Vercel theme — easiest, Geist-aligned)
                              │
                              ▼
                       Phase 3 (GitHub Dark — Primer tokens)
                              │
                              ▼
                       Phase 4 (Dracula — MIT official)
                              │
                              ▼
                       Phase 5 (One Dark — Atom MIT)
                              │
                              ▼
                       Phase 6 (Anthropic — derivative)
                              │
                              ▼
                       Phase 7 (OpenAI — derivative)
                              │
                              ▼
                       Phase 8 (Linear — derivative)
                              │
                              ▼
                       Phase 9 (builtinThemes + barrel + ThemeSwitcher stories)
                              │
                              ▼
                       Phase 10 (RFC 0007 + bump 0.4.0-next.0)
                              │
                              ▼
                       Phase 11 (Dogfood + theming page update + deploy)
```

Phases 2-8 são sequencialmente isoladas — cada uma adiciona 1 arquivo. **Em prática, pode rodar em paralelo** (sem conflito de arquivos), mas mantemos sequenciais no plan para clareza. Phase 1 (gate) precisa estar pronto antes para validar contraste à medida que cada tema é criado.

---

## Phase 0: Baseline snapshot

### T0.1 — Catalogar paletas canonical das 7 fontes

#### Objective
Documentar as cor keys exatas que vamos copiar de cada fonte canonical (Primer, Dracula, Atom, Geist) e as cor keys derivative que vamos extrair via inspeção (claude.ai, chatgpt.com, linear.app).

#### Evidence
Fontes canonical listadas em "Context" desta plan. Sem snapshot, risco de drift entre o que está nos repos canonical e o que implementamos.

#### Files to edit
```
.claude/knowledge-base/architecture/usetheo-ui/baseline-2026-05-22-themes.md — (NEW) catalog de cores
```

#### Tasks
1. Para cada tema, capturar (manualmente, da fonte canonical):
   - **Dracula**: `background #282A36`, `current-line #44475A`, `foreground #F8F8F2`, `comment #6272A4`, `cyan #8BE9FD`, `green #50FA7B`, `orange #FFB86C`, `pink #FF79C6`, `purple #BD93F9`, `red #FF5555`, `yellow #F1FA8C`.
   - **One Dark**: `mono-1 #ABB2BF` (text), `mono-2 #828997`, `mono-3 #5C6370` (comment), `hue-1 #56B6C2` (cyan), `hue-2 #61AFEF` (blue), `hue-3 #C678DD` (purple), `hue-4 #98C379` (green), `hue-5 #E06C75` (red 1), `hue-5-2 #BE5046` (red 2), `hue-6 #D19A66` (orange 1), `hue-6-2 #E5C07B` (orange 2), `syntax-bg #282C34`.
   - **GitHub Dark**: usar Primer tokens — `bg.canvas #0d1117`, `bg.subtle #161b22`, `fg.default #f0f6fc`, `accent.fg #2f81f7`, `accent.emphasis #1f6feb`, `success.fg #3fb950`, `attention.fg #d29922`, `severe.fg #db6d28`, `danger.fg #f85149`, `done.fg #a371f7`.
   - **Vercel**: Geist tokens — `background-100 #fff` / `#0a0a0a`, `foreground #000` / `#ededed`, `blue-link #0070F3`, `error #ee0000`, `warning #f5a623`, `success #50e3c2`.
   - **Anthropic** (inspection): `background #F9F9F5` (warm cream) / `#1A1A1A`, `foreground #1A1A1A` / `#F4F1EB`, `primary burnt sienna #C96442`, `accent` cinder-like, ink-on-cream feel.
   - **OpenAI** (inspection): `background #FFFFFF` / `#212121` (chatgpt-canvas), `foreground #212121` / `#ECECEC`, `primary green #10A37F`, `accent` neutral-emphasis.
   - **Linear** (inspection): `background #FFFFFF` / `#0F0F12` (linear-canvas), `foreground #1C1C1F` / `#E6E6E6`, `primary indigo #5E6AD2`, `accent` purple-violet `#7B72E0`.
2. Salvar em markdown como tabela rápida — uma row por tema, cols `Background`, `Foreground`, `Primary`, `Accent`, com link para fonte.

#### TDD
N/A — documentação.

#### Acceptance Criteria
- [ ] Documento commitado lista 7 temas × 4 high-stakes colors = 28 hex values medidos.

---

## Phase 1: `validateThemeContrast` gate (NEW)

### T1.1 — Implementar gate de contraste WCAG

#### Objective
Função pure que, dado um `Theme`, valida que `background`/`foreground`, `card`/`card-foreground`, `primary`/`primary-foreground`, `accent`/`accent-foreground` em ambos os modos passam contrast AA (4.5:1 body).

#### Evidence
10 temas × 2 modos × 4 pairs = 80 contrast checks. Manualidade insustentável.

#### Files to edit
```
scripts/validate-quality-gates.ts — adicionar validateThemeContrast + chamada em main()
scripts/lib/wcag-contrast.ts — (NEW) pure helper hslToLuminance + contrastRatio
scripts/lib/wcag-contrast.test.ts — (NEW) 6 testes
```

#### Deep Dives
**Algoritmo WCAG contrast ratio:**

```ts
// Parse "262 83% 58%" → { h: 262, s: 83, l: 58 }
function parseHsl(tuple: string): { h: number; s: number; l: number };

// HSL → relative luminance (WCAG formula)
function hslToLuminance(hsl: { h, s, l }): number {
  // 1. Convert HSL to sRGB (0..1)
  // 2. Apply linear-RGB transform: each channel:
  //    if c <= 0.03928: c/12.92
  //    else: ((c + 0.055)/1.055)^2.4
  // 3. L = 0.2126*r + 0.7152*g + 0.0722*b
}

// Ratio per WCAG: (Lmax + 0.05) / (Lmin + 0.05)
function contrastRatio(a: string, b: string): number {
  const La = hslToLuminance(parseHsl(a));
  const Lb = hslToLuminance(parseHsl(b));
  return (Math.max(La, Lb) + 0.05) / (Math.min(La, Lb) + 0.05);
}
```

**WCAG thresholds applied:**
- Body text (4.5:1) — `foreground` vs `background`, `card-foreground` vs `card`, `primary-foreground` vs `primary`, `accent-foreground` vs `accent`.
- Large text (3:1) — opcionalmente em h1/title pairs; este plano usa só body 4.5:1 para simplificar.

#### Tasks
1. RED: 6 testes — pure functions (white/black = 21:1, mid-gray pair ≈ 4.5, identical = 1.0, parseHsl with various inputs).
2. GREEN: implementar `wcag-contrast.ts`.
3. RED: 1 teste de integração — chamar `validateThemeContrast(violetForge)` deve não throw (sabemos que passa).
4. GREEN: implementar `validateThemeContrast` em `validate-quality-gates.ts` que itera o array de built-in themes e checa os 4 pairs × 2 modos.
5. Wire em `main()` do quality-gates.

#### TDD
```
RED:     test_contrast_pure_white_black === 21 (max)
RED:     test_contrast_identical === 1
RED:     test_contrast_mid_gray_pair > 4.5
RED:     test_parseHsl_valid_input
RED:     test_parseHsl_handles_extra_whitespace
RED:     test_parseHsl_strips_percent_signs — "0 0% 100%" parses same as "0 0 100"  (EC-3)
RED:     test_parseHsl_clamps_hue_360 — "360 0% 50%" treated as 0 hue  (EC-3)
RED:     test_parseHsl_achromatic_no_NaN — sat 0% returns finite luminance  (EC-3)
RED:     test_contrast_below_aa_throws_in_gate
GREEN:   Implement parseHsl + hslToLuminance + contrastRatio + validateThemeContrast.
VERIFY:  pnpm test scripts/lib/wcag-contrast
```

#### Acceptance Criteria
- [ ] 9 tests verdes (6 originais + EC-3 robustez parseHsl)
- [ ] `validateThemeContrast` exportado e chamado no main do quality-gates
- [ ] Roda em <50ms em todos themes existentes (3) + futuros (10)

#### DoD
- [ ] `pnpm quality:structure` invoca o novo gate e passa

---

## Phase 2: Vercel theme (Geist-aligned, easiest)

### T2.1 — Criar `src/themes/vercel.ts`

#### Objective
Pattern: copy `aurora-terminal.ts` structure, swap palette. Vercel light = pure white + black + Vercel blue `#0070F3`; dark = pure black + white + blue.

#### Evidence
Geist tokens são canonical (referencia [vercel/geist](https://github.com/vercel/geist)).

#### Files to edit
```
src/themes/vercel.ts — (NEW) Theme object
src/themes/vercel.test.ts — (NEW) 1 shape test + 1 contrast test
```

#### Deep Dives

```ts
export const vercelMono: Theme = {
  name: "vercel-mono",
  label: "Vercel Mono",
  description: "Inspired by, not affiliated with Vercel. Razor-sharp monochrome + signature blue (#0070F3).",
  fonts: { /* same Geist as violetForge */ },
  fontUrls: [/* same */],
  light: {
    background: "0 0% 100%",        // #fff
    foreground: "0 0% 0%",          // #000
    card: "0 0% 100%",
    "card-foreground": "0 0% 0%",
    popover: "0 0% 100%",
    "popover-foreground": "0 0% 0%",
    primary: "212 100% 47%",        // #0070F3 Vercel blue
    "primary-deep": "212 100% 36%",
    "primary-glow": "212 100% 72%",
    "primary-foreground": "0 0% 100%",
    secondary: "0 0% 96%",          // #F5F5F5
    "secondary-foreground": "0 0% 0%",
    accent: "212 100% 47%",         // same as primary — monochrome philosophy
    "accent-deep": "212 100% 36%",
    "accent-foreground": "0 0% 100%",
    muted: "0 0% 96%",
    "muted-foreground": "0 0% 45%",
    border: "0 0% 92%",             // #EBEBEB Geist border
    input: "0 0% 92%",
    ring: "212 100% 47%",
    success: "168 76% 64%",         // #50E3C2 Geist green
    "success-foreground": "0 0% 0%",
    warning: "34 92% 55%",          // #F5A623 Geist warning
    "warning-foreground": "0 0% 0%",
    destructive: "0 100% 47%",      // #EE0000 Geist error
    "destructive-foreground": "0 0% 100%",
    info: "212 100% 47%",
    "info-foreground": "0 0% 100%",
  },
  dark: {
    background: "0 0% 4%",          // #0A0A0A Geist dark
    foreground: "0 0% 93%",         // #EDEDED
    /* ... mirror of light with inverted neutrals + same blue */
  },
};
```

#### Tasks
1. Edit `vercel.ts` with full Theme.
2. Verify contraste 4.5:1 light + dark.
3. RED: shape test (`name === "vercel"`, all 29 keys present).
4. GREEN: implement.

#### TDD
```
RED:     test_vercel_has_all_required_keys — both light + dark have 29 keys
RED:     test_vercel_passes_wcag_contrast — calls validateThemeContrast, no throw
GREEN:   Implement vercel.ts.
VERIFY:  pnpm test src/themes/vercel
```

#### Acceptance Criteria
- [ ] `import { vercel } from "@theokit/ui"` resolve
- [ ] WCAG AA passa em ambos modos

---

## Phase 3: GitHub Dark (Primer tokens)

### T3.1 — Criar `src/themes/github-dark.ts`

#### Objective
Primer tokens for GitHub's standard dark theme.

#### Files to edit
```
src/themes/github-dark.ts — (NEW)
src/themes/github-dark.test.ts — (NEW) 2 tests
```

#### Deep Dives

```ts
export const githubDark: Theme = {
  name: "github-dark",
  label: "GitHub Dark",
  description: "GitHub's standard dark theme. Primer tokens.",
  fonts: { /* Geist (D1) */ },
  light: {
    background: "0 0% 100%",        // GitHub light fallback (Primer "light-default")
    foreground: "210 12% 16%",      // #24292F
    primary: "212 92% 45%",         // #0969DA Primer accent
    /* ... */
  },
  dark: {
    background: "215 28% 7%",       // #0D1117 canvas
    foreground: "210 11% 96%",      // #F0F6FC
    card: "215 21% 11%",            // #161B22 subtle
    "card-foreground": "210 11% 96%",
    primary: "212 92% 58%",         // #2F81F7 accent.fg dark
    "primary-foreground": "0 0% 100%",
    success: "135 53% 49%",         // #3FB950
    warning: "41 100% 47%",         // #D29922
    destructive: "1 90% 62%",       // #F85149
    info: "212 92% 58%",
    /* ... */
  },
};
```

#### Tasks + TDD + AC
Mesmo pattern de T2.1.

---

## Phase 4: Dracula (official MIT)

### T4.1 — Criar `src/themes/dracula.ts`

#### Files to edit
```
src/themes/dracula.ts — (NEW)
src/themes/dracula.test.ts — (NEW)
```

#### Deep Dives

Dracula spec tokens (hex → HSL):
- `background #282A36` → `231 15% 18%`
- `foreground #F8F8F2` → `60 30% 96%`
- `current-line #44475A` → `232 14% 31%`
- `comment #6272A4` → `225 27% 51%`
- `cyan #8BE9FD` → `191 97% 77%`
- `green #50FA7B` → `135 94% 65%`
- `orange #FFB86C` → `31 100% 71%`
- `pink #FF79C6` → `326 100% 74%`
- `purple #BD93F9` → `265 89% 78%`
- `red #FF5555` → `0 100% 67%`
- `yellow #F1FA8C` → `65 92% 76%`

Mapping para Theo ColorScale:
- `background` = dracula background, `foreground` = dracula foreground
- `primary` = pink `#FF79C6` (Dracula signature)
- `accent` = purple `#BD93F9`
- `success` = green, `warning` = yellow, `destructive` = red, `info` = cyan

Light mode: **adaptação original Theo** — upstream Dracula spec é **dark-only** (EC-2). Estratégia:
- bg = `#F8F8F2` (foreground original)
- fg = `#282A36` (background original)
- `primary` precisa ser **darker** que o pink original `#FF79C6` para passar WCAG AA contra branco. Pink `#FF79C6` em branco = contrast 1.9:1 — falha AA. Substituir por `#9D4EDD` (purple shifted darker, contrast ~5.1:1) ou `#C71585` (medium-violet-red, ~4.6:1).
- `accent` mantém purple `#BD93F9` adjusted darker.

JSDoc obrigatório em `src/themes/dracula.ts`:
```ts
/**
 * Note: "light" mode is a Theo-original adaptation. The Dracula upstream
 * spec is dark-only — we darken the signature pink/purple to pass WCAG AA
 * against light backgrounds, sacrificing palette purity for accessibility.
 */
```

---

## Phase 5: One Dark (Atom MIT)

### T5.1 — Criar `src/themes/one-dark.ts`

#### Deep Dives

One Dark tokens:
- `syntax-bg #282C34` → `220 13% 18%`
- `mono-1 #ABB2BF` → `220 14% 71%`
- `hue-1 #56B6C2` (cyan/blue) → `187 47% 55%`
- `hue-2 #61AFEF` (blue accent) → `207 82% 66%`
- `hue-3 #C678DD` (purple) → `286 60% 67%`
- `hue-4 #98C379` (green) → `95 38% 62%`
- `hue-5 #E06C75` (red) → `355 65% 65%`
- `hue-6 #D19A66` (orange) → `29 54% 61%`

`primary` = hue-2 blue, `accent` = hue-3 purple.

Light mode: derived "One Light" upstream — `syntax-bg #FAFAFA`, `mono-1 #383A42`, same hue palette tinted lighter.

---

## Phase 6: Anthropic (claude.ai inspired)

### T6.1 — Criar `src/themes/anthropic.ts`

#### Deep Dives
Sem ref oficial; medições visuais de claude.ai (light mode dominant):

- `background #F9F9F5` (warm cream) → `60 27% 97%`
- `foreground #1A1A1A` → `0 0% 10%`
- `card #FFFFFF` (subtle warmer overlay)
- `primary #C96442` (burnt sienna, same as Theo accent) → `15 54% 53%`
- `accent` cinder-like `#8B5E3C` → `26 39% 39%`
- `border #E8E5DC` → `45 22% 87%`

Dark: `background #1A1A1A`, `foreground #F4F1EB` (cream-white), mantém burnt sienna primary.

---

## Phase 7: OpenAI (chatgpt.com inspired)

### T7.1 — Criar `src/themes/openai.ts`

#### Deep Dives
- `background #FFFFFF` / `#212121` (canvas)
- `foreground #212121` / `#ECECEC`
- `primary #10A37F` (ChatGPT green, doc'd brand color) → `158 82% 35%`
- `accent` neutral charcoal-emphasis
- `border #E5E5E5` / `#404040`

Sem signature secondary color — green é THE color.

---

## Phase 8: Linear (linear.app inspired)

### T8.1 — Criar `src/themes/linear.ts`

#### Deep Dives
- `background #FFFFFF` / `#0F0F12` (linear-canvas)
- `foreground #1C1C1F` / `#E6E6E6`
- `primary #5E6AD2` (indigo-violet) → `233 56% 60%`
- `accent #7B72E0` (lighter violet) → `245 60% 67%`
- `border #ECECEE` / `#2A2A2E`

---

## Phase 9: builtinThemes + barrel + stories

### T9.1 — Update `src/themes/index.ts`

```ts
// Trademark-safe slugs (D1.1): -style / -mono / -glass suffixes.
export { anthropicStyle } from "./anthropic-style.js";
export { openaiStyle } from "./openai-style.js";
export { vercelMono } from "./vercel-mono.js";
export { linearGlass } from "./linear-glass.js";
// OSS / descriptive — unchanged.
export { githubDark } from "./github-dark.js";
export { dracula } from "./dracula.js";
export { oneDark } from "./one-dark.js";

export const builtinThemes = [
  violetForge, classicPaper, auroraTerminal,
  anthropicStyle, openaiStyle, vercelMono, linearGlass,
  githubDark, dracula, oneDark,
];
```

**EC-4 note**: passing the full 10-entry `builtinThemes` triggers ~60 KB CSS injection in `<style id="theo-ui-theme-vars">`. Acceptable but documented in `docs/design-system.md > Theme system` so consumers know to pass `themes={[violetForge, dracula]}` instead when only 1-2 themes are needed.

### T9.2 — Update `src/index.ts` barrel

Re-exports dos 7 novos.

### T9.3 — Atualizar `theme-switcher.stories.tsx`

Adicionar story `AllTenThemes` que renderiza ThemeSwitcher com `themes={builtinThemes}` mostrando todos no dropdown.

### T9.4 — Atualizar `validateDesignSystemFidelity` se necessário

Provavelmente nada — gate atual valida só `violetForge` em `violet-forge.ts`. Mantém.

---

## Phase 10: RFC 0007 + bump

### T10.1 — `docs/rfcs/0007-seven-themes.md`

Status `Implemented`. Lista os 7 com fonte canonical, ADRs D1-D4.

### T10.2 — Update `docs/rfcs/README.md` index

### T10.3 — Bump `0.3.0-next.0` → `0.4.0-next.0`, CHANGELOG entry

### T10.4 — Publish `0.4.0-next.0` to npm

**Pre-condition (EC-5):** confirm npm token autenticado e com `read+write @theokit/*` permission:
```bash
curl -sH "Authorization: Bearer $NPM_TOKEN" https://registry.npmjs.org/-/whoami | jq -r .username
# Must return "usetheodev"
```

Se falhar, parar e pedir refresh do token via `.env` (mesmo padrão do incident no plano faang-density-tightening T6.2).

```bash
NPM_CONFIG__AUTH_TOKEN="$NPM_TOKEN" npm publish --tag next
```

---

## Phase 11: Theming page + Dogfood

### T11.1 — Atualizar `theo-opendocs` para pkg `0.4.0-next.0`

Bump + reinstall + build.

### T11.2 — `<ThemeBuilder>` ganha switcher lista 10 themes

Pequena edit em `theme-builder.tsx`: dropdown abaixo dos color pickers que aplica um built-in theme inteiro ao preview (em vez de só override de primary).

### T11.3 — Deploy production + browse smoke

**Pre-condition (EC-5):** confirm Cloudflare token + IP allowlist:
```bash
curl -sH "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  https://api.cloudflare.com/client/v4/accounts | jq '.success'
# Must return: true
```

Se retornar erro 9109 (IP allowlist) ou 10502 (rate limit), parar e pedir update do token (recorrence em ambos plans anteriores — theming-and-sizes, faang-density).

Validar `docs.usetheo.dev/theoui/theming` mostra 10 themes; switcher funciona; cada um renderiza Button + Card + Input sem visual break.

---

## Coverage Matrix

| # | Gap / Requirement | Task(s) | Resolution |
|---|---|---|---|
| 1 | Só 3 temas built-in | T2.1-T8.1 | 7 novos themes implementados |
| 2 | Sem WCAG contrast gate automatizado | T1.1 | `validateThemeContrast` em `quality-gates` |
| 3 | Fonts duplicadas seriam ~120KB extra | D1 (Geist em todos) | Trade-off documentado |
| 4 | Builtin themes não exposes via barrel | T9.1, T9.2 | Re-exports + array updated |
| 5 | Sem story que demonstre todos | T9.3 | `AllTenThemes` story em Ladle |
| 6 | Decisão não arquivada | T10.1 | RFC 0007 status Implemented |
| 7 | Bundle delta ages | T11.3 (rebase if needed) | quality:bundle aceita ±5% delta |
| 8 | docs.usetheo.dev preview não mostra temas | T11.2 | ThemeBuilder ganha switcher |
| 9 | Consumers atuais em 0.3.x precisam saber | T10.3 (CHANGELOG) | Added section lista 7 |
| 10 | EC-1: trademark naming risk | D1.1 ADR | 4 slugs renomeados com sufixo + disclaimer |
| 11 | EC-2: Dracula light é invenção | T4.1 Deep Dives | JSDoc explica adaptation + primary darkened |
| 12 | EC-3: parseHsl robustez (achromatic, hue overflow, percent) | T1.1 TDD | +3 testes |
| 13 | EC-4: 60 KB CSS payload com builtinThemes | T9.1 + design-system.md | Documentado, alternativa sugerida |
| 14 | EC-5: npm + Cloudflare pre-conditions | T10.4 + T11.3 | Pre-condition checks adicionados |

**Coverage: 14/14 (100%)**

**Edge case review:** `.claude/knowledge-base/reviews/edge-cases/seven-themes-edge-cases-2026-05-22.md` — 5 edges (1 MUST FIX família EC-1 incorporado em D1.1 + T2/6/7/8.1; 2 SHOULD TEST cobertos em T1.1/T4.1; 2 DOCUMENT em T9.1/T10.4/T11.3).

## Global Definition of Done

- [ ] Todas 11 phases completas
- [ ] 7 novos `Theme` exports válidos em runtime (shape check)
- [ ] WCAG AA contrast passa em todos 10 temas × 2 modos × 4 pairs (80 checks)
- [ ] `pnpm quality:gates` exit 0
- [ ] RFC 0007 status `Implemented`
- [ ] CHANGELOG entry `[0.4.0-next.0]`
- [ ] **Dogfood QA PASS** — live deploy mostra 10 themes no `<ThemeBuilder>`
- [ ] **Runtime-metric proof** — N/A (apenas data, sem counter)

## Final Phase: Dogfood QA (MANDATORY)

### Execution
1. `pnpm quality:gates` (theo-ui) exit 0
2. `pnpm types:check` (theo-opendocs) exit 0
3. `pnpm pages:build` exit 0; output contém 10 themes
4. Deploy via `wrangler pages deploy out`
5. Browse smoke: `https://docs.usetheo.dev/theoui/theming/` — switcher mostra 10 entries; click em `dracula` recolora preview (Button vira pink, Card escurece); click em `vercel` (preview vira branco/preto com blue Button); switch para `anthropic` (cream + burnt sienna)
6. `npm publish --tag next` publica `@theokit/ui@0.4.0-next.0`
7. `npm view @theokit/ui versions` mostra `0.4.0-next.0` na lista

### Acceptance Criteria
- [ ] Health score >= 70/100
- [ ] Zero CRITICAL issues introduzidos
- [ ] Live preview switcher funcional em produção
- [ ] Registry npm reflete `0.4.0-next.0`

### If Dogfood Fails
1. Identify regressão (visual / typecheck / publish)
2. Fix on the affected phase
3. Re-run dogfood

---

## Notas de execução

- **Order matters somewhat**: Phase 1 (gate) antes de Phase 2-8 — garante que cada theme criado já é validado on creation.
- **Phases 2-8 são independentes em arquivos** — execução paralela é viável em practice. Mantido sequencial para clareza do plan.
- **Bundle delta** — esperado ~14 KB barrel + ~60 KB CSS injection se consumer importa todos. Rebase `scripts/baselines/bundle-sizes.json` em T9.1 ou T11.3.
- **Backwards-compat** — zero. Public API só ganha exports. Visual default permanece `violet-forge`. Consumers em 0.3.x não veem diff até passarem explicitamente um novo theme.
