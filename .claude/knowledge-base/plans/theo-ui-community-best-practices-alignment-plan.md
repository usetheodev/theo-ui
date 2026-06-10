# Plan: Alinhamento do `@theokit/ui` às Best Practices da Comunidade

> **Version 1.1** — Migrar o `@theokit/ui` (theo-ui, Violet Forge) das suas escolhas legacy (HSL split, derivações manuais, anti-patterns de cor literal não-detectados) para o estado-da-arte adotado pela comunidade Tailwind v4 + shadcn/ui 2024-2026: OKLCH como formato único, derivações algorítmicas de tonal scale via `oklch(from ...)`, lint rules barrando cor literal Tailwind no source, status tokens semânticos consolidados, schema validation Zod, visual regression Playwright, suporte a `forced-colors` (WHCM), `prefers-color-scheme` auto-detect e `light-dark()` CSS function. **Resultado esperado**: zero código consumindo cor literal; copy-paste de novos componentes shadcn upstream sem conversão manual; theme switching propaga 100% das cores corretamente em todos os 11 themes built-in; lint impede regressão permanentemente.

## Context

### Estado atual (auditoria 2026-06-03)

- **11 themes built-in** (`violet-forge`, `classic-paper`, `aurora-terminal`, `anthropic-style`, `openai-style`, `dracula`, `github-dark`, `linear-glass`, `one-dark`, `vercel-mono`) — todos em HSL split format (`"262 83% 58%"`).
- **29 ColorScale keys × 2 modes (light + dark)** = 58 valores por theme × 11 = **638 valores HSL** a converter.
- **shadcn upstream migrou para OKLCH em set/2024** (Tailwind v4 era). Componentes copy-paste de `ui.shadcn.com/v4/...` agora requerem conversão manual para o formato HSL do theo-ui — friction recorrente.
- **12 violações comprovadas de cor literal Tailwind no source** (`grep` em `src/components/**/*.tsx` excluindo `.test.` e `.stories.`):
  - `gateway-status-indicator.tsx:28,33,38,43` — `bg-emerald-500`, `bg-red-500`, `bg-amber-500`, `bg-blue-500`
  - `run-status-pill.tsx:56,71` — `border/bg/text-emerald-500/{40,10,600}`, `border/bg/text-amber-500/{40,10,600}`
  - `update-banner.tsx:44` — `border/bg/text-amber-500/{40,10,700}`
  - `stability-bundle-viewer.tsx:44,49` — `text-amber-600`, `text-blue-600`
  - **Hidden bug**: estes componentes ignoram o theme ativo. Switch para `aurora-terminal` ou `dracula` ainda renderiza `#10B981` (emerald-500) hardcoded onde deveria respeitar o token semântico `--success` do theme.
- **Tokens semânticos `--success/--warning/--destructive/--info` já existem** em `tokens.css:61-68` — os 12 usos acima poderiam apenas trocar para `bg-success`, `bg-warning`, etc., e o bug some.
- **Sem lint rule** prevenindo regressão: `biome.json` tem `useSortedClasses` mas nada que barre `bg-(red|emerald|amber|...)-\d+`.
- **Sem Playwright/visual regression**: único `playwright.config.ts` no projeto está em `referencia/ai-sdk-core/...` (não consumido). Theme switching não tem snapshot baseline.
- **`primary-deep` e `primary-glow` mantidos à mão** em cada theme (3 valores) — `oklch(from var(--primary) calc(l - 0.16) c h)` derivaria automaticamente, eliminando 22 valores × 2 modes = 44 entries duplicadas nos 11 themes.
- **CSP validation no `ThemeProvider`** usa regex allowlist (`COLOR_VALUE_PATTERN` em `theme-provider.tsx:58-59`). Para themes vindos de CMS/feature flags isso é frágil — Zod schema com `safeParse` é o pattern moderno.
- **ColorScale interface tem 29 keys mandatórios** (`types.ts:12-39`). Adicionar status tokens (`--status-online`, etc.) ou novos semânticos vira breaking change sem `defineTheme()` que faz merge com defaults — já existe (RFC 0005) mas precisa estender.
- **Sem `forced-colors` media query** (Windows High Contrast Mode) — WCAG 2.2 SC 1.4.1 fails em consumers enterprise (Microsoft, gov).
- **Sem `prefers-color-scheme` auto-detect**: `ThemeProvider` `defaultMode="dark"` é hardcoded; respeitar a preferência OS é o pattern padrão (Next.js, Linear, GitHub, Vercel).
- **`light-dark()` CSS function** (CSS Color 5, ~94% browser support 2026) permite eliminar duplicação `light: {...}` / `dark: {...}` no CSS para tokens que apenas trocam por modo.

### Evidência adicional

