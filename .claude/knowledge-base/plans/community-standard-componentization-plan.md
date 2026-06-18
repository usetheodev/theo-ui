# Plan: `@theokit/ui` — Community-Standard Componentization (shadcn v4 alignment)

## Goal

Fazer `pnpm quality:gates` passar verde com dois novos gates ativos — `use-client-directive` (0 componentes client sem `"use client"` no `dist/`) e `data-slot` (0 componentes sem `data-slot` na raiz) — corrigindo os 6 gaps contra o padrão shadcn v4 sem retrocompatibilidade.

## Context

A revisão técnica de 2026-06-18 confirmou, por inspeção direta, 6 divergências de `@theokit/ui` contra o padrão moderno shadcn v4. O blueprint `.claude/knowledge-base/discoveries/blueprints/community-standard-componentization-blueprint.md` (SHIPPABLE 100) extraiu o padrão-alvo citado linha-a-linha do repo oficial shadcn (`.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/`). Este plano implementa as decisões do blueprint (ADRs D1/D2/D3) sem preocupação com retrocompatibilidade (autorizado pelo usuário). O gap mais crítico — `"use client"` ausente no bundle — quebra a lib em Next.js App Router, o ambiente-alvo primário ("cloud dashboards").

## Baseline Context (deep review of current state)

### Files that will be touched

| File | LoC | Last touch (sha/date) | Reason it exists |
|---|---|---|---|
| `tsup.config.ts` | 229 | 70f17c3 2026-06-03 | Config do bundler (ESM-only, splitting, dts por-entry para engines) |
| `scripts/validate-quality-gates.ts` | 949 | f508fec 2026-06-03 | Validador estrutural (host dos novos gates use-client + data-slot) |
| `package.json` | 834 | f8710e5 2026-06-16 | exports map (135 subpaths), deps, scripts, peer Tailwind ^4 / React <20 |
| `src/components/primitives/button/button.tsx` | 111 | a67839c 2026-05-25 | Primitivo de referência (já tem cva + Slot; modelo p/ data-slot) |
| 45 componentes client (`*.tsx` com hooks) | — | vários | 21 primitives + 24 composites usam hooks → precisam `"use client"` |
| 135 componentes (`*.tsx` raiz) | — | vários | Todos precisam `data-slot` |
| `src/test/ladle-axe.test.tsx` | — | — | STORY_SKIPS (linha 61) com skips a11y sem fix (button-name) |
| `src/components/primitives/metrics-panel/metrics-panel.tsx` | — | — | Tiles clicáveis sem aria-label |
| `src/components/primitives/agent-stream/*` | — | — | nested aria-live (anuncia 2x) |

### Current callers / dependents

- `tsup.config.ts § dts.entry` (linhas 101-114) já mapeia entries para engines (`whiteboard`, `slide`, `slide-deck`, plugins) mas NÃO para os 135 subpaths de primitives/composites — esses resolvem types para o barrel.
- `scripts/validate-quality-gates.ts` expõe `validateComponentStructure` (67), `validateCompoundPattern` (570), `validateArchitectureCensus` (639), `validateAxeCoverage` (722), `main` (898) — novos gates entram em `main` na mesma cadeia.
- `package.json § exports` — cada subpath tem `"types": "./dist/index.d.ts"` (barrel) hoje; Phase 3 reaponta para o `.d.ts` por-entry.
- 3 componentes já têm `"use client"`: `chat-message.tsx`, `chat-message-response.tsx`, `chat-message-branch.tsx` (composites) — não regredir.

### Domain glossary

- **primitive** — componente que não importa outro `@theokit/ui` (taxonomia enforced por `validate-quality-gates.ts`).
- **composite** — importa ≥1 primitivo via barrel.
- **data-slot** — atributo HTML estável (`data-slot="button"`) para targeting/override; convenção shadcn v4: raiz = nome, sub = `nome-parte`.
- **directive hoisting** — preservação de `"use client"` no topo do chunk de saída pelo bundler.
- **subpath isolation** — `@theokit/ui/button` resolve JS isolado (já funciona); types ainda apontam para o barrel (gap Phase 3).

### Architecture boundaries affected

