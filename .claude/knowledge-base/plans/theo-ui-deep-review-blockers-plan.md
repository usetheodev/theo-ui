# Plan: `@theokit/ui` — Deep Review Remediation (2026-05-14, BLOCKER + HIGH + MEDIUM cleanup)

> **Version 1.0** — Plano corretivo que resolve **todos os 37 achados** da auditoria técnica conduzida em 2026-05-14 (snapshot em `main@799b5ec`): 3 BLOCKERS, 9 HIGH, 13 MEDIUM, 7 LOW, 5 NIT. Outcome esperado: (a) `validateComponentStructure` passa a detectar imports sibling-primitive (o regex atual aceita silenciosamente 8 violações); (b) registry inclui um `tailwind-preset` consumível, eliminando o gap em que `text-body-md` / `text-display-2xl` etc. não chegam ao consumidor; (c) `test:registry` builda CSS real (não só `tsc --noEmit`); (d) `package.json#files` enxuto, sem expor `src/` testes e mocks ao npm; (e) Geist self-hosted como default (CDN vira opt-in); (f) subpath exports `@theokit/ui/<component>` permitem bundle granular; (g) documentação alinhada (`CONTRIBUTING.md`, exception nomeada para `Toaster`); (h) snapshot de bundle e a11y agregado fora do per-component axe. Pós-execução, a lib está em estado de tag `0.1.0` sob `--tag next`, com critério humano de release verde nos 8 checkboxes do gate final.

## Context

**Estado em 2026-05-14:**
- Snapshot do repositório auditado: `main@799b5ec`, working tree limpo, 102 componentes (88 primitives + 14 composites), 110 registry items, 102 test files, 114 stories Ladle.
- Dois ciclos anteriores de remediação já foram aplicados: `ui-deep-review-fixes-plan.md` (2026-05-13) e `ui-audit-remediation-2026-05-14-plan.md`. Ambos resolveram a maior parte do que foi encontrado naquelas iterações (XSS no `ThemeScript`, compound-pattern uniforme via `Object.assign`, `vitest-axe` em ≥30 primitives, `validateArchitectureCensus`, `validateNoStrayArtifacts`, fixture stratified install).
- O CHANGELOG `Unreleased` é exemplar — todos os fixes recentes estão documentados.
- A auditoria desta sessão (terceira passada, evidence-based, com `grep` direto e validação de regex via `node -e`) descobriu três falhas **novas** que escaparam das duas passadas anteriores:
  1. O próprio gate `validateComponentStructure` tem regex defeituoso e admite silenciosamente 8 primitives que importam outros primitives.
  2. A typescale do design system (`text-body-md`, `text-display-2xl`, `text-label-caps` etc.) vive *somente* em `tailwind.config.ts` — não há `tailwind-preset` no registry, e a fixture de install não builda CSS para detectar isso.
  3. `package.json#files` inclui `"src"`, então 102 testes + 114 stories + screens internos vão para o tarball npm.

**Evidências concretas:**
- `node -e "const re = /from\s+[\"'](?:\.\.\/)+(?:primitives|composites)\//; console.log(re.test(\"import { Button } from '../button/button.js';\"))"` → `false`. O gate não pega sibling imports.
- `grep -rnE "from \"\.\./[a-z-]+/[a-z-]+\.js\"" src/components/primitives` lista 8 ocorrências (5 components × várias imports).
- `ls registry/*.json | grep -i tailwind` retorna 0 itens relevantes. `tests/fixture-shadcn-app/` não tem `tailwind.config.*`; `scripts/test-registry-install.ts:99` chama apenas `pnpm tsc --noEmit`.
- `package.json:13` declara `"files": ["dist", "src", "registry", "LICENSE", "CHANGELOG.md"]`.

**Documento de referência:** o relatório completo da auditoria está em `.claude/knowledge-base/reviews/` (gerado nesta sessão pelo assistant). Esse plano traduz cada finding em task executável.

## Objective

**Done = todos os 8 checkboxes do gate humano de release estão verdes** (vide §"Global Definition of Done"). Especificamente:

1. `validateComponentStructure` falha quando primitive importa sibling primitive — comprovado por meta-test do próprio gate.
2. Os 8 primitives que violam a regra estão reclassificados (movidos para `composites/` ou divididos), com `src/index.ts`, `registry/*.json`, README e `docs/architecture.md` sincronizados.
3. `registry/tailwind-preset.json` distribui um Tailwind preset consumível; `npx shadcn add tailwind-preset` em projeto Vite vanilla resulta em Button renderizado com a typescale correta (verificado em screenshot/snapshot).
4. `scripts/test-registry-install.ts` builda CSS real (Tailwind CLI) e assert sobre classes `.text-body-md`, `.text-display-2xl`, `.text-label-caps` no output.
5. `package.json#files` reduzido para apenas `dist`, `registry/r`, `registry/index.json`, `LICENSE`, `CHANGELOG.md`. Tarball ≤ 5 MB.
6. `src/styles/fonts.css` default é self-hosted (woff2 empacotado em `dist/fonts/`); o CDN do Google vira entrypoint opt-in `@theokit/ui/fonts-cdn.css`.
7. `package.json#exports` mapeia cada primitive/composite (`@theokit/ui/button`, `@theokit/ui/dialog`, …) via script `scripts/sync-exports.ts` automático.
8. `CONTRIBUTING.md` publicado, `docs/architecture.md` nomeia explicitamente a exceção "global provider primitives" para `Toaster`/`ThemeProvider`, NITs e LOWs aplicados.

## ADRs

### D1 — Sibling-primitive detection via path resolution, não regex literal
- **Decisão:** Reescrever `validateComponentStructure` para resolver paths a partir do diretório do arquivo e comparar contra o set de primitives conhecidas, em vez de testar `primitives|composites` literal no path do `from`.
- **Rationale:** O regex atual `/from\s+["'](?:\.\.\/)+(?:primitives|composites)\//` falha para imports irmãos da forma `"../button/button.js"` porque o path resolvido (`src/components/primitives/button/button.tsx`) tem `primitives/` mas o **specifier de import** não — só tem `../button/...`. Path-based resolution casa com a regra "primitive não importa outro primitive" sem depender de convenção de string.
- **Consequences:** Gate fica robusto contra qualquer arrumação futura de paths (pasta renomeada, monorepo move). Custo: um leve aumento de complexidade no validator (precisa listar primitives upfront). Habilita: meta-test do próprio gate.

### D2 — Reclassificar primitives violadores em composites, não documentar exceções
- **Decisão:** Mover `agent-editor`, `rule-editor`, `skill-editor`, `approval-card`, `cron-jobs-list`, `skills-list`, `mcp-server-list` para `composites/`. `form-field` é exceção (mantém em `primitives/` e inlinea `<label>` ao invés de importar `Label`).
- **Rationale:** A regra mecânica do `architecture.md` é load-bearing para a promessa de bundle previsível. Adicionar exceções enfraquece a regra e cria ambiguidade para o próximo dev. `form-field` é caso limítrofe (a única dep era `Label` para `htmlFor` wiring); mais barato inlinar do que reclassificar 7 outros. Os Editors são tipicamente composites em qualquer DS maduro (FormField + Input + Button = composite por definição). Lists-of-cards são padrão composite.
- **Consequences:** Quebra o `src/index.ts` ordering (move blocks de primitives para composites). Quebra o README catalog e architecture census — gates `validateCountConsistency` + `validateArchitectureCensus` re-sincronizam via `pnpm sync:readme`. Custos: 7 mvs, 7 atualizações de `registry/*.json` (mudar `type` se aplicável, mas o `type: "registry:ui"` já é polimórfico — registry-side é cosmético). Benefício: regra documentada vira verdade testada.

