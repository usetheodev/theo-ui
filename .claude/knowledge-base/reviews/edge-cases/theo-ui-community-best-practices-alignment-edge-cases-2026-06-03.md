# Edge Case Review — theo-ui-community-best-practices-alignment

**Data:** 2026-06-03
**Plano:** `.claude/knowledge-base/plans/theo-ui-community-best-practices-alignment-plan.md`
**Tasks analisadas:** 27 (T0.1, T0.2, T1.1-T1.4, T2.1-T2.8, T3.1-T3.4, T4.1-T4.3, T5.1-T5.5, T6.1-T6.5)
**Edge cases encontrados:** 17 (MUST FIX: 7, SHOULD TEST: 6, DOCUMENT: 4)

## MUST FIX

### EC-1: Font async loading torna screenshots flaky
- **Task afetada:** T0.1
- **Família:** Timing
- **Cenário:** Playwright tira screenshot antes do `<link rel="stylesheet">` do Geist (CDN Google Fonts) terminar de carregar. Resultado: snapshot baseline ora com fallback `-apple-system`, ora com Geist. Cross-run inconsistency.
- **Impacto:** Visual gate falsamente vermelho, ou falsamente verde se baseline foi gerado no estado errado. Bloqueia PRs por causa de fonte.
- **Fix sugerido:** Em `tests/visual/theme-matrix.spec.ts`, `await page.evaluate(() => document.fonts.ready)` antes de cada `toHaveScreenshot()`. Adicionar à T0.1 tasks como step explícito.

### EC-2: Animations rodando durante screenshot
- **Task afetada:** T0.1
- **Família:** Timing
- **Cenário:** `--animate-pulse-glow` 1.5s loop, `--animate-fade-in-up` 200ms entrance — captura no meio gera frame intermediário. Re-run captura outro frame.
- **Impacto:** Pixel diff > threshold inerente, snapshots renegerados a cada run.
- **Fix sugerido:** `playwright.config.ts` setar `use: { animations: 'disabled' }` (Playwright nativo — pausa todas as animations + transitions via CSS injection). Já incluído em T0.1 task list como step explícito.

### EC-3: HSL split sem `hsl()` wrapper não é parseável por culori
- **Task afetada:** T0.2, T2.2
- **Família:** Format
- **Cenário:** culori espera `"hsl(262 83% 58%)"`. `ColorScale` armazena `"262 83% 58%"` (split puro, designed para ser interpolado em `hsl(var(--x))`). `parseColor("262 83% 58%")` retorna `undefined`.
- **Impacto:** WCAG contrast auditor (T0.2) lê todos os tokens como `undefined` → ratios todos NaN → script crasha ou passa silenciosamente todo theme. OKLCH migration (T2.2) converte vazio.
- **Fix sugerido:** Em `scripts/lib/color.ts`, wrapper helper `parseColorScaleValue(raw: string): Color` que detecta HSL split (regex `^\d+\s+\d+%\s+\d+%$`) e prepend `hsl(`. Adicionar ao escopo de T2.1.

### EC-4: Migration script confunde declaração de cor com uso em `--shadow-*`
- **Task afetada:** T2.3
- **Família:** Format
- **Cenário:** `tokens.css` linha 99: `--shadow-sm: 0 1px 2px 0 hsl(var(--foreground) / 0.06);`. Script regex-based "converter hsl → oklch" mata isso: vira `oklch(var(--foreground) / 0.06)` que é sintaxe inválida (oklch precisa de L C H args, não var direto sem `from`).
- **Impacto:** Shadows quebram em todos os themes pós-migração. Visual gate detecta, mas implica rollback de T2.3 inteiro.
- **Fix sugerido:** Em `scripts/migrate-themes-to-oklch.ts`, converter SÓ linhas que matcham `--[a-z-]+:\s*<HSL-split-value>;` (declaração de token de cor pura). Pular linhas que contém `hsl(var(--x) / ...)` (uso em shadows/utilities). Refactor T2.5 já faz as utilities manualmente — escopo correto.

