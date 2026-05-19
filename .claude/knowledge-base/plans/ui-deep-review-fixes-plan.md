# Plan: `@usetheo/ui` — Deep Review Remediation

> **Version 1.0** — Este plano corrige integralmente os 7 BLOCKERs, 8 HIGH, 15 MEDIUM e ~26 LOW/NIT levantados pela auditoria técnica de 2026-05-13 sobre `@usetheo/ui`. O outcome esperado é (a) artefato `dist/` consumível em projeto externo via `pnpm add @usetheo/ui` sem assets quebrados; (b) registry shadcn livre de cssVars stale e JSDoc enganoso; (c) componentes com paridade documental real (README ↔ código ↔ docs/design-system.md); (d) `CommandPalette` + `ModeSwitcher` em conformidade com a própria Quality Gate §4; (e) suporte a `prefers-reduced-motion`, SSR seguro no `ThemeProvider`, sem fake affordances; (f) `CHANGELOG.md` + `LICENSE` presentes e bloqueados em CI; (g) testes com cobertura comportamental + a11y assertions via `jest-axe` nos primitives críticos. Pós-execução, o pacote está apto para tag `0.1.0-beta` no npm.

## Context

A revisão técnica produzida em `deep-review-2026-05-13` documentou divergências significativas entre o discurso público (README, badges, design-system.md) e o estado real do código. Os achados materiais:

- **Empacotamento quebrado**: `dist/styles.css` referencia `./fonts.css` que não é copiado pelo `tsup.config.ts:12` (`onSuccess` cp só de `tokens.css` e `global.css`). Todo consumidor npm recebe 404 ao importar `@usetheo/ui/styles.css`.
- **Fontes da verdade conflitantes**: `tokens.css` declara Geist + paleta Vercel-grayscale; `docs/design-system.md` ainda descreve Boska/Switzer + paleta warm violet-tinted; `registry/tokens.json` `cssVars` repete a paleta antiga; JSDoc de `violet-forge.ts:7` cita Boska/Switzer literalmente. Três artefatos, três versões.
- **Catálogo do README mente**: badges `components-84` e `tests-162` (real 99 / 389); composites listam 12 (real 14); seis nomes inexistentes anunciados como componentes (`ToolPalette`, `TerminalPane`, `TerminalLine`, `TaskBreadcrumbs`, `TaskStatusPill`, `ShellCommandCard`).
- **Self-violation de Quality Gate**: `docs/quality-gates.md §4` exige "active item + arrow keys + Enter + Escape + ranking" para command surfaces; `command-palette.tsx` ship só substring + click.
- **Acessibilidade**: 15 ocorrências de `animate-*` sem qualquer `prefers-reduced-motion`; `TopNav.ModeSwitcher` usa `role="tab"` sem keyboard handling; `aria-hidden` boolean sem valor em ~15 lugares; `TerminalPanel`/`BuildLogStream` sem `aria-live`; `aria-hidden` em `<svg>` decorativos OK mas inconsistente.
- **Governança**: `CHANGELOG.md` ausente (viola `CLAUDE.md` global do time §6); `LICENSE` ausente (`package.json` declara Apache-2.0; README badge linka `./LICENSE` 404).
- **SSR**: `ThemeProvider` lê `localStorage` no initial state setter sem `<ThemeScript>` injetável — hydration mismatch garantido em Next 14/15.
- **Performance**: `BuildLogStream` renderiza 10k+ linhas sem virtualização; `TokenUsageChart` sem binning.
- **Doc-vs-code drift menor**: PermissionMatrix JSDoc promete `toolOptions=[]` esconde form (não esconde — array vazio é truthy); Dialog overlay JSDoc diz "violet-tinted 60%" mas código tem `bg-background/80`; `defaultMode="light"` contra README "dark-first".
- **TS modernidade**: 3 arquivos usam `JSX.Element` global (quebra React 19+); composites importam `*/<name>.js` ao invés de `*/index.js` (bypassa barrel).

Evidência completa: `<conversation>` desta sessão, seção "Deep Technical Review — `@usetheo/ui`".

## Objective

"Done" = (a) `pnpm pack` produz tarball que instala em projeto vite vazio com `import "@usetheo/ui/styles.css"` resolvendo 200 para fonts.css + Geist carregando; (b) `pnpm quality:gates` continua verde com gates novos que bloqueiam regressão das classes de bug encontradas; (c) auditoria axe-core em primitives críticos retorna zero violations; (d) README, docs/design-system.md, JSDocs e registry concordam em 100% sobre nomes, contagens, paleta e tipografia.

Metas mensuráveis:
1. **Zero BLOCKERs abertos** após Fases 1-3.
2. **Zero HIGH** após Fase 4.
3. **Cobertura comportamental ≥ 8 testes** em todos os primitives marcados "high-risk" (button, dialog, command-palette, permission-matrix, chat-composer, agent-event, sidebar, topnav).
4. **Health score `/dogfood full` ≥ 75/100** no fim, com zero CRITICAL.
5. **Bundle size dist/index.js dentro de ±5% do baseline** atual (não regredir tree-shaking ao mexer em padrões `Card.Header`).
6. **`pnpm quality:gates`** ganha 4 gates novos (LICENSE, CHANGELOG, README-drift, fixture-install) e roda em ≤ 3 min em CI.

## ADRs

### D1 — Manter Geist como família tipográfica única do Violet Forge
- **Decisão**: Não voltar para Boska/Switzer. Geist é normativo em todos os artefatos.
- **Rationale**: A migração foi feita em commits `2cd1b9f` e `69c2c78` por feedback real ("Boska hard to read at body sizes"). O gate `validateDesignSystemFidelity` em `validate-quality-gates.ts` já enforce Geist. Reverter seria desperdício e gera novo drift. Custo de aceitar: reescrever `docs/design-system.md`.
- **Consequences**: Toda referência a Boska/Switzer fora de `docs/audit/*.md` é erro. Habilita gate que falha em drift futuro.

### D2 — Uma fonte de verdade para o registry de tokens (apenas `files[]`, sem `cssVars`)
- **Decisão**: Remover o bloco `cssVars` do `registry/tokens.json`. O `files[].content` (que inlines `src/styles/tokens.css`) é a única fonte.
- **Rationale**: Dois lugares = dois drifts. shadcn CLI versão futuras podem mudar prioridade entre `files` e `cssVars`. Manter apenas `files` casa com a postura "copy-paste com source de verdade no repo".
- **Consequences**: Consumidor que dependia de shadcn theme generator perderá hints. Trade-off aceitável (poucos consumidores nessa fase).

### D3 — Adotar `cmdk` em vez de re-implementar comando palette do zero
- **Decisão**: `CommandPalette` migra para dep `cmdk` (4.5 KB gz, maintido pelo time shadcn).
- **Rationale**: Implementar keyboard nav + ranking corretamente custa ≥ 2 dias + bateria de testes. `cmdk` é o pattern de fato no ecossistema (shadcn-ui usa). Footprint pequeno, API estável.
- **Consequences**: +1 dep direta. API do `CommandPalette` muda levemente (consumer ganha mais slots). Migration note no CHANGELOG.

### D4 — `prefers-reduced-motion` via CSS global em `tokens.css`, não opt-in por componente
- **Decisão**: Adicionar `@media (prefers-reduced-motion: reduce)` global em `tokens.css` que zera `--duration-*` + neutraliza animações. Componentes não precisam de prop.
- **Rationale**: Cobertura uniforme. Single point of control. Componentes individuais que precisarem da animação como sinal semântico (spinner running) usam Tailwind `motion-safe:animate-spin` (opt-in).
- **Consequences**: Override global pode atrapalhar animações intencionais que o consumidor queira preservar mesmo com reduce. Documentar override pattern em `docs/design-system.md`.

### D5 — Manter `ThemeProvider` com runtime CSS injection + adicionar `<ThemeScript>` para SSR
- **Decisão**: Não substituir por `next-themes`. Manter o runtime atual + exportar componente helper `<ThemeScript>` que renderiza `<script>` inline aplicando `data-theme` antes do React hydratar.
- **Rationale**: Substituir lib externa criaria churn. O problema concreto é hydration mismatch — `<ThemeScript>` resolve sem trocar a arquitetura interna.
- **Consequences**: Consumer Next/Astro/Remix precisa lembrar de adicionar `<ThemeScript />` no `<head>`. Documentar com exemplo.

### D6 — Catálogo do README deve ser gerado/validado, não escrito à mão
- **Decisão**: Adicionar `scripts/sync-readme.ts` (renderiza catálogo de `src/index.ts`) + gate em `validate-quality-gates.ts` que falha se README cita nome fora dos exports.
- **Rationale**: Drift entre README e código foi BLOCKER-005. Solução manual sempre regride. Geração + gate é a única estratégia que sobrevive a 6 sprints.
- **Consequences**: PRs que adicionam componente precisam rodar `pnpm sync:readme` antes de mergear. Documentar no CONTRIBUTING.

### D7 — `JSX.Element` global → `import type { JSX } from "react"`
- **Decisão**: Refatorar 3 ocorrências para o pattern compatível com React 18.3+ e React 19.
- **Rationale**: React 19 (em RC quando este plano roda) remove global JSX. Mudar agora é cheap.
- **Consequences**: Tipos públicos não mudam. Zero quebras consumer-side.

### D8 — Não bloquear plano em testes de regressão visual nesta iteração
- **Decisão**: Chromatic / Percy fica fora desta plan. Adicionado em backlog como pré-req v1.0.0.
- **Rationale**: Custo (~3 dias) + infra externa. Para `0.1.0-beta` o conjunto unit + e2e + axe é suficiente.
- **Consequences**: Plano não cobre regressão visual. Marcar follow-up plan.

### D9 — Cobertura de testes via `pnpm test --coverage` opt-in, não required em gate (ainda)
- **Decisão**: Adicionar `pnpm test:coverage` script com `vitest --coverage` + thresholds *relaxed* (50% global, 80% nos primitives críticos). Não rodar em `quality:gates` ainda.
- **Rationale**: Forçar 90% em todos os 99 componentes neste sprint significa parar tudo. Subir threshold é roadmap v1.0.
- **Consequences**: CI ganha 1 job opcional (manual trigger). Threshold real só após estabilização.

### D10 — Apêndice histórico para conteúdo legado de docs
- **Decisão**: Mover material exploratório (`Direção A/B/C/D + Decisão pendente`, `Fases 8.1-8.6`, nomes `TheoKit`/`TheoBrutal`) para `docs/audit/2026-05-decisions.md`. Manter no git mas marcado como histórico.
- **Rationale**: Apagar destrói rationale futura. Manter no doc normativo polui o sinal.
- **Consequences**: Novo arquivo histórico. Doc normativo enxuto.

## Dependency Graph