- RFC 0005 (theming-and-sizes) já estabeleceu `defineTheme(partial)` + `hex()`/`rgb()` helpers. Direção arquitetural compatível; apenas precisamos estender (não substituir).
- RFC 0007 (seven-themes) cobriu lift de 3 → 10 themes, mas não tocou formato de cor — escolha original HSL preservada por inércia.
- Comunidade: shadcn/ui (PR #4773 set/2024), Radix Colors (set/2024), Tailwind v4 (out/2024 stable), Linear, Vercel — todos OKLCH-first em 2026.

## Objective

**Definição de "done"**: nenhum componente em `src/**/*.tsx` consome cor literal Tailwind (`bg-emerald-500` etc.); 100% dos 11 themes built-in expressos em OKLCH; lint rule barra regressão; tonal scale (`primary-deep`, `primary-glow`) derivado algoritmicamente via `oklch(from var(--primary) ...)` em CSS puro; theme switching valida visualmente via Playwright snapshot em CI; suporte first-class a `forced-colors`, `prefers-color-scheme` auto-detect e `light-dark()`; schema Zod substitui regex allowlist.

Goals mensuráveis:

1. **Anti-pattern zero**: `grep -rE 'bg-(red|blue|green|emerald|amber|indigo|orange|pink|sky|cyan|teal|lime|yellow|fuchsia|rose|violet|purple|slate|gray|zinc|neutral|stone)-\d+' src/components` retorna 0 matches (excluindo test/stories).
2. **OKLCH 100%**: `grep -rE '\d+\s+\d+%\s+\d+%' src/themes/*.ts src/styles/tokens.css` retorna 0 HSL split matches.
3. **Lint rule ativa**: `pnpm quality:gates` falha quando cor literal é introduzida em qualquer arquivo de componente (regressão proof).
4. **Visual regression CI gate**: Playwright snapshot de 10 themes × 2 modes × N páginas curadas roda em `pnpm quality:gates`; diff > 0.1% bloqueia merge.
5. **Tonal derivation**: `--primary-deep` e `--primary-glow` declarados via `oklch(from var(--primary) ...)` em `tokens.css`; campos correspondentes removidos de `ColorScale` (ou tornados opcionais como override).
6. **`prefers-color-scheme` respeitado**: novo `ThemeProvider` prop `respectSystemMode?: boolean` (default `true`) detecta `(prefers-color-scheme: dark)` na hidratação inicial quando consumer não fixou modo.
7. **`forced-colors` suportado**: tokens.css declara `@media (forced-colors: active)` block mapeando para `CanvasText`, `Canvas`, `LinkText`, `Highlight`, `ButtonText` system colors.
8. **Zod schema** valida themes em `registerTheme()`; mantém regex allowlist como segundo nível de defesa (defense-in-depth).
9. **WCAG AA contrast automatizado**: novo script `quality:contrast` valida pares fg/bg de cada theme contra WCAG 2.2 AA (4.5:1 texto normal, 3:1 texto grande); falha CI se algum theme regredir.
10. **Documentação atualizada**: novo ADR sobre cor-literal proibida; ADR sobre OKLCH; ADR sobre derivação algorítmica; ADR sobre forced-colors; ADR sobre prefers-color-scheme.

## ADRs

### D1 — OKLCH como formato único de cor em tokens

**Decisão**: migrar 100% dos tokens de cor de HSL split (`"H S% L%"` consumido via `hsl(var(--x))`) para OKLCH (`oklch(L C H)` direto). Eliminar a indireção HSL.

**Rationale**:
- Comunidade convergiu: shadcn/ui (set/2024), Radix Colors (set/2024), Tailwind v4 (out/2024 stable). Copy-paste cross-projeto vira zero-friction.
- Perceptualmente uniforme: variar L produz variação igual de brilho percebido (HSL não tem essa propriedade — `hsl(60 100% 50%)` amarelo "parece" mais brilhante que `hsl(240 100% 50%)` azul com mesmo L=50%).
- Habilita `color-mix(in oklch, ...)` perceptualmente correto e `oklch(from ...)` para derivações.
- Suporte: 94%+ browsers (caniuse 2026-06). Para o ~6% legacy, polyfill via `@supports not (color: oklch(0 0 0))` com fallback HSL gerado automaticamente.

**Consequences**:
- Habilita D2 (tonal derivation algorítmica).
- Quebra `COLOR_VALUE_PATTERN` regex em `theme-provider.tsx` (precisa ampliar — já aceita oklch, validar coverage).
- `hex()`/`rgb()` helpers passam a retornar string `oklch(L C H)` em vez de `"H S% L%"`. Mantemos versão legacy `hexToHsl()`/`rgbToHsl()` deprecated por 1 minor para consumers downstream.
- Quebra: themes externos registrados via `registerTheme()` que ainda usam HSL split. Mitigação: ColorScale aceita union de strings com normalização automática + warn em dev.

### D2 — Tonal scales (`-deep`, `-glow`) derivados via `oklch(from ...)`

**Decisão**: declarar `--primary-deep` e `--primary-glow` em `tokens.css` usando relative-color syntax `oklch(from var(--primary) calc(l - X) c h)`. Remover esses campos de `ColorScale` (ou marcar opcionais como override por theme).

**Rationale**:
- Hoje cada um dos 11 themes mantém 3 valores `primary`/`primary-deep`/`primary-glow` à mão. 11 × 2 modes × 2 derivados = 44 entries duplicadas e propensas a desalinhamento.
- `oklch(from ...)` é nativo Chrome 119+, Safari 16.4+, Firefox 128+ (~92% globally 2026-06). Caniuse mostra suficiente para CI gate; legacy fallback via `@supports`.
- Material 3 + Radix Colors usam tonal scales algorítmicas — pattern dominante.

**Consequences**:
- Themes ficam ~22% menores (44 entries removidas em 11 themes).
- Consumer que QUER override mantém capacidade via `defineTheme({ light: { 'primary-deep': '...' } })` — campos viram `Partial<ColorScale>` opcional.
- Quebra requer migration codemod (rodada por `theokit upgrade-theme`).

### D3 — Lint rule barra cor literal Tailwind no source

**Decisão**: adicionar validação em `scripts/validate-quality-gates.ts` que falha quando encontra padrões `\b(bg|text|border|ring|fill|stroke|from|to|via|outline|divide|shadow|accent|caret|decoration|placeholder)-(red|blue|green|emerald|amber|indigo|orange|pink|sky|cyan|teal|lime|yellow|fuchsia|rose|violet|purple|slate|gray|zinc|neutral|stone)-\d+` em `src/**/*.{ts,tsx}` excluindo `*.test.*`, `*.stories.*`, `tests/fixture-*/`.

**Rationale**:
- Bug real comprovado: 12 ocorrências em 4 arquivos quebram theme switching.
- Single-file regex validator (~50 LoC) é low-cost, runtime <100ms — não justifica plugin biome customizado.
- Whitelist por path > whitelist por palavra: testes precisam de cores literais para assertions; fixtures de shadcn install reproduzem upstream verbatim.

**Consequences**:
- 12 violações atuais bloqueiam green build até serem corrigidas em T1.2.
- Adoção downstream consistente: ADR-0004 referenciado em `CONTRIBUTING.md`.
- Falsos positivos esperados: `bg-primary-foreground` NÃO matcha (`-foreground` não é número). Validado por testes do próprio validator.

### D4 — Status tokens semânticos como segundo grupo

**Decisão**: criar quarteto `--status-online`, `--status-offline`, `--status-degraded`, `--status-info` em `ColorScale`, separados de `--success/--destructive/--warning/--info`. Status colors descrevem **estado operacional** (componente vivo/morto/degradado); semantic colors descrevem **resultado/severidade de ação** (operação bem-sucedida/falhou/atenção).

**Rationale**:
- Separação atual mistura: `gateway-status-indicator` usa `success` para "online" (semântica torta — "online" não é sucesso de uma ação, é estado).
- shadcn/Radix não tem esse split (limitação deles). Linear, Vercel, GitHub têm grupos separados.
- 4 tokens × 2 modes × 11 themes = 88 valores adicionais. Pequeno custo, semântica significativamente mais limpa.

**Consequences**:
- `ColorScale` ganha 4 keys × 2 (incluindo `-foreground`) = 8 keys novas. Total: 29 → 37.
- `defineTheme()` precisa popular defaults razoáveis a partir de `success`/`destructive`/`warning`/`info` para consumers que não declararem (backward compat).
- Refactor de `gateway-status-indicator` + `run-status-pill` + `update-banner` para consumir os novos tokens.

### D5 — Schema Valibot substitui regex allowlist para validação de theme

**Decisão** (revisada pós edge-case review, EC-6): introduzir `themeSchema` **Valibot** em `src/themes/schema.ts`. `ThemeProvider` + `registerTheme()` invocam `v.safeParse(themeSchema, theme)`. Falha em dev = throw; produção = warn + skip do theme. Regex allowlist (T2.5 expandida) permanece como segunda camada de defesa contra CSS injection.

**Rationale**:
- Regex monolítico difícil de evoluir e auditar.
- **Por que Valibot e não Zod** (mudança vs draft inicial): Zod core é ~12KB gzipped + `ThemeProvider` constructor é síncrono — dynamic import não permite tree-shake. Valibot core é ~1.5KB gzipped com API equivalente (`safeParse`, schemas modulares por `import`, peer-friendly). Para o use case "validar shape + tipos de input simples" Valibot é estritamente superior em bundle size.
- Permite mensagens de erro estruturadas: "theme 'xyz' field 'light.primary' invalid: expected color value, got '...'".

**Consequences**:
- +~2.5KB gzipped ao bundle de `@theokit/ui/themes` (Valibot core + schema) — verificável via `quality:bundle` antes/depois.
- Mantém regex em paralelo (defense in depth contra CSS injection — Valibot valida shape, regex valida valor seguro para CSS interpolation).
- Valibot é nova devDep direta de `@theokit/ui` (não compartilhada com SDK que usa Zod). Aceitável: bundle delta justifica.

### D6 — `prefers-color-scheme` respeitado por default

**Decisão**: novo prop `respectSystemMode?: boolean` em `ThemeProvider`, default `true`. Quando consumer não passa `defaultMode` explícito, ler `window.matchMedia('(prefers-color-scheme: dark)').matches` na hidratação. Subscriber para mudanças em runtime quando consumer não fixou `setMode()` manualmente.

**Rationale**:
- Pattern padrão Linear, Vercel, GitHub, Next.js theme libs.
- WCAG 1.4.13 + WAI-ARIA APG recomenda.
- Hoje `defaultMode="dark"` força dark em 100% dos consumers que não sabem do opt-in.

**Consequences**:
- Breaking sutil: consumers que esperavam dark sempre agora veem light em sistemas light-mode. Mitigação: prop `defaultMode` continua funcionando como override absoluto; ADR + CHANGELOG entry destacam.
- Requer atualizar `ThemeScript` (SSR no-flash) para também ler matchMedia antes da hidratação.

### D7 — `forced-colors` (WHCM) first-class support

**Decisão**: bloco `@media (forced-colors: active)` em `tokens.css` mapeando tokens para system colors: `--background: Canvas`, `--foreground: CanvasText`, `--primary: Highlight`, `--primary-foreground: HighlightText`, `--border: ButtonBorder`, etc. Aplicar override `forced-color-adjust: none` apenas em elementos decorativos (gradients de hero, glow shadows).

**Rationale**:
- WCAG 2.2 SC 1.4.1 (Use of Color) + SC 1.4.3 (Contrast) — bloqueia adoção em gov/enterprise sem isso.
- Microsoft documentation pattern padrão (forced-colors media query).
- Custo: ~1 bloco CSS de ~30 linhas. Zero JavaScript.

**Consequences**:
- Themes ficam acessíveis em Windows High Contrast Mode sem mudança de código no consumer.
- Decorative components (texture utilities `.bg-dotted-violet`, `.bg-hero-glow`) precisam `forced-color-adjust: none` para preservar identidade.

### D8 — `light-dark()` CSS function como pattern emergente (deferred, documentado)

**Decisão**: NÃO usar `light-dark()` neste plano. Documentar como follow-up pendente Q4 2026.

**Rationale**:
- `light-dark()` requer `color-scheme` declarado em `:root` + ainda não temos cobertura completa (Safari 17.5+, Firefox 120+, Chrome 123+; ~88% global 2026-06).
- Estratégia atual `data-theme="<name>"` + `.dark` class é mais flexível (suporta theme switch além de modo).
- Plan permanece focado; benefício marginal vs custo de migration.

**Consequences**:
- `tokens.css` permanece com `:root` + `.dark` overrides. Sem regressão.
- Documentar em RFC 0010 (proposto) para revisão pós-Q4 2026.

### D9 — Visual regression Playwright como CI gate

**Decisão**: introduzir `tests/visual/` com Playwright + `expect(...).toHaveScreenshot()` snapshot de 5 páginas curadas (chat-message, dashboard, command-palette, agent-stream, deployment-row) × 10 themes × 2 modes = 100 snapshots. Rodar em `quality:visual` integrado a `quality:gates`.

**Rationale**:
- OKLCH migration é high-risk visualmente. Sem snapshot baseline, não há prova objetiva de equivalência.
- Padrão indústria: Storybook + Chromatic (closed-source), Ladle + Playwright (open). Já temos Ladle.
- 100 snapshots × ~30KB cada = ~3MB no repo — aceitável para PR review (LFS opcional se crescer).

**Consequences**:
- Setup inicial ~2h (Playwright config + matrix gen + base snapshots).
- CI runtime +~2min (paralelizado entre 4 workers).
- Falsos positivos com font rendering diff Linux vs macOS — solução padrão: rodar apenas em container Docker pinado.

### D10 — WCAG AA contrast validator automatizado

**Decisão**: novo script `scripts/validate-contrast.ts` que carrega cada theme, computa pares fg/bg críticos (`background↔foreground`, `card↔card-foreground`, `primary↔primary-foreground`, etc.), calcula ratio via fórmula WCAG 2.x relative luminance, falha se < 4.5:1 (texto normal) ou < 3:1 (texto grande UI).

**Rationale**:
- Hoje themes adicionados (especialmente Dracula light mode — explicitly "Theo-adapted for WCAG AA") confiam em revisão manual.
- WCAG é teste automatizável; deveria ser CI gate, não checklist.
- Custo: ~80 LoC + dep `culori` (já adicionada em D1 conversão).

**Consequences**:
- Themes que falharem o gate bloqueiam merge. Auditoria inicial pode revelar 1-2 themes com pares no limite.
- Foundation para futuro `quality:a11y:contrast` expandido (testar TODAS as combinações reais usadas, não só semantic pairs).

## Dependency Graph

```
Phase 0 (Baselines, non-destructive)
  T0.1 Visual regression baseline ─┐
  T0.2 Contrast auditor           ─┤
                                   │
                                   ▼
Phase 1 (Anti-pattern fix + lint, IMMEDIATE)
  T1.1 Status tokens ─▶ T1.2 Sweep ─▶ T1.3 Lint rule ─▶ T1.4 ADR-0004
                                                              │
                                                              ▼
Phase 2 (OKLCH migration, parallel-safe with P1)
  T2.1 culori dep
       ▼
  T2.2 HSL→OKLCH script
       ▼
  T2.3 Convert tokens.css ─┬─▶ T2.4 Convert 11 themes
                           │
                           └─▶ T2.5 Update tokens-v4.css
                                    │
                                    ▼
                           T2.6 Extend CSP regex + Zod schema (D5)
                                    │
                                    ▼
                           T2.7 Update color.ts helpers
                                    │
                                    ▼
                           T2.8 ADR-0005 OKLCH
                                    │
                                    ▼
Phase 3 (Algorithmic derivations, depends on P2)
  T3.1 Declare --primary-deep/glow via oklch(from ...) in tokens.css
       ▼
  T3.2 Remove primary-deep/glow from ColorScale required (mark optional)
       ▼
  T3.3 Strip 11 themes
       ▼
  T3.4 ADR-0006 derivations

Phase 4 (Status semantic + composites, depends on P1 + P3)
  T4.1 Add status-* tokens to ColorScale + 11 themes
       ▼
  T4.2 Consolidated StatusDot composite
       ▼
  T4.3 MetricCard composite
       ▼
  T4.4 Refactor consumers

Phase 5 (Quality infra, parallel with P4)
  T5.1 Zod schema (D5)
  T5.2 prefers-color-scheme auto-detect (D6)
  T5.3 forced-colors block (D7)
  T5.4 Playwright visual matrix (D9) — depends on T0.1 baseline
  T5.5 WCAG contrast CI gate (D10) — depends on T0.2

Phase 6 (Consolidation)
  T6.1-T6.5 ADRs + CHANGELOG + Migration guide

Phase 7 Dogfood QA (BLOCKER)
```

Phases 0, 1, 2 podem rodar parcialmente em paralelo. Phase 3 bloqueia em P2 (precisa OKLCH). Phase 4 bloqueia em P1 (status tokens) + P3 (themes já enxutos). Phase 5 majoritariamente paralelo. Phase 6 consolidação final.

---

## Phase 0: Baselines de segurança

**Objective:** Estabelecer baselines visuais e de contraste ANTES de qualquer mudança destrutiva, para que diffs sejam detectáveis.

### T0.1 — Visual regression baseline (Playwright + Ladle matrix)

#### Objective
Capturar snapshot fotográfico de 5 páginas curadas × 10 themes × 2 modes = 100 PNGs como baseline imutável pré-migração.

#### Evidence
- Único `playwright.config.ts` no projeto está em `referencia/ai-sdk-core/...` (não consumido por theo-ui). Logo: zero coverage visual hoje.
- OKLCH migration vai mexer em 638 valores de cor. Sem baseline, regressão visual é invisível.
- Comunidade convergiu para Playwright + screenshot diff como standard (Storybook usa por debaixo; Ladle compat).

#### Files to edit
```
playwright.config.ts (NEW) — Playwright config (chromium-only, Docker pinned)
tests/visual/theme-matrix.spec.ts (NEW) — matrix runner: 5 pages × 10 themes × 2 modes
tests/visual/pages/index.ts (NEW) — curated page list
tests/visual/__screenshots__/ (NEW dir) — committed snapshots
package.json — add devDeps @playwright/test ^1.49.0; add scripts quality:visual, quality:visual:update
.gitignore — exclude tests/visual/__screenshots__/diff/
docs/quality-gates.md — document quality:visual gate
```

#### Deep file dependency analysis
- **`playwright.config.ts`** (NEW): config minimalista — chromium-only, viewport 1280×720, deterministic font rendering via container. Não interfere com vitest existente (extensão `.spec.ts` vs `.test.ts`).
- **`tests/visual/theme-matrix.spec.ts`** (NEW): para cada combinação, renderiza Ladle story via dev server local, programaticamente injeta `data-theme="<name>"` + `data-mode="<mode>"` em `<html>`, aguarda fonts ready, screenshot. Usa Ladle programatic API (`@ladle/react`) já instalado.
- **`package.json`**: adiciona deps. Confere via `pnpm install` + `pnpm quality:visual -- --update-snapshots` first run.
- **Downstream**: T5.4 integra em `quality:gates`. T2.x usa estes snapshots como assertion após OKLCH cutover.

#### Deep Dives

**Por que Playwright e não Storybook+Chromatic:**
Chromatic é SaaS pago com vendor lock-in; Playwright + Ladle é OSS, runs anywhere. Já temos Ladle stories cobrindo ~80% dos componentes — reaproveitamos.

**Font rendering determinism:**
LCD subpixel rendering muda entre Linux/macOS/Windows. Solução: Docker image `mcr.microsoft.com/playwright:v1.49.0-jammy` pinada no CI. Local dev opcional. Snapshots commitados representam estado Docker.

**Página curada vs full sweep:**
5 páginas escolhidas por cobertura semântica máxima:
1. `chat-message` (texto + avatares + code blocks)
2. `dashboard` (cards + métricas + table)
3. `command-palette` (modal + lista + atalhos)
4. `agent-stream` (streaming + status colors + animations)
5. `deployment-row` (status colors + actions + table-like)

Cada uma exercita ≥6 tokens críticos. 100 snapshots = sweet spot custo/cobertura.

**Storage:**
~3MB total. Git histórico crescerá ~3MB por migration. Aceitável; LFS opcional se exceder 50MB cumulativo.

#### Tasks
1. Instalar `@playwright/test@^1.49.0` em devDeps.
2. Criar `playwright.config.ts` chromium-only, viewport 1280×720, `expect.toHaveScreenshot.threshold: 0.001`, **`use: { animations: 'disabled' }`** (EC-2: pausa CSS animations + transitions globalmente).
3. Criar `tests/visual/pages/index.ts` listando 5 stories Ladle por slug.
4. Criar `tests/visual/theme-matrix.spec.ts` parametrizado em 10 themes × 2 modes. **Cada spec executa `await page.evaluate(() => document.fonts.ready)` antes de `toHaveScreenshot()`** (EC-1: garante Geist Sans/Mono carregadas antes da captura — evita snapshot com fallback `-apple-system`).
5. Adicionar scripts `quality:visual` e `quality:visual:update` no `package.json`.
6. Adicionar script `quality:visual:docker` que wrappa `docker run --rm -v $(pwd):/work -w /work mcr.microsoft.com/playwright:v1.49.0-jammy pnpm quality:visual` (EC-13: devs locais regeneram baseline em paridade com CI; Linux vs macOS font rendering diverge).
7. First run: `pnpm quality:visual:update` (em Docker) para gerar baseline.
8. Commit `__screenshots__/` directory (excluir `diff/`).
9. Documentar em `docs/quality-gates.md` — incluir nota "snapshots gerados em Docker pinned image; devs locais usam `quality:visual:docker` para evitar OS drift".

#### TDD
```
RED:     theme-matrix.spec.ts initial run with NO baseline — MUST fail with "No screenshot to compare against".
GREEN:   Run with --update-snapshots flag; baseline generated; second run passes.
REFACTOR: None expected — config is config.
VERIFY:  pnpm quality:visual exits 0 after baseline; pnpm quality:visual fails after manual color change.
```

#### Acceptance Criteria
- [ ] `pnpm quality:visual` exits 0 on clean tree
- [ ] `tests/visual/__screenshots__/` contains 100 PNG files
- [ ] Provocation test: temporarily change `--primary` value → `pnpm quality:visual` fails with pixel diff > 0.001
- [ ] Revert + `pnpm quality:visual` re-greens without `--update-snapshots`
- [ ] CI runtime delta ≤ 3min (paralelizado com 4 workers)
- [ ] Pass: code-audit complexity (<= 10 cyclomatic per file)
- [ ] Pass: code-audit lint (zero biome warnings)

#### DoD
- [ ] All tasks completed
- [ ] `pnpm quality:visual` integrated into `quality:gates` (T5.4 dep — registered, not invoked yet)
- [ ] `docs/quality-gates.md` updated with new gate
- [ ] Baseline committed (100 PNGs)

---

### T0.2 — WCAG AA contrast auditor (baseline)

#### Objective
Auditar todos os 11 themes contra WCAG 2.2 AA contrast pre-migração, gerar baseline JSON com ratios atuais, expor `pnpm quality:contrast` script.

#### Evidence
- Dracula theme declara explicitamente "Theo-adapted for WCAG AA" — não verificado automatizadamente.
- Sem baseline, OKLCH conversion pode silenciosamente degradar contrast (algoritmos de conversão arredondam L).
- WCAG é equação matemática objetiva — não tem ambiguidade.

#### Files to edit
```
scripts/validate-contrast.ts (NEW) — runner + assertions
scripts/lib/wcag-contrast.ts (NEW) — relative luminance + ratio computation
tests/contrast/contrast-baseline.json (NEW) — pre-migration ratios
tests/contrast/wcag-contrast.test.ts (NEW) — unit tests for the math
package.json — add script quality:contrast
docs/quality-gates.md — document
```

#### Deep file dependency analysis
- **`scripts/lib/wcag-contrast.ts`**: implementa `relativeLuminance(rgb)` + `contrastRatio(rgb1, rgb2)` da WCAG 2.x spec. Não usa lib externa — fórmula é ~20 linhas, dep externa não justifica.
- **`scripts/validate-contrast.ts`**: importa os 11 themes, parseia cada cor via helper `parseColorScaleValue()` que detecta HSL split format (`"H S% L%"` puro, regex `^\d+\s+\d+%\s+\d+%$`) e prepend `hsl(` antes de delegar para culori (EC-3: culori não parseia split sem wrapper — `parseColor("262 83% 58%")` retorna `undefined`). Pós-T2.x mudará para parseColor direto (OKLCH wrapper já presente). Computa ratios para 8 pares críticos por modo, compara contra threshold WCAG AA, falha se algum < limite.
- **Downstream**: T2.4 (conversion script) garante ratios preservados; T5.5 promove a CI gate hard-fail.

#### Deep Dives

**Pares críticos auditados:**
| Par | Threshold | Tipo |
|---|---|---|
| `background` ↔ `foreground` | 4.5:1 | texto normal |
| `card` ↔ `card-foreground` | 4.5:1 | texto normal |
| `popover` ↔ `popover-foreground` | 4.5:1 | texto normal |
| `primary` ↔ `primary-foreground` | 4.5:1 | texto em CTA |
| `secondary` ↔ `secondary-foreground` | 4.5:1 | texto botão |
| `accent` ↔ `accent-foreground` | 4.5:1 | texto botão |
| `muted` ↔ `muted-foreground` | 4.5:1 | texto auxiliar |
| `destructive` ↔ `destructive-foreground` | 4.5:1 | texto destructive |

8 pares × 2 modes × 11 themes = **176 assertions por run**.

**Baseline JSON:**
Snapshot dos ratios atuais (computados HSL → RGB → luminance). Pós-T2.x ratios DEVEM ser ≥ baseline (toleramos melhora, não regressão). JSON commitado, regenerado explicitamente via `pnpm quality:contrast --update`.

#### Tasks
1. Implementar `wcag-contrast.ts` com `relativeLuminance` + `contrastRatio`.
2. Implementar testes unitários (8+ casos de fixture WCAG canonical pairs).
3. Implementar `validate-contrast.ts` runner.
4. First run: gerar `contrast-baseline.json`.
5. Commit baseline.
6. Add script `quality:contrast` em `package.json`.
7. Documentar em `docs/quality-gates.md`.

#### TDD
```
RED:     wcag-contrast.test.ts cases — known WCAG examples (#000 vs #FFF = 21:1; #777 vs #000 = 5.74:1).
RED:     validate-contrast main test — provocation: mutate a theme to fg=bg, assert script exits 1 with ratio 1.0.
GREEN:   Implement luminance + ratio + runner; tests pass.
REFACTOR: Extract per-pair iteration into `auditTheme(theme: Theme): ContrastReport` for testability.
VERIFY:  pnpm vitest run scripts/lib/wcag-contrast.test.ts && pnpm quality:contrast exits 0
```

#### Acceptance Criteria
- [ ] `pnpm quality:contrast` runs in <2s
- [ ] All 11 themes pass WCAG AA (or baseline documents known failures explicitly with FIXME)
- [ ] Baseline JSON committed
- [ ] Unit tests cover ≥6 canonical WCAG pairs from W3C examples
- [ ] Pass: code-audit complexity (<= 10)
- [ ] Pass: code-audit coverage (>= 90% on `wcag-contrast.ts`)
- [ ] Pass: code-audit lint (zero warnings)

#### DoD
- [ ] All tasks completed
- [ ] Script integrated into local dev (NOT yet CI gate — T5.5 promotes)
- [ ] Baseline preserved; document procedure to regenerate

---

## Phase 1: Anti-pattern fix + lint rule (IMMEDIATE)

**Objective:** Eliminar as 12 violações de cor literal Tailwind comprovadas, adicionar lint rule que previne regressão.

### T1.1 — Status semantic token group em `ColorScale`

#### Objective
Adicionar `--status-online`, `--status-offline`, `--status-degraded`, `--status-info` + `-foreground` companions em `ColorScale`, populando defaults razoáveis em todos os 11 themes.

#### Evidence
- 4 dos 12 anti-patterns são em `gateway-status-indicator` reusando emerald/red/amber/blue para status estados. Sem tokens dedicados, sweep força reuse de `success/destructive/warning/info` — semanticamente errado (D4).
- Lições D4 ADR.

#### Files to edit
```
src/themes/types.ts — add 8 keys to ColorScale (4 status + 4 foreground)
src/styles/tokens.css — add 8 :root + 8 .dark declarations
src/themes/violet-forge.ts — populate 16 values (8 light + 8 dark)
src/themes/classic-paper.ts — same
src/themes/aurora-terminal.ts — same
src/themes/anthropic-style.ts — same
src/themes/openai-style.ts — same
src/themes/dracula.ts — same
src/themes/github-dark.ts — same
src/themes/linear-glass.ts — same
src/themes/one-dark.ts — same
src/themes/vercel-mono.ts — same
src/styles/tokens-v4.css — add 8 @theme alias declarations
src/themes/define.ts — extend defaults merge to handle status group
src/themes/define.test.ts — assert defaults work
```

#### Deep file dependency analysis
- **`types.ts`**: ColorScale extension. Breaking se ColorScale é exported publicly (verify exports). Solução: novos keys são **mandatory** no `Theme` type; `defineTheme(partial)` enche defaults a partir de mapping (online←success, offline←destructive, degraded←warning, info←info).
- **`tokens.css`**: 8 novas variáveis em `:root` + 8 em `.dark`. Cuidado: preserve a ordem semântica (texturas, motion, typography blocks intactos).
- **`tokens-v4.css`**: 8 aliases `--color-status-*: hsl(var(--status-*))` (em P2 substituiremos por oklch).
- **`themes/*.ts`** (11 files): 8 keys × 2 modes = 16 entries por theme. Inicialmente espelhar success/destructive/warning/info para parity; ajuste fino em revisão de design subsequente.
- **`define.ts`**: defaults merge precisa reconhecer status group. Atual `defineTheme(partial)` faz spread sobre `violetForge` — só funcionar se `violetForge` declara TODOS os 37 keys após T1.1.

#### Deep Dives

**Por que separar de success/warning/destructive/info?**
Semântica: `--success` é cor de **operação bem-sucedida** (ex: "form saved"); `--status-online` é cor de **componente vivo** (ex: gateway connected). Hoje mistos, levando consumers a usar tokens errados.

**Default mapping** (D4 sub-decisão):
```
status-online        ← success          (verde geralmente)
status-online-fg     ← success-foreground
status-offline       ← destructive      (vermelho)
status-offline-fg    ← destructive-foreground
status-degraded      ← warning          (âmbar)
status-degraded-fg   ← warning-foreground
status-info          ← info             (azul)
status-info-fg       ← info-foreground
```

Consumers que querem status visualmente distinto de success/destructive override via `defineTheme({ light: { 'status-online': '...' } })`.

#### Tasks
1. Edit `types.ts` — adicionar 8 keys a `ColorScale`.
2. Edit `tokens.css` — adicionar 16 declarations (8 light + 8 dark) com defaults mapeados.
3. Para cada um dos 11 themes: adicionar 16 entries (mirror inicial dos defaults).
4. Edit `tokens-v4.css` — adicionar 8 @theme aliases.
5. Edit `define.ts` — garantir defaults rendering quando consumer omite status group.
6. Update `define.test.ts` com asserções para o novo grupo.
7. Rodar `pnpm typecheck` — confirmar zero errors.
8. Rodar `pnpm test` — confirmar zero regressões.

#### TDD
```
RED:     define.test.ts: `defineTheme({ name: 'foo' })` returns Theme with all 37 keys populated incluindo status-*.
RED:     types.ts: @ts-expect-error em theme com `light.status-online` missing — agora DEVE compilar até T1.1; após T1.1 falha porque é mandatory.
RED:     tokens.css regex test: `--status-online: ` aparece em :root e .dark blocks.
GREEN:   Implement keys + values + defaults; tests pass.
REFACTOR: Considerar extrair `defaultStatusMapping` const para reuse.
VERIFY:  pnpm typecheck && pnpm test
```

#### Acceptance Criteria
- [ ] `ColorScale` type tem 37 keys (29 + 8)
- [ ] `tokens.css` declara `--status-{online,offline,degraded,info}` + foregrounds em :root e .dark
- [ ] 11 themes declaram os 16 status entries
- [ ] `defineTheme()` popula defaults quando consumer omite
- [ ] `pnpm quality:contrast` (T0.2) continua green
- [ ] `pnpm quality:visual` (T0.1) sem diff (nenhum componente ainda usa)
- [ ] Pass: code-audit lint
- [ ] Pass: code-audit complexity

#### DoD
- [ ] All tasks completed
- [ ] Zero typecheck errors
- [ ] Zero test failures
- [ ] Tokens disponíveis para T1.2 sweep

---

### T1.2 — Sweep das 12 violações de cor literal

#### Objective
Substituir 100% dos `bg-(red|emerald|amber|blue|...)` hardcoded em 4 arquivos por tokens semânticos correspondentes.

#### Evidence
- 12 violações confirmadas em `gateway-status-indicator.tsx` (4), `run-status-pill.tsx` (2 lines, ~6 classes), `update-banner.tsx` (1 line, ~3 classes), `stability-bundle-viewer.tsx` (2).
- Cada violação quebra theme switching em todos os 9 themes não-violet.

#### Files to edit
```
src/components/primitives/gateway-status-indicator/gateway-status-indicator.tsx
src/components/primitives/run-status-pill/run-status-pill.tsx
src/components/primitives/update-banner/update-banner.tsx
src/components/composites/stability-bundle-viewer/stability-bundle-viewer.tsx
src/components/primitives/gateway-status-indicator/gateway-status-indicator.test.tsx
src/components/primitives/run-status-pill/run-status-pill.test.tsx
src/components/primitives/update-banner/update-banner.test.tsx
src/components/composites/stability-bundle-viewer/stability-bundle-viewer.test.tsx
```

#### Deep file dependency analysis
- **`gateway-status-indicator.tsx:28,33,38,43`**: trocar `bg-emerald-500`/`bg-red-500`/`bg-amber-500`/`bg-blue-500` por `bg-status-online`/`bg-status-offline`/`bg-status-degraded`/`bg-status-info` (T1.1 dependency).
- **`run-status-pill.tsx:56,71`**: trocar `border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400` por `border-status-online/40 bg-status-online/10 text-status-online dark:text-status-online`. Atenção: o pattern `dark:text-emerald-400` muda **apenas o tom** entre modos — com token semântico, isso já é gerenciado por `.dark` cascade, então a classe `dark:text-status-online` é redundante mas inofensiva.
- **`update-banner.tsx:44`**: análogo — `border/bg/text-status-degraded`.
- **`stability-bundle-viewer.tsx:44,49`**: `text-amber-600 dark:text-amber-400` → `text-status-degraded`; `text-blue-600 dark:text-blue-400` → `text-status-info`.
- **`*.test.tsx`**: testes que assertam `className` específico DEVEM ser atualizados. Snapshot tests (se houver) regenerados.

#### Deep Dives

**Risco de visual diff:**
Apenas para o theme `violet-forge`, os tokens semânticos DEVEM resultar em pixels equivalentes (T1.1 defaults espelham success/destructive/warning/info). Para outros 9 themes, **visual diff esperado** — eles serão a primeira vez que respeitam o theme corretamente. T0.1 snapshots precisam ser regenerados POR THEME após T1.2.

**Por que NÃO usar success/warning/etc diretamente:**
Aqui aplicamos D4: separação semântica. `gateway-status-indicator` representa status operacional, não "operação foi bem-sucedida".

#### Tasks
1. Editar `gateway-status-indicator.tsx` — 4 substituições.
2. Editar `run-status-pill.tsx` — 2 lines × N classes.
3. Editar `update-banner.tsx` — 1 line × N classes.
4. Editar `stability-bundle-viewer.tsx` — 2 substituições.
5. Editar tests correspondentes para assertions atualizadas.
6. Rodar `pnpm test` — confirmar zero failures.
7. Rodar `pnpm quality:visual` — atualizar snapshots para os 9 themes não-violet (esperado).
8. Rodar `pnpm quality:contrast` — verificar que pares não-violet ainda passam AA.

#### TDD
```
RED:     Update gateway-status-indicator.test.tsx — assert className contains `bg-status-online` (não mais `bg-emerald-500`).
RED:     Adicionar test: render <GatewayStatusIndicator status="online" /> com data-theme="dracula", assert computed background-color matches dracula --status-online (via getComputedStyle in jsdom).
GREEN:   Sweep das 12 ocorrências.
REFACTOR: Centralizar mapping status → token em const local para legibilidade.
VERIFY:  pnpm test (zero failures) + pnpm quality:visual --update + pnpm quality:contrast
```

#### Acceptance Criteria
- [ ] `grep -rE 'bg-(red|emerald|amber|blue|...)-\d+' src/components --include="*.tsx" | grep -v "\.test\." | grep -v "\.stories\."` retorna 0 matches
- [ ] `pnpm test` exits 0
- [ ] `pnpm quality:contrast` exits 0
- [ ] Visual snapshots regenerados para os 9 themes
- [ ] Manual smoke: trocar theme em playground muda cor dos status indicators

#### DoD
- [ ] Zero cor literal nos 4 arquivos
- [ ] Tests passam
- [ ] Visual snapshots atualizados intentionalmente (commit message explica regeneration)

---

### T1.3 — Lint rule anti-cor-literal em `validate-quality-gates.ts`

#### Objective
Adicionar gate que escaneia `src/**/*.{ts,tsx}` (excluindo test/stories/fixtures) por classes Tailwind de cor literal, falha build com mensagem clara apontando ao token semântico esperado.

#### Evidence
- Sem gate, regressão é certeza estatística: 12 violações já existem inadvertidamente; próxima PR repete o pattern.
- D3 ADR rationale.

#### Files to edit
```
scripts/validate-quality-gates.ts — add validateNoLiteralTailwindColors() function + invocation
scripts/lib/literal-color-scanner.ts (NEW) — reusable scanner with whitelist + suggestion engine
scripts/__tests__/literal-color-scanner.test.ts (NEW) — unit tests
docs/quality-gates.md — document the new gate
CONTRIBUTING.md — add "no Tailwind literal colors" rule with example
```

#### Deep file dependency analysis
- **`literal-color-scanner.ts`** (NEW): exporta `scan(rootDir: string, options: ScanOptions): Violation[]`. Implementa regex `\b(bg|text|border|ring|fill|stroke|from|to|via|outline|divide|shadow|accent|caret|decoration|placeholder)-(red|blue|green|emerald|amber|indigo|orange|pink|sky|cyan|teal|lime|yellow|fuchsia|rose|violet|purple|slate|gray|zinc|neutral|stone)-(?:\d{2,3})\b`. Whitelist por path glob (`*.test.tsx`, `*.stories.tsx`, `tests/fixture-*/`). Suggestion engine: red/rose/destructive→suggest destructive; emerald/green/lime→suggest success/status-online; amber/yellow/orange→suggest warning/status-degraded; blue/sky/cyan/indigo→suggest info/primary.
- **`validate-quality-gates.ts`** (existing, 934 LoC): adicionar invocação no chain principal. Manter consistent com style atual (cada validator retorna `{ passed: bool, errors: string[] }`).

#### Deep Dives

**Regex anchoring:**
`\b` boundary garante que `bg-primary-foreground` NÃO matcha (não termina em dígito). `bg-blue-500/10` matcha (alpha suffix OK porque `/10` vem depois do número).

**Performance:**
~99 primitives + ~30 composites × ~3 files each = ~390 .tsx files. Regex run via `fs.readFileSync` (sync read OK para script). Total <500ms.

**Mensagem de erro útil:**
```
[quality-gates] src/components/foo/bar.tsx:42
  Found literal Tailwind color: `bg-emerald-500`
  Use a semantic token instead. Suggestions:
    - bg-success            (positive action result)
    - bg-status-online      (operational liveness state)
  See ADR-0004 and docs/design-system.md#semantic-tokens.
```

#### Tasks
1. Implementar `literal-color-scanner.ts` com `scan()` + suggestions.
2. Implementar unit tests (provocations: `bg-blue-500`, `bg-blue-500/10`, `bg-primary-foreground` NOT match, paths whitelist).
3. Integrar em `validate-quality-gates.ts`.
4. Run local — confirma 0 violations (T1.2 já fez sweep).
5. Provocation manual: introduzir `bg-red-500` em arquivo qualquer → confirmar gate falha → reverter.
6. Documentar em `docs/quality-gates.md` e `CONTRIBUTING.md`.

#### TDD
```
RED:     scanner.test.ts:
         - matches bg-red-500, bg-emerald-500/10, text-amber-600, border-blue-500/40
         - does NOT match bg-primary, bg-primary-foreground, bg-success/10
         - whitelist: file ending in .test.tsx is skipped
         - suggestion engine: bg-emerald-500 → ["bg-success", "bg-status-online"]
RED:     validate-quality-gates.test.ts: scan finds 0 violations on current tree (T1.2 already cleared).
GREEN:   Implement scanner + integration.
REFACTOR: Memoize regex compilation.
VERIFY:  pnpm quality:structure (which invokes validate-quality-gates) exits 0
```

#### Acceptance Criteria
- [ ] `pnpm quality:structure` exits 0 on clean tree
- [ ] Provocation: introduzir `bg-red-500` em qualquer arquivo de componente → exit 1 com mensagem útil
- [ ] Whitelist funciona: `bg-red-500` em `*.test.tsx` OK
- [ ] Unit tests cover ≥10 cases
- [ ] Runtime <500ms
- [ ] Pass: code-audit complexity (<= 10)
- [ ] Pass: code-audit coverage (>= 90% on `literal-color-scanner.ts`)

#### DoD
- [ ] Gate ativo em `quality:structure` (que faz parte de `quality:gates`)
- [ ] Documentado em CONTRIBUTING.md
- [ ] ADR-0004 referenciado (será criado em T1.4)

---

### T1.4 — ADR-0004 cor literal proibida

#### Objective
Documentar a decisão arquitetural em ADR formal.

#### Files to edit
```
docs/adr/0004-no-literal-tailwind-colors-in-source.md (NEW)
docs/adr/README.md — index entry (if exists)
```

#### Tasks
1. Escrever ADR seguindo template MADR.
2. Linkar do CONTRIBUTING.md e validator error messages.

#### TDD
N/A (documentação). Validator: T1.3.

#### Acceptance Criteria
- [ ] ADR existe, MADR-formatted
- [ ] Status: Accepted
- [ ] Cross-references: D3, T1.3

#### DoD
- [ ] ADR commitado
- [ ] Index atualizado

---

## Phase 2: OKLCH migration

**Objective:** Migrar 638 valores HSL para OKLCH em paralelo seguro (não-destrutivo até cutover), com Zod schema substituindo regex allowlist.

### T2.1 — Adicionar `culori` como devDep + cmd alias

#### Objective
Instalar `culori` (color manipulation library OSS, 0 transitive deps polluentes), exposed como utility no `scripts/lib/`.

#### Evidence
- HSL → OKLCH precisa conversion algorítmica precisa. Rolar à mão = risco de erro numérico.
- `culori` é dep usada por shadcn upstream, Tailwind, Radix Colors. Standard de facto.
- Reuso: T0.2 contrast auditor também consume.

#### Files to edit
```
package.json — add devDep culori ^4.0.0
scripts/lib/color.ts (NEW) — thin wrapper exposing converter functions
```

#### Tasks
1. `pnpm add -D culori` (importar apenas funções específicas via `culori/fn` para tree-shaking).
2. Criar `scripts/lib/color.ts` exportando:
   - `hslSplitToOklch(input: string): string` — converte `"H S% L%"` → `"oklch(L C H)"` (3 decimais)
   - `oklchToHslSplit(input: string): string` — reverse para legacy compat
   - `parseColor(input: string): Color | undefined` — delegando culori (aceita `hsl()`, `oklch()`, `#hex`, etc.)
   - **`parseColorScaleValue(raw: string): Color | undefined`** — detecta HSL split (regex `^\d+\s+\d+%\s+\d+%$`), prepend `hsl(` antes de delegar (EC-3: ColorScale armazena split format puro, sem wrapper; culori não parseia direto).
   - Output OKLCH usa `clampChroma()` da culori para garantir P3 gamut — hex inputs fora de sRGB são clipados explicitamente (evita valores fantasma "fora do gamut" que browsers truncam silenciosamente).
3. Tests unitários (mínimo 8 cases: pure colors, alpha, HSL split, OKLCH roundtrip, hex P3 overflow, malformed input retorna undefined).

#### TDD
```
RED:     color.test.ts:
         - hslSplitToOklch("262 83% 58%") returns "oklch(0.560 0.244 277.0)" within ±0.001
         - oklchToHslSplit("oklch(0.560 0.244 277.0)") returns approx original
         - parseColor handles hex, rgb, hsl, oklch
GREEN:   Implement using culori.
VERIFY:  pnpm vitest run scripts/lib/color.test.ts
```

#### Acceptance Criteria
- [ ] culori instalado
- [ ] Wrapper tests passing
- [ ] Zero new bundle size em consumers (devDep)

#### DoD
- [ ] Deps installed; tests green

---

### T2.2 — Script automatizado HSL → OKLCH

#### Objective
Implementar `scripts/migrate-themes-to-oklch.ts` que lê todos os theme.ts files + tokens.css + tokens-v4.css, converte cada HSL split para OKLCH, escreve de volta atomicamente.

#### Evidence
- 638 valores. Manual = erro garantido.
- Script é one-shot mas precisa ser reproducível para revisão.

#### Files to edit
```
scripts/migrate-themes-to-oklch.ts (NEW)
scripts/__tests__/migrate-themes-to-oklch.test.ts (NEW)
```

#### Deep file dependency analysis
- **`migrate-themes-to-oklch.ts`**: lê arquivos via AST (ts-morph) para preservar comments. Para `.css` arquivos: regex baseado parse, mas **filtra APENAS linhas que declaram tokens de cor puros** — pattern `^\s*--[a-z][a-z0-9-]*:\s*(\d+)\s+(\d+%)\s+(\d+%)\s*;` (HSL split na declaração). **Linhas que contêm `hsl(var(--x) / ...)` ou outros usos de var() em valores compostos (shadows, gradients, color-mix) são EXPLICITAMENTE puladas** (EC-4: tokens.css linha 99 declara `--shadow-sm: 0 1px 2px 0 hsl(var(--foreground) / 0.06)` — convertendo cegamente produziria sintaxe inválida `oklch(var(--foreground) / 0.06)` sem L C H args). Texture utilities (`.bg-dotted-violet` etc.) e shadow declarations são migrados manualmente em T2.5. Atomic write via `fs.writeFileSync` + backup `.bak` (cleanup em commit). Em caso de crash no meio do batch, script aborta e instrui rollback manual via `find . -name '*.bak' -exec sh -c 'mv "$1" "${1%.bak}"' _ {} \;`.
- **Testes**: validar conversion em fixtures pequenos incluindo um fixture com shadow declaration (positive: token convertido; negative: shadow preservado).

#### Tasks
1. Implementar parser/writer com ts-morph + regex CSS.
2. Tests com fixture mini (1 theme + 1 tokens.css excerpt).
3. Dry-run mode (`--dry-run`) para diff antes de cutover.

#### TDD
```
RED:     migrate.test.ts: rodar contra fixture, assert output strings.
GREEN:   Implement.
REFACTOR: Extract writer logic.
VERIFY:  pnpm vitest run scripts/__tests__/migrate-themes-to-oklch.test.ts
```

#### Acceptance Criteria
- [ ] Script roda em <5s
- [ ] Dry-run mode funcional
- [ ] Preserva comments e formatting

#### DoD
- [ ] Script testado em fixture; pronto para T2.3-T2.5

---

### T2.3 — Converter `tokens.css` para OKLCH

#### Objective
Executar conversão em `src/styles/tokens.css`, validar visualmente via Playwright snapshots.

#### Files to edit
```
src/styles/tokens.css — :root e .dark blocks convertidos para oklch()
```

#### Tasks
1. Rodar `pnpm tsx scripts/migrate-themes-to-oklch.ts --target=tokens.css --dry-run` — revisar diff.
2. Aplicar.
3. Rodar `pnpm quality:visual` — esperado: zero diff (OKLCH é matematicamente equivalente para conversion lossless).
4. Rodar `pnpm quality:contrast` — esperado: ratios preservados.

#### TDD
```
RED:     Visual snapshot (T0.1 baseline) precisa permanecer green pós-conversion.
GREEN:   Apply conversion.
VERIFY:  pnpm quality:visual && pnpm quality:contrast
```

#### Acceptance Criteria
- [ ] tokens.css 100% OKLCH (zero HSL split remaining em `--{token}:` declarations)
- [ ] `pnpm quality:visual` exits 0
- [ ] `pnpm quality:contrast` exits 0
- [ ] `hsl(var(--token))` em outros arquivos QUEBRA — esperado, captured by T2.5 follow-up

#### DoD
- [ ] tokens.css convertido
- [ ] Visual/contrast preserved

---

### T2.4 — Converter os 11 themes `.ts`

#### Objective
Executar conversion nos 11 `*.ts` theme files.

#### Files to edit
```
src/themes/violet-forge.ts
src/themes/classic-paper.ts
src/themes/aurora-terminal.ts
src/themes/anthropic-style.ts
src/themes/openai-style.ts
src/themes/dracula.ts
src/themes/github-dark.ts
src/themes/linear-glass.ts
src/themes/one-dark.ts
src/themes/vercel-mono.ts
```

#### Tasks
1. Rodar migrate script em batch nos 11 files.
2. Revisar diff manualmente (sample 2-3 themes).
3. Rodar tests + visual + contrast.

#### TDD
```
RED:     theme-provider.test.tsx + define.test.ts — testes existentes precisam continuar verdes.
RED:     Visual snapshots para 10 themes × 2 modes precisam permanecer green.
GREEN:   Apply.
VERIFY:  pnpm test && pnpm quality:visual && pnpm quality:contrast
```

#### Acceptance Criteria
- [ ] 11 themes 100% OKLCH
- [ ] Visual/contrast preserved
- [ ] Tests green

#### DoD
- [ ] Conversion aplicada e validada

---

### T2.5 — Atualizar `tokens-v4.css` aliases (hsl → direct oklch reference)

#### Objective
Substituir indireção `hsl(var(--primary))` → `oklch()` direto, eliminando wrapper desnecessário.

#### Evidence
- `tokens-v4.css` aliases existiam para fazer Tailwind v4 ler runtime HSL vars via `hsl()` wrapper. Com OKLCH direto, `var(--primary)` JÁ é OKLCH parseável — wrapper vira no-op danoso.

#### Files to edit
```
src/styles/tokens-v4.css — change all `hsl(var(--x))` to `var(--x)` (or oklch(from var(--x) l c h))
src/styles/tokens.css — texture utilities `.bg-dotted-violet` etc. precisam atualizar de `hsl(var(--primary) / 0.08)` para color-mix or oklch native
```

#### Deep file dependency analysis
- **`tokens-v4.css`**: cada `--color-foo: hsl(var(--foo))` vira `--color-foo: var(--foo)`. Tailwind v4 lê o valor OKLCH parseável diretamente.
- **`tokens.css` texture utilities (linhas 204-225)**: `hsl(var(--primary) / 0.08)` precisa virar `color-mix(in oklch, var(--primary) 8%, transparent)` ou `oklch(from var(--primary) l c h / 0.08)`. O segundo é mais idiomático.
- **`theme-provider.tsx` COLOR_VALUE_PATTERN regex** (EC-5 absorbed): regex atual em `theme-provider.tsx:58-59` aceita o token `oklch(...)` mas o conteúdo interno é `[\d.\s%,/+\-]+` — **proíbe palavras** (`from`, `l`, `c`, `h`) e parênteses aninhados (`var(`, `calc(`). Logo `oklch(from var(--primary) calc(l - 0.16) c h)` é REJEITADO. Após T3.1 essa sintaxe vai aparecer nos themes built-in declarados via CSS (esses não passam pelo runtime validator), mas consumers que registram themes via `registerTheme()` com derivações próprias batem na validação. **Pattern novo proposto** (substitui apenas o segmento `oklch|oklab`; demais funções inalteradas):
  ```
  (?:oklch|oklab)\(\s*(?:from\s+var\(--[a-zA-Z0-9-]+\)\s+)?(?:calc\([^();{}]+\)|[a-z]|[\d.]+%?|none|\/|\s)+\s*\)
  |
  (?:rgb|rgba|hsl|hsla|lab|lch|color)\(\s*[\d.\s%,/+\-]+\s*\)
  ```
  Mantém safety: continua banindo `;`, `{`, `}`, `url(`; permite tokens single-char OKLCH params (`l`/`c`/`h`/`a`/`b`/`r`/`g`/`alpha`) + `none` + `from var(...)` + `calc()` aninhado de 1 nível.

#### Tasks
1. Editar `tokens-v4.css` — substituir `hsl(var(--x))` por `var(--x)` em 25+ declarations.
2. Editar texture utilities em `tokens.css` — `hsl(var(--primary) / 0.08)` → `oklch(from var(--primary) l c h / 0.08)` (linhas 205-221).
3. Estender regex `COLOR_VALUE_PATTERN` em `theme-provider.tsx` com o pattern OKLCH expandido acima. **Extrair constante para `src/themes/color-value-pattern.ts`** (exportada, reuso em T2.7 Zod schema).
4. Atualizar testes de `theme-provider.test.tsx`:
   - **Positive cases (must pass validation)**: `oklch(0.560 0.244 277.0)`, `oklch(from var(--primary) calc(l - 0.16) c h)`, `oklch(from var(--accent) l c h / 0.5)`, `oklch(0.5 0.2 270 / 0.5)`, `oklch(none none none)`.
   - **Negative cases (must reject)**: `oklch(from var(--x); injected: bad)`, `oklch(url(http://evil))`, `oklch(from var(--x) calc(l - calc(0.1)) c h)` (nested calc rejected — only 1 level), `oklch({injected})`, `oklch(from var(--x) calc(l < 0.1) c h)` (operators outside +/-/*//).
5. Rodar `pnpm quality:visual` + `pnpm test`.

#### TDD
```
RED:     theme-provider.test.tsx — 5 positive + 5 negative cases listed above. Positive cases MUST currently fail with the existing regex.
GREEN:   Extract COLOR_VALUE_PATTERN to color-value-pattern.ts; apply expanded regex; all cases pass.
REFACTOR: Document inline the safety boundaries (banned chars list) in JSDoc.
VERIFY:  pnpm test && pnpm quality:visual
```

#### Acceptance Criteria
- [ ] tokens-v4.css sem `hsl(var(...))` wrappers
- [ ] texture utilities renderizam idênticos (visual snapshot)
- [ ] Regex aceita `oklch(from ...)` para T3.1 (5+ positive tests passando)
- [ ] Regex continua rejeitando 5+ vetores de CSS injection conhecidos
- [ ] `COLOR_VALUE_PATTERN` exportável de `src/themes/color-value-pattern.ts`
- [ ] Pass: code-audit complexity

#### DoD
- [ ] Aliases atualizados
- [ ] Visual preservado
- [ ] Regex expandido + testes positive/negative completos

---

### T2.6 — Atualizar `color.ts` helpers (hex/rgb retornam oklch)

#### Objective
Refactor `hex()` e `rgb()` para retornar string `oklch(L C H)` em vez de `"H S% L%"`. Manter versões legacy `hexToHsl()` / `rgbToHsl()` deprecated por 1 minor.

#### Files to edit
```
src/themes/color.ts — return type oklch; deprecate old via @deprecated JSDoc + parallel exports
src/themes/color.test.ts — update assertions to oklch values
src/themes/index.ts — re-export both new and legacy (transitional)
```

#### Tasks
1. Refactor `hex()` para usar culori internamente → oklch.
2. Manter `hexToHsl()` como deprecated alias.
3. Update tests.
4. Update JSDoc com migration note.

#### TDD
```
RED:     color.test.ts: hex("#7C3AED") returns "oklch(0.560 0.244 277.0)" within tolerance.
RED:     hexToHsl("#7C3AED") returns "262 83% 58%" (legacy, must still work).
GREEN:   Implement both.
REFACTOR: Share parsing.
VERIFY:  pnpm test src/themes/color.test.ts
```

#### Acceptance Criteria
- [ ] hex/rgb retornam oklch
- [ ] hexToHsl/rgbToHsl deprecated mas funcionais
- [ ] @deprecated JSDoc presente

#### DoD
- [ ] Helpers migrados

---

### T2.7 — Valibot schema substitui regex allowlist (D5)

> **Decisão revisada (EC-6 absorbed):** D5 originalmente especificou Zod. Auditoria pós-plan: Zod core é ~12KB gzipped (não ~3KB como estimado), e `ThemeProvider` constructor é síncrono — dynamic import não tree-shake. Substitui-se Zod por **Valibot ~1.5KB gzipped** (API equivalente `safeParse`, peer-friendly, exportações modulares). Alternativa B (dev-only schema via `import.meta.env.PROD ? skip : run`) descartada porque deixaria production sem validação — defense in depth perdida.

#### Objective
Implementar `src/themes/schema.ts` com Valibot validation. `ThemeProvider` + `registerTheme()` usam `safeParse`. Regex aprimorada (T2.5) permanece como segunda camada de defesa (Valibot valida shape + tipos; regex valida segurança de CSS injection contra interpolação textual).

#### Files to edit
```
src/themes/schema.ts (NEW) — Valibot schema for Theme + ColorScale
src/themes/theme-provider.tsx — integrate safeParse; throw em dev / warn em prod
src/themes/theme-provider.test.tsx — add 8+ cases for valid/invalid themes
package.json — add valibot ^0.42.0 as direct dep
```

#### Tasks
1. `pnpm add valibot@^0.42.0`.
2. Implementar `themeSchema = v.object({ name: themeNameSchema, label: v.string(), description: v.optional(v.string()), light: colorScaleSchema, dark: colorScaleSchema, fonts: fontsSchema, fontUrls: v.optional(v.array(v.pipe(v.string(), v.url()))) })`.
3. `colorScaleSchema = v.object({ [29 mandatory + 8 status keys]: v.pipe(v.string(), v.regex(COLOR_VALUE_PATTERN)) })` — reusa regex extraída em T2.5 como `color-value-pattern.ts`.
4. `themeNameSchema = v.pipe(v.string(), v.regex(THEME_NAME_PATTERN))`.
5. `fontsSchema = v.object({ display, body, mono })` — cada um `v.pipe(v.string(), v.regex(FONT_FAMILY_PATTERN))`.
6. Integrar em `ThemeProvider` constructor: `const result = v.safeParse(themeSchema, theme); if (!result.success) { if (IS_DEV) throw new Error(formatValibotIssues(result.issues)); else { warnInvalidTheme(theme, result.issues); return; /* skip this theme */ } }`.
7. Adicionar helper `formatValibotIssues(issues)` que produz mensagem `[@theokit/ui] theme 'X' invalid: field 'light.primary' expected color value, got '...'`.
8. Tests (8+ cases).

#### TDD
```
RED:     theme-provider.test.tsx:
         - Valid theme passes safeParse
         - Invalid color value rejects with field path in message
         - Invalid font URL (javascript:) rejected
         - Missing mandatory key (e.g., light.primary) rejected with explicit "Required" message
         - Status keys (D4) validated against same regex as primary
         - In dev: invalid theme throws
         - In prod: invalid theme produces console.warn + skip (theme not registered)
         - Bundle measurement: valibot import adds < 2.5KB gzipped to themes subpath (verify via pnpm quality:bundle)