### EC-5: `COLOR_VALUE_PATTERN` regex rejeita `oklch(from ... calc(...) ...)`
- **Task afetada:** T2.5, T3.1
- **Família:** Format
- **Cenário:** Regex atual `theme-provider.tsx:58` aceita `oklch(...)` mas conteúdo interno é `[\d.\s%,/+\-]+` — proíbe palavras (`from`, `l`, `c`, `h`) e parênteses aninhados (`var(`, `calc(`). Após T3.1, `tokens.css` declara `--primary-deep: oklch(from var(--primary) calc(l - 0.16) c h)` — quando consumer chama `registerTheme()` com esse mesmo string, validação throws em dev e bloqueia em prod.
- **Impacto:** Themes externos custom usando relative color syntax quebram. Built-in themes OK porque escrevem direto no CSS (não passam pelo runtime validator) — mas plano de migração (T3.3) "themes mais enxutos" pressupõe ausência desses valores; consumers que migrem temas próprios batem na regex.
- **Fix sugerido:** Estender regex para aceitar conteúdo OKLCH com nested parens + palavras seguras. Pattern proposto (testar antes de commit):
  ```
  oklch\(\s*(?:from\s+var\(--[a-zA-Z0-9-]+\)\s+)?(?:calc\([^();{}]+\)|[a-z]|[\d.]+%?|none|\/)+(?:\s+(?:calc\([^();{}]+\)|[a-z]|[\d.]+%?|none|\/)+)*\s*\)
  ```
  Continua banindo `;`, `{`, `}`, `url(`. T2.5 task explicita a nova regex (atualizada no plano).

### EC-6: Bundle delta Zod otimista — schema é ~12KB gzipped, não 3KB
- **Task afetada:** T2.7
- **Família:** Resource
- **Cenário:** Plano diz "+~3KB gzipped" para Zod lazy-import. Realidade: Zod core é ~12KB gzipped (medido shadcn-ui consumer bundle 2026). Dynamic import só funciona em paths assíncronos; `ThemeProvider` constructor é sync — schema fica eager.
- **Impacto:** Bundle gate `quality:bundle` (350KB budget) falha com +12KB; consumer paga sem opt-out.
- **Fix sugerido:** Dois caminhos não-exclusivos:
  1. **Dev-only validation**: schema só executa quando `IS_DEV` (já existe constante). Production keeps regex-only. Adicionar `import.meta.env.PROD ? skipSchema : runSchema` (build tree-shakes).
  2. **Alternativa leve**: substituir Zod por `valibot` (~1.5KB gzipped, same parse API).
  Atualizar D5 + T2.7 com a escolha. Atualizar o budget se necessário (com aprovação explícita).

### EC-7: `oklch(from var(--primary) calc(l - 0.16))` clipa em themes muito dark
- **Task afetada:** T3.1
- **Família:** Boundary
- **Cenário:** Theme `aurora-terminal` (ou outro dark-first com primary L baixo, ex L=0.45). `calc(l - 0.16)` = 0.29 — OK. Mas em theme hipotético com primary L=0.12, calc = -0.04 — browser clipa a 0 (preto puro). `primary-deep` perde diferenciação contra preto puro do background.
- **Impacto:** Pressed states de buttons em themes dark ficam invisíveis. Não é crash, mas é regressão visual silenciosa.
- **Fix sugerido:** Em T3.1, usar `max(0.05, calc(l - 0.16))` em vez de `calc(l - 0.16)`. Ou per-theme override formula (theme.ts campo `derivations?: { 'primary-deep'?: string }`). Optar por `max()` primeiro (KISS), per-theme override se necessário pós-validação visual.

---

## SHOULD TEST