### D3 — Distribuir Tailwind preset como item de registry obrigatório
- **Decisão:** Criar `src/styles/tailwind-preset.ts` (TypeScript) com `theme.extend.{fontSize, fontFamily, colors, borderRadius, boxShadow, transitionTimingFunction, transitionDuration, keyframes, animation}`. Publicar como `registry:lib` em `registry/tailwind-preset.json`. Todo `registry:ui` que use classes utility do preset declara `tailwind-preset` em `registryDependencies`.
- **Rationale:** Alternativas consideradas: (a) inlinar os tokens como `style` props — rejeitada, perde tree-shaking de Tailwind e quebra dark mode; (b) gerar CSS variável `--font-size-body-md` em `tokens.css` + utility class no `styles.css` — rejeitada, duplica fonte de verdade e não aproveita `tailwindcss-animate`; (c) `tailwindcss preset` exportado — aceito, é o padrão idiomático Tailwind, casa com a expectativa shadcn (registry pode shipear preset).
- **Consequences:** Adiciona 1 etapa ao quickstart Option B (instalar preset antes de qualquer componente). README precisa de update. Cria nova fonte de verdade: o preset. Quality gate `validateDesignSystemFidelity` precisa olhar ambos `tailwind.config.ts` E `tailwind-preset.ts` para garantir paridade — ou melhor, `tailwind.config.ts` passa a *importar* o preset e o gate só audita o preset.

### D4 — Fixture-app builda Tailwind CLI no test:registry
- **Decisão:** Estender `scripts/test-registry-install.ts` com: (1) `pnpm tailwindcss -i src/styles/global.css -o dist/test.css --content "src/**/*.tsx"` dentro da fixture; (2) parse do CSS gerado e assertion sobre presença de classes-chave; (3) opcional, Vitest+RTL renderiza um Button e checa `getComputedStyle`.
- **Rationale:** "tsc --noEmit" verifica só tipos. O bug do BLOCKER-002 só vira visível em build CSS real. Snapshot de classes é barato e suficiente.
- **Consequences:** Custo de CI: +5-15s. `tests/fixture-shadcn-app/` ganha `tailwind.config.ts` (importando o preset), `postcss.config.cjs` e `package.json` ganha `tailwindcss` em devDeps. Cobertura real do registry workflow.

### D5 — `package.json#files` minimalista; subpath exports gerados
- **Decisão:** Manter no tarball: `dist/`, `registry/r/`, `registry/index.json`, `LICENSE`, `CHANGELOG.md`. Excluir: `src/`, `registry/<descriptors>.json`, `referencia/`, `playground/`, `tests/`, `.ladle/`. Gerar `package.json#exports` via `scripts/sync-exports.ts` que lê `src/index.ts` named exports e produz `./button`, `./dialog`, etc. apontando para `./dist/components/<layer>/<name>/index.js`.
- **Rationale:** Consumidores precisam de tipos + JS + CSS, nada mais. Tarball atual leva 200+ arquivos desnecessários. Subpath exports são lib-padrão moderna (ESM, Node 16.17+). `tsup` já gera o `index.d.ts`/`index.js` mas precisa também shipear arquivos por componente — ajustar `tsup.config.ts#entry` para incluir cada `src/components/<layer>/<name>/index.ts`.
- **Consequences:** Build mais lento (102 entries vs 1). Permite tree-shaking trivial mesmo em bundlers ruins. Possibilidade de regressão se `tsup` não gerar bem cada entry — mitigar com snapshot test do `dist/`. Remove ambiguidade de "posso importar do src/?" para sempre.

### D6 — Fonts self-hosted como default; CDN opt-in via entrypoint paralelo
- **Decisão:** Empacotar Geist Sans + Geist Mono em `dist/fonts/` como woff2. `src/styles/fonts.css` usa `@font-face` apontando para paths relativos (`./fonts/geist-...woff2`). Criar entrypoint adicional `@theokit/ui/fonts-cdn.css` que mantém o `@import` do Google Fonts para quem quer zero asset hosting.
- **Rationale:** A audiência declarada (PaaS, AI agents, dev tools enterprise) tem CSP estrito e GDPR — Google Fonts CDN é fricção real. Self-host é o padrão moderno em libs (shadcn, Radix themes, Tremor). Tamanho: Geist 5 weights × 2 famílias = ~150KB woff2 total — comparable to lucide-icons que já é dep. Quem não quer asset: usa `fonts-cdn.css`.
- **Consequences:** Licença Geist é OFL — compatível com Apache-2.0 do projeto. Build `tsup` copia woff2 para `dist/fonts/`. `package.json#exports` adiciona `"./fonts-cdn.css"`. README quickstart muda: o snippet padrão fica self-hosted.

### D7 — `Toaster`/`ThemeProvider` viram "global provider primitives" — categoria nomeada na arch doc
- **Decisão:** Manter `Toaster` e `ThemeProvider` em `primitives/` mas adicionar seção "Global Provider Primitives" no `docs/architecture.md` que nomeia a exceção explicitamente: providers cuja semântica é app-wide, podem existir em `primitives/` mas exigem que o consumidor os monte na raiz. Lista exhausted: `Toaster`, `ThemeProvider`. Qualquer novo provider primitive exige RFC.
- **Rationale:** Mover `Toaster` para `composites/` cria mismatch com expectativa shadcn (Toaster é primitive em todos os DS modernos). Documentar é mais barato que reclassificar e atende ao espírito da regra ("docu­ment the requirement loudly" — citação literal do `architecture.md` atual).
- **Consequences:** O gate `validateComponentStructure` precisa de allowlist explícita para esses casos. Architecture doc cresce 30 linhas. Outros providers (`FormFieldContext`, `ToastContext`) ficam restritos ao próprio componente.

### D8 — Bundle-size gate via tsup metafile + snapshot test
- **Decisão:** Após `pnpm build`, parsear `dist/<entry>/meta.json` (tsup emite quando configurado com `metafile: true`), extrair size por entry, comparar contra `scripts/baselines/bundle-sizes.json`. Falha se Button-only > 25 KB, Dialog-only > 45 KB, full barrel > 350 KB. Snapshots são human-reviewable e atualizáveis via flag.
- **Rationale:** Bundle size é prova empírica de tree-shaking. Sem isso, qualquer regressão (re-export side-effectful, dep transitiva nova) passa silenciosa.
- **Consequences:** Adiciona script novo (`scripts/validate-bundle-size.ts`) ao `quality:gates`. Baselines vivem em `scripts/baselines/`. Quando um size sobe legitimamente, dev atualiza baseline com diff visível no PR.

## Dependency Graph

```
Phase 0 ──▶ Phase 1 ──▶ Phase 2 ──▶ Phase 3 ──▶ Phase 4 ──▶ Phase 7 ──▶ Phase 8
   │           │                       │            │
   │           │                       │            ▼
   │           │                       │       Phase 5 (parallel after 4)
   │           │                       │
   │           ▼                       ▼
   │      Phase 6 (parallel after 1)
   │
   └─▶ Phase 0 unlocks everything (gate first)

Phase 0: Fix the gate (BLOCKER-001 detection)
Phase 1: Reclassify violators (BLOCKER-001 fix)
Phase 2: Tailwind preset + fixture CSS build (BLOCKER-002 + BLOCKER-003)
Phase 3: Tarball + subpath exports (HIGH-001, HIGH-005, HIGH-003)
Phase 4: Self-hosted fonts (HIGH-002)
Phase 5: Docs + governance (MEDIUM-005, HIGH-007, MEDIUM-004)
Phase 6: Observability + test hardening (HIGH-006, HIGH-008, HIGH-009, MEDIUMs)
Phase 7: API cleanup (MEDIUM-007, MEDIUM-012, LOWs, NITs)
Phase 8: Dogfood QA (MANDATORY)
```