GREEN:   Implement valibot integration.
REFACTOR: Cache schema parse results via WeakMap<Theme, ParseResult>.
VERIFY:  pnpm test && pnpm quality:bundle
```

#### Acceptance Criteria
- [ ] Schema rejeita themes inválidos com mensagem com field path
- [ ] Regex (T2.5) continua ativo como defense in depth
- [ ] **Bundle delta ≤ +2.5KB gzipped** (Valibot core + schema; medido via `pnpm quality:bundle` antes/depois)
- [ ] 8 test cases cobertos (4 positive + 4 negative)
- [ ] Dev throws; production warns + skips
- [ ] Pass: code-audit complexity
- [ ] Pass: code-audit coverage

#### DoD
- [ ] Schema integrado
- [ ] Tests green
- [ ] Bundle limit honored (≤ +2.5KB gzipped, validated by quality:bundle)
- [ ] D5 ADR revisado/atualizado mencionando Valibot escolhido sobre Zod com rationale

---

### T2.8 — ADR-0005 OKLCH como formato único

#### Files to edit
```
docs/adr/0005-oklch-as-canonical-color-format.md (NEW)
```

#### Acceptance Criteria
- [ ] ADR escrito (MADR format)
- [ ] Status: Accepted
- [ ] Cross-refs: D1, D2, T2.x, RFC 0005

#### DoD
- [ ] ADR commitado

---

## Phase 3: Algorithmic tonal derivations

**Objective:** Eliminar `primary-deep` e `primary-glow` manuais, derivar via `oklch(from var(--primary) ...)` em CSS.

### T3.1 — Declarar tonal derivations em `tokens.css`

#### Files to edit
```
src/styles/tokens.css — replace --primary-deep + --primary-glow + --accent-deep manual values with oklch(from ...) expressions
```

#### Deep Dives

**Derivation formulas** (calibradas para preservar visual atual de violet-forge, com clamp anti-overflow per EC-7):

```css
/* EC-7 absorbed: max()/min() clamps protegem contra L overflow em themes muito dark/light.
   Sem isso, theme com primary L=0.12 + calc(l - 0.16) = -0.04 → browser clipa pra 0 (preto puro),
   primary-deep fica indistinguível do background dark e pressed state desaparece. */