### EC-8: Lint rule regex precisa cobrir variantes Tailwind
- **Task afetada:** T1.3
- **Teste sugerido:** `literal-color-scanner.test.ts` adicionar casos:
  - `border-l-red-500` (directional) → MATCH
  - `data-[state=open]:bg-emerald-500` (state variant) → MATCH
  - `hover:bg-amber-500` (pseudo-class) → MATCH
  - `md:dark:text-blue-500` (responsive + dark) → MATCH
  - `bg-primary-foreground` (semantic com sufixo) → NO MATCH
  - `[&_svg]:text-emerald-500` (arbitrary selector) → MATCH

### EC-9: Template literal bypass não é detectado
- **Task afetada:** T1.3
- **Teste sugerido:** `literal-color-scanner.test.ts`:
  - Test caso `` const klass = `bg-${color}-500`; `` — scanner NÃO matcha (interpolação). Documentar como limitação aceita; adicionar regra biome separada se virar problema real (medir frequência primeiro). NOT a fix; é teste para confirmar limitação conhecida.

### EC-10: Alpha modifier em tokens semânticos com Tailwind v4
- **Task afetada:** T1.2
- **Teste sugerido:** Smoke spec verificando que `bg-status-online/10` renderiza com 10% alpha em todos os 10 themes. Tailwind v4 alpha em arbitrary CSS custom properties requer formato específico — pode falhar silenciosamente sem teste. Adicionar `run-status-pill.test.tsx` assertion via `getComputedStyle().backgroundColor` parsing alpha component.

### EC-11: WCAG contrast com cores que têm alpha
- **Task afetada:** T0.2
- **Teste sugerido:** `wcag-contrast.test.ts` adicionar fixture: `--status-online` em uso `bg-status-online/10` sobre `bg-card`. Background composto = `card * 0.9 + status-online * 0.1`. Asserir que a fórmula efetua a composição antes do ratio. Sem isso, auditor passa pares "puros" mas componentes reais com alpha podem regredir.

### EC-12: `matchMedia` listener leak em unmount
- **Task afetada:** T5.1
- **Teste sugerido:** `theme-provider.test.tsx`: render → unmount → asserir que `matchMedia('(prefers-color-scheme: dark)').removeEventListener` foi chamado. Sem cleanup, micro-frontends que mount/unmount provider repetidamente vazam listeners.

### EC-13: Snapshot determinism cross-OS
- **Task afetada:** T0.1, T5.3
- **Teste sugerido:** Documentar em `playwright.config.ts` que snapshots são gerados ONLY em Docker image `mcr.microsoft.com/playwright:v1.49.0-jammy` (pinned tag). Adicionar `package.json` script `quality:visual:docker` que wrappa `docker run` para devs locais regenerarem em paridade com CI. Sem isso, baseline gerado em macOS bate diff em CI Linux.

---

## DOCUMENT

### EC-14: APCA vs WCAG 2.x escolha consciente
- **Risco aceito:** WCAG 2.x relative luminance é equação datada (1998); APCA (WCAG 3 draft) é matematicamente superior para dark themes. Adotamos WCAG 2.x AA porque é o standard ratifiable hoje. Documentar em ADR-0010 (proposto) ou adendo ao D10: "WCAG 2.x AA gate atual; APCA revisão Q4 2026 quando WCAG 3 estabilizar".

### EC-15: forced-colors mode perde semântica de status
- **Risco aceito:** WHCM (Windows High Contrast Mode) define `Highlight`, `CanvasText`, `ButtonText` — sem `Success`/`Error`/`Warning`. Mapear `--status-online` para `Highlight` faz online + active selection ficarem indistinguíveis. WCAG aceita; users WHCM já confiam em texto + icone, não cor. Documentar em ADR-0008 (T6.3).