- `.claude/rules/architecture.md` — taxonomia primitive/composite e bundle isolation. Os novos gates REFORÇAM a fronteira (não a cruzam). O barrel (`src/index.ts`) NÃO muda de superfície pública.
- `package.json#exports` — superfície pública; Phase 3 muda `types` por subpath (breaking apenas para quem dependia do barrel-types via subpath — aceitável).

## Prior Art & Related Work

- Blueprint interno `.claude/knowledge-base/discoveries/blueprints/community-standard-componentization-blueprint.md` (SHIPPABLE 100) — padrão shadcn v4 citado.
- `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/{button,card,dialog,select}.tsx` — convenção data-slot + assinatura.
- `.claude/knowledge-base/references/shadcn-ui/packages/shadcn/src/utils/transformers/transform-rsc.ts` — evidência de que o modelo copy-paste não cobre o npm path.
- `esbuild-plugin-preserve-directives` (OSS) — solução madura de hoisting de diretiva para esbuild/tsup (Não-reinventar, Rule 9).

## Objective

"Done" = (a) `dist/primitives/<x>/index.js` e `dist/composites/<x>/index.js` dos 45 componentes client começam com `"use client"`; (b) os 135 componentes emitem `data-slot` na raiz; (c) subpaths têm `.d.ts` próprio; (d) devDep Tailwind em v4 + matriz React 19; (e) a11y pontuais fechados; (f) `pnpm quality:gates` verde com os 2 novos gates.

Metas mensuráveis:
1. Novo gate `validateUseClientDirective` retorna 0 violações.
2. Novo gate `validateDataSlot` retorna 0 violações.
3. Teste RSC-smoke: import do tarball num fixture Next-App-Router-shaped não lança "useState only works in a Client Component".
4. `vitest-axe` verde para AgentStream, MetricsPanel, e os 3 editores (sem STORY_SKIPS de button-name).

## ADRs

### D1 — `data-slot` universal com naming `nome`/`nome-parte`

- **Decisão:** todo componente emite `data-slot` na raiz (= nome kebab) e em cada sub-parte exportada (= `nome-parte`); componentes com `cva` emitem `data-variant`/`data-size`. Testes asseveram `data-slot` no lugar de tokens Tailwind.
- **Rationale:** padrão dominante (53/57 na ref shadcn v4); desacopla testes de classes (`.claude/rules/testing.md` § "não testar implementação"); habilita override por consumidor. KISS — atributo estático.
- **Alternativa rejeitada:** classe CSS dedicada por componente (`.theo-button`) — duplica o que `data-slot` já dá e diverge do ecossistema (acoplaria consumidores a um seletor proprietário).

### D2 — Preservar `"use client"` via `esbuild-plugin-preserve-directives`

- **Decisão:** adicionar o plugin ao `tsup.config.ts § esbuildPlugins` + `"use client"` no topo de todo componente client + gate `validateUseClientDirective` que falha se um componente client não tem a diretiva no `dist/`.
- **Rationale:** o modelo copy-paste do shadcn não cobre `pnpm add @theokit/ui` (Não-reinventar, Rule 9 — usar plugin maduro). Sem isso a lib quebra em Next.js App Router.
- **Alternativa rejeitada:** `banner: { js: '"use client"' }` global do tsup — aplicaria a diretiva ao barrel inteiro (incluindo utils server-safe), forçando todo o pacote a ser client. Plugin por-módulo é correto.

### D3 — Manter `forwardRef` (não migrar para ref-as-prop)

- **Decisão:** NÃO refatorar os 123 `forwardRef`.
- **Rationale:** funciona em React 19 (só deprecado); refatorar é churn sem ganho funcional — YAGNI.
- **Alternativa rejeitada:** migração em massa para `function Component(props)` ref-as-prop — 123 arquivos de diff, risco de regressão de ref-forwarding, zero ganho funcional até o piso subir para React ≥19.

### D4 — Types por subpath via `dts.entry` expandido

- **Decisão:** expandir `tsup.config.ts § dts.entry` para incluir cada primitivo/composite com export público (ou usar um gerador que itere a árvore), e reapontar `package.json#exports[*].types` para o `.d.ts` por-entry.
- **Rationale:** subpath isolation hoje é meio-feito (JS isolado, types no barrel). Completá-lo melhora DX e tempo de type-check do consumidor.
- **Alternativa rejeitada:** api-extractor — adiciona toolchain pesada; o `dts.entry` do tsup já é usado para engines e resolve sem nova dep (KISS). Se o OOM do rollup-plugin-dts reaparecer com 135 entries, mitigar com `dts: { resolve: false }` ou particionar.