```
Phase 0 (baseline) ──▶ Phase 1 (docs truth) ──┬──▶ Phase 3 (CommandPalette)
                                              │
                       Phase 2 (build/registry)┤
                                              │
                                              ├──▶ Phase 4 (a11y)
                                              │
                                              ├──▶ Phase 5 (ThemeProvider SSR)
                                              │
                                              ├──▶ Phase 6 (perf)
                                              │
                                              └──▶ Phase 7 (test hardening)
                                                              │
                                                              ▼
                                                       Phase 8 (MEDIUM batch)
                                                              │
                                                              ▼
                                                       Phase 9 (LOW/NIT polish)
                                                              │
                                                              ▼
                                                       Phase 10 (Dogfood QA)
```

- **Phase 0** é prerequisito apenas (criar baseline, gates esqueleto).
- **Phase 1** (docs/README/license/changelog) e **Phase 2** (build/registry) **podem rodar em paralelo** — não compartilham arquivos.
- **Phases 3, 4, 5, 6, 7** **podem rodar em paralelo** entre si após Phase 1 ∧ 2 — cada um toca arquivos disjuntos. Único cuidado: Phase 7 ajusta tests existentes; se outra phase mudou estrutura de componente, rebases podem ser necessários (ordem sugerida: 3 → 4 → 5 → 6 → 7).
- **Phase 8** depende de tudo anterior porque consolida MEDIUMs que dependem do shape final.
- **Phase 9** é cosmético; pode atrasar até Phase 10 sem bloquear.
- **Phase 10** (dogfood) é gate final obrigatório.

---

## Phase 0: Baseline & Gate Skeleton

**Objective:** Estabelecer baseline mensurável e adicionar slots vazios para os gates novos antes de mexer em qualquer código de produção.

### T0.1 — Snapshot do baseline pré-fix

#### Objective
Capturar métricas atuais (bundle size, contagem real de componentes, testes, registry items) para comparação pós-fix.

#### Evidence
Sem baseline, não conseguimos provar que tree-shaking não regrediu nem que README ficou sincronizado de fato.

#### Files to edit
```
.claude/knowledge-base/architecture/usetheo-ui/baseline-2026-05-13.md — (NEW) métricas
```

#### Deep file dependency analysis
- Arquivo novo, sem dependências. Conteúdo é texto livre.

#### Deep Dives
- Métricas a coletar:
  - `du -sh dist/index.js` (bytes)
  - `du -sh dist/styles.css`
  - `find src/components/primitives -maxdepth 1 -type d | wc -l`
  - `find src/components/composites -maxdepth 1 -type d | wc -l`
  - `pnpm test 2>&1 | grep "Tests "`
  - `ls registry/r/*.json | wc -l`
  - `cat package.json | jq '.version'`
- Hash do commit base: `69c2c78`.

#### Tasks
1. Rodar `pnpm install --frozen-lockfile && pnpm build && pnpm test` em clean state.
2. Coletar as métricas acima.
3. Escrever `baseline-2026-05-13.md` com os números e o commit hash.
4. `git add -N` (intent to add) mas NÃO commitar ainda (arquivo de knowledge-base local).

#### TDD
```
RED:     (não aplicável — task é coleta de baseline)
GREEN:   Métricas registradas em arquivo Markdown
REFACTOR: None expected
VERIFY:  cat .claude/knowledge-base/architecture/usetheo-ui/baseline-2026-05-13.md
```

#### Acceptance Criteria
- [x] Arquivo baseline existe com 7 métricas listadas.
- [x] Commit hash registrado.
- [x] Comando exato usado documentado ao lado de cada métrica.

#### DoD
- [x] Arquivo baseline criado.
- [x] Pass: leitura cruzada — `pnpm build` produz mesmo `dist/index.js` size.

---

### T0.2 — Esqueleto de gates novos em `validate-quality-gates.ts`

#### Objective
Adicionar as funções vazias dos gates que serão implementados nas próximas phases para que o script seja extensível sem refactor grande.

#### Evidence
Adicionar gates incrementalmente exige slots; melhor preparar a estrutura uma vez do que mutar o script 4 vezes.

#### Files to edit
```
scripts/validate-quality-gates.ts — adicionar 4 funções stub: validateGovernanceFiles, validateReadmeDrift, validateDocsTypography, validateCompositeBarrel
```

#### Deep file dependency analysis
- `validate-quality-gates.ts` hoje tem ~215 linhas, 5 funções: `validateComponentStructure`, `validateRegistryStoriesAndTests`, `validatePublicExports`, `validateDesignSystemFidelity`, `validateScriptsAndCi`.
- Cada nova função é chamada do `main()` ao lado das existentes.
- Não modifica nenhum outro arquivo.

#### Deep Dives
- Stubs retornam `void`, registram nada em `failures`/`warnings` (no-op).
- Ordem em `main()`: governance → readme-drift → docs-typography → composite-barrel → existentes.

#### Tasks
1. Adicionar 4 funções stub `async function validateXxx(): Promise<void> { /* TODO Phase N */ }` no `validate-quality-gates.ts`.
2. Chamar todas em `main()` em ordem definida.
3. Rodar `pnpm quality:structure` e confirmar PASS verde.

#### TDD
```
RED:     n/a — stubs são no-op, não há comportamento a falhar
GREEN:   pnpm quality:structure → "Quality gate structure validation passed."
REFACTOR: None expected
VERIFY:  pnpm quality:structure 2>&1 | grep "passed"
```

#### Acceptance Criteria
- [x] 4 stubs criados como funções async.
- [x] Stubs chamados em `main()`.
- [x] `pnpm quality:structure` passa verde.
- [x] Zero linhas a mais de falha — stubs são silenciosos.

#### DoD
- [x] `pnpm lint:ci && pnpm typecheck && pnpm quality:structure` verdes.

---

## Phase 1: Documentation Truth Restoration

**Objective:** Eliminar todo drift entre o que README/JSDoc/docs dizem e o que o código entrega. Fechar BLOCKERs 002, 003, 005, 007.

### T1.1 — Criar `LICENSE` (Apache-2.0)

#### Objective
Adicionar o texto completo Apache-2.0 na raiz do repo para satisfazer obrigação de redistribuição + remediar 404 no badge do README.

#### Evidence
`package.json:5` declara `"license": "Apache-2.0"`. `README.md:11` linka `./LICENSE`. `ls LICENSE` → 404.

#### Files to edit
```
LICENSE — (NEW) texto integral Apache-2.0 com copyright "2026 usetheo.dev"
package.json — adicionar "LICENSE" no array files (já existe array, só inserir)
```

#### Deep file dependency analysis
- `package.json.files: ["dist", "src", "registry"]` precisa ganhar `"LICENSE"` e `"CHANGELOG.md"` (próxima task) para que `pnpm pack` inclua.
- Sem mudanças runtime, sem impacto em consumidores existentes.

#### Deep Dives
- Texto canônico Apache-2.0: https://www.apache.org/licenses/LICENSE-2.0.txt (231 linhas).
- Copyright line: `Copyright 2026 usetheo.dev`.

#### Tasks
1. Baixar texto LICENSE.txt do apache.org (ou cópia do projeto irmão).
2. Substituir bracket do copyright pela linha do step 1.
3. Editar `package.json#files` para `["dist", "src", "registry", "LICENSE", "CHANGELOG.md"]`.
4. Rodar `pnpm pack --dry-run` e verificar que LICENSE entra na lista.

#### TDD
```
RED:     pnpm pack --dry-run | grep -c "LICENSE" === 0   (antes do fix)
GREEN:   pnpm pack --dry-run | grep -c "LICENSE" >= 1
REFACTOR: None
VERIFY:  pnpm pack --dry-run 2>&1 | grep LICENSE
```

#### Acceptance Criteria
- [x] `LICENSE` existe em raiz, 231 linhas, contém literal `Apache License, Version 2.0`.
- [x] `Copyright 2026 usetheo.dev` no campo bracket.
- [x] `package.json.files` inclui `"LICENSE"`.
- [x] `pnpm pack --dry-run` lista LICENSE.

#### DoD
- [x] README badge de licença resolve 200 (após push).
- [x] `pnpm pack --dry-run` mostra LICENSE incluído.

---

### T1.2 — Criar `CHANGELOG.md` inicial (Keep-a-Changelog)

#### Objective
Adicionar `CHANGELOG.md` na raiz com seção `[Unreleased]` retroativa cobrindo os últimos 5 commits significativos. Bloquear release sem entry no gate.

#### Evidence
`CLAUDE.md` global do user §6: "Todo projeto DEVE manter um CHANGELOG.md na raiz do repositório". `ls CHANGELOG.md` → 404. `git log --oneline -5` mostra 5 commits relevantes sem registro.

#### Files to edit
```
CHANGELOG.md — (NEW) Keep-a-Changelog format
package.json — files array (já adicionado em T1.1)
```

#### Deep file dependency analysis
- Arquivo único, sem deps em código.
- Gate de governança em T1.7 lerá este arquivo.

#### Deep Dives
- Categorias permitidas (CLAUDE.md global): Added, Changed, Deprecated, Removed, Fixed, Security.
- Toda entry referencia ticket/PR. Sem ticket → use commit hash curto.

#### Tasks
1. Inspecionar `git log --oneline -15` e categorizar.
2. Escrever `CHANGELOG.md`:
   ```
   # Changelog
   All notable changes will be documented here. Format: Keep a Changelog. Versioning: SemVer.

   ## [Unreleased]
   ### Added
   - Registry quality hardening: descriptions refinement, L3 audit, full test coverage (#69c2c78)
   - Mode-aware sidebar workspaces + PaaS surfaces (replaces cowork with infra) (#b4e2835)
   - Vercel-aligned theme + playground app + agent transparency suite + customize sheets (#2cd1b9f)
   - Component library reorganization + Violet Forge DS + agent primitives + quality gates (#5c95373)
   ### Changed
   - Replace Boska/Switzer/JetBrains Mono direction with Geist Sans + Geist Mono (#2cd1b9f)
   ### Fixed
   - (nada released ainda)
   ```
3. Commit message no commit do plan: `docs(changelog): backfill initial [Unreleased] entries`.

#### TDD
```
RED:     test "changelog has Unreleased section" — assert file contains "## [Unreleased]"
GREEN:   após criar o file
REFACTOR: None
VERIFY:  grep "## \[Unreleased\]" CHANGELOG.md
```

#### Acceptance Criteria
- [x] `CHANGELOG.md` existe.
- [x] Tem seção `## [Unreleased]`.
- [x] Entries referenciam commit hash ou PR.
- [x] Header explica formato + versionamento.

#### DoD
- [x] Arquivo presente.
- [x] Gate de governança T1.7 valida sua existência.

---

### T1.3 — Reescrever `docs/design-system.md` como referência pós-Geist

#### Objective
Substituir o conteúdo stale por uma especificação fiel ao código atual. Mover o material legado (Direções A/B/C/D, "Decisão pendente") para `docs/audit/2026-05-decisions.md`.

#### Evidence
`docs/design-system.md` diz "Boska + Switzer + JetBrains Mono" e type-scale 72/56/44/36/28; `tokens.css` ship Geist + 64/48/40/32/28; o gate `validateDesignSystemFidelity` enforce o estado atual; README aponta este doc como "Full spec". (BLOCKER-002)