--primary-deep: oklch(from var(--primary) max(0.05, calc(l - 0.16)) c h);
--primary-glow: oklch(from var(--primary) min(0.95, calc(l + 0.18)) c h);
--accent-deep:  oklch(from var(--accent)  max(0.05, calc(l - 0.13)) c h);
```

`max(0.05, ...)` floor garante L mínima 0.05 (quase preto mas não preto puro — preserva matiz). `min(0.95, ...)` ceiling análogo para glow.

**Validação cross-theme:**
Cada um dos 11 themes precisa visualmente preservar — diff esperado mas dentro de tolerância (calibrar threshold ~0.01 OKLCH delta). Em particular, themes mais dark (`aurora-terminal`, `dracula` dark mode, `one-dark`) DEVEM ser inspecionados manualmente para confirmar que clamp não introduz colors visualmente "achatadas".

**Per-theme override path:**
Se theme específico precisa formula custom (ex: glow mais intenso em `aurora-terminal`), permitir override declarando o token explicitamente em `theme.ts` — schema valibot (T2.7) aceita os campos como optional após T3.2.

#### Tasks
1. Update `tokens.css` com expressions usando `max()`/`min()` clamps.
2. Confirmar que biome v1.9.4 não bloqueia `max()`/`calc()` nested em CSS — biome só lê `.ts`/`.tsx` por config atual, mas validar via `stylelint` se presente.
3. Rodar visual + contrast em todos 11 themes.
4. **Validação dark-theme dedicada**: inspecionar manualmente `aurora-terminal`, `dracula` (dark mode), `one-dark`, `vercel-mono` em playground; medir `getComputedStyle(button).backgroundColor` para `:active` state — confirmar que primary-deep tem chroma > 0.02 (visualmente distinguível, não cinza/preto puro).
5. Se algum theme regredir visualmente: per-theme override no `.ts` correspondente declarando `primary-deep` explícito.

#### TDD
```
RED:     Visual snapshots para 11 themes × 2 modes (T0.1) — esperado diff ≤ 2% per snapshot pós-clamp aplicado.
RED:     tests/css/tonal-derivation.spec.ts (NEW Playwright spec): render <Button variant="primary"> em theme=aurora-terminal mode=dark, assert :active background tem L > 0.05 (clamp ativo) e chroma > 0.02 (preserva matiz).
GREEN:   Apply expressions com clamps.
REFACTOR: None expected.
VERIFY:  pnpm quality:visual --update (com diff review manual) && pnpm quality:contrast && novo Playwright spec
```

#### Acceptance Criteria
- [ ] tokens.css usa `oklch(from ...)` com `max()`/`min()` clamps para tonal derivations
- [ ] Visual diff ≤ 2% per snapshot (review manual)
- [ ] Contrast preserved em todos 11 themes
- [ ] Per-theme override path funciona (validado em pelo menos 1 theme via test)
- [ ] Playwright spec confirma clamp ativo em dark themes (L > 0.05, chroma > 0.02)
- [ ] Pass: code-audit lint

#### DoD
- [ ] Derivations declared com anti-overflow clamps
- [ ] Validation completed em todos 11 themes
- [ ] Dark themes (4+) inspecionados manualmente sem regressão

---

### T3.2 — Tornar tonal scales opcionais em `ColorScale`

#### Files to edit
```
src/themes/types.ts — primary-deep, primary-glow, accent-deep => optional
src/themes/schema.ts — schema updated
src/themes/define.ts — defaults: when omitted, computed via culori (mirror of CSS derivation)
```

#### Tasks
1. Mark fields optional in TypeScript.
2. Update defineTheme defaults logic.
3. Tests.

#### TDD
```
RED:     define.test.ts: defineTheme({ name: 'x', light: { primary: 'oklch(...)' } }) returns theme with primary-deep auto-derived.
GREEN:   Implement.
VERIFY:  pnpm test
```

#### Acceptance Criteria
- [ ] Tonal fields opcionais no Type
- [ ] defineTheme deriva quando omitido
- [ ] Override consumer ainda funciona

#### DoD
- [ ] Optional + auto-derive working

---

### T3.3 — Strip 11 themes (remover entries derivadas manuais)

#### Files to edit
```
src/themes/violet-forge.ts (drop primary-deep, primary-glow, accent-deep × 2 modes = 6 entries)
src/themes/classic-paper.ts (same)
... × 11 themes (66 entries total dropped)
```

#### Tasks
1. Remove 6 entries per theme.
2. Run visual + contrast.

#### TDD
```
RED:     Visual snapshots permanecem (CSS derivation já entrou em T3.1; theme.ts stripping não muda runtime).
GREEN:   Strip entries.
VERIFY:  pnpm test && pnpm quality:visual && pnpm quality:contrast
```

#### Acceptance Criteria
- [ ] Themes ~10% menores
- [ ] Visual preserved
- [ ] Contrast preserved

#### DoD
- [ ] Strip complete

---

### T3.4 — ADR-0006 algorithmic tonal derivations

#### Files to edit
```
docs/adr/0006-algorithmic-tonal-derivations.md (NEW)
```

#### DoD
- [ ] ADR escrito + cross-refs

---

## Phase 4: Status semantic + composites

**Objective:** Consolidar status indicator components; introduzir MetricCard composite.

### T4.1 — StatusDot composite consolidado

#### Objective
Unificar `status-dot` (primitive existente) + `gateway-status-indicator` em um composite `StatusDot` com semantic API (`status: 'online' | 'offline' | 'degraded' | 'info'`). Backward compat: re-export primitives existentes.

#### Hierarchy invariant (CRITICAL — composites depend on primitives, never reverse)

A taxonomia mecanicamente enforced em `validate-quality-gates.ts` é: **primitive importa zero `@theokit/ui` components; composite importa primitives**. Inverter quebra o gate. O design correto NÃO renomeia primitive para composite — preserva os primitives `status-dot` (genérico, recebe `className`/`color`) e `gateway-status-indicator` (já específico a gateway), e introduz um composite NOVO que CONSOME esses primitives com semantic API.

**Naming** (escolha consciente para evitar conflict com primitive existente `status-dot`):
- Composite: `<StatusIndicator status="online">` (não `StatusDot` — primitive já ocupa esse nome).
- Internamente usa `<StatusDot color="var(--status-online)" />` (primitive) + label opcional + Tooltip.

#### Files to edit
```
src/components/composites/status-indicator/status-indicator.tsx (NEW)
src/components/composites/status-indicator/status-indicator.test.tsx (NEW)
src/components/composites/status-indicator/status-indicator.stories.tsx (NEW)
src/components/composites/status-indicator/index.ts (NEW)
src/components/primitives/status-dot/status-dot.tsx (UNCHANGED — primitive permanece como API genérica)
src/components/primitives/gateway-status-indicator/gateway-status-indicator.tsx (UNCHANGED na hierarchy; T1.2 já trocou cores literais por tokens semânticos)
registry/status-indicator.json (NEW)
src/index.ts — export StatusIndicator
```

#### Tasks
1. Implementar `<StatusIndicator status>` composite que CONSOME `<StatusDot>` primitive + opcional `<Tooltip>` + opcional label `<span>`. API:
   ```tsx
   <StatusIndicator status="online" label="Connected" />
   <StatusIndicator status="degraded" label="Slow" showTooltip />
   ```
2. Implementar mapping `status → token` interno: `online → bg-status-online`, `offline → bg-status-offline`, `degraded → bg-status-degraded`, `info → bg-status-info`.
3. NÃO mexer em `gateway-status-indicator` primitive (T1.2 já corrigiu cores literais para tokens semânticos via T1.1). Adicionar JSDoc `@see StatusIndicator composite for semantic API` apenas.
4. Stories + tests (8+ cases cobrindo 4 statuses × com/sem label).
5. Registry JSON entry.
6. Export em `src/index.ts`.
7. Confirmar que `validate-quality-gates.ts` taxonomia gate passa (composite importa primitive — OK; nenhuma inversão).

#### TDD
```
RED:     status-indicator.test.tsx:
         - <StatusIndicator status="online" /> renders StatusDot primitive with bg-status-online
         - <StatusIndicator status="online" label="Connected" /> renders label span
         - <StatusIndicator status="degraded" showTooltip /> wraps in Tooltip with "Degraded" content
         - Class taxonomia: import chain composites/status-indicator → primitives/status-dot OK (asserted by quality:structure)