## Drawbacks & Risks

| Risco | Severidade | Mitigação | Owner |
|---|---|---|---|
| Diff massivo (135 componentes p/ data-slot) introduz erro mecânico | MÉDIA | Gate `validateDataSlot` + codemod verificável; teste por componente | impl |
| `dts.entry` com 135 entries causa OOM no rollup-plugin-dts (histórico, comentado no tsup) | ALTA | Phase 3 isolada; fallback `dts: { resolve: false }` ou particionar; se inviável, ADR-defer com gate de WARN | impl |
| `esbuild-plugin-preserve-directives` conflita com `splitting: true` (diretiva por chunk) | ALTA | Teste RSC-smoke valida o dist real; validar ordem do plugin; checar que chunks compartilhados não viram client à toa | impl |
| Migrar devDep p/ Tailwind v4 quebra build de stories/preset v3-legacy | MÉDIA | Remover styles-v3-legacy (retrocompat dispensada); rodar dogfood:v4-real-build | impl |
| Remover button-name dos STORY_SKIPS expõe falha a11y real que exige refactor de editor | BAIXA | Corrigir o componente (aria-label/sr-only), não o teste | impl |

## Unresolved Questions

- O `dts.entry` aguenta 135 entries sem OOM? — resolvido empiricamente na Phase 3 (com fallback documentado em D4). Não bloqueia Phase 1/2.
- Adicionar job CI React 19 (matriz) vs estreitar o peer para `<19`? — Phase 4 decide por matriz React 19 (mais honesto com o peer atual `<20`); se o CI ficar instável, fallback estreitar peer.

## Dependency Graph

```
Phase 1 (use client RSC)  ─┐
Phase 2 (data-slot)        ├─ independentes entre si (arquivos/gates distintos), podem paralelizar
Phase 6 (a11y pontuais)   ─┘
Phase 3 (.d.ts subpath) ── depende de Phase 1 (tsup.config alterado) p/ evitar conflito de merge no mesmo arquivo
Phase 4 (tailwind v4 / react19) ── independente; roda após 1-2 p/ não competir pelo build
Phase 5 (cva/asChild) ── melhor após Phase 2 (data-variant já presente)
Final Phase: Integration Validation ── depende de todas
```

## Phase 1: Preservar `"use client"` no bundle (CRÍTICO)

### T1.1 — Adicionar `esbuild-plugin-preserve-directives` ao tsup + diretiva nos componentes client

#### Objective
Garantir que os 45 componentes client emitam `"use client"` no `dist/`, destravando Next.js App Router.

#### Why this step (action + reasoning)
**Ação:** instalar `esbuild-plugin-preserve-directives`, registrar em `tsup.config.ts § esbuildPlugins`, e adicionar `"use client"` no topo dos 45 componentes que usam hooks/contexto.
**Raciocínio:** o blueprint (ADR D2) provou que o modelo copy-paste do shadcn não cobre o npm path; `transform-rsc.ts` confirma que a diretiva é um source-concern. Sem hoisting no bundler, `dist/primitives/*/index.js` perde a diretiva (medido: 0 no dist), e o consumidor Next.js toma erro de RSC. Esta é a maior dor de DX (Baseline: 21+24 componentes client).

#### Evidence
- `grep -rl '"use client"' dist/primitives dist/composites` → 0 (medido nesta sessão).
- `tsup.config.ts` sem `esbuildPlugins`/`banner` (medido).
- `.claude/knowledge-base/references/shadcn-ui/packages/shadcn/src/utils/transformers/transform-rsc.ts:1-18`.

#### Files to edit
- `tsup.config.ts` — adicionar `esbuildPlugins: [preserveDirectives()]`.
- `package.json` — devDep `esbuild-plugin-preserve-directives`.
- 45 componentes `src/components/{primitives,composites}/**/*.tsx` (root file de cada um) — `"use client"` no topo (exceto os 3 já marcados).
- `scripts/validate-quality-gates.ts` — novo gate `validateUseClientDirective` + entry em `main`.
- `tests/rsc-smoke/` (NEW) — fixture que importa um componente client do dist e verifica a diretiva.