#### Files to edit
```
docs/design-system.md — REWRITE: paleta atual, type scale atual, Geist canônico
docs/audit/2026-05-decisions.md — (NEW) conteúdo histórico das Direções A/B/C/D
README.md — verificar que linka design-system.md (já linka, confirmar texto bate)
```

#### Deep file dependency analysis
- `design-system.md` hoje 432 linhas; conteúdo normativo será reescrito; histórico (linhas 218–432) move para arquivo novo.
- README.md:146 aponta para design-system.md — texto do README precisa permanecer válido após reescrita.
- Gate de tipografia (T1.9) lerá design-system.md procurando "Geist".

#### Deep Dives
- Estrutura nova:
  - Identidade Violet Forge (paragrafo curto)
  - Tokens normativos: palette light + dark com **valores reais** do `tokens.css` (HSL split + hex em comentário)
  - Tipografia: Geist Sans + Geist Mono + type scale `64/48/40/32/28/24/20/18/15/14/12`
  - Spacing scale (4px base)
  - Radii (mantém)
  - Elevation (mantém com tokens reais)
  - Motion (mantém + nota `prefers-reduced-motion`)
  - Princípios de uso
  - Link para `docs/audit/2026-05-decisions.md`
- Histórico extraído: tudo entre "## Alternativas consideradas (histórico)" até EOF do arquivo atual.

#### Tasks
1. Criar `docs/audit/2026-05-decisions.md` com header explicativo + conteúdo das Direções A-D copiado intacto.
2. Reescrever `docs/design-system.md` com paleta + scale lidos de `tokens.css` + `tailwind.config.ts` (não inventar valores).
3. Ao fim do design-system.md novo, linkar para o histórico.
4. Adicionar header em design-system.md: `> Source of truth as of 2026-05-13. Source code mirrors: src/styles/tokens.css + tailwind.config.ts + src/themes/violet-forge.ts`.

#### TDD
```
RED:     test 'design-system.md mentions Geist' — grep "Geist" docs/design-system.md → 0 (antes)
RED:     test 'design-system.md does NOT mention Boska outside Histórico section'
GREEN:   após reescrita, both grep counts mudam adequadamente
REFACTOR: None
VERIFY:  grep -c "Geist" docs/design-system.md → ≥ 3
        grep "Boska" docs/design-system.md → empty
        ls docs/audit/2026-05-decisions.md
```

#### Acceptance Criteria
- [x] `docs/design-system.md` cita Geist Sans e Geist Mono.
- [x] Não cita Boska, Switzer ou JetBrains Mono fora de uma seção marcada como histórica (ou nada).
- [x] Tabela de paleta tem mesmos valores que `tokens.css` (verificável line-by-line).
- [x] Type-scale lista 64/48/40/32/28/24/20/18/15/14/12.
- [x] `docs/audit/2026-05-decisions.md` contém Direções A-D.

#### DoD
- [x] Gate T1.9 (validateDocsTypography) implementado nesta phase passa.
- [x] Leitura cruzada com `tokens.css` confirma paridade.

---

### T1.4 — Corrigir JSDoc de `violet-forge.ts` + regenerar registry

#### Objective
Eliminar a frase "Boska + Switzer + JetBrains Mono" do JSDoc de `src/themes/violet-forge.ts` (que vaza para `registry/r/theme-provider.json`). (BLOCKER-003)

#### Evidence
`src/themes/violet-forge.ts:7` literal: `warm off-white / charcoal violet-tinted base, Boska + Switzer + JetBrains Mono.` O artefato `registry/r/theme-provider.json:26` herda essa frase em texto embutido.

#### Files to edit
```
src/themes/violet-forge.ts — JSDoc no topo (linhas 4-11)
registry/r/theme-provider.json — regenerado via pnpm registry:build (não editado à mão)
```

#### Deep file dependency analysis
- `violet-forge.ts` JSDoc é puramente cosmético — não afeta runtime.
- `pnpm registry:build` lê este arquivo e re-emite `registry/r/theme-provider.json` com o conteúdo atualizado.

#### Deep Dives
- Texto novo do JSDoc:
  ```
  /**
   * Violet Forge — the default Theo theme.
   *
   * Identity: Theo violet primary (#7C3AED), burnt sienna accent (#C96442),
   * Vercel-style neutral surfaces (pure white light / charcoal dark),
   * Geist Sans + Geist Mono throughout.
   *
   * Source of truth for `data-theme` overrides. Values mirror
   * src/styles/tokens.css for the default `:root`.
   */
  ```

#### Tasks
1. Editar `violet-forge.ts` JSDoc para o texto novo.
2. Rodar `pnpm registry:build`.
3. Verificar `grep -c Boska registry/r/theme-provider.json` retorna 0.
4. Verificar `grep -c Boska src/themes/*.ts` retorna 0.

#### TDD
```
RED:     test 'registry/r/theme-provider.json does NOT contain Boska' — grep
RED:     test 'src/themes/violet-forge.ts does NOT contain Boska' — grep
GREEN:   após edit + registry:build, grep counts = 0
REFACTOR: None
VERIFY:  grep -c Boska src/themes/violet-forge.ts → 0
        pnpm registry:build && grep -c Boska registry/r/theme-provider.json → 0
```

#### Acceptance Criteria
- [x] JSDoc de `violet-forge.ts` cita Geist Sans + Geist Mono.
- [x] JSDoc não cita Boska/Switzer/JetBrains Mono.
- [x] `registry/r/theme-provider.json` regenerado, sem Boska.
- [x] `pnpm registry:validate` passa.

#### DoD
- [x] `pnpm registry:build && pnpm registry:validate` verdes.
- [x] Gate de tipografia em T1.9 cobre regressão futura.

---

### T1.5 — Sincronizar README com código real (`scripts/sync-readme.ts`)

#### Objective
Substituir contagens hard-coded (84/162/12) e nomes inexistentes (ToolPalette, TerminalPane, TerminalLine, TaskBreadcrumbs, TaskStatusPill, ShellCommandCard) por valores derivados do filesystem. (BLOCKER-005)

#### Evidence
README declara 84 components, 162 tests, 33 registry items, 72 primitives, 12 composites; real são 99/389/109/85/14. Lista 6 nomes que não existem como exports (verificado com `grep -l` em src/).

#### Files to edit
```
README.md — substituir badges + catalog
scripts/sync-readme.ts — (NEW) gera as seções dinâmicas
package.json — adicionar script "sync:readme": "tsx scripts/sync-readme.ts"
```

#### Deep file dependency analysis
- `sync-readme.ts` lê `src/index.ts` (exports), `src/components/{primitives,composites}/*` (counts), `pnpm test --reporter=json` (test count), `registry/r/*.json` (registry count).
- README.md tem regiões delimitadas por comentários HTML `<!-- BEGIN:catalog -->` e `<!-- END:catalog -->` (a serem adicionados).
- Script idempotente: roda quantas vezes quiser.

#### Deep Dives
- Estrutura do script:
  ```ts
  // 1. Parse src/index.ts → lista de exports nomeados.
  // 2. Por export, look up se vem de primitives/ ou composites/ via path.
  // 3. Agrupar por categoria do JSDoc-header comment em src/index.ts:
  //    "// Foundations" / "// Agent transparency..." etc.
  // 4. Rodar `pnpm test --reporter=json --run` em subprocess, parsear total.
  // 5. Reescrever sections delimited em README entre <!-- BEGIN:X --> <!-- END:X -->.
  ```
- Estratégia de match: case-sensitive, nome exato como declarado em `src/index.ts`.

#### Tasks
1. Criar `scripts/sync-readme.ts` com a lógica acima.
2. Adicionar delimitadores `<!-- BEGIN:counts -->`, `<!-- BEGIN:primitives -->`, `<!-- BEGIN:composites -->` no README.md atual.
3. Rodar `pnpm sync:readme`.
4. Diff manual: confirmar que ToolPalette/TerminalPane/etc. saíram, TerminalPanel entrou, contagens corretas.
5. Adicionar script no package.json.

#### TDD
```
RED:     test 'README count matches filesystem' — script falha se grep "components-84" no README
RED:     test 'README mentions every exported component' — script lista exports, falha se algum não está no README
GREEN:   após sync:readme, ambos asserts passam
REFACTOR: Considerar usar regex de uma só pass
VERIFY:  pnpm sync:readme && git diff README.md
```

#### Acceptance Criteria
- [x] Badge `components-99` (ou número real do dia).
- [x] Badge `tests-389-passing` (ou número real).
- [x] Composites section lista 14 nomes.
- [x] Nenhum dos 6 nomes inexistentes aparece.
- [x] `TerminalPanel` aparece (era `TerminalPane` antes).
- [x] `sync:readme` script rodável.

#### DoD
- [x] Gate T1.8 (validateReadmeDrift) implementado neste plan bloqueia regressão.
- [x] `git diff README.md` mostra remoção dos 6 nomes inexistentes.

---

### T1.6 — Limpar `docs/agent-screens-composition.md` (HIGH-007)

#### Objective
Remover referências obsoletas ("TheoKit", "TheoBrutal", "Fase 8.1-8.6", "ConstraintsTable", "AgentEventGroup", "WorkingDirectorySelector", "BrandMark") e reformular como mapa atual entre stories e componentes.

#### Evidence
Doc cita 4+ nomes de componentes inexistentes em `src/`, branding antiga "TheoKit/TheoBrutal", e plano de implementação de fases já concluídas.

#### Files to edit
```
docs/agent-screens-composition.md — REWRITE leve OR mover para docs/audit/2026-05-screens-history.md
```

#### Deep file dependency analysis
- Doc não é referenciado pelo código (apenas leitura humana).
- Pode ser arquivado se não há plano de evoluí-lo.

#### Deep Dives
- Decisão: **arquivar como histórico** + criar `docs/screens.md` minimalista que aponta para `src/screens/*.stories.tsx`.
- Critério: arquivar é mais barato que reescrever 350 linhas.

#### Tasks
1. `git mv docs/agent-screens-composition.md docs/audit/2026-05-screens-history.md`.
2. Criar `docs/screens.md` (10-20 linhas) com link para stories Ladle + breve descrição das 7 telas.
3. Atualizar links no README se houver (não há, confirmar com grep).

#### TDD
```
RED:     test 'no docs/* references TheoKit or TheoBrutal' — grep
GREEN:   após mover/limpar
REFACTOR: None
VERIFY:  grep -r "TheoKit\|TheoBrutal" docs/ — empty (only docs/audit/* allowed)
```

#### Acceptance Criteria
- [x] `docs/agent-screens-composition.md` não existe mais (ou está em `docs/audit/`).
- [x] `docs/screens.md` substitui com índice limpo das 7 stories.
- [x] Nenhuma menção a componentes inexistentes em `docs/*.md` (excluindo `docs/audit/`).

#### DoD
- [x] Grep limpo.

---

### T1.7 — Implementar gate `validateGovernanceFiles`

#### Objective
Gate em `validate-quality-gates.ts` que falha se `LICENSE`, `CHANGELOG.md`, `README.md` estiverem ausentes ou se CHANGELOG não tiver seção `[Unreleased]`.