GREEN:   Implement composite consuming primitive.
REFACTOR: Extract status-to-token mapping to module-level const for testability.
VERIFY:  pnpm test && pnpm quality:structure (taxonomia gate)
```

#### Acceptance Criteria
- [ ] Composite criado em `src/components/composites/status-indicator/`
- [ ] Hierarchy invariant respeitada (composite → primitive, never reverse)
- [ ] Primitives `status-dot` e `gateway-status-indicator` UNCHANGED em hierarchy
- [ ] Registry entry valid
- [ ] Tests covering 8+ cases
- [ ] Pass code-audit
- [ ] Pass: `quality:structure` taxonomia validation

#### DoD
- [ ] StatusIndicator composite shipped
- [ ] Hierarchy preserved (gate green)
- [ ] Documentation: composite is recommended for new code; primitives kept para escape hatch

---

### T4.2 — MetricCard composite

#### Objective
Implementar pattern recorrente "métrica de dashboard" como composite reusable: `<MetricCard title value delta trend />`.

#### Evidence
- Vídeo do shadcn aponta o anti-pattern de duplicar Card+CardHeader+CardAction+Badge ×4.
- Auditoria: `dashboard-paas-primitives-2-plan.md` existe — provavelmente já tem ocorrências do pattern.

#### Files to edit
```
src/components/composites/metric-card/metric-card.tsx (NEW)
src/components/composites/metric-card/metric-card.test.tsx (NEW)
src/components/composites/metric-card/metric-card.stories.tsx (NEW)
src/components/composites/metric-card/index.ts (NEW)
registry/metric-card.json (NEW)
src/index.ts — export
```

#### Deep Dives

**API design:**
```tsx
<MetricCard
  title="Revenue"
  value="$12,345"
  delta={{ value: '+12%', trend: 'up' }}
  hint="vs last month"
  icon={<DollarSign />}