#### Deep file dependency analysis
`tsup.config.ts` é consumido por `pnpm build`; alterar `esbuildPlugins` afeta TODOS os entries. Risco: interação com `splitting: true` (D2 risk). O gate novo roda em `main()` (linha 898) junto aos demais.

#### TDD
- **RED:** teste `tests/rsc-smoke/use-client-preserved.test.ts` que faz `pnpm build` (ou lê dist pré-buildado) e asserta que `dist/primitives/agent-event/index.js` (client) começa com `"use client"`. Falha hoje (0 diretivas).
- **GREEN:** plugin + diretivas → teste passa.
- **REFACTOR:** extrair a lista de "componentes client" para o gate derivar de AST (presença de hook) em vez de lista hardcoded.

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `dist/{primitives,composites}/<client>/index.js` dos 45 começa com `"use client"`.
- `validateUseClientDirective` retorna 0 violações.
- Componentes server-safe (ex: utils-only) NÃO recebem a diretiva: `grep -L "use client" dist/lib/*.js` lista os utils (oracle: ausência da diretiva).

#### DoD
- `pnpm build && node -e "..."` confirma diretiva; `pnpm quality:structure` verde; CHANGELOG `[Unreleased] § Fixed` atualizado (RSC).

### T1.2 — Gate `validateUseClientDirective`

#### Objective
Falhar o build se um componente client não tem `"use client"` no dist.

#### Why this step
**Ação:** adicionar função ao validador que, para cada componente cujo source usa hooks, verifica a diretiva no `dist/`.
**Raciocínio:** sem gate, a regressão volta silenciosamente (Rule: fail-fast). Espelha como `validateAxeCoverage` protege a11y.

#### Files to edit
- `scripts/validate-quality-gates.ts`.

#### TDD
- **RED:** teste unitário do gate com um componente client sem diretiva → gate reporta violação.
- **GREEN:** implementação detecta e reporta corretamente.

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- Gate detecta componente client sem diretiva e falha (oracle: `pnpm quality:structure` exit code != 0 no fixture); ignora componentes server-safe.

#### DoD
- `pnpm quality:structure` inclui o gate; teste do gate verde.

## Phase 2: `data-slot` universal

### T2.1 — `data-slot` na raiz + sub-partes dos 135 componentes

#### Objective
Emitir `data-slot` em todo componente (raiz + sub-partes) e `data-variant`/`data-size` onde há `cva`.

#### Why this step
**Ação:** adicionar `data-slot="<nome>"` ao elemento raiz e `data-slot="<nome>-<parte>"` às sub-partes; nos que têm `cva`, adicionar `data-variant`/`data-size`.
**Raciocínio:** padrão shadcn v4 (ADR D1), 53/57 na ref. Desacopla testes de classes Tailwind (resolve as 29 className-assertions).

#### Evidence
- `grep -rl data-slot src/components` → 0 (medido).
- `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/card.tsx:8,21,34,44,54,67,77`.

#### Files to edit
- 135 componentes root `src/components/{primitives,composites}/**/*.tsx`.
- `src/test/**` — substituir 29 className-assertions por data-slot-assertions.
- `scripts/validate-quality-gates.ts` — gate `validateDataSlot`.

#### Deep file dependency analysis
Mudança aditiva (novo atributo); não altera comportamento nem superfície de tipos. Risco mecânico mitigado pelo gate.

#### TDD
- **RED:** para um lote-piloto (button, card, dialog, alert), teste que asserta `screen.getByText(...).closest('[data-slot="card"]')` presente — falha hoje.
- **GREEN:** adicionar atributos → passa.
- **REFACTOR:** generalizar para todos via codemod; rodar gate.

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- Todos os 135 root files têm `data-slot`; sub-partes seguem `nome-parte`; `validateDataSlot` 0 violações; 29 className-assertions migradas.

#### DoD
- `pnpm test && pnpm quality:structure` verde; CHANGELOG `[Unreleased] § Changed`.

## Phase 3: Types por subpath

### T3.1 — `.d.ts` por entry para primitives/composites

#### Objective
Cada subpath público resolve `.d.ts` próprio, não o barrel.