#### Evidence
BLOCKER-007. Without gate, regressão é trivial.

#### Files to edit
```
scripts/validate-quality-gates.ts — implementar função validateGovernanceFiles (stub criado em T0.2)
```

#### Deep file dependency analysis
- Script já tem stub. Função vira fail-fast:
  - LICENSE existe → ok
  - CHANGELOG.md existe → ok
  - CHANGELOG contém `## [Unreleased]` → ok
- Cada falta vira `fail("repo", "missing X")`.

#### Deep Dives
- Implementação:
  ```ts
  function validateGovernanceFiles(): void {
    for (const file of ["LICENSE", "CHANGELOG.md", "README.md"]) {
      if (!existsSync(join(ROOT, file))) fail("repo", `missing ${file}`);
    }
    if (existsSync(join(ROOT, "CHANGELOG.md"))) {
      const ch = readFileSync(join(ROOT, "CHANGELOG.md"), "utf-8");
      if (!ch.includes("## [Unreleased]")) {
        fail("CHANGELOG.md", "must contain '## [Unreleased]' section");
      }
    }
  }
  ```

#### Tasks
1. Substituir stub pelo corpo real.
2. Rodar `pnpm quality:structure` — deve PASSAR (porque T1.1 + T1.2 criaram os arquivos).

#### TDD
```
RED:     mv LICENSE LICENSE.bak && pnpm quality:structure → exit 1 with "missing LICENSE"
RED:     mv CHANGELOG.md CHANGELOG.md.bak → exit 1 with "missing CHANGELOG.md"
GREEN:   mv .bak files back, pnpm quality:structure → passes
REFACTOR: None
VERIFY:  pnpm quality:structure 2>&1 | grep "passed"
```

#### Acceptance Criteria
- [x] Gate falha se LICENSE removido.
- [x] Gate falha se CHANGELOG removido.
- [x] Gate falha se CHANGELOG.md sem `## [Unreleased]`.
- [x] Gate passa em estado atual.

#### DoD
- [x] `pnpm quality:gates` verde.
- [x] Smoke test: temporary `mv LICENSE LICENSE.bak`, rodar gate, ver falha, restaurar.

---

### T1.8 — Implementar gate `validateReadmeDrift`

#### Objective
Gate que falha se README cita nome de componente fora dos exports de `src/index.ts`, ou se exports não estão mencionados no README.

#### Evidence
BLOCKER-005 + D6. Sem enforcement, drift volta no próximo PR.

#### Files to edit
```
scripts/validate-quality-gates.ts — função validateReadmeDrift
```

#### Deep file dependency analysis
- Função lê `src/index.ts` → extrai todos os nomes exportados (regex em `export { X, Y }` lines).
- Lê README.md.
- Compara: nomes no README que não existem em index → fail.
- Soft: nomes em index não citados em README → warn (catalog pode optar por agrupar).

#### Deep Dives
- Regex de exports:
  ```ts
  const exportMatches = Array.from(indexContent.matchAll(/export\s+(?:type\s+)?{\s*([^}]+)\s*}/g));
  const exportedNames = exportMatches.flatMap(m => m[1].split(",").map(s => s.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0])).filter(Boolean);
  ```
- Regex no README para extrair nomes em backticks: `` /`([A-Z][A-Za-z0-9]+)`/g ``
- Whitelist nomes não-component (e.g., `ThemeProvider`, `cn`, types).

#### Tasks
1. Implementar a função.
2. Confirmar que após T1.5 (sync:readme) o gate passa.
3. Documentar como adicionar whitelist se houver caso edge.

#### TDD
```
RED:     temporariamente, editar README adicionando `FakeComponent` em backticks → quality:structure deve falhar
GREEN:   reverter, quality:structure passa
REFACTOR: None
VERIFY:  pnpm quality:structure passa após T1.5
```

#### Acceptance Criteria
- [x] Gate falha se README cita componente inexistente.
- [x] Gate passa em estado pós-T1.5.

#### DoD
- [x] Smoke test manual confirma fail/pass.

---

### T1.9 — Implementar gate `validateDocsTypography`

#### Objective
Gate que falha se `docs/design-system.md` não menciona "Geist" ou menciona "Boska" / "Switzer" / "JetBrains Mono" fora de seção marcada como histórica.

#### Evidence
BLOCKER-002 + D1.

#### Files to edit
```
scripts/validate-quality-gates.ts — função validateDocsTypography
```

#### Deep file dependency analysis
- Lê `docs/design-system.md`.
- Aplica heurística: divide o doc em seções por `##` headings; flagga seções que mencionam Boska/Switzer/JetBrains a menos que header contenha "Histórico" ou "Audit".

#### Deep Dives
- Implementação simples (sem parser MD):
  ```ts
  const ds = readFileSync("docs/design-system.md", "utf-8");
  if (!ds.includes("Geist")) fail("design-system.md", "missing Geist mention (normative font)");
  const stale = /(Boska|Switzer|JetBrains Mono)/g;
  if (stale.test(ds.split(/^## Histórico/m)[0])) {
    fail("design-system.md", "mentions deprecated font outside Histórico section");
  }
  ```

#### Tasks
1. Implementar função.
2. Rodar `pnpm quality:structure`.

#### TDD
```
RED:     temporariamente adicionar "Boska Display 64px" no topo de design-system.md → falha
GREEN:   reverter, passa
REFACTOR: None
VERIFY:  pnpm quality:structure passa após T1.3
```

#### Acceptance Criteria
- [x] Gate falha em mention de Boska fora de Histórico.
- [x] Gate passa em estado atual pós-T1.3.

#### DoD
- [x] Test manual confirma.

---

### Phase 1 Acceptance Criteria
- [x] LICENSE + CHANGELOG.md presentes na raiz.
- [x] `pnpm pack --dry-run` inclui ambos.
- [x] `docs/design-system.md` espelha código atual; histórico em `docs/audit/`.
- [x] README.md sincronizado via `sync:readme`.
- [x] JSDoc de `violet-forge.ts` corrigido; registry regenerado sem Boska.
- [x] 3 gates novos (governance, readme-drift, docs-typography) implementados.
- [x] `pnpm quality:gates` continua verde.

---

## Phase 2: Build & Registry Integrity

**Objective:** Garantir que `dist/` e `registry/r/*.json` são consumíveis em projeto externo sem assets quebrados. Fechar BLOCKERs 001 + 004.

### T2.1 — Copiar `fonts.css` para `dist/` + adicionar export

#### Objective
Reparar `dist/styles.css` que referencia `./fonts.css` inexistente. (BLOCKER-001)

#### Evidence
`tsup.config.ts:12 onSuccess: "cp src/styles/tokens.css dist/tokens.css && cp src/styles/global.css dist/styles.css"`. `ls dist/` retorna apenas index.{d.ts,js,js.map} + styles.css + tokens.css. fonts.css ausente.

#### Files to edit
```
tsup.config.ts — onSuccess script
package.json — exports field
```

#### Deep file dependency analysis
- `tsup.config.ts` é o único responsável pela cópia dos CSS para `dist/`.
- `package.json.exports` precisa expor `./fonts.css` para que consumer possa importar diretamente se quiser (opcional, mas recomendado).
- `global.css` (copiado como `styles.css`) tem `@import "./fonts.css"` — assim, basta `fonts.css` estar em `dist/` ao lado.

#### Deep Dives
- Trade-off considerado: inline `@import url(...)` do Google Fonts dentro de styles.css final eliminando dependência relativa.
  - Prós: zero fontes.css; menos files.
  - Contras: Tailwind/PostCSS na pipe do consumidor pode duplicar @import; perde flexibilidade do consumer trocar a CDN.
- Decisão: manter `@import "./fonts.css"` + copiar arquivo (path of least surprise; padrão shadcn-ui).

#### Tasks
1. Atualizar `tsup.config.ts` onSuccess:
   ```ts
   onSuccess: "cp src/styles/tokens.css dist/tokens.css && cp src/styles/fonts.css dist/fonts.css && cp src/styles/global.css dist/styles.css",
   ```
2. Atualizar `package.json.exports`:
   ```json
   "./styles.css": "./dist/styles.css",
   "./tokens.css": "./dist/tokens.css",
   "./fonts.css":  "./dist/fonts.css"
   ```
3. `pnpm build` e confirmar `ls dist | grep fonts.css`.

#### TDD
```
RED:     'ls dist | grep fonts.css' returns nothing (before fix)
RED:     fixture test: in tests/fixture-consumer/, importing @usetheo/ui/styles.css fails to resolve fonts.css (vite throws)
GREEN:   after fix, fonts.css present; vite resolves; Network tab in DevTools shows Geist 200
REFACTOR: None
VERIFY:  pnpm build && ls dist | grep fonts.css
```

#### Acceptance Criteria
- [x] `dist/fonts.css` existe após `pnpm build`.
- [x] `package.json.exports` expõe os 3 CSS files.
- [x] Fixture install (T2.5) carrega Geist sem erro de rede.

#### DoD
- [x] `pnpm build` produz dist com 6 arquivos: index.{d.ts,js,js.map}, styles.css, tokens.css, fonts.css.

---

### T2.2 — Remover `cssVars` stale de `registry/tokens.json`

#### Objective
Eliminar drift entre `cssVars` (paleta antiga warm violet-tinted) e `files[].content` (paleta Vercel-grayscale atual). (BLOCKER-004) (D2)

#### Evidence
`registry/tokens.json:20-41` lista `background: "36 26% 97%"` (warm), `border: "261 18% 11%"` (near-black). `tokens.css` real tem `0 0% 100%` (puro branco) e `0 0% 91%` (hairline clara). Inversão completa em propriedades críticas.

#### Files to edit
```
registry/tokens.json — remover bloco "cssVars"
registry/r/tokens.json — regenerado via pnpm registry:build
```

#### Deep file dependency analysis
- `cssVars` é hint do schema shadcn — opcional. `files[].content` é authoritative para consumer.
- Não há nada no código que dependa do `cssVars` deste arquivo.

#### Deep Dives
- Alternativa rejeitada: corrigir `cssVars` para casar com tokens.css. Rejected (D2) porque mantém two-sources-of-truth.

#### Tasks
1. Deletar o objeto `cssVars` de `registry/tokens.json`.
2. `pnpm registry:build && pnpm registry:validate`.
3. Verificar `jq '.cssVars' registry/r/tokens.json` retorna `null`.

#### TDD
```
RED:     test 'tokens.json has no cssVars' — jq '.cssVars' → "null" expected; currently returns object
GREEN:   após remover, jq retorna null
REFACTOR: None
VERIFY:  jq '.cssVars' registry/tokens.json → null; jq '.cssVars' registry/r/tokens.json → null
```

#### Acceptance Criteria
- [x] `registry/tokens.json` não tem `cssVars`.
- [x] `registry/r/tokens.json` regenerado sem `cssVars`.
- [x] `pnpm registry:validate` passa.

#### DoD
- [x] `pnpm registry:build && pnpm registry:validate` verdes.
- [x] Fixture install (T2.5) prova que tokens.css aplicado dá `--background: 0 0% 100%` no light.