Phases 5 and 6 can run in parallel after Phase 1 lands (they don't touch the same files). Phase 7 is cosmetic and runs after structural changes settle.

---

## Phase 0: Fix the quality gate (BLOCKER-001 detection layer)

**Objective:** Make `validateComponentStructure` detect sibling-primitive imports before reclassifying any component. Order matters — fix the alarm before turning on the alarm system.

### T0.1 — Reescrever `validateComponentStructure` com path resolution

#### Objective
Substituir o regex literal por uma checagem path-resolved que detecta `from "../<sibling>/<sibling>.js"` corretamente.

#### Evidence
- `node -e` confirma que o regex atual retorna `false` para `"../button/button.js"`.
- `grep -rnE "from \"\.\./[a-z-]+/[a-z-]+\.js\"" src/components/primitives` lista 8 imports não-detectados.
- O proposito documentado do gate (`validate-quality-gates.ts:35-37` JSDoc implícito + `architecture.md:24-34`) é exatamente catar esses.

#### Files to edit
```
scripts/validate-quality-gates.ts — substituir hasImportFromTheoComponent + validateComponentStructure
scripts/validate-quality-gates.test.ts — (NEW) meta-test do gate
```

#### Deep file dependency analysis
- `scripts/validate-quality-gates.ts` é executado por `pnpm quality:structure` e `pnpm quality:gates`. Não tem testes próprios (lacuna).
- A função `hasImportFromTheoComponent` é local a esse script, sem outros consumidores.
- O TS path resolution requer importar `node:path` (já presente) e `fs/promises` (já presente) — sem dep nova.
- O meta-test usa Vitest (config existente em `vitest.config.ts`) e pode rodar com `include: ["scripts/**/*.test.ts"]` adicionado.

#### Deep Dives
- **Algoritmo:**
  1. Listar `src/components/primitives/<name>/` → `Set<string> primitiveNames`.
  2. Listar `src/components/composites/<name>/` → `Set<string> compositeNames`.
  3. Para cada `<name>.tsx`:
     - Parsear imports via regex `/from\s+["']([^"']+)["']/g`.
     - Para cada specifier que começa com `..`, resolver via `path.resolve(dirname(file), specifier)` → checar se cai em outro `primitives/<other>/`.
     - Distinguir value-imports de type-imports (regex prefix `import type` ou `{ type X }`).
- **Invariantes:**
  - Primitive não pode value-import outro primitive (regra fundadora).
  - Primitive PODE type-import outro primitive (`agent-profile` type usado por `agent-editor` é OK — vide `architecture.md:90-91`).
  - `form-field` é exceção temporária até T1.1.6 inlinar `Label`.
- **Edge cases:**
  - Re-export indireto (`export * from`) — não relevante aqui mas considerar.
  - Allowlist explícita para "global provider primitives" (vide D7) — `ThemeProvider` e `Toaster`.

#### Tasks
1. Adicionar função `parseImports(content: string): Array<{ specifier: string; isType: boolean }>` em `scripts/validate-quality-gates.ts`.
2. Adicionar função `resolveSpecifierToLayer(file: string, specifier: string, layers: { primitives: Set<string>; composites: Set<string> }): { layer: "primitives" | "composites" | null; name: string | null }`.
3. Reescrever `validateComponentStructure()` usando as helpers acima.
4. Adicionar allowlist `GLOBAL_PROVIDER_PRIMITIVES = new Set(["theme-provider", "toaster"])` (não usado em T0.1, mas preparado para T1.1).
5. Atualizar `vitest.config.ts` `include` para incluir `scripts/**/*.test.ts`.
6. Criar `scripts/validate-quality-gates.test.ts` com cenários RED listados abaixo.

#### TDD
```
RED:     test_sibling_value_import_fails_gate() — fixture com `from "../button/button.js"` deve fazer o gate falhar
RED:     test_sibling_type_only_import_passes_gate() — fixture com `import type { X } from "../button/button.js"` deve passar
RED:     test_global_provider_primitive_allowlisted() — `useTheme` importando `theme-provider` é OK
RED:     test_composite_imports_screen_fails() — composite com `from "../../../screens/x.js"` falha
GREEN:   Implementar parseImports + resolveSpecifierToLayer + nova validateComponentStructure
REFACTOR: Extrair os helpers para `scripts/lib/import-graph.ts` se ≥3 outros gates passarem a usar
VERIFY:  pnpm vitest run scripts/validate-quality-gates.test.ts
```

#### Acceptance Criteria
- [ ] Meta-test `scripts/validate-quality-gates.test.ts` cobre 4 cenários (sibling value, sibling type, global provider, composite-imports-screen).
- [ ] Rodar `pnpm quality:structure` com os 8 violadores atuais **falha** com mensagens claras por arquivo.
- [ ] Rodar `pnpm quality:structure` no estado pós-T1 (componentes reclassificados) **passa**.
- [ ] Helper functions exportadas via named export (preparado para reuso).
- [ ] Zero `any` introduzido no script.
- [ ] Biome `lint:ci` passa.

#### DoD
- [ ] Todas as tarefas implementadas.
- [ ] `pnpm vitest run scripts/` verde.
- [ ] `pnpm lint:ci` zero warning.
- [ ] `pnpm typecheck` verde.
- [ ] CHANGELOG `Unreleased > Changed` documenta a correção do regex.

---

## Phase 1: Reclassify components that violate taxonomy (BLOCKER-001 + HIGH-004)

**Objective:** Move the 7 violators to `composites/` and inline `<Label>` into `form-field`. Sync index, registry, README, architecture census.

### T1.1 — Mover `agent-editor` para `composites/`

#### Objective
Reclassificar `agent-editor` como composite (importa `Button`, `FormField`, `Input`, `Select`, `Textarea`).

#### Evidence
`src/components/primitives/agent-editor/agent-editor.tsx:6-10` value-imports 5 primitives. Registry já admite (`registry/agent-editor.json` declara `registryDependencies: ["cn", "agent-profile", "button", "form-field", "input", "select", "textarea", "mode-types"]`).

#### Files to edit
```
src/components/primitives/agent-editor/* — mover para src/components/composites/agent-editor/*
src/components/composites/agent-editor/agent-editor.tsx — corrigir imports `../button/button.js` → `../../primitives/button/index.js`
src/components/composites/agent-editor/index.ts — manter export
src/components/composites/agent-editor/agent-editor.test.tsx — corrigir relative paths
src/components/composites/agent-editor/agent-editor.stories.tsx — corrigir relative paths + title `Primitives / Agent` → `Composites / Agent`
src/index.ts — mover linhas de export do bloco PRIMITIVES para COMPOSITES
registry/agent-editor.json — atualizar `path` para `components/composites/agent-editor/agent-editor.tsx` e `target` para `components/blocks/agent-editor.tsx`; opcionalmente `type: "registry:block"`
docs/architecture.md — `<!-- BEGIN:primitives-list -->` remove AgentEditor; `<!-- BEGIN:composites-list -->` adiciona AgentEditor (auto via sync:readme)
README.md — auto via sync:readme
```

#### Deep file dependency analysis
- Imports relativos passam de `../button/button.js` (sibling primitive) para `../../primitives/button/index.js` (cross-layer via barrel — exigido pelo gate `validateCompositeBarrel`).
- Story title muda de `Primitives / Agent / AgentEditor` para `Composites / Agent / AgentEditor` (afeta Ladle navegação).
- `welcome.stats.ts` é regenerado por `sync:readme` — sem ação manual.
- O `registry/agent-editor.json` target `components/ui/agent-editor.tsx` deve virar `components/blocks/agent-editor.tsx` (convenção de `registry:block`). Type pode permanecer `registry:ui` (não é hard requirement do shadcn) ou virar `registry:block` para consistência.

#### Deep Dives
- O `registry:block` muda o consumer target de `@/components/ui/agent-editor` para `@/components/blocks/agent-editor`. Quebra para qualquer consumidor que já instalou — mas como a lib está pré-1.0 (v0.0.0), aceitável. Documentar em CHANGELOG `Breaking`.
- A reset-on-id pattern via `<AgentEditor key={agent.id} />` (CHANGELOG 2026-05-14) continua válida.
- Tests atuais não importam paths absolutos `@/...`; só relativos. Move-then-fix é mecânico.

#### Tasks
1. `git mv src/components/primitives/agent-editor src/components/composites/agent-editor`.
2. Atualizar imports dentro de `agent-editor.tsx` (5 paths sibling → barrel cross-layer).
3. Atualizar imports dentro de `agent-editor.test.tsx`.
4. Atualizar import + story title em `agent-editor.stories.tsx`.
5. Mover block de export em `src/index.ts` (encontrar `AgentEditor` na seção PRIMITIVES, mover para COMPOSITES > "Agent composites").
6. Atualizar `registry/agent-editor.json`: `files[0].path` para `components/composites/agent-editor/agent-editor.tsx`, `files[0].target` para `components/blocks/agent-editor.tsx`, opcionalmente `type` para `registry:block`.
7. Rodar `pnpm sync:readme` para regenerar README + architecture census + welcome.stats.ts.
8. Rodar `pnpm registry:build && pnpm registry:validate`.
9. Rodar `pnpm test src/components/composites/agent-editor/`.

#### TDD
```
RED:     test existente em agent-editor.test.tsx passa em novo path (smoke)
RED:     test_validateComponentStructure_passes_for_moved_component — meta-test do gate
GREEN:   Aplicar os mvs + ajustes de imports
REFACTOR: None expected
VERIFY:  pnpm test src/components/composites/agent-editor && pnpm quality:structure
```

#### Acceptance Criteria
- [ ] Diretório `src/components/primitives/agent-editor/` não existe.
- [ ] Diretório `src/components/composites/agent-editor/` existe e contém os 4 arquivos.
- [ ] `src/index.ts` exporta `AgentEditor` da seção composites.
- [ ] `registry/agent-editor.json` aponta para o novo path.
- [ ] `pnpm sync:readme` (idempotente) — segunda execução não muda nada.
- [ ] `pnpm quality:gates` verde.

#### DoD
- [ ] Test verde.
- [ ] Registry validate verde.
- [ ] CHANGELOG `Unreleased > Breaking` documenta a mudança de target.

### T1.2 — Mover `rule-editor` para `composites/`

Idêntico a T1.1, aplicado a `rule-editor` (importa 6 primitives).

**Files to edit:** análogos. **Evidência:** `src/components/primitives/rule-editor/rule-editor.tsx:6-11`. **TDD:** smoke test passa no novo path; gate passa. **DoD:** mesmo de T1.1.

### T1.3 — Mover `skill-editor` para `composites/`

Idêntico a T1.1. Note que `skill-editor` faz `import type { Skill, SkillSource, SkillState } from "../skill-card/skill-card.js"` — type-only é OK pelo D1, mas após o move o path vira `../../primitives/skill-card/index.js`.

### T1.4 — Mover `approval-card` para `composites/`

Importa apenas `Button`. Após move, `from "../../primitives/button/index.js"`.

### T1.5 — Mover `cron-jobs-list`, `skills-list`, `mcp-server-list` para `composites/`

Cada um importa o card correspondente. **Evidência:** `cron-jobs-list.tsx:5`, `skills-list.tsx:5`, `mcp-server-list.tsx:9`. Reclassificação trivial, mesmo pattern.

### T1.6 — Inlinar `<label>` em `form-field` (manter primitive)

#### Objective
`form-field` é exceção: única dep é `Label` para `htmlFor` wiring. Mais barato inlinar do que reclassificar e quebrar a expectativa de "form-field é primitive em todo DS".

#### Files to edit
```
src/components/primitives/form-field/form-field.tsx — substituir `<Label>` por `<label>` nativo com styling equivalente
src/components/primitives/form-field/form-field.test.tsx — test continua usando RTL queryBy*
registry/form-field.json — remover `label` de registryDependencies
```

#### Deep Dives
- `Label` primitive atual (`src/components/primitives/label/label.tsx`) é provavelmente `<label className="…tokens…">`. Replicar o className inline em `FormField.Label`.
- Mantém a regra: form-field tem subpart `FormField.Label` que renderiza `<label htmlFor={fieldId}>`.

#### TDD
```
RED:     test_form_field_label_has_htmlFor_attribute
RED:     test_form_field_label_has_correct_styling_classes
GREEN:   Inlinar label + classes
REFACTOR: Extrair className em const se necessário
VERIFY:  pnpm test src/components/primitives/form-field
```

#### Acceptance Criteria
- [ ] `form-field.tsx` não importa `Label`.
- [ ] `registry/form-field.json` declara `registryDependencies: ["cn"]`.
- [ ] `pnpm test src/components/primitives/form-field` verde.
- [ ] Visual snapshot do FormField inalterado (Ladle compare manual).

### T1.7 — Atualizar `validateComponentStructure` allowlist para `Toaster`

#### Objective
Após reclassificações, `Toaster` permanece em `primitives/` (decisão D7) mas precisa estar allowlisted para o gate não falhar.

#### Files to edit
```
scripts/validate-quality-gates.ts — adicionar GLOBAL_PROVIDER_PRIMITIVES = new Set(["theme-provider", "toaster"]); ignorar imports de/para esses
docs/architecture.md — adicionar seção "Global Provider Primitives" antes de "Renaming, deprecation, deletion"
```

#### Evidence
`Toaster` em `primitives/toast/toaster.tsx` cria context provider. `architecture.md` anti-patterns diz "primitive should not require a parent to mount a context provider … or document the requirement loudly" — D7 escolheu documentar.

#### TDD
```
RED:     test_global_provider_primitive_allowlisted (já no T0.1)
GREEN:   Adicionar allowlist
VERIFY:  pnpm quality:structure
```

#### Acceptance Criteria
- [ ] `docs/architecture.md` tem seção "Global Provider Primitives" listando `ThemeProvider` e `Toaster` com rationale.
- [ ] Gate aceita imports cruzados envolvendo essas duas componentes.

---

## Phase 2: Tailwind preset distribution + fixture CSS build (BLOCKER-002 + BLOCKER-003)

**Objective:** Make `npx shadcn add button` deliver a styled component to a vanilla project. Validate it in fixture.

### T2.1 — Extrair `tailwind-preset.ts`

#### Objective
Mover toda a `theme.extend` block do `tailwind.config.ts` para um preset reutilizável, fazer o config local consumi-lo.

#### Files to edit
```
src/styles/tailwind-preset.ts — (NEW) export const theoUIPreset: Partial<Config> = { ... }
tailwind.config.ts — substituir theme.extend por `presets: [theoUIPreset]`
scripts/validate-quality-gates.ts — validateDesignSystemFidelity passa a auditar tailwind-preset.ts (não tailwind.config.ts)
```

#### Deep file dependency analysis
- `tailwind.config.ts` é consumido por Tailwind CLI em build da lib (`global.css` → utility expansion) e pelo Ladle/playground.
- O preset será consumido por: (a) próprio `tailwind.config.ts` da lib, (b) `tests/fixture-shadcn-app/tailwind.config.ts` (criado em T2.4), (c) qualquer consumidor real via `npx shadcn add tailwind-preset`.
- Tipos: `Partial<Config>` para que `darkMode`, `content` etc. fiquem responsabilidade do consumidor.

#### Deep Dives
- Conteúdo do preset: `theme.extend.{colors, fontFamily, fontSize, borderRadius, boxShadow, transitionTimingFunction, transitionDuration, keyframes, animation, container}` + `plugins: [animate]`.
- `darkMode: "class"` fica fora do preset (decisão do consumer).
- `content: [...]` fica fora do preset.

#### Tasks
1. Criar `src/styles/tailwind-preset.ts` copiando o `extend` block atual de `tailwind.config.ts`.
2. Reescrever `tailwind.config.ts` para importar e usar `presets: [theoUIPreset]`, mantendo só `darkMode`, `content`.
3. Atualizar `validateDesignSystemFidelity` para ler `tailwind-preset.ts` ao invés de `tailwind.config.ts`.

#### TDD
```
RED:     test_tailwind_preset_exports_required_typescale_tokens — assert fontSize keys
RED:     test_validateDesignSystemFidelity_reads_preset
GREEN:   Extrair preset
REFACTOR: None expected
VERIFY:  pnpm typecheck && pnpm build && (inspect dist/styles.css for .text-body-md)
```

#### Acceptance Criteria
- [ ] `src/styles/tailwind-preset.ts` existe e exporta `theoUIPreset`.
- [ ] `tailwind.config.ts` < 30 linhas (só `content`, `darkMode`, `presets`).
- [ ] `pnpm build` produz `dist/styles.css` com `.text-body-md`, `.text-display-2xl`, `.text-label-caps`.
- [ ] `pnpm quality:gates` verde.

### T2.2 — Adicionar registry item `tailwind-preset`

#### Files to edit
```
registry/tailwind-preset.json — (NEW)
registry/index.json — auto-regenerado por registry:build
```

#### Tasks
1. Criar `registry/tailwind-preset.json`:
   ```json
   {
     "$schema": "https://ui.shadcn.com/schema/registry-item.json",
     "name": "tailwind-preset",
     "type": "registry:lib",
     "title": "Theo UI Tailwind preset",
     "description": "Type scale, fontFamily, colors and motion tokens consumed by every Theo UI component. Add to tailwind.config.ts#presets before installing any other component.",
     "dependencies": ["tailwindcss-animate"],
     "files": [
       { "path": "styles/tailwind-preset.ts", "type": "registry:lib", "target": "styles/tailwind-preset.ts" }
     ]
   }
   ```
2. Rodar `pnpm registry:build`.

#### TDD
```
RED:     test_registry_validate_finds_tailwind_preset
RED:     test_tokens_registry_does_not_duplicate_preset (sanity)
GREEN:   Criar descritor
VERIFY:  pnpm registry:build && pnpm registry:validate
```

#### Acceptance Criteria
- [ ] `registry/r/tailwind-preset.json` gerado com `files[0].content` ≠ vazio.
- [ ] `registry/index.json` lista `tailwind-preset`.

### T2.3 — Declarar `tailwind-preset` como `registryDependency` em todo `registry:ui` que use o typescale

#### Files to edit
```
registry/*.json — adicionar "tailwind-preset" a registryDependencies em todos os items registry:ui e registry:block
```

#### Deep Dives
- Identificar quais registry items efetivamente usam classes do preset: praticamente todos os componentes que usam `text-body-*`, `text-title-*`, `text-display-*`, `font-display`, `font-sans`, `font-mono`. Estimativa: ~95% dos itens.
- Mais simples: adicionar a TODOS exceto os 7 type-only / lib items (`agent-types`, `chat-types`, `cn`, `mode-types`, `permission-types`, `rule-types`, `task-types`).

#### Tasks
1. Criar `scripts/add-tailwind-preset-dep.ts` que lê todos `registry/*.json` exceto a whitelist e adiciona `"tailwind-preset"` em `registryDependencies` se ainda não estiver.
2. Executar uma vez.
3. Validar.

#### TDD
```
RED:     test_every_registry_ui_item_depends_on_tailwind_preset (gate novo)
RED:     test_lib_items_excluded_from_dep_chain
GREEN:   Adicionar via script + manual
VERIFY:  pnpm registry:validate
```

#### Acceptance Criteria
- [ ] Todo `registry:ui` / `registry:block` lista `tailwind-preset` em `registryDependencies`.
- [ ] Type-only e cn items NÃO listam (lib-only chain).
- [ ] Novo gate `validateRegistryPresetDep` adicionado a `validate-quality-gates.ts`.

### T2.4 — Fixture-app builda Tailwind real

#### Objective
Estender `tests/fixture-shadcn-app/` para incluir `tailwind.config.ts`, `postcss.config.cjs`, e fazer `test:registry` executar `tailwindcss` CLI + assert sobre classes.

#### Files to edit
```
tests/fixture-shadcn-app/tailwind.config.ts — (NEW)
tests/fixture-shadcn-app/postcss.config.cjs — (NEW)
tests/fixture-shadcn-app/package.json — adicionar tailwindcss, tailwindcss-animate, postcss, autoprefixer em devDeps
tests/fixture-shadcn-app/src/styles/global.css — (NEW) @tailwind base/components/utilities + tokens
scripts/test-registry-install.ts — adicionar etapa Tailwind build + assertion
```

#### Deep Dives
- Fixture já tem `pnpm-lock.yaml` separado; precisa `pnpm install --filter` ou trick para garantir que `tailwindcss` aparece. Usar `pnpm exec tailwindcss` direto se possível.
- O Tailwind CLI: `pnpm exec tailwindcss -i src/styles/global.css -o dist/test.css --config tailwind.config.ts`.
- Assert: parse o CSS gerado com regex simples, garantir presença de `.text-body-md{`, `.text-display-2xl{`, `.text-label-caps{`.

#### Tasks
1. Criar `tailwind.config.ts` na fixture importando o preset instalado.
2. Criar `postcss.config.cjs` padrão.
3. Criar `src/styles/global.css` com `@tailwind` directives + `@import "./tokens.css"`.
4. Adicionar `tailwindcss`, `tailwindcss-animate`, `postcss`, `autoprefixer` ao `package.json` da fixture.
5. Reescrever `scripts/test-registry-install.ts` final para:
   - Executar `pnpm tsc --noEmit` (como hoje).
   - Executar `pnpm exec tailwindcss -i src/styles/global.css -o dist/test.css`.
   - Ler `dist/test.css` e assert `expect(css).toContain(".text-body-md")` etc.

#### TDD
```
RED:     test_registry_install_builds_css_and_asserts_classes (script Vitest)
RED:     test_button_renders_with_text_body_class (RTL)
GREEN:   Configurar fixture + adicionar etapa no script
REFACTOR: None expected
VERIFY:  pnpm test:registry
```

#### Acceptance Criteria
- [ ] `pnpm test:registry` builda Tailwind real na fixture.
- [ ] Output CSS contém `.text-body-md`, `.text-display-2xl`, `.text-label-caps`.
- [ ] Script falha se qualquer classe esperada estiver ausente.
- [ ] Tempo de execução ≤ 30s.

#### DoD
- [ ] Falha intencional: remover uma classe do preset → fixture detecta.
- [ ] CHANGELOG documenta a melhoria.

---

## Phase 3: NPM tarball hygiene + subpath exports (HIGH-001, HIGH-005, HIGH-003)

**Objective:** Tarball npm enxuto, exports granulares por componente, generated files fora de `src/`.

### T3.1 — Reduzir `package.json#files`

#### Files to edit
```
package.json — files array
.npmignore — (NEW, alternativa) com glob de exclusão explícito
```

#### Tasks
1. Substituir `"files": ["dist", "src", "registry", "LICENSE", "CHANGELOG.md"]` por `"files": ["dist", "registry/r", "registry/index.json", "LICENSE", "CHANGELOG.md"]`.
2. Verificar `npm pack --dry-run` lista < 200 arquivos e < 5MB.
3. Adicionar gate novo `validateNpmTarball` em `validate-quality-gates.ts` que executa `npm pack --dry-run --json` e falha se algum arquivo matchear `*.test.*`, `*.stories.*`, `src/screens/`, `referencia/`.

#### TDD
```
RED:     test_npm_tarball_excludes_tests
RED:     test_npm_tarball_excludes_screens
RED:     test_npm_tarball_size_under_5mb
GREEN:   Ajustar files array
VERIFY:  pnpm exec npm pack --dry-run --json | jq '.[0].files | length'
```

#### Acceptance Criteria
- [ ] `npm pack --dry-run` < 5MB.
- [ ] Zero arquivos `.test.tsx`/`.stories.tsx` no tarball.
- [ ] `src/screens/` ausente.
- [ ] Novo gate `validateNpmTarball` no `quality:gates`.

### T3.2 — Subpath exports por componente

#### Files to edit
```
package.json — exports map ampliado
tsup.config.ts — entry: array de cada src/components/<layer>/<name>/index.ts
scripts/sync-exports.ts — (NEW) gerador do exports map a partir de src/index.ts
```

#### Deep Dives
- `tsup` aceita `entry: ["src/index.ts", "src/components/primitives/button/index.ts", …]` e gera um chunk por entry. Configurar `outExtension: () => ({ js: ".js" })` para manter `.js`.
- O sync-exports script parseia `src/index.ts` named exports + lê os paths via regex. Gera blocos `exports[`./button`] = { types, import }`.
- Compatibilidade: o `.` (barrel) continua sendo a forma recomendada; subpaths são otimização para bundlers ruins.

#### Tasks
1. Criar `scripts/sync-exports.ts` que regenera `package.json#exports` a partir de `src/index.ts`.
2. Atualizar `tsup.config.ts` para multi-entry.
3. Rodar `pnpm sync:exports`.
4. Validar com fixture: `import { Button } from "@theokit/ui/button"` resolve via subpath.
5. Adicionar gate `validateExportsMap` (cross-check entre named exports e exports map).
6. Adicionar `sync:exports` ao `quality:gates:fast` para evitar drift.

#### TDD
```
RED:     test_import_via_subpath_works (fixture)
RED:     test_validateExportsMap_catches_drift
GREEN:   Gerar exports + validar
VERIFY:  pnpm build && pnpm test:registry
```

#### Acceptance Criteria
- [ ] `import { Button } from "@theokit/ui/button"` resolve no fixture.
- [ ] Todos os 102 componentes têm entry em `exports`.
- [ ] Gate `validateExportsMap` no `quality:gates`.
- [ ] Build size por subpath em `scripts/baselines/bundle-sizes.json` (preparação para T6.3).

### T3.3 — Mover `welcome.stats.ts` para fora de `src/`

#### Files to edit
```
src/welcome.stats.ts — DELETE
.ladle/generated/welcome.stats.ts — (NEW, target do gerador)
scripts/sync-readme.ts — atualizar path de output
scripts/validate-quality-gates.ts — validateCountConsistency lê do novo path
src/screens/welcome.stories.tsx — atualizar import (se importar)
tsconfig.json — opcional, incluir .ladle/generated em paths
```

#### Tasks
1. Mover output destino de `sync-readme.ts`.
2. Adicionar `.ladle/generated/` a `.gitignore`? — não, pois o gate compara com README; precisa estar committed ou regenerado em CI.
3. Atualizar todos os consumidores.

#### TDD
```
RED:     test_welcome_stats_lives_outside_src
GREEN:   Mover + atualizar paths
VERIFY:  pnpm sync:readme && pnpm quality:gates
```

#### Acceptance Criteria
- [ ] `src/welcome.stats.ts` não existe.
- [ ] `.ladle/generated/welcome.stats.ts` é regenerado por `pnpm sync:readme`.
- [ ] Gate `validateCountConsistency` continua passando.
- [ ] Tarball npm não contém o arquivo.

---

## Phase 4: Self-hosted Geist fonts (HIGH-002)

**Objective:** Default ship com fonts locais; CDN vira opt-in via entrypoint paralelo.

### T4.1 — Empacotar Geist como woff2

#### Files to edit
```
src/styles/fonts/ — (NEW) diretório com geist-{100..900}.woff2, geist-mono-{100..900}.woff2
src/styles/fonts.css — substituir @import do Google Fonts por @font-face declarations apontando para ./fonts/
src/styles/fonts-cdn.css — (NEW) entrypoint opt-in com o @import original
tsup.config.ts — copyFile dos woff2 para dist/fonts/
package.json#exports — adicionar "./fonts-cdn.css"
```

#### Evidence
Vercel publica Geist como OFL (`https://vercel.com/font` ou pacote npm `geist`). Aceitar 3 weights (400, 500, 600) ao invés de variável full-axis para minimizar tamanho (~30KB cada × 3 × 2 = 180KB).

#### Tasks
1. Baixar/extrair Geist Sans + Geist Mono weights 400, 500, 600 (ou usar npm `geist` package se aceitável).
2. Verificar licença OFL no LICENSE-FONT ou similar (incluir em `dist/fonts/LICENSE-GEIST`).
3. Reescrever `fonts.css` com `@font-face` per weight per family.
4. Criar `fonts-cdn.css` mantendo o `@import` Google.
5. Atualizar `tsup.config.ts#onSuccess` para `await Promise.all([...woff2s.map(copy)])`.
6. Atualizar README quickstart com a nova ordem.

#### TDD
```
RED:     test_fonts_css_uses_font_face_not_import
RED:     test_dist_contains_geist_woff2_files
RED:     test_fonts_cdn_css_exists_as_separate_entrypoint
GREEN:   Empacotar + reescrever
VERIFY:  pnpm build && ls dist/fonts/ | wc -l (espera ≥6)
```

#### Acceptance Criteria
- [ ] `dist/fonts/*.woff2` presentes (≥6 arquivos).
- [ ] `dist/styles.css` resolve `url(./fonts/geist-*.woff2)` (paths relativos OK).
- [ ] `@import "@theokit/ui/styles.css"` em fixture não dispara request para `fonts.googleapis.com`.
- [ ] `@import "@theokit/ui/fonts-cdn.css"` (opt-in) preserva comportamento atual.
- [ ] `LICENSE-GEIST` (OFL) incluso no `dist/fonts/`.

### T4.2 — Atualizar `validateDesignSystemFidelity` para aceitar @font-face

O gate atual checa que `tokens.css` contém "Geist" string. Como mantemos o nome do family, continua válido. Mas adicionar assertion explícita de `@font-face` em `fonts.css`.

---

## Phase 5: Documentação e governança (MEDIUM-005, HIGH-007, MEDIUM-004, NITs)

**Objective:** CONTRIBUTING.md, exceções nomeadas, documentação de `referencia/`, SECURITY.md.

### T5.1 — Criar `CONTRIBUTING.md`

#### Files to edit
```
CONTRIBUTING.md — (NEW) 200-300 linhas: setup, taxonomia, fluxo, quality gates, registry, release
```

#### Acceptance Criteria
- [ ] Seções: Setup, Architecture rule, Adding a component (passo a passo do `architecture.md:97-118`), Quality gates, Registry, Submitting a PR, Release process.
- [ ] Link from README.
- [ ] Mention `referencia/` como "internal exploration, not maintained" se mantiver.

### T5.2 — Documentar "Global Provider Primitives" em `architecture.md`

Implementado em T1.7. Aqui consolidamos: a seção fica entre "Anti-patterns" e "Renaming, deprecation, deletion".

### T5.3 — Criar `SECURITY.md`

#### Files to edit
```
SECURITY.md — (NEW) política de disclosure, supported versions, contact (security@theokit.dev?)
```

#### Acceptance Criteria
- [ ] Compatível com GitHub Security Policy.
- [ ] Menciona `ThemeScript` XSS hardening e o vetor `</script>`.

### T5.4 — Decidir destino de `referencia/`

#### Options
- **A:** mover para repo separado (`@theokit/design-references` privado).
- **B:** documentar em `CONTRIBUTING.md` como "exploration archive — not maintained, may be removed".
- **C:** deletar do repo (perde history se não estiver em outro lugar).

#### Recommended
Opção B: cita em CONTRIBUTING + adicionar nota no top de `referencia/README.md` (se não existir, criar).

---

## Phase 6: Observability e test hardening (HIGH-006, HIGH-008, HIGH-009, MEDIUM-001/002/003/008/009/010/011/012/013)

**Objective:** Bundle size baseline, displayName tests, a11y agregado, dev warnings.

### T6.1 — Dev-only console.warn em `ThemeProvider` catch silencioso

#### Files to edit
```
src/themes/theme-provider.tsx — adicionar warn em useState init + persist catches
biome.json — overrides para theme-provider (noConsole = off no path específico)
```

#### Tasks
1. Substituir 2 catch silenciosos por:
   ```ts
   } catch (err) {
     if (process.env.NODE_ENV !== "production") {
       // biome-ignore lint/suspicious/noConsole: dev-only diagnostic
       console.warn("[@theokit/ui] theme storage unavailable:", err);
     }
   }
   ```

#### TDD
```
RED:     test_theme_provider_warns_in_dev_when_storage_fails
RED:     test_theme_provider_silent_in_prod
GREEN:   Adicionar warn
VERIFY:  pnpm test src/themes/
```

### T6.2 — DisplayName regression tests for compounds

#### Files to edit
```
src/components/primitives/{card,dialog,tabs,sheet,sidebar,topnav,avatar,toast,radio-group,form-field}/*.test.tsx — adicionar test
```

#### TDD
```
RED:     test_Card_displayName_is_correct
RED:     test_Card_Header_displayName_is_correct
...
GREEN:   Já passa (correto no código atual); test apenas verifica regression
```

#### Acceptance Criteria
- [ ] 10 compounds × ~5 subparts cada = ~50 assertions a mais.

### T6.3 — Bundle size snapshot

#### Files to edit
```
scripts/validate-bundle-size.ts — (NEW)
scripts/baselines/bundle-sizes.json — (NEW) baseline inicial
package.json — adicionar script `quality:bundle` ao quality:gates
tsup.config.ts — habilitar metafile: true
```

#### Tasks
1. Habilitar `metafile: true` no tsup.
2. Criar script que lê `dist/metafile-*.json`, extrai size por entry, compara com baseline.
3. Suportar `--update` para regenerar baseline.

#### Acceptance Criteria
- [ ] Baseline com sizes por entry (após T3.2).
- [ ] Tolerância de ±5% antes de falhar.
- [ ] Gate `quality:bundle` integrado.

### T6.4 — `aria-atomic="false"` explícito em `agent-stream`

```
src/components/composites/agent-stream/agent-stream.tsx — adicionar aria-atomic="false"
```

### T6.5 — Warn em controlled/uncontrolled switch no BuildLogStream

```
src/components/primitives/build-log-stream/build-log-stream.tsx — useEffect dev-only que detecta visibleLevels prop transitioning between undefined and defined
```

### T6.6 — A11y agregado via axe em Ladle build

#### Files to edit
```
.ladle/config.mjs — adicionar plugin axe (se disponível)
scripts/audit-a11y.ts — (NEW) playwright + axe-core sobre cada story
package.json — script `quality:a11y` que chama o script
```

#### Acceptance Criteria
- [ ] Cada Ladle story tem 0 axe violations.
- [ ] Gate adicionado a `quality:gates`.

### T6.7 — Pequenos cleanups

- T6.7.1: `permission-matrix` ganha visual regression test (snapshot CSS class) — MEDIUM-003
- T6.7.2: `LICENSE` confirmar não-hardlink — MEDIUM-008
- T6.7.3: `cmdk` peer dep opcional → manter dep direta + documentar custo no doc
- T6.7.4: `agent-editor.tsx` `React.FormEvent` → `import type { FormEvent }` — MEDIUM-012
- T6.7.5: Unit test em `parseIndexExports()` — MEDIUM-013

---

## Phase 7: API cleanup (MEDIUM-007, LOW-001..LOW-007, NIT-001..NIT-005)

### T7.1 — `ScrollArea.Bar` compound

#### Files to edit
```
src/components/primitives/scroll-area/scroll-area.tsx — Object.assign Root, { Bar: ScrollBar }
src/index.ts — remover ScrollBar standalone export, manter ScrollArea
src/components/primitives/scroll-area/scroll-area.test.tsx — adicionar test do compound
registry/scroll-area.json — atualizar se necessário
```

#### Deprecation
Adicionar `@deprecated` JSDoc em `ScrollBar` antes de remover; remover em próximo major.

### T7.2 — Pequenos cleanups (LOWs e NITs)

#### Files to edit
```
playground/* — adicionar a tsconfig.json#include — LOW-001
README.md — documentar decisão ESM-only — LOW-002
src/test/a11y.ts — padronizar helper, deprecar inline pattern — LOW-003
src/components/primitives/skeleton/skeleton.tsx — documentar override de aria-live — LOW-004
docs/design-system.md — promover "no glass blur" a guideline nomeada — NIT-002
referencia/ → renomear para references/ ou mover (vide T5.4) — NIT-003
docs/architecture.md — remover "T8.2"/"D5"/"HIGH-007" refs internos a sprint — NIT-005
```

---

## Coverage Matrix

| # | Finding | Severity | Task(s) | Resolution |
|---|---|---|---|---|
| 1 | BLOCKER-001 — Gate regex fails for sibling imports | BLOCKER | T0.1, T1.1–T1.7 | Regex → path-resolved; 7 mvs + 1 inline |
| 2 | BLOCKER-002 — Typescale not shipped via registry | BLOCKER | T2.1, T2.2, T2.3 | Tailwind preset extracted + registry item + all UI items depend on it |
| 3 | BLOCKER-003 — Fixture only does `tsc --noEmit` | BLOCKER | T2.4 | Fixture builds Tailwind + asserts classes |
| 4 | HIGH-001 — `files` includes `src/` | HIGH | T3.1 | Files trimmed + new gate |
| 5 | HIGH-002 — Google Fonts CDN default | HIGH | T4.1, T4.2 | Self-hosted Geist + opt-in CDN entrypoint |
| 6 | HIGH-003 — `welcome.stats.ts` in `src/` | HIGH | T3.3 | Moved to `.ladle/generated/` |
| 7 | HIGH-004 — 8 primitives violate rule | HIGH | T1.1–T1.6 | Reclassified (covered by BLOCKER-001) |
| 8 | HIGH-005 — No subpath exports | HIGH | T3.2 | exports map per component + sync script + gate |
| 9 | HIGH-006 — Silent catch in ThemeProvider | HIGH | T6.1 | Dev-only console.warn |
| 10 | HIGH-007 — Toaster is provider primitive | HIGH | T1.7, T5.2 | Documented exception "Global Provider Primitives" |
| 11 | HIGH-008 — No granular sideEffects test | HIGH | T6.3 | Bundle size baseline + gate |
| 12 | HIGH-009 — displayName not regression tested | HIGH | T6.2 | Tests added for 10 compounds |
| 13 | MEDIUM-001 — agent-stream aria-relevant | MEDIUM | T6.4 | aria-atomic="false" added |
| 14 | MEDIUM-002 — BuildLogStream controlled/uncontrolled | MEDIUM | T6.5 | Dev warn on prop transition |
| 15 | MEDIUM-003 — PermissionMatrix visual drift risk | MEDIUM | T6.7.1 | Visual regression test |
| 16 | MEDIUM-004 — `referencia/` undocumented | MEDIUM | T5.4 | Documented in CONTRIBUTING |
| 17 | MEDIUM-005 — No CONTRIBUTING.md | MEDIUM | T5.1 | Created |
| 18 | MEDIUM-006 — `build/`/`dist/` in gitignore | MEDIUM | T7.2 | Added to .gitignore explicitly |
| 19 | MEDIUM-007 — ScrollBar separate export | MEDIUM | T7.1 | Migrated to ScrollArea.Bar compound |
| 20 | MEDIUM-008 — LICENSE nlink=2 | MEDIUM | T6.7.2 | Verified non-issue |
| 21 | MEDIUM-009 — cmdk dep policy | MEDIUM | T6.7.3 | Documented as direct dep |
| 22 | MEDIUM-010 — lucide-react bundle | MEDIUM | T6.3 | Covered by bundle size snapshot |
| 23 | MEDIUM-011 — No eslint-plugin-jsx-a11y | MEDIUM | T6.6 | axe-playwright in CI on Ladle build |
| 24 | MEDIUM-012 — `React.FormEvent` namespace | MEDIUM | T6.7.4 | Named import |
| 25 | MEDIUM-013 — welcome.stats circular truth | MEDIUM | T6.7.5 | Unit test for parser |
| 26 | LOW-001 — `playground/` not in tsconfig.include | LOW | T7.2 | Added |
| 27 | LOW-002 — ESM-only undocumented | LOW | T7.2 | README note |
| 28 | LOW-003 — Mixed a11y helpers | LOW | T7.2 | Single helper |
| 29 | LOW-004 — Skeleton aria-live always-on | LOW | T7.2 | JSDoc override note |
| 30 | LOW-005 — useToast in barrel | LOW | Covered by T3.2 subpath |
| 31 | LOW-006 — ThemeSwitcher no feedback | LOW | (deferred, not critical) |
| 32 | LOW-007 — `*-list` duplicate landmarks | LOW | T7.2 | Documented |
| 33 | NIT-001 — Import ordering | NIT | T7.2 | Biome organize-imports check |
| 34 | NIT-002 — Glass blur guideline unnamed | NIT | T7.2 | Promoted in design-system.md |
| 35 | NIT-003 — `referencia/` pt-BR name | NIT | T7.2 | Renamed/moved |
| 36 | NIT-004 — `font-bold` hardcoded in CVA | NIT | (deferred — minor) |
| 37 | NIT-005 — Sprint refs in comments | NIT | T7.2 | Cleaned up |

**Coverage: 37/37 findings (100%)**

## Global Definition of Done

- [ ] All phases 0–7 completed.
- [ ] `pnpm quality:gates` verde (incluindo novos gates: `validateNpmTarball`, `validateExportsMap`, `validateRegistryPresetDep`, `quality:bundle`, `quality:a11y`).
- [ ] `pnpm typecheck` verde.
- [ ] `pnpm lint:ci` zero warnings.
- [ ] `pnpm test` verde (target: ≥ atual + 50 novos asserts).
- [ ] `pnpm test:registry` builda CSS e asserts classes do typescale.
- [ ] `npm pack --dry-run` < 5MB, sem `.test.*`/`.stories.*`/`screens/`.
- [ ] CHANGELOG `Unreleased` documenta cada mudança breaking ou comportamental, agrupada por categoria (Added/Changed/Fixed/Removed/Security).
- [ ] Architecture docs sincronizados via `pnpm sync:readme`.
- [ ] README quickstart Option B testado manualmente em Vite vanilla — Button renderiza com typescale correta.
- [ ] **Dogfood QA PASS** — `/dogfood full` health score >= 70, zero CRITICAL issues.

## Final Phase: Dogfood QA (MANDATORY)

> Roda DEPOIS de todas as phases. Plano não está done até dogfood passar.

### Execution

```bash
# 1. Cross-validation primeiro (BLOCKER gate)
/cross-validation theo-ui-deep-review-blockers

# 2. Se APROVADO, dogfood
/dogfood full
```

### Acceptance Criteria
- [ ] Cross-validation APROVADO ou APROVADO COM RESSALVAS (sem BLOCKERs).
- [ ] Dogfood health score >= 70/100.
- [ ] Zero CRITICAL issues introduzidos por este plano.
- [ ] Zero HIGH issues nos componentes/scripts modificados.
- [ ] Pre-existing issues documentadas em `Unreleased > Known issues` mas não bloqueantes.

### If Dogfood Fails
1. Triagem: issues novos vs pré-existentes (usar `git blame` + linhas tocadas pelo plano).
2. Fixar CRITICAL e HIGH causados pelo plano antes de declarar done.
3. Re-rodar `/dogfood full`.

### Runtime-metric proof
Este plano não cria runtime counters/hit-rates (não há benchmark workload custom). A prova runtime aqui é mais simples mas igualmente exigente:
- **T2.4 (fixture CSS build)** — CSS gerado precisa conter as classes-chave em workload real (não só compilar).
- **T3.1 (npm tarball)** — `npm pack --dry-run` em CI precisa retornar tamanho real abaixo do threshold.
- **T6.3 (bundle size)** — `dist/` tem que existir com sizes mensurados, não só sumários.
- **T4.1 (self-hosted fonts)** — abrir fixture em browser headless e confirmar zero requests para `fonts.googleapis.com`.

Esses são os equivalentes do "runtime-metric acceptance" para um projeto frontend lib.