### EC-16: HSL→OKLCH não-lossless por arredondamento
- **Risco aceito:** Float precision em conversão HSL → linear → OKLCH → string com 3 decimais introduz delta ~0.001 L. Visual diff esperado < 0.5% pixel — abaixo do threshold `0.001` configurado em T0.1. Documentar em CHANGELOG: "color values rounded to 3 decimals OKLCH; visually equivalent (< 0.5% pixel diff per theme)".

### EC-17: MetricCard trend semantics (up=good is arbitrary)
- **Risco aceito:** `up: success / down: destructive` é correto para Revenue/Users; INVERTIDO para Cost/Churn. Plano replica shadcn pattern. Consumer override via prop `invertTrend?: boolean` mencionar em JSDoc se simples; senão DOCUMENT como limitação intencional. Atualizar T4.2 task list para adicionar prop opcional `invertTrend`.

---

## Padrões Sistêmicos Detectados

| Padrão | Encontrado? | Onde |
|--------|-------------|------|
| Implemented but not wired | Não | — |
| Correct code in wrong place | Sim (suspeito) | T4.1 inverte composite→primitive hierarchy; precisa explicitar que primitive permanece, composite consome |
| Project name vs ID | N/A | Domain não tem |
| ArgoCD/GitOps padrões | N/A | UI library |
| Multi-cell | N/A | UI library |
| Format mismatch (HSL split vs hsl() wrapper) | Sim | EC-3 — culori não parseia split sem wrapper |
| Validação muito restritiva bloqueia uso legítimo | Sim | EC-5 — regex CSP rejeita OKLCH relative syntax |
| Bundle size otimismo | Sim | EC-6 — Zod 12KB não 3KB |

---

## Resumo

| Task | Edges encontrados | MUST FIX | SHOULD TEST | DOCUMENT |
|------|-------------------|----------|-------------|----------|
| T0.1 | 3 | 2 (EC-1, EC-2) | 1 (EC-13) | 0 |
| T0.2 | 3 | 1 (EC-3) | 1 (EC-11) | 1 (EC-14) |
| T1.1 | 0 | 0 | 0 | 0 |
| T1.2 | 1 | 0 | 1 (EC-10) | 0 |
| T1.3 | 2 | 0 | 2 (EC-8, EC-9) | 0 |
| T1.4 | 0 | 0 | 0 | 0 |
| T2.1 | 1 | 1 (EC-3) | 0 | 0 |
| T2.2 | 1 | 1 (EC-3) | 0 | 0 |
| T2.3 | 1 | 1 (EC-4) | 0 | 0 |
| T2.4 | 1 | 0 | 0 | 1 (EC-16) |
| T2.5 | 1 | 1 (EC-5) | 0 | 0 |
| T2.6 | 0 | 0 | 0 | 0 |
| T2.7 | 1 | 1 (EC-6) | 0 | 0 |
| T2.8 | 0 | 0 | 0 | 0 |
| T3.1 | 1 | 1 (EC-7) | 0 | 0 |
| T3.2 | 0 | 0 | 0 | 0 |
| T3.3 | 0 | 0 | 0 | 0 |
| T3.4 | 0 | 0 | 0 | 0 |
| T4.1 | 1 (composite/primitive hierarchy) | 1 (incorporated as task note) | 0 | 0 |
| T4.2 | 1 | 0 | 0 | 1 (EC-17) |
| T4.3 | 0 | 0 | 0 | 0 |
| T5.1 | 1 | 0 | 1 (EC-12) | 0 |
| T5.2 | 1 | 0 | 0 | 1 (EC-15) |
| T5.3 | 1 | 0 | 1 (EC-13) | 0 |
| T5.4 | 0 | 0 | 0 | 0 |
| T5.5 | 0 | 0 | 0 | 0 |
| T6.x | 0 | 0 | 0 | 0 |

**Veredicto:** PLANO PRECISA DE AJUSTE — 7 MUST FIX absorber antes de implementação. Após ajustes (T0.1+T0.2+T2.1+T2.3+T2.5+T2.7+T3.1+T4.1), plano vira shippable.