#### Why this step
**Ação:** expandir `tsup.config.ts § dts.entry` (ou gerar via script iterando a árvore de componentes com `index.ts`), reapontar `package.json#exports[*].types`.
**Raciocínio:** ADR D4 — subpath isolation hoje é parcial (types no barrel). Completá-lo melhora DX/perf de type-check.

#### Evidence
- `dist/primitives/*/*.d.ts` ausente (medido); `package.json#exports` aponta `./dist/index.d.ts` por subpath.
- `tsup.config.ts:101-114` (dts.entry já por-entry para engines).

#### Files to edit
- `tsup.config.ts`, `package.json` (exports), `scripts/regen-subpath-exports.ts` (já existe — estender).

#### TDD
- **RED:** teste que importa tipo de `@theokit/ui/button` e verifica que `dist/primitives/button/index.d.ts` existe e exporta `ButtonProps`. Falha hoje.
- **GREEN:** dts por-entry → passa.
- **REFACTOR:** garantir no-OOM (fallback D4 se necessário).

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `dist/{primitives,composites}/<x>/index.d.ts` existe; `exports[*].types` aponta corretamente; `pnpm quality:attw`/`publint` verde.

#### DoD
- `pnpm build && pnpm quality:publint` verde; CHANGELOG `[Unreleased] § Fixed`.

## Phase 4: Alinhar matriz de build (Tailwind v4 + React 19)

### T4.1 — devDep Tailwind v4 + matriz React 19 + remover v3-legacy

#### Objective
Testar contra a versão anunciada (Tailwind ^4, React 19).

#### Why this step
**Ação:** bump devDep `tailwindcss` p/ `^4`; adicionar job de teste React 19; remover `styles-v3-legacy` + `preset-v3-legacy` (retrocompat dispensada).
**Raciocínio:** peer declara `tailwindcss ^4` mas testa em 3.4.17 — promessa não validada. React peer `<20` sem matriz 19.

#### Evidence
- `package.json`: peer `tailwindcss ^4.0.0`, devDep `^3.4.17` (medido).
- `dist/styles-v3-legacy.css`, `preset-v3-legacy.*` (existem).

#### Files to edit
- `package.json` (devDeps, scripts, exports — remover v3-legacy), `tsup.config.ts` (remover entry v3-legacy), `tailwind.config.ts`, `.github/workflows/*` (matriz React 19).

#### TDD
- **RED:** `dogfood:v4-real-build` roda contra Tailwind v4 instalado → hoje passa por acaso (preset v3); após remover legacy, garantir build v4 puro.
- **GREEN:** devDep v4 + ajustes → dogfood verde.

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- devDep `tailwindcss@^4`; CI testa React 19; `styles-v3-legacy`/`preset-v3-legacy` removidos de exports e dist; `pnpm dogfood:v4-real-build` verde.

#### DoD
- `pnpm quality:gates` verde; CHANGELOG `[Unreleased] § Removed` (v3-legacy) + `§ Changed` (matriz).

## Phase 5: `cva`/`asChild` sistematizado

### T5.1 — Auditar e expor variantes + re-export de `*Variants`

#### Objective
Componentes com variação real expõem `variant`/`size` via `cva` e re-exportam `*Variants`; `asChild` onde fizer sentido.

#### Why this step
**Ação:** auditar (não forçar) os componentes — sub-step de auditoria nesta mesma task produz a lista; onde há variação real, refatorar para `cva` + `VariantProps` + re-export; adicionar `asChild` via `Slot` em wrappers polimórficos.
**Raciocínio:** blueprint Técnica 2; hoje 11/135 cva. NÃO forçar em todos (YAGNI) — só onde há variação genuína.

#### Files to edit
- Componentes selecionados na auditoria (lista derivada por sub-step desta task), seus testes.

#### TDD
- **RED:** para cada componente promovido, teste que `<X variant="..."/>` aplica `data-variant` e que `xVariants({variant})` é importável do barrel.
- **GREEN:** refator cva → passa.

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- Componentes promovidos exportam `*Variants`; `data-variant`/`data-size` presentes; sem regressão visual (`quality:visual`).

#### DoD
- `pnpm test && pnpm quality:visual` verde; CHANGELOG `[Unreleased] § Changed`.

## Phase 6: a11y pontuais

### T6.1 — nested aria-live, button-name, aria-label

#### Objective
Fechar as 3 violações a11y conhecidas.