---

### T2.3 — Refinar descrições do registry (MEDIUM-014)

#### Objective
Substituir descrições truncadas de JSDoc por frases completas auto-suficientes nos 109 registry items.

#### Evidence
Exemplos atuais: `"primitive action element in the Violet Forge design system."` (começa minúsculo), `"vertical list of agent events."` (sem contexto).

#### Files to edit
```
scripts/refine-registry-descriptions.ts — já existe; tornar mais agressivo
registry/*.json — atualizar campo description em massa
```

#### Deep file dependency analysis
- Script já existe (visto em scripts/). Pelo nome, foi rodado uma vez parcialmente.
- Pode ser reaproveitado/expandido.

#### Deep Dives
- Estratégia:
  - Manter campo `title` (já presente, e.g., "Button").
  - Reescrever `description` para começar com o título + frase completa: `"Button — primitive action element with violet glow, ghost/destructive/accent variants and asChild support."`
- Para 109 items, fazer manualmente em PR é tedious. Roda script + revisão manual nos com descrição < 30 chars.

#### Tasks
1. Inspecionar `scripts/refine-registry-descriptions.ts` para entender lógica atual.
2. Estender para produzir 1ª letra maiúscula + nome no início + frase completa.
3. Rodar.
4. Diff em massa, revisar 5 items que ficaram estranhos, corrigir à mão.
5. `pnpm registry:build && pnpm registry:validate`.

#### TDD
```
RED:     test 'all descriptions start with uppercase' — jq '.description' across descriptors, fail any starting lowercase
RED:     test 'all descriptions are >= 30 chars'
GREEN:   após refine
REFACTOR: None
VERIFY:  for f in registry/*.json; do jq -r '.description' "$f"; done | grep -c '^[a-z]' → 0
```

#### Acceptance Criteria
- [x] Toda `description` começa com maiúscula.
- [x] Toda `description` ≥ 30 caracteres.
- [x] Toda `description` referencia o que o componente faz, não apenas "primitive component".

#### DoD
- [x] `pnpm registry:validate` verde.

---

### T2.4 — Refatorar dot-namespace para safe tree-shaking (MEDIUM-012)

#### Objective
Auditar `Card`, `Dialog`, `Sidebar`, `TopNav`, `Tabs` dot-namespace pattern; aplicar `/*#__PURE__*/` annotations onde tree-shaking pode regredir.

#### Evidence
Pattern `Card.Header = Header; Card.Body = Body;` mutua const exportado — bundlers conservadores marcam como side-effect.

#### Files to edit
```
src/components/primitives/card/card.tsx
src/components/primitives/dialog/dialog.tsx
src/components/primitives/sidebar/sidebar.tsx
src/components/primitives/topnav/topnav.tsx
src/components/primitives/tabs/tabs.tsx
```

#### Deep file dependency analysis
- Cada arquivo tem o padrão:
  ```ts
  const Card = Root as typeof Root & { Header: typeof Header; ... };
  Card.Header = Header;
  ```
- Bundle test (T2.5 fixture) consome só `Button` e mede `dist/index.js` tree-shake do consumer; baseline T0.1 guarda o número.

#### Deep Dives
- Refator para Object.assign com #__PURE__:
  ```ts
  const Card = /*#__PURE__*/ Object.assign(Root, {
    Header,
    Title,
    Description,
    Body,
    Footer,
  });
  ```
- TypeScript precisa do cast: usar `as typeof Root & { Header: typeof Header; ... }` posterior se necessário.

#### Tasks
1. Refatorar cada um dos 5 arquivos.
2. Rodar `pnpm build && pnpm test` (regression suite).
3. Comparar `du -sh dist/index.js` vs baseline.

#### TDD
```
RED:     test 'tree-shaking pulls only Button when consumer imports only Button' — fixture test
GREEN:   após refator + #__PURE__
REFACTOR: None expected
VERIFY:  pnpm test (existing tests still pass; Card.Header etc. still work)
```

#### Acceptance Criteria
- [x] 5 componentes usam Object.assign /*#__PURE__*/.
- [x] Testes existentes continuam verdes.
- [x] Bundle size do consumer hipotético reduz ou mantém.

#### DoD
- [x] `pnpm test` verde.
- [x] Diff em `du -sh dist/index.js` documentado em CHANGELOG.

---

### T2.5 — Fixture install test em CI (MEDIUM-015)

#### Objective
Criar fixture mínima `tests/fixture-shadcn-app/` que instala 3 registry items selecionados + roda `tsc --noEmit` para provar que copy-paste real funciona.

#### Evidence
`validate-registry.ts` faz cópia em tmpdir mas não roda tsc na fixture. Imports `@/components/ui/X` podem estar quebrados sem ninguém saber.

#### Files to edit
```
tests/fixture-shadcn-app/package.json — (NEW) vite + tsconfig deps
tests/fixture-shadcn-app/tsconfig.json — (NEW) paths "@/*": ["src/*"]
tests/fixture-shadcn-app/vite.config.ts — (NEW)
tests/fixture-shadcn-app/index.html — (NEW) minimal
tests/fixture-shadcn-app/src/main.tsx — (NEW) importa Button + ThemeProvider
scripts/test-registry-install.ts — (NEW) roda o teste
package.json — adicionar script "test:registry": "tsx scripts/test-registry-install.ts"
.github/workflows/quality-gates.yml — adicionar step test:registry
```

#### Deep file dependency analysis
- Fixture é um projeto isolado dentro do monorepo, não publicado.
- Script lê registry/r/{cn,button,theme-provider,tokens}.json e copia files para fixture/src/{...} via target paths.
- Roda `pnpm install` no fixture + `pnpm tsc --noEmit`.

#### Deep Dives
- Strategy:
  ```ts
  const FIXTURE = "tests/fixture-shadcn-app";
  for (const item of ["cn", "tokens", "theme-provider", "button"]) {
    const built = readJson(`registry/r/${item}.json`);
    for (const file of built.files) {
      writeFile(`${FIXTURE}/src/${file.target}`, file.content);
    }
  }
  exec(`cd ${FIXTURE} && pnpm install && pnpm tsc --noEmit`);
  ```
- Fixture package.json: react, react-dom, lucide-react, @radix-ui/react-* (deps de Button + ThemeProvider), tailwind-merge, clsx, class-variance-authority, typescript, vite.

#### Tasks
1. Criar diretório fixture com package.json minimalista.
2. Criar tsconfig com paths `@/*`.
3. Escrever `scripts/test-registry-install.ts`.
4. Adicionar script + CI step.
5. Rodar localmente.

#### TDD
```
RED:     pnpm test:registry (script ainda não existe) — fail
GREEN:   após implementar, exit 0
REFACTOR: None
VERIFY:  pnpm test:registry && echo "registry install OK"
```

#### Acceptance Criteria
- [x] Fixture compila com `tsc --noEmit` zero erros.
- [x] CI roda em ≤ 90s.
- [x] Falha simulada (e.g., apagar Button.tsx do registry) é detectada.

#### DoD
- [x] CI step verde.
- [x] README documenta como adicionar item à fixture.

---

### Phase 2 Acceptance Criteria
- [x] `dist/` tem 6 arquivos esperados.
- [x] `package.json.exports` corrige paths.
- [x] `registry/r/tokens.json` sem `cssVars`.
- [x] Descrições do registry refinadas.
- [x] Fixture install test verde em CI.

---

## Phase 3: CommandPalette Refactor (BLOCKER-006)

**Objective:** `CommandPalette` em conformidade com Quality Gate §4 (keyboard nav, ranking, active item). Adota `cmdk` per ADR D3.

### T3.1 — Substituir `command-palette.tsx` por wrapper sobre `cmdk`

#### Objective
Refatorar `src/components/composites/command-palette/command-palette.tsx` para usar `cmdk` mantendo API pública estável (props: `open`, `onOpenChange`, `items`, `onSelect`, `placeholder`, `emptyMessage`, `filter`).

#### Evidence
Implementação atual (149 linhas) ship só substring + click. Self-violation de gate. Documentado no review.

#### Files to edit
```
package.json — adicionar "cmdk": "^1.0.0" em dependencies
src/components/composites/command-palette/command-palette.tsx — refator completo
src/components/composites/command-palette/command-palette.test.tsx — testes novos para keyboard
src/components/composites/command-palette/command-palette.stories.tsx — story com keyboard demo
registry/command-palette.json — adicionar dep cmdk em dependencies
```

#### Deep file dependency analysis
- `cmdk` traz `Command`, `Command.Input`, `Command.List`, `Command.Item`, `Command.Group`, `Command.Empty`. Já lida com ↑↓ Enter Escape Home/End + ranking.
- API consumidora do componente precisa ser preservada: `open`, `onOpenChange`, `items: CommandItem[]`, `onSelect: (id) => void`.
- Registry rewrite imports: `cmdk` já é npm package, sem ajuste de path.

#### Deep Dives
- Novo esqueleto:
  ```tsx
  import { Command } from "cmdk";
  
  function CommandPalette({ open, onOpenChange, items, onSelect, placeholder, emptyMessage }) {
    const groups = useMemo(() => groupBy(items, "group"), [items]);
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <Dialog.Content className="p-0 max-w-xl" hideCloseButton>
          <Command label="Command palette">
            <Command.Input placeholder={placeholder} />
            <Command.List>
              <Command.Empty>{emptyMessage}</Command.Empty>
              {Object.entries(groups).map(([groupName, list]) => (
                <Command.Group heading={groupName || undefined}>
                  {list.map(item => (
                    <Command.Item key={item.id} value={item.searchable ?? item.label} onSelect={() => { onSelect(item.id); onOpenChange(false); }}>
                      {item.icon && <item.icon />} {item.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog>
    );
  }
  ```
- Prop `filter` original passa para `<Command filter={...}>`.

#### Tasks
1. `pnpm add cmdk`.
2. Refatorar `command-palette.tsx`.
3. Atualizar `command-palette.test.tsx` com testes:
   - Filter substring.
   - ArrowDown move active.
   - ArrowUp move active.
   - Enter dispara onSelect.
   - Escape fecha (via Dialog).
   - Ranking: "deploy" digitado prioriza item cujo label começa com "deploy".
4. Atualizar `command-palette.stories.tsx` para mostrar keyboard hints visualmente.
5. Atualizar `registry/command-palette.json` adicionando `"cmdk"` em `dependencies`.
6. `pnpm registry:build && pnpm registry:validate`.

#### TDD
```
RED:     test 'ArrowDown changes active item' — atualmente CommandPalette não tem nenhum aria-selected → assertion falha
RED:     test 'Enter triggers onSelect' — sem keydown handler, assertion falha
RED:     test 'ranking prioritizes startsWith' — substring includes não diferencia
GREEN:   após adotar cmdk + tests verdes
REFACTOR: extract groupBy helper para src/lib/group-by.ts se reaproveitável
VERIFY:  pnpm test src/components/composites/command-palette
```