/>

{/* EC-17 absorbed: cost/expense/churn invert the semantic — "up" é ruim */}
<MetricCard
  title="Monthly Cost"
  value="$3,200"
  delta={{ value: '+18%', trend: 'up' }}
  invertTrend
/>
```

**Trend → token mapping (default + inverted):**
| trend | default invertTrend=false | invertTrend=true |
|---|---|---|
| up | `text-success` (positive growth) | `text-destructive` (cost growing = bad) |
| down | `text-destructive` (negative growth) | `text-success` (cost dropping = good) |
| neutral | `text-muted-foreground` | `text-muted-foreground` |

Default `invertTrend=false` matches consumer expectation para Revenue/Users/Conversions (~80% dos casos comuns). Prop opt-in para Cost/Churn/Latency.

**Composition:**
Internamente usa Card + Badge + lucide icons.

#### Tasks
1. Implementar component com prop `invertTrend?: boolean = false` (EC-17).
2. Documentar tabela trend mapping em JSDoc.
3. Tests + stories incluindo case `invertTrend`.
4. Registry JSON.
5. Update README.md component catalog.

#### TDD
```
RED:     metric-card.test.tsx: renders title, value, delta with correct trend color.
GREEN:   Implement.
VERIFY:  pnpm test && pnpm quality:structure (registry validation)
```

#### Acceptance Criteria
- [ ] Component shipped
- [ ] Registry entry valid
- [ ] Tests covering 5+ cases
- [ ] Pass code-audit

#### DoD
- [ ] MetricCard shipped + documented

---

### T4.3 — Refactor consumers

#### Objective
Migrar quaisquer ocorrências de pattern "metric card duplicado" em `src/screens/` / `playground/` / consumer apps para usar MetricCard.

#### Files to edit
```
(TBD via grep) — qualquer `Card.*CardHeader.*Badge` em dashboard contexts
```

#### Tasks
1. `grep -rn "<Card>" src/screens playground` para identificar candidatos.
2. Refactor para `<MetricCard>`.
3. Visual snapshot diff esperado (review manual).

#### Acceptance Criteria
- [ ] Zero duplicação de pattern em screens/playground
- [ ] Visual preserved

#### DoD
- [ ] Refactor complete

---

## Phase 5: Quality infrastructure

**Objective:** Pre-commit hooks, container queries, prefers-color-scheme, forced-colors, CI gates.

### T5.1 — `prefers-color-scheme` auto-detect (D6)

#### Files to edit
```
src/themes/theme-provider.tsx — add respectSystemMode prop, integrate matchMedia
src/themes/theme-script.tsx — SSR no-flash respeitando matchMedia
src/themes/theme-provider.test.tsx — 4 new tests
src/themes/theme-script.test.tsx — 2 new tests
```

#### Tasks
1. Add `respectSystemMode?: boolean = true` prop.
2. Integrate matchMedia subscribe **com cleanup explícito via `useEffect` return** (EC-12):
   ```tsx
   useEffect(() => {
     if (!respectSystemMode) return;
     const mql = window.matchMedia('(prefers-color-scheme: dark)');
     const onChange = (e: MediaQueryListEvent) => {
       if (!userHasManuallyOverridden.current) {
         setModeState(e.matches ? 'dark' : 'light');
       }
     };
     mql.addEventListener('change', onChange);
     return () => mql.removeEventListener('change', onChange);
   }, [respectSystemMode]);
   ```
3. Track `userHasManuallyOverridden` via `useRef<boolean>` — set true em `setMode()` user-called; system changes ignoradas after manual override.
4. SSR script: emit inline `<script>` que reads matchMedia + localStorage antes da hidratação. Requer CSP nonce (já gerenciado por `ThemeScript`).
5. **Precedence semantics**: explicitar em JSDoc + docs/design-system.md:
   - `defaultMode` prop = "initial mode if no system signal + no stored preference" (NOT override absoluto se respectSystemMode=true)
   - Para forçar mode independente do system, usar `respectSystemMode={false}` + `defaultMode="dark"`
   - Consider rename to `initialMode` em major version futura para clarity (NÃO neste plano — breaking).
6. Tests (6+ casos incluindo cleanup assertion).

#### TDD
```
RED:     test_respects_prefers_color_scheme_dark_default
RED:     test_user_explicit_setMode_overrides_system_subsequently
RED:     test_subscribe_to_system_changes_when_not_overridden
RED:     test_ssr_script_reads_matchMedia
RED:     test_cleanup_removes_matchMedia_listener_on_unmount (EC-12 — render, capture mql ref, unmount, assert removeEventListener foi chamado)
RED:     test_respectSystemMode_false_disables_subscribe (no matchMedia listener added)
GREEN:   Implement with proper cleanup.
REFACTOR: Extract matchMedia subscription into custom hook useSystemColorScheme.
VERIFY:  pnpm test
```

#### Acceptance Criteria
- [ ] System mode detection works
- [ ] Backward compat: `defaultMode` prop ainda funciona (semantics esclarecida em docs)
- [ ] No SSR flash
- [ ] Cleanup: listener removed on unmount (asserted by test)
- [ ] User manual setMode override persiste contra system changes subsequentes
- [ ] Pass: code-audit coverage

#### DoD
- [ ] Feature shipped
- [ ] Zero listener leaks (validated via test)
- [ ] Docs explicit sobre precedence

---

### T5.2 — `forced-colors` (WHCM) support (D7)

#### Files to edit
```
src/styles/tokens.css — add @media (forced-colors: active) block mapping to system colors
src/styles/tokens.css — texture utilities get forced-color-adjust: none
docs/design-system.md — document forced-colors support
```

#### Tasks
1. Add forced-colors block.
2. Add forced-color-adjust opt-outs.
3. Manual test em Edge + simulate WHCM.

#### TDD
```
RED:     N/A — CSS only, validar via Playwright forced-colors emulation
GREEN:   Add CSS.
VERIFY:  Playwright spec usando page.emulateMedia({ forcedColors: 'active' })
```

#### Acceptance Criteria
- [ ] forced-colors active = system colors aplicadas
- [ ] Decorative components não quebram

#### DoD
- [ ] WHCM support shipped + tested

---

### T5.3 — Playwright visual matrix CI gate (D9)

#### Files to edit
```
package.json — quality:gates includes quality:visual
.github/workflows/ci.yml (or equiv) — Docker runner
```

#### Tasks
1. Integrate `quality:visual` em `quality:gates` chain.
2. CI pin Docker image.

#### Acceptance Criteria
- [ ] CI runs visual on every PR
- [ ] Diff bloqueia merge

#### DoD
- [ ] Gate ativo em CI

---

### T5.4 — WCAG contrast CI gate (D10)

#### Files to edit
```
package.json — quality:gates includes quality:contrast (hard fail)
docs/quality-gates.md — document
```

#### Tasks
1. Promote `quality:contrast` to hard gate.
2. Update docs.

#### Acceptance Criteria
- [ ] CI runs contrast on every PR
- [ ] Hard fail mode

#### DoD
- [ ] Gate active

---

### T5.5 — Container queries primitives (modern responsive)

#### Objective
Adicionar utilities `@container/<name>` em tokens-v4.css + documentar pattern (componentes que sabem responder ao tamanho do CONTAINER pai, não ao viewport).

#### Files to edit
```
src/styles/tokens-v4.css — add container utilities
docs/design-system.md — document container query pattern
src/components/composites/metric-card/metric-card.tsx — usa @container query como demo
```

#### Tasks
1. Add container utilities.
2. Demo no MetricCard.
3. Docs.

#### Acceptance Criteria
- [ ] Container queries disponíveis
- [ ] Demo funcional

#### DoD
- [ ] Pattern shipped

---

## Phase 6: Documentation + Consolidation

### T6.1 — Migration guide consumer-facing

#### Files to edit
```
docs/migration/hsl-to-oklch.md (NEW)
CHANGELOG.md — major entry
```

#### Tasks
1. Write migration guide cobrindo: themes custom, helpers, ColorScale type changes, status tokens novos.
2. CHANGELOG entry (Added, Changed, Deprecated sections).

#### DoD
- [ ] Migration guide publicado

---

### T6.2 — ADR-0007 status semantic tokens

#### Files to edit
```
docs/adr/0007-status-semantic-tokens.md (NEW)
```

#### DoD
- [ ] ADR escrito

---

### T6.3 — ADR-0008 forced-colors support

#### Files to edit
```
docs/adr/0008-forced-colors-whcm-support.md (NEW)
```

#### DoD
- [ ] ADR escrito

---

### T6.4 — ADR-0009 prefers-color-scheme default

#### Files to edit
```
docs/adr/0009-prefers-color-scheme-default.md (NEW)
```

#### DoD
- [ ] ADR escrito

---

### T6.5 — Update CONTRIBUTING.md + README.md component catalog

#### Files to edit
```
CONTRIBUTING.md — references novas a ADRs, lint rules
README.md — atualizar catalog com MetricCard, StatusDot composite
PITCH.md — atualizar "Why @theokit/ui" se aplicável
```

#### DoD
- [ ] Documentation refreshed

---

## Coverage Matrix

| # | Gap / Requirement | Task(s) | Resolution |
|---|---|---|---|
| 1 | 12 cores literais Tailwind quebrando theme switching | T1.1, T1.2 | Status tokens criados, sweep aplicado |
| 2 | Sem prevenção de regressão para cor literal | T1.3, T1.4 | Lint rule + ADR-0004 |
| 3 | HSL split format obsoleto vs comunidade OKLCH | T2.1-T2.8 | Migração completa para OKLCH + ADR-0005 |
| 4 | `primary-deep`/`primary-glow` duplicados manualmente em 11 themes | T3.1-T3.4 | Derivação algorítmica via `oklch(from ...)` + ADR-0006 |
| 5 | gateway-status-indicator misturando status com success/destructive | T4.1, D4 | StatusIndicator composite + status semantic tokens + ADR-0007 |
| 6 | Pattern "metric card" duplicável sem composite | T4.2, T4.3 | MetricCard composite |
| 7 | Sem visual regression baseline | T0.1, T5.3 | Playwright + 100 snapshots + CI gate |
| 8 | Sem WCAG AA automatic validation | T0.2, T5.4 | Contrast auditor + CI gate |
| 9 | Sem suporte forced-colors (WHCM) | T5.2, T6.3 | @media block + ADR-0008 |
| 10 | Hardcoded defaultMode="dark" sem respeito a system | T5.1, T6.4 | respectSystemMode prop + ADR-0009 |
| 11 | Regex allowlist frágil para theme validation | T2.7 (D5) | Valibot schema + defense in depth |
| 12 | Sem container queries idiom | T5.5 | Utilities + demo |
| 13 | Documentação não reflete decisões novas | T6.1-T6.5 | Migration guide + 4 ADRs + README/CONTRIBUTING refresh |
| 14 | EC-1: Font async loading torna snapshots flaky | T0.1 task 4 | `document.fonts.ready` await pré-screenshot |
| 15 | EC-2: Animations durante screenshot geram pixel diff inerente | T0.1 task 2 | Playwright `animations: 'disabled'` |
| 16 | EC-3: HSL split sem `hsl()` wrapper não parseável por culori | T0.2, T2.1 | `parseColorScaleValue()` wrapper helper |
| 17 | EC-4: Migration script destruindo `--shadow-*` que usam `hsl(var(--x))` | T2.2 | Regex filtra apenas declarações puras; texture utilities migradas manualmente em T2.5 |
| 18 | EC-5: `COLOR_VALUE_PATTERN` regex rejeita `oklch(from ... calc())` | T2.5 | Regex expandido com positive/negative tests; extraído como `color-value-pattern.ts` |
| 19 | EC-6: Bundle Zod ~12KB (não ~3KB) — eager import em sync constructor | T2.7, D5 revisado | Substituição por Valibot ~1.5KB |
| 20 | EC-7: `calc(l - 0.16)` clipa em themes dark, primary-deep vira preto | T3.1 | `max(0.05, ...)` floor + `min(0.95, ...)` ceiling |
| 21 | EC-8: Lint regex precisa cobrir variants Tailwind (data-/hover:/[&_svg]:) | T1.3 | 6+ test cases incluindo variants |
| 22 | EC-10: Alpha modifier em token semântico requer Tailwind v4 specific syntax | T1.2 | Smoke spec `getComputedStyle()` parse alpha |
| 23 | EC-11: WCAG contrast com cores que têm alpha precisa background composition | T0.2 | Fixture cobrindo alpha + composição |
| 24 | EC-12: matchMedia listener leak em unmount | T5.1 | `useEffect` cleanup + test assertion |
| 25 | EC-13: Snapshot determinism cross-OS | T0.1, T5.3 | Docker pinned + `quality:visual:docker` script |
| 26 | EC-14: APCA vs WCAG 2.x escolha | T0.2 (documented) | ADR mencionar; revisão Q4 2026 |
| 27 | EC-15: forced-colors perde semântica status | T5.2 (documented) | ADR documenta limitação WHCM |
| 28 | EC-16: HSL→OKLCH não-lossless | T2.4 (documented) | CHANGELOG menciona delta ~0.001 |
| 29 | EC-17: MetricCard trend semantics arbitrária | T4.2 | Prop `invertTrend?: boolean` |
| 30 | Hierarchy invariant: composite → primitive (never reverse) | T4.1 | `StatusIndicator` composite consome `StatusDot` primitive; primitives unchanged |

**Coverage: 30/30 gaps + edge cases covered (100%)**

## Global Definition of Done

- [ ] All phases (0-7) completed
- [ ] `pnpm quality:gates` exits 0 (inclui visual + contrast + lint + structure + bundle + a11y + ladle)
- [ ] Zero biome/lint warnings
- [ ] Zero typecheck errors
- [ ] Backward compatibility: consumers usando old hex/rgb helpers ainda funcionam (deprecated paths)
- [ ] 4 new ADRs commitados (0004, 0005, 0006, 0007, 0008, 0009) — total 6
- [ ] CHANGELOG.md major entry
- [ ] Migration guide publicado
- [ ] Visual snapshots regenerados intentionalmente (com commit message explicando regeneration scope)
- [ ] WCAG AA preservado em todos 11 themes (T0.2 baseline ≥)
- [ ] Bundle delta ≤ +4KB gzipped total (Valibot ~1.5KB + culori tree-shaken ~2KB + helpers ≤0.5KB; verify via `pnpm quality:bundle`)
- [ ] EC-1/EC-2: visual snapshots determinísticos (font ready awaited + animations disabled)
- [ ] EC-5: regex `COLOR_VALUE_PATTERN` aceita relative OKLCH syntax (validado por 5+ positive + 5+ negative tests)
- [ ] EC-7: tonal derivation clamps verificados em 4+ dark themes (chroma > 0.02, L > 0.05)
- [ ] EC-12: zero matchMedia listener leaks (assertion no test unmount)
- [ ] **Dogfood QA PASS** — `/dogfood full` health score >= 70, zero CRITICAL issues
- [ ] **Runtime-metric proof**: theme switching no playground troca cores em todos componentes refatorados (T1.2 consumers + T4.1/T4.2 composites) — verificado manual via 3 themes representativos (violet-forge, dracula, github-dark)

## Final Phase: Dogfood QA (MANDATORY)

> Esta fase roda APÓS toda implementação. Plan não é done até dogfood passar.

**Objective:** Validar mudanças como um consumer real experienciaria — não apenas via unit tests.

### Execution

Para `@theokit/ui` o equivalente de "dogfood full" é:
1. `pnpm quality:gates` (full chain) exits 0
2. Build local + install em consumer fixture (`tests/fixture-shadcn-app/`)
3. Smoke render de 5 componentes representativos em 3 themes via Ladle browser
4. Manual theme switching test em playground app

### Acceptance Criteria

- [ ] Health score >= 70/100 (proxy: zero CRITICAL gates failing)
- [ ] Zero CRITICAL issues introduzidos por este plan
- [ ] Zero HIGH issues em componentes modificados
- [ ] Issues pré-existentes documentados em `.claude/knowledge-base/reviews/` (não bloqueiam plan)

### If Dogfood Fails

1. Identify issues plan-caused vs pré-existentes
2. Fix all plan-caused CRITICAL e HIGH
3. Re-run quality:gates + manual smoke
4. Pré-existentes logados mas não bloqueiam

---

## Notas operacionais

- **Architecture snapshot (BEFORE)**: tomado via auditoria manual nesta sessão (skill `architecture-docs` não disponível no scope). Estado documentado em "Context" section.
- **Edge case review**: rodar `/edge-case-plan theo-ui-community-best-practices-alignment` após aprovação do plan.
- **Cross-validation**: rodar `/cross-validation theo-ui-community-best-practices-alignment` após implementação, ANTES do dogfood.
- **Estimativa total de esforço**: 5-8 dias de trabalho focado (Phases 0-4 ~4 dias; Phases 5-6 ~2 dias; dogfood + ajustes ~1-2 dias).
- **Risco principal**: Phase 2 (OKLCH migration) — mitigado por baseline visual (T0.1) + WCAG contrast (T0.2) que detectam regressão objetivamente.
- **Reversibilidade**: cada phase é commit isolado; rollback via `git revert` por phase.