#### Why this step
**Ação:** remover `aria-live` aninhado em AgentStream/AgentStreaming (manter um só); dar nome acessível aos botões dos editores Agent/Skill/Rule; `aria-label` nos tiles clicáveis do MetricsPanel; remover os skips correspondentes de `STORY_SKIPS`.
**Raciocínio:** WCAG; hoje só comentados em `ladle-axe.test.tsx:61`. Corrigir o componente, não o teste.

#### Evidence
- `src/test/ladle-axe.test.tsx:61` STORY_SKIPS; `metrics-panel.tsx` tiles sem aria-label (Baseline).

#### Files to edit
- `src/components/primitives/agent-stream/*`, `metrics-panel.tsx`, editores Agent/Skill/Rule, `src/test/ladle-axe.test.tsx`.

#### TDD
- **RED:** `vitest-axe` para cada alvo sem o skip → falha (button-name / duplicate aria-live).
- **GREEN:** correção → axe verde.

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `vitest-axe` verde para os 5 alvos; STORY_SKIPS de button-name removidos; assert `getAllByRole("status")` retorna exatamente 1 região no AgentStream (oracle: `pnpm quality:a11y`).

#### DoD
- `pnpm quality:a11y` verde; CHANGELOG `[Unreleased] § Fixed`.

## Coverage Matrix

| # | Requisito (gap) | Evidência | Task(s) |
|---|---|---|---|
| 1 | use client preservado no dist (CRÍTICO) | `grep dist` → 0 | T1.1, T1.2 |
| 2 | data-slot em 135 componentes | `grep src/components` → 0 | T2.1 |
| 3 | 29 className-assertions → data-slot | testes acoplados a tokens | T2.1 |
| 4 | .d.ts por subpath | `dist/primitives/*` sem types | T3.1 |
| 5 | Tailwind v4 devDep + React 19 matriz | peer ^4 / devDep 3.4.17 | T4.1 |
| 6 | remover styles-v3-legacy (sem retrocompat) | `dist/styles-v3-legacy.css` | T4.1 |
| 7 | cva/asChild sistematizado + *Variants | 11/135 cva | T5.1 |
| 8 | nested aria-live | AgentStream anuncia 2x | T6.1 |
| 9 | button-name editores | STORY_SKIPS:61 | T6.1 |
| 10 | aria-label MetricsPanel | tiles sem label | T6.1 |
| 11 | NÃO migrar forwardRef (decisão de não-fazer) | ADR D3 | (deferral — out of scope per ADR D3) |

**Coverage: 11/11 requisitos mapeados (100%)**

## Global Definition of Done

- [ ] `pnpm quality:gates` verde (inclui os 2 novos gates).
- [ ] `pnpm test` verde; cobertura não regride.
- [ ] `pnpm lint:ci && pnpm typecheck` limpos.
- [ ] Bundle isolation preservada (barrel inalterado; subpath JS isolado).
- [ ] Taxonomia primitive/composite intacta (sem cross-import novo).
- [ ] CHANGELOG `[Unreleased]` atualizado por fase.
- [ ] Arquivos respeitam budget (~500 LoC; validador não muda de responsabilidade única).

## Failure scenarios (when I/O external)

(none — no external I/O touched; todas as mudanças são build-time / componente / teste. O "RSC-smoke" lê o dist local, não rede.)

## Final Phase: Integration Validation (MANDATORY)

### Execution
```
pnpm format:check && pnpm lint:ci && pnpm typecheck && pnpm quality:knip && pnpm test && pnpm build && pnpm quality:publint && pnpm registry:build && pnpm registry:validate && pnpm quality:structure && pnpm quality:bundle && pnpm quality:a11y && pnpm quality:visual && pnpm ladle:build && pnpm dogfood:v4-real-build
# + novo: teste RSC-smoke (use client preservado no dist)
```

### Acceptance Criteria
- Toda a cadeia `quality:gates` verde com os 2 gates novos ativos.
- RSC-smoke passa (diretiva preservada).
- `pnpm quality:bundle` dentro do baseline ±5% (data-slot é atributo estático, impacto desprezível; se estourar, atualizar baseline com justificativa).

### If Validation Fails
- Voltar ao `/implement` na task da fase que quebrou. Não desabilitar gate. Não silenciar regra.