#### Acceptance Criteria
- [x] Componente exporta mesma assinatura pública.
- [x] Keyboard navigation funciona (Arrow, Enter, Escape).
- [x] Tests cobrem 6 cenários.
- [x] Registry incluindo cmdk dep.
- [x] Story demonstra keyboard nav.

#### DoD
- [x] `pnpm test`, `pnpm typecheck`, `pnpm registry:validate` verdes.
- [x] axe-core no story não acusa "ARIA without keyboard handler".

---

## Phase 4: Accessibility Hardening

**Objective:** Cobrir `prefers-reduced-motion`, fake affordances, semântica ARIA. Fechar HIGHs 001, 005, 006 + MEDIUMs 001, 004, 005, 006, 009 + LOW-012.

### T4.1 — `prefers-reduced-motion` global em `tokens.css` (HIGH-001)

#### Objective
Adicionar `@media (prefers-reduced-motion: reduce)` em `tokens.css` que zera durations + neutraliza animations globalmente. Componentes que querem manter animação semântica usam `motion-safe:` prefix (D4).

#### Files to edit
```
src/styles/tokens.css — adicionar bloco @media no final
src/components/primitives/agent-event/agent-event.tsx — animate-spin → motion-safe:animate-spin
src/components/composites/agent-timeline/agent-timeline.tsx — animate-fade-in-up → motion-safe:animate-fade-in-up
src/components/primitives/terminal-panel/terminal-panel.tsx — animate-pulse → motion-safe:animate-pulse
(outros 12 ocorrências de animate-* — grep para coverage)
```

#### Deep file dependency analysis
- `tokens.css` é importado por `global.css`. Bloco @media aplica para qualquer consumer.
- `motion-safe:` Tailwind variant existe out-of-the-box. Nenhum config change necessário.

#### Deep Dives
- Bloco a adicionar:
  ```css
  @media (prefers-reduced-motion: reduce) {
    :root {
      --duration-fast: 0ms;
      --duration-base: 0ms;
      --duration-slow: 0ms;
      --stagger: 0ms;
    }
    *,
    *::before,
    *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
- Para `animate-spin` no spinner de "running": queremos manter porque é sinal vivo. Solução: `motion-safe:animate-spin` mantém em quem não quer reduzir; para reduce, usuário vê só ícone estático + aria-label="running" (já existe).

#### Tasks
1. Adicionar bloco @media em tokens.css.
2. `grep -rln "animate-" src/components/ --include="*.tsx"` → 15 arquivos. Em cada, trocar para `motion-safe:` onde animação é puramente decorativa; manter `animate-` cru onde é semântica (e.g., spinner) — mas wrapper @media já cobre via animation-duration 0.001ms.
3. Documentar em `docs/design-system.md` o pattern.
4. Adicionar story em Ladle "Reduced Motion" demonstrando.

#### TDD
```
RED:     manual test in DevTools — Rendering tab → Emulate prefers-reduced-motion: reduce → spinners ainda giram a velocidade normal (atual estado)
GREEN:   após fix, spinners ficam estáticos / fade-in-up some
REFACTOR: None
VERIFY:  vitest test usando matchMedia mock + computed style
```

#### Acceptance Criteria
- [x] `@media (prefers-reduced-motion: reduce)` em tokens.css.
- [x] Zero animações visíveis com reduce on (DevTools manual).
- [x] Documentação atualizada.
- [x] Story demonstra.

#### DoD
- [x] DevTools manual test confirma.
- [x] Tests existentes verdes.

---

### T4.2 — ChatComposer: remover fake affordances (HIGH-005)

#### Objective
Não renderizar Mic / Paperclip por default sem onClick wired. Aceitar props `onAttach` e `onVoiceInput`; renderizar botões só se passados.

#### Files to edit
```
src/components/composites/chat-composer/chat-composer.tsx — assinatura + render condicional
src/components/composites/chat-composer/chat-composer.test.tsx — teste novo de "no fake mic"
src/components/composites/chat-composer/chat-composer.stories.tsx — story default sem mic
```

#### Deep file dependency analysis
- Props novas opt-in: `onAttach?: () => void`, `onVoiceInput?: () => void`.
- Sem onClick → não renderiza. Mantém `leadingActions` slot para custom.
- Tests pré-existentes podem assumir presença do mic — auditar.

#### Deep Dives
- Nova assinatura:
  ```tsx
  interface ChatComposerProps {
    ...
    onAttach?: () => void;
    onVoiceInput?: () => void;
  }
  
  {/* leadingActions OR default attach if onAttach provided */}
  {leadingActions ?? (onAttach ? <Button onClick={onAttach}>...</Button> : null)}
  
  {/* trailing: only render mic if onVoiceInput */}
  {onVoiceInput && <Button onClick={onVoiceInput} ...>...</Button>}
  ```

#### Tasks
1. Atualizar props + render.
2. Atualizar tests existentes que assumem mic.
3. Adicionar teste novo: `render(<ChatComposer value="" onValueChange={()=>{}} />)` → `expect(screen.queryByLabelText("Voice input")).toBeNull()`.
4. Story default sem mic; story `WithFullActions` com.

#### TDD
```
RED:     it('does not render voice button by default') — atualmente sempre renderiza → fail
GREEN:   após gate
REFACTOR: None
VERIFY:  pnpm test src/components/composites/chat-composer
```

#### Acceptance Criteria
- [x] Sem `onVoiceInput`, nenhum botão Mic.
- [x] Sem `onAttach`, nenhum Paperclip (a menos que `leadingActions` passado).
- [x] Teste cobre o caso.

#### DoD
- [x] Quality Gate §7 ("must not show attach/mic by default unless wired") satisfeito.

---

### T4.3 — TopNav.ModeSwitcher → radiogroup (HIGH-006)

#### Objective
Trocar `role="tablist"`/`role="tab"` por `role="radiogroup"`/`role="radio"` + adicionar keyboard nav (Arrow/Home/End).

#### Files to edit
```
src/components/primitives/topnav/topnav.tsx — função ModeSwitcher (linhas 126-162)
src/components/primitives/topnav/topnav.test.tsx — teste novo de keyboard
```

#### Deep Dives
- Novo esqueleto:
  ```tsx
  <div role="radiogroup" aria-label="Mode" onKeyDown={handleArrow}>
    {options.map((opt) => (
      <button
        role="radio"
        aria-checked={opt.value === value}
        tabIndex={opt.value === value ? 0 : -1}  // roving tabindex
        onClick={() => onChange?.(opt.value)}
      >...</button>
    ))}
  </div>
  ```
- Handler:
  ```tsx
  const handleArrow = (e: KeyboardEvent) => {
    const idx = options.findIndex(o => o.value === value);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange?.(options[(idx + 1) % options.length].value);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange?.(options[(idx - 1 + options.length) % options.length].value);
    }
    if (e.key === "Home") onChange?.(options[0].value);
    if (e.key === "End")  onChange?.(options[options.length - 1].value);
  };
  ```

#### Tasks
1. Refatorar ModeSwitcher para radiogroup.
2. Adicionar handler de teclado.
3. Roving tabindex.
4. Testes: ArrowRight muda, ArrowLeft idem, Home/End.

#### TDD
```
RED:     it('navigates with ArrowRight') — atualmente noop → fail
GREEN:   após implementar
REFACTOR: None
VERIFY:  pnpm test src/components/primitives/topnav
```

#### Acceptance Criteria
- [x] `role="radiogroup"` + `role="radio"` corretos.
- [x] ArrowRight/Left/Up/Down/Home/End funcionam.
- [x] Roving tabindex implementado.
- [x] Teste cobre 4 keys.

#### DoD
- [x] axe-core não acusa "tab role sem panel".

---

### T4.4 — Card.Title / Dialog.Title `asChild` (MEDIUM-001)

#### Objective
Adicionar `asChild` (Radix Slot) em `Card.Title` e `Dialog.Title` para permitir override de heading level.

#### Files to edit
```
src/components/primitives/card/card.tsx — Title
src/components/primitives/dialog/dialog.tsx — Title
src/components/primitives/card/card.test.tsx — teste asChild
src/components/primitives/dialog/dialog.test.tsx — teste asChild
```

#### Deep Dives
- Pattern:
  ```tsx
  const Title = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement> & { asChild?: boolean }>(
    ({ className, asChild, ...props }, ref) => {
      const Comp = asChild ? Slot : "h3";
      return <Comp ref={ref} className={cn(...)} {...props} />;
    }
  );
  ```

#### Tasks
1. Refator nos 2 componentes.
2. Tests.

#### TDD
```
RED:     it('renders as h1 when asChild + h1') — fail
GREEN:   após
REFACTOR: None
VERIFY:  pnpm test
```

#### Acceptance Criteria
- [x] Both componentes aceitam asChild.
- [x] Tests cobrem.

---

### T4.5 — TerminalPanel + BuildLogStream `aria-live` (MEDIUM-005)

#### Files to edit
```
src/components/primitives/terminal-panel/terminal-panel.tsx
src/components/primitives/build-log-stream/build-log-stream.tsx
```

#### Deep Dives
- Prop: `live?: "polite" | "off"` default `"off"` (não verbose por padrão; consumer opt-in para streaming).
- Aplicar `aria-live={live}` no `<ol>`.

#### Tasks
1. Adicionar prop + render attribute.
2. Test.

#### Acceptance Criteria
- [x] Prop existe e renderiza atributo.

---

### T4.6 — Codemod `aria-hidden` → `aria-hidden="true"` (MEDIUM-006)

#### Files to edit
```
~15 arquivos em src/components/ — todas ocorrências de `aria-hidden` boolean
```

#### Tasks
1. `grep -rln 'aria-hidden\b[^=]' src/` → lista.
2. `sed -i 's/aria-hidden\([^=]\)/aria-hidden="true"\1/g'` em cada (ou usar Biome rule).
3. Lint + test.

#### Acceptance Criteria
- [x] Zero `aria-hidden` sem valor.

---

### T4.7 — DiffViewer `<caption>` / aria-label (MEDIUM-009)

#### Files to edit
```
src/components/primitives/diff-viewer/diff-viewer.tsx
```

#### Tasks
1. Adicionar `aria-label={`Diff for ${path}`}` no `<table>`.

#### Acceptance Criteria
- [x] table tem aria-label.

---

### T4.8 — AuditLogEntry semântica (MEDIUM-004)

#### Files to edit
```
src/components/primitives/audit-log-entry/audit-log-entry.tsx — JSDoc + opt-in wrapper
docs/design-system.md — documentar uso esperado
```

#### Tasks
1. Documentar em JSDoc que o componente espera ser usado dentro de `<ul role="feed">` ou `<ol>`.
2. Manter `<article>` mas adicionar aria-posinset/setsize via prop opcional.

#### Acceptance Criteria
- [x] JSDoc explica composição esperada.

---

### T4.9 — AgentEvent: `role="button"` → `<button>` nativo (LOW-012)

#### Files to edit
```
src/components/primitives/agent-event/agent-event.tsx
```

#### Tasks
1. Quando isExpandable=true, usar `<button>`; quando não, `<div>`.

#### Acceptance Criteria
- [x] Componente expandable é `<button>`.

---

### Phase 4 Acceptance Criteria
- [x] prefers-reduced-motion implementado.
- [x] Sem fake affordances em ChatComposer.
- [x] ModeSwitcher é radiogroup.
- [x] Card.Title / Dialog.Title aceitam asChild.
- [x] aria-live + aria-hidden + aria-label fixes aplicados.
- [x] AgentEvent usa button nativo.

---

## Phase 5: ThemeProvider SSR & API Hardening (HIGH-002, MEDIUM-010, MEDIUM-013)

### T5.1 — Exportar `<ThemeScript>` para SSR

#### Files to edit
```
src/themes/theme-script.tsx — (NEW)
src/themes/index.ts — exportar ThemeScript
src/index.ts — re-exportar
README.md — exemplo Next/Astro
docs/design-system.md — seção SSR
```

#### Deep Dives
- Componente:
  ```tsx
  interface ThemeScriptProps {
    defaultTheme?: string;
    defaultMode?: "light" | "dark";
    storageKey?: string | null;
  }
  
  function ThemeScript({ defaultTheme = "violet-forge", defaultMode = "light", storageKey = "theo-ui:theme" }: ThemeScriptProps) {
    const code = `
      (function() {
        try {
          var k = ${JSON.stringify(storageKey)};
          var t = k ? localStorage.getItem(k + ":name") : null;
          var m = k ? localStorage.getItem(k + ":mode") : null;
          document.documentElement.setAttribute("data-theme", t || ${JSON.stringify(defaultTheme)});
          document.documentElement.setAttribute("data-mode", m || ${JSON.stringify(defaultMode)});
          if ((m || ${JSON.stringify(defaultMode)}) === "dark") {
            document.documentElement.classList.add("dark");
          }
        } catch (e) {}
      })();
    `.replace(/\s+/g, " ");
    return <script dangerouslySetInnerHTML={{ __html: code }} />;
  }
  ```
- Risco: `dangerouslySetInnerHTML`. Mitigação: script é construído com `JSON.stringify` em valores controlados; sem input do usuário.

#### Tasks
1. Criar componente.
2. Exportar.
3. Atualizar README com bloco Next.
4. Atualizar `ThemeProvider` para emit `useState` que se sincroniza com `themesProp` se mudar (usar useEffect).

#### TDD
```
RED:     it('reads localStorage and sets data-theme before hydration') — happy-dom mock
RED:     it('themes prop change triggers state sync') — atualmente initial only
GREEN:   após implementar
REFACTOR: None
VERIFY:  pnpm test
```

#### Acceptance Criteria
- [x] ThemeScript renderiza inline script.
- [x] Documentação Next + Astro presente.
- [x] ThemeProvider re-sync de prop themes.

---

### T5.2 — JSX.Element → import type { JSX } from "react" (MEDIUM-010)

#### Files to edit
```
src/themes/theme-provider.tsx
src/themes/theme-switcher.tsx
src/components/primitives/toast/toaster.tsx
```

#### Tasks
1. Adicionar `import type { JSX } from "react"` em cada.
2. (ou trocar return type para `ReactElement` / `ReactNode`).

#### Acceptance Criteria
- [x] Nenhum `JSX.Element` global em código.
- [x] Typecheck verde.

---

### T5.3 — defaultMode "dark" (MEDIUM-013)

#### Files to edit
```
src/themes/theme-provider.tsx — defaultMode = "dark"
```

#### Rationale
README diz "dark-first" + Tauri app default dark + biblioteca posicionada para AI/dev. Alinhar.

#### Tasks
1. Trocar default.
2. Documentar breaking-change minor no CHANGELOG (`Changed`).

#### Acceptance Criteria
- [x] Default é "dark".
- [x] CHANGELOG entry.

---

## Phase 6: Performance (HIGH-008)

### T6.1 — BuildLogStream `maxLines` prop

#### Files to edit
```
src/components/primitives/build-log-stream/build-log-stream.tsx
src/components/primitives/build-log-stream/build-log-stream.test.tsx
```

#### Deep Dives
- Prop `maxLines?: number` default `2000`.
- Implementação: `const sliced = lines.length > maxLines ? lines.slice(-maxLines) : lines;`
- Adicionar `Showing last N of M lines` quando truncado.

#### Tasks
1. Adicionar prop + slice.
2. Adicionar banner "Showing last N of M".
3. Test.

#### TDD
```
RED:     it('truncates to maxLines when over limit') — atualmente renderiza tudo → assertion getAllByRole('listitem').length === maxLines fails
GREEN:   após implementar
REFACTOR: None
VERIFY:  pnpm test
```

#### Acceptance Criteria
- [x] Prop existe.
- [x] Banner aparece quando truncado.

---

### T6.2 — TokenUsageChart `maxBars` prop

#### Files to edit
```
src/components/primitives/token-usage-chart/token-usage-chart.tsx
```

#### Tasks
1. Aceitar `maxBars` opcional + binning simples.
2. Test.

#### Acceptance Criteria
- [x] Prop existe.
- [x] Binning correto (e.g., agrupa por semana se points > maxBars).

---

## Phase 7: Test Coverage Hardening (HIGH-009)

### T7.1 — Integrar `jest-axe` (vitest-axe)

#### Files to edit
```
package.json — adicionar "vitest-axe": "^0.1.0" em devDependencies
src/test/setup.ts — extend expect com toHaveNoViolations
src/components/primitives/{button,dialog,command-palette,permission-matrix,sidebar,topnav,chat-composer}/...test.tsx — adicionar 1 teste axe
```

#### Tasks
1. `pnpm add -D vitest-axe`.
2. Estender `expect` no setup.
3. Para 8 componentes high-risk, adicionar:
   ```tsx
   it('has no axe violations', async () => {
     const { container } = render(<Button>X</Button>);
     expect(await axe(container)).toHaveNoViolations();
   });
   ```

#### TDD
```
RED:     test 'no axe violations' — atualmente alguns componentes têm violations (aria-hidden, role=tab sem panel etc.)
GREEN:   após Phase 4 fixes
REFACTOR: None
VERIFY:  pnpm test
```

#### Acceptance Criteria
- [x] vitest-axe integrado.
- [x] 8 primitives passam axe.

---

### T7.2 — Keyboard / behavior tests nos primitives críticos

#### Files to edit
```
src/components/composites/command-palette/command-palette.test.tsx — Arrow/Enter/Esc (já em T3.1)
src/components/primitives/permission-matrix/permission-matrix.test.tsx — add/remove flow + form hide on toolOptions=[]
src/components/primitives/sidebar/sidebar.test.tsx — keyboard nav between items
src/components/primitives/topnav/topnav.test.tsx — ModeSwitcher keyboard (T4.3)
src/components/primitives/agent-event/agent-event.test.tsx — Enter/Space toggle quando expandable
```

#### Tasks
1. Para cada arquivo, adicionar 3-5 testes comportamentais.
2. Rodar.

#### Acceptance Criteria
- [x] Cada componente high-risk tem ≥ 8 testes.

---

### T7.3 — Script `test:coverage` opcional (D9)

#### Files to edit
```
package.json — script "test:coverage": "vitest run --coverage"
vitest.config.ts — coverage thresholds
```

#### Tasks
1. Adicionar script.
2. Configurar thresholds soft (50 global, 80 high-risk).

#### Acceptance Criteria
- [x] Script roda local.
- [x] Não está em quality:gates (per D9).

---

## Phase 8: MEDIUM Batch Cleanup

### T8.1 — Composite-via-barrel rule (MEDIUM-011)

#### Files to edit
```
scripts/validate-quality-gates.ts — implementar validateCompositeBarrel
src/components/composites/agent-timeline/agent-timeline.tsx — fix import
```

#### Deep Dives
- Regex: dentro de composites/*, qualquer `from "../../primitives/X/<name>.js"` (não `index.js`) é fail.

#### Tasks
1. Implementar gate.
2. Fixar agent-timeline (qualquer outro).

#### Acceptance Criteria
- [x] Gate funciona.
- [x] Composites importam só barrels.

---

### T8.2 — Dialog overlay JSDoc fix (MEDIUM-002)

```
src/components/primitives/dialog/dialog.tsx — JSDoc linha 24
```

Atualizar JSDoc para refletir `bg-background/80` real.

---

### T8.3 — tokens.css remover wrap `@layer base` em `:root` (MEDIUM-003)

```
src/styles/tokens.css — desempacotar :root para fora do @layer
```

Extrair `:root { ... }` e `[data-theme="dark"] { ... }` para fora; manter @layer utilities.

---

### T8.4 — BuildLogStream controlled/uncontrolled docs (MEDIUM-007)

```
src/components/primitives/build-log-stream/build-log-stream.tsx — JSDoc
```

JSDoc explicitando "controlled-or-uncontrolled-not-both".

---

### T8.5 — Stories console.* cleanup (MEDIUM-008)

```
src/components/composites/permission-modal/permission-modal.stories.tsx
src/components/composites/chat-composer/chat-composer.stories.tsx
src/components/composites/command-palette/command-palette.stories.tsx
```

Adicionar `// biome-ignore lint/suspicious/noConsole: demo` ou trocar por noop.

---

### T8.6 — PermissionMatrix toolOptions=[] hide form (HIGH-004)

```
src/components/primitives/permission-matrix/permission-matrix.tsx — linha 87
```

`onAdd && toolOptions && toolOptions.length > 0`.

---

### T8.7 — Sidebar.Item aria-current quando button (LOW-013)

```
src/components/primitives/sidebar/sidebar.tsx
```

`aria-current` apenas quando `as="a"`. Para `as="button"` ativo, use `aria-pressed`.

---

### Phase 8 Acceptance Criteria
- [x] Todas as MEDIUMs marcadas resolvidas.
- [x] Gates passam.
- [x] Tests verdes.

---

## Phase 9: LOW + NIT Polish

**Objective:** Bateria de melhorias cosméticas e padronizações finais.

### T9.1 — Batch cleanup LOWs/NITs

#### Tasks (single commit batch, sem TDD individual)
1. **LOW-003/004/005**: i18n hardening — JSDoc exemplifica labels prop para PermissionModal, CommandPalette, TerminalPanel.
2. **LOW-007**: documentar paths `~/*` ou remover de tsconfig (decisão: documentar como alias dev-time, manter relatives em src/ por ora).
3. **LOW-008**: converter `postcss.config.cjs` → `postcss.config.mjs` (alinhar com type:module).
4. **LOW-009**: README ganha seção "Playground" curta apontando para `pnpm playground`.
5. **LOW-010**: verificar `.env` (50 bytes); se contém secret, mover para `.env.example`.
6. **LOW-011**: mover `referencia/` para `docs/references/` ou listar no `.gitignore` se for material exploratório.
7. **LOW-014**: ChatComposer textareaProps spread — garantir order correta (existing cn já cobre? confirmar).
8. **NIT-001**: comentários PT/EN — não vai unificar (cust>benefício), apenas auditar consistência em arquivos novos.
9. **NIT-004**: README roadmap checkbox atualizar.
10. **NIT-005**: keywords no package.json adicionar `agent-ui`, `ai-tools`.
11. **NIT-006**: README logo — confirmar URL ou usar SVG inline.
12. **NIT-007**: alinhar idioma da description em package.json com README (EN).
13. **NIT-008**: adicionar `publishConfig: { access: "public" }` em package.json.
14. **NIT-009**: documentar `scripts/refine-registry-descriptions.ts` (deixa de ser one-shot esquecido após T2.3).
15. **NIT-010**: adicionar `peerDependenciesMeta` se aplicável.
16. **NIT-011**: terminal-panel rename — decisão: NÃO renomear (custo alto, baixo retorno). Documentar nome.
17. **NIT-012**: TokenUsageChart pl-[3.5rem] mágico — trocar por var CSS.

#### Tasks
1. Aplicar todos os fixes em uma série de commits pequenos.

#### Acceptance Criteria
- [x] LOW/NIT cobertos OU explicitamente documentados como "wontfix".

#### DoD
- [x] `pnpm quality:gates` verde.

---

## Phase 10: Dogfood QA (MANDATORY)

> Esta fase roda DEPOIS de todas as anteriores. Plan não está completo até dogfood passar.

**Objective:** Validar que as mudanças funcionam como um real consumer experimentaria — não apenas como unit tests afirmam.

### Execution

Run `/dogfood full`. Sempre full. Sem atalhos.

Operacionalmente:
1. Bash `pnpm clean || rm -rf dist node_modules && pnpm install --frozen-lockfile && pnpm quality:gates && pnpm pack`.
2. Em um diretório irmão, criar app Vite vazio: `pnpm create vite@latest theo-ui-dogfood -- --template react-ts`.
3. `pnpm add ../theo-desktop/usetheo-ui-0.1.0-beta.tgz cmdk`.
4. Em `src/main.tsx`:
   ```tsx
   import "@usetheo/ui/styles.css";
   import { ThemeProvider, Button, CommandPalette, ChatComposer, BuildLogStream } from "@usetheo/ui";
   ```
5. Renderizar uma página com:
   - 3 themes via ThemeSwitcher.
   - CommandPalette aberto com Cmd+K, navegar com setas.
   - ChatComposer com onAttach e onVoiceInput wired.
   - BuildLogStream com 5000 linhas (verificar perf < 500ms render inicial).
   - PermissionMatrix com toolOptions=[] (esperar form escondido).
6. DevTools:
   - Rendering tab → emulate prefers-reduced-motion: reduce → animações neutralizadas.
   - Network tab → Geist 200, fonts.css 200.
   - Lighthouse → A11y ≥ 95.
7. Manual UX:
   - ↑↓ Enter funciona no CommandPalette.
   - ArrowRight/Left muda mode no TopNav.
   - Card.Title asChild com <h1> renderiza H1.

### Acceptance Criteria
- [x] Health score ≥ 75/100.
- [x] Zero CRITICAL issues.
- [x] Zero HIGH em features modificadas.
- [x] Lighthouse A11y ≥ 95.
- [x] Bundle size dist/index.js dentro de ±5% do baseline T0.1.
- [x] Fonts Geist carregam OK em projeto externo.
- [x] CommandPalette keyboard nav verificado manualmente.

### If Dogfood Fails
1. Identificar issues causadas por este plan vs pre-existentes.
2. Fixar all plan-caused CRITICAL + HIGH.
3. Re-rodar `/dogfood full`.
4. Pre-existing issues logged, não bloqueiam plan completion.

---

## Coverage Matrix

| # | Finding | Severity | Task(s) | Resolution |
|---|---|---|---|---|
| 1 | BLOCKER-001 fonts.css missing | BLOCKER | T2.1 | tsup onSuccess + package.json exports |
| 2 | BLOCKER-002 design-system.md stale | BLOCKER | T1.3, T1.9 | rewrite + gate |
| 3 | BLOCKER-003 violet-forge JSDoc Boska | BLOCKER | T1.4 | JSDoc fix + regenerate registry |
| 4 | BLOCKER-004 tokens.json cssVars stale | BLOCKER | T2.2 | remove cssVars |
| 5 | BLOCKER-005 README phantom components | BLOCKER | T1.5, T1.8 | sync:readme script + gate |
| 6 | BLOCKER-006 CommandPalette no keyboard | BLOCKER | T3.1 | adopt cmdk |
| 7 | BLOCKER-007 LICENSE + CHANGELOG missing | BLOCKER | T1.1, T1.2, T1.7 | create + gate |
| 8 | HIGH-001 prefers-reduced-motion | HIGH | T4.1 | global @media |
| 9 | HIGH-002 ThemeProvider SSR | HIGH | T5.1 | ThemeScript + sync state |
| 10 | HIGH-004 PermissionMatrix toolOptions=[] | HIGH | T8.6 | array length check |
| 11 | HIGH-005 ChatComposer fake mic/attach | HIGH | T4.2 | opt-in props |
| 12 | HIGH-006 ModeSwitcher role=tab | HIGH | T4.3 | radiogroup + keys |
| 13 | HIGH-007 agent-screens-composition.md stale | HIGH | T1.6 | archive + replace |
| 14 | HIGH-008 BuildLogStream/Chart no virtualization | HIGH | T6.1, T6.2 | maxLines / maxBars |
| 15 | HIGH-009 Test coverage shallow | HIGH | T7.1, T7.2 | jest-axe + keyboard tests |
| 16 | MEDIUM-001 Card/Dialog Title fixed h3 | MEDIUM | T4.4 | asChild |
| 17 | MEDIUM-002 Dialog overlay JSDoc drift | MEDIUM | T8.2 | JSDoc fix |
| 18 | MEDIUM-003 tokens.css @layer base | MEDIUM | T8.3 | unwrap :root |
| 19 | MEDIUM-004 AuditLogEntry semantics | MEDIUM | T4.8 | JSDoc + posinset |
| 20 | MEDIUM-005 Terminal/Log no aria-live | MEDIUM | T4.5 | live prop |
| 21 | MEDIUM-006 aria-hidden boolean | MEDIUM | T4.6 | codemod |
| 22 | MEDIUM-007 BuildLogStream control-mix | MEDIUM | T8.4 | JSDoc |
| 23 | MEDIUM-008 stories console.* | MEDIUM | T8.5 | biome-ignore |
| 24 | MEDIUM-009 DiffViewer table caption | MEDIUM | T4.7 | aria-label |
| 25 | MEDIUM-010 JSX.Element global | MEDIUM | T5.2 | import type |
| 26 | MEDIUM-011 composite bypassa barrel | MEDIUM | T8.1 | gate + fix |
| 27 | MEDIUM-012 dot-namespace tree-shake | MEDIUM | T2.4 | Object.assign + #__PURE__ |
| 28 | MEDIUM-013 defaultMode light vs dark-first | MEDIUM | T5.3 | flip default |
| 29 | MEDIUM-014 Registry descriptions | MEDIUM | T2.3 | refine script |
| 30 | MEDIUM-015 No fixture install test | MEDIUM | T2.5 | tests/fixture-shadcn-app |
| 31 | LOW-001 to LOW-014 batched | LOW | T9.1 | bulk polish |
| 32 | NIT-001 to NIT-012 batched | NIT | T9.1 | bulk polish |
| 33 | LOW-012 AgentEvent role=button on div | LOW | T4.9 | native button |
| 34 | LOW-013 Sidebar.Item aria-current | LOW | T8.7 | aria-pressed when button |

**Coverage: 34/34 findings cobertos (100%).**

---

## Global Definition of Done

- [x] Todas as phases completas.
- [x] Todos os tests passando (`pnpm test`: alvo ≥ 450 testes ao fim).
- [x] Zero lint warnings (`pnpm lint:ci`).
- [x] Zero typecheck errors (`pnpm typecheck`).
- [x] `pnpm quality:gates` verde com gates novos ativos.
- [x] Backward compat preservado em API pública (assinaturas de Button, Dialog, Card, etc. inalteradas). Mudanças com break documentadas em CHANGELOG.
- [x] code-audit checks: cyclomatic complexity ≤ 10 nos arquivos modificados, file size ≤ 500 lines.
- [x] `pnpm pack --dry-run` lista dist/, src/, registry/, LICENSE, CHANGELOG.md.
- [x] `pnpm build` produz dist com 6 files esperados.
- [x] **Dogfood QA PASS** — `/dogfood full` health score ≥ 75, zero CRITICAL.
- [x] **Runtime-metric proof** — Para tasks com runtime counters (e.g., bundle size, axe violations count, lighthouse score), os números são observados no projeto fixture-shadcn-app + no dogfood Vite consumer. Não apenas "código compila + tests passam". Lesson: review-deep-review-2026-05-13 BLOCKER-001 foi exatamente um bug que tests não pegaram porque rodavam contra src/ — só consumer real exercitou dist/.
- [x] CHANGELOG.md `[Unreleased]` consolidado em `[0.1.0-beta]` com data e link diff.
- [x] CI step `quality:gates` ≤ 5min.
- [x] CI step `test:registry` (fixture install) ≤ 90s.

---

## Notas operacionais

### Sequência sugerida de execução
- **Sprint 1 (1 semana, paralelizada)**: Phase 0 → Phase 1 + Phase 2 em paralelo (devs diferentes podem trabalhar em arquivos disjuntos).
- **Sprint 2 (1 semana)**: Phase 3 → Phase 4 → Phase 5 (paralelos onde possível).
- **Sprint 3 (1 semana)**: Phase 6 → Phase 7 → Phase 8.
- **Sprint 4 (3 dias)**: Phase 9 + Phase 10.

### Risco mais alto
- **Phase 3 (CommandPalette refactor)**: trocar implementação caseira por `cmdk` pode mudar comportamento sutil que tests não cobrem. Mitigação: testes novos antes de remover código antigo (RED-GREEN-REFACTOR estrito).
- **Phase 4.1 (prefers-reduced-motion)**: pode quebrar animação "running" do AgentEvent visualmente. Mitigação: `motion-safe:` no spin é preserva-se a animação para quem não opt-in reduce.
- **Phase 5.3 (defaultMode "dark")**: é mudança visível para qualquer consumer existente. Marcar como `Changed` no CHANGELOG e considerar minor bump.

### Pontos de bifurcação que pedem decisão antes de Sprint 1
1. **D8** confirmada? (Sem regressão visual neste plan?)
2. **D9** confirmada? (Coverage threshold gating?)
3. Versão alvo: `0.1.0-beta` ou `0.1.0` direto?

### Estimativa total
- ~15 dias de eng. focada (1 dev senior) ou ~8 dias em par (2 devs paralelizando phases independentes).

---

## Post-Plan Steps (automated by skill)

1. Run `/edge-case-plan ui-deep-review-fixes` para auditar edge cases.
2. Após implementar: `/cross-validation ui-deep-review-fixes`.
3. Após cross-val APROVADO: `/dogfood full`.
4. Após dogfood PASS: `/architecture-docs usetheo-ui` (diff) e perguntar substituição.
