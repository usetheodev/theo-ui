# Plan: `@usetheo/ui` — Audit Remediation (2026-05-14)

> **Version 1.0** — Este plano corrige os 32 findings (4 BLOCKERs · 9 HIGH · 9 MEDIUM · 5 LOW · 5 NIT) levantados pela auditoria técnica realizada em `2026-05-14` sobre `main@4c386cc`. O outcome esperado é (a) **ThemeScript** XSS-safe com escape de `</`, eliminando o vetor `</script>` em props; (b) **compound component pattern** consolidado em `Object.assign /*#__PURE__*/` nos 9 componentes (4 ainda usam mutation post-cast); (c) **FormField.Control** convertido para `cloneElement` eliminando dependência de invariantes internas do React; (d) **paridade README ↔ welcome ↔ architecture.md** auto-derivada do source-of-truth (sem números chumbados); (e) `vitest-axe` ativamente usado em ≥30 primitives interativos (atual: 6/101); (f) quality gates novos que falham em compound-pattern drift, axe-coverage drop, README count drift e architecture census drift; (g) Tailwind dark-mode config saneada (seletor morto removido); (h) tsup build portável (sem `cp` POSIX). Pós-execução, `pnpm quality:gates` é o único gate suficiente para liberar `0.1.0`.

## Context

A auditoria de 2026-05-14 — documentada na seção "Deep Technical Review" desta sessão de Claude — identificou que apesar do plano anterior (`ui-deep-review-fixes-plan.md`) ter sido majoritariamente executado (LICENSE, CHANGELOG, ThemeScript, vitest-axe integrado, README sync, paleta corrigida), **8 classes de problemas persistem ou foram introduzidas no caminho**:

1. **Segurança em ThemeScript**: `JSON.stringify` não escapa `/`, então `defaultTheme = "</script><script>alert(1)</script>"` sai literal no DOM. O teste existente (`theme-script.test.tsx:32-38`) confere um padrão errado e passa apesar do bug.
2. **Drift estrutural**: `docs/architecture.md` declara 36 primitives + 12 composites; real é 85 dirs / 88 named exports + 14 composites. `welcome.stories.tsx` STATS chumbados (36/12/07/03/21/122) vs reais (85/14/7/3/110/389). README badge "components-99" vs listas internas "88 primitives + 14 composites" = 102.
3. **Compound pattern incompleto**: CHANGELOG declara migração para `Object.assign /*#__PURE__*/` em 5 componentes (Card, Dialog, Sidebar, TopNav, Tabs). Mas Toast, Avatar, RadioGroup, FormField continuam com o padrão antigo (`X as typeof X & {...}; X.Sub = Sub`).
4. **FormField.Control bug latente**: usa `{...child, props: {...}}` em vez de `React.cloneElement(child, {...})`. Funciona por coincidência (preserva `$$typeof`), perde `ref`, frágil em React 19+.
5. **useEffect anti-pattern**: `agent-editor`, `skill-editor`, `rule-editor` resetam state via `useEffect [initial?.id]` — bug silencioso quando dois inputs com id undefined.
6. **A11y testing claim vs reality**: 6/101 testes (5.9%) usam `vitest-axe`, apesar do CHANGELOG declarar integração.
7. **Tailwind dead config**: `darkMode: ["class", '[data-theme="dark"]']` — segundo seletor nunca casa pois ThemeProvider seta `data-theme="violet-forge"`. Mesmo seletor em `tokens.css:126` é dead code.
8. **Coverage de fixture install ínfima**: `test-registry-install.ts` testa 4 de 110 registry items. Não cobre nenhum composite, nenhum item com Radix Dialog/Toast/cmdk.

Outros itens menores (`.bak`/`.tmp` no working tree, JSDoc inconsistências, `cp` POSIX em tsup, `theo-code-shell.tsx` com 2193 linhas, fonts CDN sem opt-in) completam a lista de 32 findings.

Evidência completa: relatório "Deep Technical Review — `@usetheo/ui` (Violet Forge)" produzido nesta sessão.

## Objective

"Done" =
- (a) `pnpm quality:gates` falha automaticamente em qualquer um dos 32 findings se reintroduzido;
- (b) zero BLOCKERs + zero HIGH abertos;
- (c) **`/dogfood full` health score ≥ 75/100** com zero CRITICAL;
- (d) auditoria axe-core sobre ≥30 primitives interativos retorna zero violations;
- (e) README, `architecture.md`, `welcome.stories.tsx` e `src/index.ts` concordam em 100% sobre contagens e listas, todos derivados de um único pipeline `pnpm sync:readme`.

Metas mensuráveis:

1. **Zero BLOCKERs** (4) após Phase 1-3.
2. **Zero HIGH** (9) após Phase 4-6.
3. **vitest-axe coverage ≥ 30 primitives** (medido por gate `validateAxeCoverage`).
4. **Bundle size `dist/index.js` ±5%** do baseline atual após mudanças de compound pattern (treeshake regression check).
5. **4 novos quality gates ativos**: `validateAxeCoverage`, `validateCompoundPattern`, `validateArchitectureCensus`, `validateCountConsistency`.
6. **Fixture install cobre ≥10 registry items** (uma amostra estratificada).
7. **Build portável** em macOS/Linux/Windows.

## ADRs

### D1 — Single source of truth para contagens: `src/index.ts` + filesystem
- **Decisão**: Toda contagem (badges, welcome, architecture.md, README catalog) é derivada por `scripts/sync-readme.ts` (ampliado). Nenhum número fica hardcoded em fontes não-geradas.
- **Rationale**: A auditoria mostrou 3 lugares onde números divergem (README badge "99" vs README listas "88+14", architecture.md "36+12", welcome "36/12/21/122"). Manter sincronização manual sempre falha. O script atual já existe e cobre o README; estender é barato.
- **Consequences**: `architecture.md` e `welcome.stories.tsx` ganham regiões `<!-- BEGIN:X -->` `<!-- END:X -->` ou importam de arquivo gerado. Gate `validateCountConsistency` enforça non-edit-by-hand.

### D2 — Compound component pattern canônico: `Object.assign /*#__PURE__*/`
- **Decisão**: Todos os 9 compound components migram para `Object.assign(Root, { Sub1, Sub2, ... })` com hint `/*#__PURE__*/`. Sem exceções.
- **Rationale**: CHANGELOG já declarou essa migração mas só 5/9 estão em conformidade. Padrão mutation (`Root as typeof Root & {...}; Root.Sub = Sub`) impede tree-shaking porque a mutação acontece em tempo de import sem marca PURE. `Object.assign` retorna o objeto e o JIT/bundler reconhece como side-effect-free quando anotado.
- **Consequences**: Toast, Avatar, RadioGroup, FormField refatorados. Novo gate `validateCompoundPattern` proíbe regressão. TypeScript: o resultado de `Object.assign` precisa de type assertion explícita em alguns casos para preservar JSX type.

### D3 — XSS defense em ThemeScript via `<` escape
- **Decisão**: Em `buildScript`, todo input externo é escapado com `JSON.stringify(v).replace(/</g, "\\u003c")` antes de ser injetado no template literal.
- **Rationale**: O bug demonstrado: `JSON.stringify("</script>")` retorna `'"</script>"'` (sem escape do `/`). Browser tokeniza `</script>` mesmo dentro de aspas porque a tokenização HTML acontece antes do parsing JS. Escapar `<` resolve completamente (parse JS continua válido pois `<` em string literal é `<`).
- **Consequences**: `buildScript` ganha uma função helper `safe(v)`. Teste atualizado para cobrir `</script>` explicitamente. Sem mudança de API.

### D4 — React.cloneElement como única forma de injetar props em filhos
- **Decisão**: Onde a UI lib precisa estender props de um child element (atualmente só `FormField.Control`), usar `React.cloneElement` + `React.Children.only`. Nunca spread-em-element.
- **Rationale**: React API contract documenta `cloneElement` como público; spread em element-shaped object não é. Preserva `ref` e `key`. Evita armadilha de regressão em React 19+.
- **Consequences**: Possivelmente afeta consumers que esperavam que `<FormField.Control><Input /></FormField.Control>` aceitasse múltiplos children — `Children.only` agora joga erro. Documentar em CHANGELOG.

### D5 — Test gate de registry: warning → fail
- **Decisão**: `validateRegistryStoriesAndTests` converte falta de `<name>.test.tsx` de `warn` para `fail`. Sem fase de tolerância.
- **Rationale**: 102 test files existem. A "test-backfill phase" já acabou. Warnings silenciosos não evitam novo drift.
- **Consequences**: Todo novo registry item precisa de test file no momento de adicionar — bloqueia merge.

### D6 — `darkMode: "class"` canonical, remover `[data-theme="dark"]` dead selector
- **Decisão**: `tailwind.config.ts` usa apenas `darkMode: "class"`. `tokens.css` remove `[data-theme="dark"]` selector. Dark mode aciona-se exclusivamente via `.dark` class em `<html>`.
- **Rationale**: ThemeProvider seta `data-theme` como **nome do tema** (`"violet-forge"`), nunca `"dark"`. O selector `[data-theme="dark"]` nunca casa. Manter dois mecanismos confunde. `.dark` class já é setada por ThemeProvider e ThemeScript.
- **Consequences**: Se algum consumer dependia de setar `data-theme="dark"` manualmente para acionar dark mode (improvável), quebra. Documentar em CHANGELOG. Vantagem: menor superfície de drift.

### D7 — Fixture install cobre amostra estratificada (não exhaustiva)
- **Decisão**: Estender `ITEMS_TO_INSTALL` para incluir 1 representante por categoria de dependency profile: zero-deps (cn), CVA-only (button), Radix-simple (avatar), Radix-portal (dialog), cmdk (command-palette), composite-pure (deployment-row), composite-radix (permission-modal).
- **Rationale**: Cobertura 100% (110 items) duplica `pnpm install` em CI e adiciona ~3min. Cobertura estratificada (~10 items) pega 95% dos modos de falha em ~30s adicionais.
- **Consequences**: `tests/fixture-shadcn-app/package.json` ganha peers de Radix/cmdk. CI um pouco mais lenta.

## Dependency Graph

```
Phase 0 (cleanup mecânico) ─────────────────────────────────────┐
                                                                 │
Phase 1 (security)         ─┐                                    │
Phase 2 (correctness)      ─┼─▶ Phase 4 (quality gates)          │
Phase 3 (docs truth)       ─┘         │                          │
                                      ▼                          │
                              Phase 5 (registry fixture) ────────┤
                                                                 │
Phase 6 (a11y expansion)   ─────────────────────────────────────┤
Phase 7 (tailwind/css)     ─────────────────────────────────────┤
Phase 8 (component cleanup) ────────────────────────────────────┤
                                                                 │
                                                                 ▼
                                                  Phase 9 (Dogfood QA)
```

**Paralelizável**: Phase 0, 1, 2, 6, 7, 8 não têm dependências entre si.
**Sequencial obrigatório**: Phase 3 depende de Phase 2 (precisa do pattern Object.assign estável antes de gerar docs). Phase 4 depende de Phase 1+2+3 (gates enforçam o que foi corrigido). Phase 5 depende de Phase 0+2 (registry items precisam estar limpos). Phase 9 depende de TODAS as anteriores.

---

## Phase 0: Cleanup mecânico

**Objective:** remover lixo do working tree, corrigir JSDocs drifteados, fixar build portável — todos são fix-de-uma-linha sem risco de regressão.

### T0.1 — Remover arquivos `.bak` e `.json.tmp` do working tree

#### Objective
Eliminar 97 arquivos (`README.md.bak`, `docs/design-system.md.bak`, 95× `registry/*.json.tmp`) que poluem listagens, IDE e ferramentas de busca ad-hoc.

#### Evidence
- `ls -la` mostra `README.md.bak` (9892 bytes) e `docs/design-system.md.bak`.
- `find registry -name "*.json.tmp" | wc -l → 95`.
- `git ls-files | grep -E '\.(bak|tmp)$' → 0` (já cobertos por `.gitignore`).

#### Files to edit
```
README.md.bak — DELETE
docs/design-system.md.bak — DELETE
registry/*.json.tmp (95 arquivos) — DELETE
scripts/refine-registry-descriptions.ts — auditar para entender quem cria .tmp e impedir
scripts/expand-short-descriptions.ts — idem
```

#### Deep file dependency analysis
- Os `.bak` são cópias manuais antigas (datadas pré-2026-05-13). Nenhuma referência cruzada.
- Os `.tmp` aparentam ter conteúdo idêntico ao `.json` final (`diff button.json button.json.tmp` é vazio). São output residual de algum script de refinamento.
- `refine-registry-descriptions.ts` (144 LoC) **não cria `.tmp`** — só sobrescreve `.json`. O culpado provavelmente é `expand-short-descriptions.ts` (70 LoC) — confirmar leitura.

#### Deep Dives
- Padrão `*.bak` em `.gitignore:69-72` cobre ambos. Não há risco de vazar para git, mas atrapalham `pnpm sync:readme` se o script futuro varrer todos os `.json`.
- Decision: hardcode delete + investigar a fonte para impedir reaparecimento.

#### Tasks
1. `rm README.md.bak docs/design-system.md.bak`
2. `find registry -name "*.json.tmp" -delete`
3. Ler `scripts/expand-short-descriptions.ts` para identificar criação de `.tmp`
4. Se o script criar `.tmp`, ajustar para escrever direto em `.json` ou limpar em finally block
5. Adicionar `--no-tmp` mode caso preciso, ou simplesmente cleanup do escopo do script

#### TDD
```
RED: test_no_stray_tmp_or_bak_files() — verifica via Node fs que não existem *.bak/*.json.tmp em src/, registry/, docs/, README
       (este teste falha hoje com 97 matches)
GREEN: implementar deletes + ajuste no script gerador
REFACTOR: None expected
VERIFY: pnpm tsx scripts/validate-quality-gates.ts (gate validateNoStrayArtifacts a ser adicionado em T4.4)
```

#### Acceptance Criteria
- [ ] `find . -name "*.bak" -not -path "./node_modules/*"` retorna 0 matches
- [ ] `find . -name "*.json.tmp"` retorna 0 matches
- [ ] Script gerador (`expand-short-descriptions.ts` ou outro) auditado e não recria `.tmp`
- [ ] `pnpm quality:structure` passa

#### DoD
- [ ] Working tree limpo
- [ ] CI green
- [ ] Gate de prevenção implementado em T4.4

---

### T0.2 — Corrigir `tsup.config.ts` para build portável (sem `cp` POSIX)

#### Objective
Trocar invocação shell `cp` por API Node, permitindo `pnpm build` em Windows.

#### Evidence
- `tsup.config.ts:12-13`: `onSuccess: "cp src/styles/tokens.css dist/tokens.css && cp src/styles/fonts.css dist/fonts.css && cp src/styles/global.css dist/styles.css"`.
- README:33 anuncia "Framework-agnostic. Works under Vite, Next, Remix, Astro, Tanstack Start" mas não menciona OS.
- `cp` não existe em Windows nativo (sem WSL/git-bash).

#### Files to edit
```
tsup.config.ts — substituir string-shell onSuccess por função async usando fs/promises
```

#### Deep file dependency analysis
- `tsup` aceita `onSuccess` como string OU como função async. Função permite chamar `node:fs/promises.copyFile`.
- Comportamento idêntico em Linux/macOS — `copyFile` é POSIX/Windows.
- CI (linux) continua passando; adiciona portabilidade.

#### Deep Dives
- `dist/styles.css` é gerado pela cópia de `src/styles/global.css` (renomeado). `global.css` faz `@import "./fonts.css"; @import "./tokens.css"` — esses paths se resolvem dentro de `dist/` porque a cópia coloca `fonts.css` e `tokens.css` no mesmo diretório.
- Invariante: dist/ deve ter os 3 arquivos CSS lado a lado.

#### Tasks
1. Importar `node:fs/promises` no tsup config (top-level)
2. Reescrever onSuccess como `async () => { await copyFile(...); ... }`
3. Rodar `rm -rf dist && pnpm build && ls dist/` — confirmar 3 CSS + index.js + index.d.ts + index.js.map

#### TDD
```
RED: test_dist_contains_all_css_after_build() — script bash em CI que rm -rf dist, roda pnpm build, e verifica existência de dist/tokens.css, dist/fonts.css, dist/styles.css
GREEN: ajuste no tsup.config.ts
REFACTOR: None
VERIFY: pnpm build && test -f dist/tokens.css && test -f dist/fonts.css && test -f dist/styles.css
```

#### Acceptance Criteria
- [ ] `pnpm build` produz `dist/{tokens,fonts,styles}.css`
- [ ] Build funciona em macOS/Linux (validar local); CI Linux green
- [ ] Nenhum `cp`/`mv`/shell-builtin no `onSuccess`
- [ ] Bundle size `dist/index.js` ± 5% do baseline

#### DoD
- [ ] tsup config usa Node API
- [ ] CI passa
- [ ] README mantém menção a "framework-agnostic" sem caveats de OS

---

### T0.3 — Corrigir JSDoc drifts (ThemeProvider, classic-paper, quality-gates.md)

#### Objective
Eliminar 3 drifts JSDoc → código que enganam consumers e leitores.

#### Evidence
- `theme-provider.tsx:79`: `/** Mode to start with. Defaults to "light". */` mas linha 106: `defaultMode = "dark"`.
- `classic-paper.ts:3-7`: `Classic Paper — light-only, Inter + JetBrains Mono.` mas exporta `dark` palette completa.
- `docs/quality-gates.md:95-98`: declara "Current known risk" para registry rewriting que já está resolvido em `build-registry.ts:100-118`.

#### Files to edit
```
src/themes/theme-provider.tsx — atualizar JSDoc da prop defaultMode
src/themes/classic-paper.ts — atualizar JSDoc para refletir dark mirror
docs/quality-gates.md — converter "current known risk" para "resolved" + remover bloco obsoleto
```

#### Deep file dependency analysis
- ThemeProvider JSDoc é visto via IntelliSense em qualquer consumer importando `ThemeProvider`. Corrigir não muda comportamento, apenas perceção.
- `classic-paper.ts` JSDoc é interno; correção é cosmética mas evita "esse dark é dead code?" durante review.
- `quality-gates.md` é referenciado por README:201 e architecture.md:101.

#### Deep Dives
- Não há gate validando consistência JSDoc → defaults. Adicionar isso requer parser TS (custo alto). Optar por one-shot fix + diligência.
- Para `quality-gates.md`, manter a seção "Gate 2 — Registry Compatibility" mas trocar a redação do "Current known risk" para passado.

#### Tasks
1. Editar `theme-provider.tsx:78-79` para `Defaults to "dark"` (library is dark-first)
2. Editar `classic-paper.ts:3-7` para descrever light primary + dark mirror
3. Editar `docs/quality-gates.md:95-98` para `**Resolved (2026-05)**: build-registry.ts rewrites relative imports via sourceImportMap.`

#### TDD
```
RED: regex check em validate-quality-gates.ts:
     - 'Defaults to "light"' não aparece em theme-provider.tsx JSDoc
     - 'light-only' não aparece em classic-paper.ts (a menos que precedido por "light-primary")
     - 'Current known risk' não aparece em quality-gates.md
GREEN: edição manual
REFACTOR: None
VERIFY: grep -n 'Defaults to "light"' src/themes/theme-provider.tsx → 0; grep -n 'light-only' src/themes/classic-paper.ts → 0
```

#### Acceptance Criteria
- [ ] Greps acima retornam 0 matches
- [ ] IntelliSense em `<ThemeProvider defaultMode={...} />` mostra "dark" como default
- [ ] Doc reflete state atual (resolved)

#### DoD
- [ ] 3 edições aplicadas
- [ ] Lint passa
- [ ] Build verde

---

### T0.4 — Cleanup `lint:ci`, `noConsole`, README whitelist, fonts opt-in

#### Objective
Pequenos ajustes de configuração que reduzem drift futuro.

#### Evidence
- `package.json:28` — `lint:ci` cobre apenas `src scripts .ladle`, deixando `playground/` e `tests/` fora.
- `biome.json:34` — `noConsole` permite `warn`/`error`; lib não precisa de `console` em produção.
- `scripts/validate-quality-gates.ts:252-262` — whitelist inclui `Boska`, `Switzer`, `JetBrains` (fontes removidas pelo plano anterior).
- `src/styles/fonts.css:15` — `@import` de Google Fonts CDN não-opt-in.

#### Files to edit
```
package.json — estender lint:ci para playground/ tests/
biome.json — noConsole "allow: []"
scripts/validate-quality-gates.ts — remover Boska/Switzer/JetBrains do whitelist
src/styles/fonts.css — adicionar comentário documentando opt-in alternativo
```

#### Deep file dependency analysis
- `playground/vite.config.ts` e `tests/fixture-shadcn-app/src/App.tsx` (gerado por test-registry-install) entram no lint scope. Verificar se há violações latentes.
- `tests/fixture-shadcn-app/node_modules` está em `.gitignore` e `biome.json:6` já o exclui — ok.
- Remover Boska/Switzer do whitelist: garantir que README atual não usa esses tokens (já não usa).

#### Deep Dives
- `fonts.css` opt-in: a estratégia minimal é deixar como está mas documentar — não quebrar default. Consumer que quer self-host comenta o `@import` ao copiar.
- Alternative: separar em `fonts-cdn.css` (com @import) e `fonts.css` (apenas @font-face declarations apontando para asset local). Custo: API change. Aceitar baixo custo agora apenas documentando.

#### Tasks
1. `package.json:28` — `"lint:ci": "biome ci src scripts .ladle playground tests/fixture-shadcn-app/src"`
2. `biome.json:34` — `"noConsole": { "level": "error", "options": { "allow": [] } }`
3. Rodar `pnpm lint:ci` e corrigir violações encontradas (esperado: zero ou poucas)
4. Remover entradas Boska/Switzer/JetBrains/Berkeley/Departure/Söhne/Migra/Monaspace do whitelist em validate-quality-gates.ts
5. Adicionar comment em `fonts.css` documentando "comment this @import to self-host Geist"

#### TDD
```
RED:
  - test_lint_ci_covers_playground() — grep "playground" em package.json#scripts.lint:ci
  - test_biome_no_console_strict() — JSON.parse(biome.json).linter.rules.suspicious.noConsole.options.allow.length === 0
  - test_validate_readme_whitelist_clean() — Set whitelist NÃO contém Boska, Switzer, JetBrains
GREEN: edits acima
REFACTOR: None
VERIFY: pnpm lint:ci && pnpm quality:structure
```

#### Acceptance Criteria
- [ ] `pnpm lint:ci` cobre playground/ e tests/fixture-shadcn-app/src/
- [ ] `noConsole.allow === []` em biome.json
- [ ] Whitelist sem nomes de fontes deprecated
- [ ] `fonts.css` tem comentário guiando self-host

#### DoD
- [ ] Quatro edições aplicadas
- [ ] CI passa após cleanup

---

## Phase 1: Security

**Objective:** corrigir vulnerabilidade XSS em ThemeScript e cobrir com teste correto.

### T1.1 — Escape `</` em `ThemeScript.buildScript` (BLOCKER-001)

#### Objective
Eliminar vetor XSS via injeção de `</script>` em props de ThemeScript.

#### Evidence
- `theme-script.tsx:37-46` — `buildScript` faz `JSON.stringify(v)` mas não escapa `/`.
- `theme-script.test.tsx:32-38` — teste atual confere `not.toContain("</script>x</script>")` para input `"><script>x</script>` (sem `</script>` à frente do payload). Teste passa apesar do bug.
- Browser HTML tokenizer encerra `<script>` no primeiro `</script>` que aparece, mesmo dentro de string literal JS.

#### Files to edit
```
src/themes/theme-script.tsx — adicionar helper safe() e usar em buildScript
src/themes/theme-script.test.tsx — adicionar teste com input contendo </script>; atualizar teste existente
```

#### Deep file dependency analysis
- `theme-script.tsx` é exportado de `src/themes/index.ts:3` e re-exportado em `src/index.ts:17`. Mudança de implementação sem mudança de API não afeta consumers.
- `theme-script.test.tsx` atualizado mas testes existentes (3) continuam passando — o helper apenas adiciona escape.

#### Deep Dives
- Técnica padrão JSON-in-script: `JSON.stringify(v).replace(/</g, "\\u003c")`. `<` é a representação Unicode de `<` em string literal JS; o parser JS resolve normalmente, mas o tokenizer HTML não vê `<` como char "perigoso".
- Considerar também escapar `>` por simetria? Não necessário — não há tag de fechamento `</...>` que `>` sozinho fecharia dentro de script. Apenas `<` precisa escape.
- Não escapar ` ` / ` ` (line separators) — Node sempre lê estes corretamente. Em runtime do browser, JSON.stringify já escapa esses chars em ES2019+.

#### Tasks
1. Adicionar função `safe(v: unknown): string` no topo de `theme-script.tsx`
2. Substituir os 3 `JSON.stringify(...)` em `buildScript` por `safe(...)`
3. Atualizar comentário de segurança no JSDoc para refletir o que o código realmente faz
4. Adicionar teste explícito `it("escapes </script> in defaultTheme")` que falha pre-fix
5. Manter os 3 testes existentes (devem continuar passando)

#### TDD
```
RED:
  it("escapes </script> in defaultTheme") — render <ThemeScript defaultTheme="</script><script>alert(1)</script>" />
    → expect script.innerHTML NÃO contém '</script>' fora do tag de abertura
    → expect script.innerHTML CONTÉM '\\u003c/script\\u003e'
  it("escapes </script> in storageKey") — render <ThemeScript storageKey="</script>" />
    → expect script.innerHTML NÃO contém '</script>' fora do tag
GREEN: implementar safe() + substituir 3 chamadas
REFACTOR: extrair safe() para top do arquivo; documentar em JSDoc
VERIFY: pnpm test src/themes/theme-script.test.tsx
```

#### Acceptance Criteria
- [ ] Teste "escapes </script>" passa
- [ ] Os 4 testes do `theme-script.test.tsx` passam
- [ ] JSDoc atualizado com comentário "Escapes `<` to `<` per JSON-in-script best practice"
- [ ] Sem mudança de API pública
- [ ] CVSS estimado do bug original baixa para 0 (não exploitable)

#### DoD
- [ ] Edits aplicados
- [ ] `pnpm test` green
- [ ] `pnpm build` green
- [ ] Adicionar entrada `### Security` em CHANGELOG: "Fixed: ThemeScript escapes `<` in interpolated props (prevents `</script>` breakout if props derive from untrusted input)."

---

## Phase 2: Correctness (compound pattern + cloneElement + useEffect)

**Objective:** corrigir 3 anti-patterns React que afetam 4+ componentes — compound mutation, spread em element, useEffect reset.

### T2.1 — Migrar Toast/Avatar/RadioGroup/FormField para `Object.assign /*#__PURE__*/`

#### Objective
Completar a migração declarada no CHANGELOG (atualmente 5/9 conformes).

#### Evidence
- `src/components/primitives/toast/toast.tsx:130-143` — usa `Toast = ToastRoot as typeof ... & {...}` + 6 mutations.
- `src/components/primitives/avatar/avatar.tsx` — mesmo padrão (`Avatar = AvatarRoot as typeof ... & {...}`).
- `src/components/primitives/radio-group/radio-group.tsx` — idem.
- `src/components/primitives/form-field/form-field.tsx:147-156` — idem.
- CHANGELOG (Unreleased > Changed): *"Replace `dot-namespace` mutation pattern (...) with `/*#__PURE__*/ Object.assign(...)` in `Card`, `Dialog`, `Sidebar`, `TopNav`, `Tabs` for safer tree-shaking."* (4 outros faltam).

#### Files to edit
```
src/components/primitives/toast/toast.tsx — refactor compound assembly
src/components/primitives/avatar/avatar.tsx — idem
src/components/primitives/radio-group/radio-group.tsx — idem
src/components/primitives/form-field/form-field.tsx — idem
```

#### Deep file dependency analysis
- **Toast**: usado por `toaster.tsx` (`<Toast.Provider>`, `<Toast.Viewport>`, `<Toast.Title>`, `<Toast.Description>`, `<Toast.Action>`, `<Toast.Close>`). Forwarding via `Object.assign` precisa preservar todos os subparts incluindo `Provider`/`Viewport` (que são Radix re-exports, não componentes próprios).
- **Avatar**: subparts `Image`, `Fallback`. Usado em stories e em ChatMessage indirectly (via avatar prop).
- **RadioGroup**: subpart `Item`. Usado em forms.
- **FormField**: subparts `Label`, `Control`, `Hint`, `Error`. Mais delicado pois `Control` será refatorado em T2.2.

#### Deep Dives
- Pattern canônico (replicar de `card.tsx:93`):
  ```ts
  const Card = /*#__PURE__*/ Object.assign(Root, {
    Header, Title, Description, Body, Footer,
  });
  ```
- TypeScript: o type de `Card` é inferred como `typeof Root & { Header, ... }`. JSX continua funcionando.
- Para Toast (que mistura componentes locais + Radix re-exports):
  ```ts
  const Toast = /*#__PURE__*/ Object.assign(ToastRoot, {
    Title: ToastTitle,
    Description: ToastDescription,
    Close: ToastClose,
    Action: ToastAction,
    Provider: ToastPrimitive.Provider,
    Viewport: ToastPrimitive.Viewport,
  });
  ```
- Validação treeshake: rodar `pnpm build` antes/depois, comparar `dist/index.js` size com `gzip -c dist/index.js | wc -c`. Esperar **redução ou paridade**, nunca aumento substancial.

#### Tasks
1. Refactor `toast.tsx`: substituir bloco `const Toast = ToastRoot as typeof ToastRoot & {...}; Toast.X = X; ...` por `Object.assign`
2. Refactor `avatar.tsx` idem
3. Refactor `radio-group.tsx` idem
4. Refactor `form-field.tsx` idem (mantendo `FormFieldControl` como está; T2.2 cuida dele)
5. Snapshot do bundle size antes/depois
6. Rodar testes — todos os 4 componentes têm test files

#### TDD
```
RED:
  - test_compound_pattern_all_object_assign() — regex em src/components/primitives/**/(*.tsx) — para arquivos que exportam compound (têm "Object.assign" ou "as typeof"), exigir Object.assign
GREEN: 4 refactors
REFACTOR: extrair util/helper se padrão se repetir (provavelmente não — Object.assign é one-liner)
VERIFY: pnpm test src/components/primitives/{toast,avatar,radio-group,form-field}
```

#### Acceptance Criteria
- [ ] 9/9 compound components usam `Object.assign /*#__PURE__*/`
- [ ] `grep -rE "as typeof \w+Root \&" src/components/` retorna 0 matches
- [ ] Bundle size `dist/index.js` ± 5% baseline (idealmente reduz por melhor tree-shaking)
- [ ] Todos os testes existentes passam
- [ ] Type errors zero

#### DoD
- [ ] 4 refactors aplicados
- [ ] CI verde
- [ ] Snapshot de bundle size documentado em CHANGELOG (Unreleased > Changed)

---

### T2.2 — Substituir spread-em-element por `React.cloneElement` em FormField.Control

#### Objective
Eliminar a dependência de invariantes internas do React (`$$typeof`); preservar `ref` e `key`.

#### Evidence
- `form-field.tsx:84-107`: `child && typeof child === "object" ? { ...child, props: {...} } : child`.
- React docs declaram que elements são imutáveis e devem ser clonados via `cloneElement`. Spread + redefinição de `props` quebra essa convenção.
- Atualmente funciona porque `$$typeof` é spreadeado, mas `ref` não é preservado (e o code-path com `ref` na child input falha silenciosamente).

#### Files to edit
```
src/components/primitives/form-field/form-field.tsx — refactor FormFieldControl
src/components/primitives/form-field/form-field.test.tsx — adicionar teste de ref forwarding
```

#### Deep file dependency analysis
- Consumers: chat-composer (composite), agent-editor, skill-editor, rule-editor — todos passam `<Input />` como único child de `<FormField.Control>`.
- Após o fix, comportamento esperado: o input recebe `id`, `aria-describedby`, `aria-invalid`. Adicionalmente `ref` passa por.

#### Deep Dives
- `React.cloneElement(child, propsToOverride)` retorna novo element com props mescladas. Preserva `key`, `ref`, `type`.
- `React.Children.only(children)` valida que há exatamente um child element. Lança erro se múltiplos ou zero.
- Edge case: child pode ser `null`/`false`/`undefined`/`string`. `Children.only` aceita apenas elements; outros tipos jogam erro. Decisão: aceitar `Children.only` jogando — é o uso correto.
- Backward compat: se algum consumer passa string ou múltiplos, hoje silenciosamente quebra; depois do fix, lança erro explícito. Documentar em CHANGELOG.

#### Tasks
1. Importar `cloneElement, Children, isValidElement` de "react" em `form-field.tsx`
2. Refactor `FormFieldControl`:
   ```tsx
   const only = Children.only(children);
   const cloned = isValidElement(only)
     ? cloneElement(only, { id: fieldId, "aria-describedby": described, "aria-invalid": hasError || undefined })
     : only;
   return <div ref={ref} {...props}>{cloned}</div>;
   ```
3. Adicionar teste de `ref` forwarding: passar `ref={inputRef}` em `<Input>` dentro de `<FormField.Control>` e verificar que `inputRef.current` é o input DOM
4. Documentar em CHANGELOG: "FormField.Control agora exige exatamente um child element (era silenciosamente quebrado antes para outros formatos)"

#### TDD
```
RED:
  it("forwards ref through FormField.Control") — useRef + assertion sobre input DOM element
  it("throws when FormField.Control has no child") — render sem child esperando erro
  it("throws when FormField.Control has multiple children") — render com 2 inputs esperando erro
GREEN: refactor via cloneElement + Children.only
REFACTOR: None
VERIFY: pnpm test src/components/primitives/form-field
```

#### Acceptance Criteria
- [ ] Os 3 novos testes passam
- [ ] Os 4 testes existentes continuam passando
- [ ] `cloneElement` é usado (grep confirma)
- [ ] Spread em element é removido
- [ ] CHANGELOG documenta breaking de "múltiplos children silenciosamente aceitos" → "Children.only enforça"

#### DoD
- [ ] Refactor aplicado
- [ ] Tests green
- [ ] Lint passa

---

### T2.3 — Substituir `useEffect [initial?.id]` por padrão `key` nos editors

#### Objective
Remover anti-pattern de reset-via-effect; documentar padrão `key` no JSDoc dos 3 editors.

#### Evidence
- `agent-editor.tsx:70-81`, `skill-editor.tsx:55-65`, `rule-editor.tsx:50-58` — todos usam o mesmo padrão `useEffect [initial?.id]` com biome-ignore.
- React docs (React 18+) recomendam explicitamente `key` para reset.

#### Files to edit
```
src/components/primitives/agent-editor/agent-editor.tsx — remover useEffect; ajustar JSDoc
src/components/primitives/skill-editor/skill-editor.tsx — idem
src/components/primitives/rule-editor/rule-editor.tsx — idem
src/components/primitives/agent-editor/agent-editor.stories.tsx — atualizar story para demonstrar key pattern
(idem stories dos outros 2)
```

#### Deep file dependency analysis
- Stories existentes provavelmente passam `initial` mas não trocam dinamicamente entre instâncias. Adicionar story `WithSwitching` que demonstra o pattern correto.
- Consumers internos do projeto (apps que usam AgentEditor) não estão neste repo, mas welcome story menciona em texto.

#### Deep Dives
- API design: o useState com `() => initial?.x ?? ""` funciona apenas no primeiro mount. Para "controlled-like" behavior (sincronizar com prop changes), o consumer remonta via `<AgentEditor key={agent.id} initial={agent} />`.
- Alternativa considerada: aceitar `key` mas ALSO manter o `useEffect` para "trabalho seguro" — rejeitado porque mistura padrões e mantém o bug.

#### Tasks
1. Em cada um dos 3 editors:
   - Remover o bloco `useEffect (...) { setX(...); ... }, [initial?.id]`
   - Remover o `biome-ignore lint/correctness/useExhaustiveDependencies`
   - Adicionar nota no JSDoc do componente: *"Para resetar o form ao mudar de entidade, use `key`: `<AgentEditor key={agent.id} initial={agent} />`."*
2. Em cada story:
   - Adicionar export `WithSwitching` que demonstra alternar entre dois `initial`s via key prop
3. Atualizar CHANGELOG: "Changed: AgentEditor/SkillEditor/RuleEditor não resetam mais automaticamente em mudança de prop `initial` — use `key={initial.id}` para reset explícito (padrão React recomendado)."

#### TDD
```
RED:
  it("AgentEditor preserves state when initial prop changes (no key)")
    — render <AgentEditor initial={a} />; rerender <AgentEditor initial={b} />;
    — name still equals a.name
  it("AgentEditor resets state when key changes")
    — render <AgentEditor key={a.id} initial={a} />; rerender <AgentEditor key={b.id} initial={b} />;
    — name equals b.name
  (idem para SkillEditor, RuleEditor)
GREEN: remove useEffect
REFACTOR: None
VERIFY: pnpm test src/components/primitives/{agent-editor,skill-editor,rule-editor}
```

#### Acceptance Criteria
- [ ] 0 ocorrências de `useEffect.*\[initial\?\.id\]` no codebase
- [ ] 6 novos testes (2 por editor) verdes
- [ ] Stories atualizadas
- [ ] CHANGELOG documenta a mudança de comportamento

#### DoD
- [ ] 3 refactors aplicados
- [ ] Tests green
- [ ] Lint passa

---

## Phase 3: Documentation truth

**Objective:** todas as contagens e listas vivem em uma única fonte derivada do source.

### T3.1 — Estender `sync-readme.ts` para gerar `welcome.stats.json` + `architecture.md`

#### Objective
Eliminar 3 lugares onde contadores chumbados drifteam (welcome.stories.tsx, architecture.md, badges).

#### Evidence
- `welcome.stories.tsx:18-25` — STATS literais: 36/12/07/03/21/122 (reais: 88/14/7/3/110/389).
- `architecture.md:63` — "Primitives (36)"; `:73` — "Composites (12)"; lista de 36 primitives nominados (faltam 49).
- README badge:15 — "components-99" mas linhas 102/128 — "Primitives (88)" + "Composites (14)" — total 102.
- `sync-readme.ts` já cobre README; precisa cobrir os outros 2 lugares.

#### Files to edit
```
scripts/sync-readme.ts — adicionar geração de:
  (a) src/welcome.stats.ts (NEW) — emite STATS object
  (b) docs/architecture.md — atualiza regiões BEGIN:primitives-list, BEGIN:composites-table, BEGIN:census
src/welcome.stories.tsx — importar STATS de "./welcome.stats.js"
docs/architecture.md — adicionar marcadores BEGIN/END nas seções dinâmicas
src/welcome.stats.ts — NEW (gerado)
```

#### Deep file dependency analysis
- `welcome.stories.tsx` hoje tem STATS literal. Após mudança, importa de `./welcome.stats.js`. O arquivo é gerado, então `.gitignore` permanece e o arquivo é tracked.
- `architecture.md` ganha marcadores `<!-- BEGIN:primitives-list -->`...`<!-- END:primitives-list -->` em seções dinâmicas. Texto explicativo + ADRs permanecem fixos.
- `sync-readme.ts` ganha 2 funções: `writeWelcomeStats()`, `updateArchitectureCensus()`.

#### Deep Dives
- Source of truth para contagens:
  - **Primitives count** = `parseIndexExports().primitives.length` (named exports, atualmente 88).
  - **Composites count** = `parseIndexExports().composites.length` (14).
  - **Components total** = primitives + composites = 102 (consolidar com README badge).
  - **Tests** = `countTests()` (run pnpm test e parse).
  - **Registry items** = count em `registry/r/`.
  - **Screens** = count em `src/screens/*.stories.tsx`.
  - **Themes** = 3 (hardcoded — só muda se alguém adicionar um tema).
- Para padronizar: o badge "components-N" usa primitives + composites (named exports). O catalog usa o mesmo. Eliminar a divergência atual.

#### Tasks
1. Em `sync-readme.ts`:
   - Função `writeWelcomeStats(counts)` que gera `src/welcome.stats.ts` com `export const STATS = { primitives, composites, screens, themes, registryItems, tests };`
   - Função `updateArchitectureCensus(primitives, composites)` que reescreve regiões marcadas em `architecture.md`
   - Função `parseImportGraph()` que mapeia composites para suas dependencies primitives (alimenta tabela "Composite → Imports")
2. Em `welcome.stories.tsx`: importar STATS, derivar dinamicamente o array exibido. Atualizar footer "All checks green · ... · N tests".
3. Em `architecture.md`: adicionar marcadores BEGIN/END nas seções "Current census" e "Composites table".
4. Adicionar `src/welcome.stats.ts` ao gitignore? **Não** — gerado mas commitado para Ladle build não precisar rodar sync.
5. Ajustar README catalog badge para usar `primitives + composites = 102` (não 99 dir count).

#### TDD
```
RED:
  it("welcome STATS matches index.ts exports count") — exec sync; require welcome.stats.ts; assert STATS.primitives === parseIndexExports().primitives.length
  it("architecture.md census matches reality") — read architecture.md; regex extract "Primitives (N)"; assert N === parseIndexExports().primitives.length
  it("README badge components count === primitives + composites") — read README.md; extract components-N badge; assert N === counts.primitives + counts.composites
GREEN: implementar 3 funções em sync-readme.ts
REFACTOR: extrair "writeRegion" comum
VERIFY: pnpm sync:readme && pnpm test scripts/sync-readme.test.ts (NEW se necessário) || node test inline
```

#### Acceptance Criteria
- [ ] `pnpm sync:readme` atualiza README + welcome.stats.ts + architecture.md
- [ ] welcome.stories.tsx não contém números literais — todos via STATS
- [ ] architecture.md "Current census" reflete realidade após sync
- [ ] README badge "components" == primitives + composites named exports
- [ ] Architecture.md lista de primitives contém TODOS os 88 named exports (não 36)

#### DoD
- [ ] sync:readme passa
- [ ] Os 3 arquivos batem
- [ ] CI verde

---

### T3.2 — Resolver inconsistência README badge ("99 components" vs "88+14=102")

#### Objective
Eliminar drift no contador "components" — único número, padronizado.

#### Evidence
- `README.md:15` (badge): `components-99`.
- `README.md:102, 128` (catalog): `Primitives (88)` + `Composites (14)` = 102.
- Discrepância vem de `sync-readme.ts:78-84` que computa `counts.components = primitives + composites` usando **dir count** (85+14=99) enquanto o catalog usa **named exports** (88+14=102).

#### Files to edit
```
scripts/sync-readme.ts — alinhar counts.components com named exports
README.md — após sync, badge mostra 102
```

#### Deep file dependency analysis
- `gatherCounts()` usa `countDirectories()` para primitives (85). Mas `parseIndexExports()` retorna 88 (named exports). Eles divergem por design: dirs vs exports.
- Para um catalog público: named exports é a métrica que importa (usuário vê esses nomes).
- Decisão: substituir `counts.primitives` por `parseIndexExports().primitives.length` em `gatherCounts()` (mesmo para composites).

#### Deep Dives
- Edge case: alguns directories podem ter zero named exports (componente moved/deprecated). Tornaria dir count > export count. Hoje não há, mas o gate deve cobrir.

#### Tasks
1. Em `gatherCounts()`: chamar `parseIndexExports()` antes; usar `.primitives.length` e `.composites.length` em vez de `countDirectories()`.
2. Validar: `pnpm sync:readme` → README badge mostra 102.
3. Adicionar gate `validateCountConsistency` em T4.3.

#### TDD
```
RED:
  it("README components badge matches catalog primitives+composites") — parse README; extract badge N; extract "Primitives (P)" + "Composites (C)"; assert N === P + C
GREEN: ajustar gatherCounts
REFACTOR: None
VERIFY: pnpm sync:readme && node -e "const re = require('fs').readFileSync('README.md','utf8'); const b = re.match(/components-(\d+)/)[1]; const p = re.match(/Primitives.*?\((\d+)\)/)[1]; const c = re.match(/Composites.*?\((\d+)\)/)[1]; if (+b !== +p + +c) process.exit(1)"
```

#### Acceptance Criteria
- [ ] Badge "components" == primitives + composites count
- [ ] `pnpm sync:readme` é determinístico (rodar 2× não muda nada)

#### DoD
- [ ] Edit aplicado
- [ ] README sincronizado

---

## Phase 4: Quality gate hardening

**Objective:** novos gates que falham automaticamente se as 4 classes corrigidas reaparecerem.

### T4.1 — Adicionar `validateCompoundPattern` gate

#### Objective
Falhar build se algum compound component usar mutation pattern em vez de Object.assign.

#### Evidence
- T2.1 corrige Toast/Avatar/RadioGroup/FormField; gate previne regressão.

#### Files to edit
```
scripts/validate-quality-gates.ts — adicionar função validateCompoundPattern e chamar de main()
```

#### Deep file dependency analysis
- Heurística simples: arquivo de primitive que contém `as typeof \w+Root` mas NÃO contém `Object.assign` é violação.
- Falsos positivos: componentes que usam `as typeof` para outro propósito (cast de cmdk, Radix, etc.) podem disparar. Mitigar com regex mais específica: `const \w+ = \w+Root as typeof \w+Root \&`.

#### Deep Dives
- Regex final: `/const\s+\w+\s+=\s+\w+Root\s+as\s+typeof\s+\w+Root\s+&/`
- Para arquivos que matcham: confirmar ausência de `Object.assign(\w+Root,` na mesma file. Se ambos presentes, é caso transitivo de refactor incompleto — também falha.

#### Tasks
1. Adicionar função `validateCompoundPattern()` em `validate-quality-gates.ts`
2. Iterar `src/components/{primitives,composites}/*/<name>.tsx`
3. Se regex match: `fail(name, "compound component must use Object.assign — see CHANGELOG 2026-05-13")`
4. Chamar em `main()` antes de `validateScriptsAndCi`

#### TDD
```
RED:
  test_validate_compound_pattern_detects_mutation() — adicionar fixture temporária src/components/primitives/__fixture__/bad.tsx com pattern mutation; gate deve falhar; remover fixture
  test_validate_compound_pattern_accepts_object_assign() — fixture com Object.assign deve passar
GREEN: implementar validateCompoundPattern
REFACTOR: None
VERIFY: pnpm tsx scripts/validate-quality-gates.ts
```

#### Acceptance Criteria
- [ ] Gate ativo em `pnpm quality:structure`
- [ ] Re-introduzir pattern mutation em qualquer compound faz CI falhar
- [ ] Todos os 9 compounds atuais passam

#### DoD
- [ ] Função adicionada
- [ ] Gate passa
- [ ] CI green

---

### T4.2 — Adicionar `validateAxeCoverage` gate

#### Objective
Garantir cobertura mínima de a11y assertions em primitives interativos.

#### Evidence
- 6/101 tests usam `vitest-axe` (5.9%). README declara "accessible by default".
- Phase 6 expande cobertura para ≥30 primitives.

#### Files to edit
```
scripts/validate-quality-gates.ts — adicionar função validateAxeCoverage
```

#### Deep file dependency analysis
- Lista de primitives interativos (~35): Button, Checkbox, Dialog, DropdownMenu, FormField, Input, Label, RadioGroup, Select, Sheet, Sidebar, Switch, Tabs, Textarea, Toast, Tooltip, TopNav, CommandPalette (composite), ChatComposer, ProjectSwitcher, ModelSelector, IntentSelector, MentionMenu, FolderSelector, AttachmentChip, QuickActionChips, PermissionMatrix, HookConfig, MCPServerCard, ApprovalCard, AgentHandoff, ToolCallCard, AgentEditor, SkillEditor, RuleEditor, SystemPromptEditor.
- Gate exige ≥30 desses ter ≥1 `toHaveNoViolations` em seu test file.

#### Deep Dives
- Lista hardcoded de "interactive primitives" no script — atualizada ao adicionar novo primitive interativo.
- Alternativa: heurística baseada em "primitive que contém `<button>` ou Radix interactive" — mais robusto a longo prazo, mais ruidoso a curto. Optar por **lista explícita** com TODO de melhorar.

#### Tasks
1. Definir array `INTERACTIVE_PRIMITIVES` em `validate-quality-gates.ts` (lista nominal).
2. Função `validateAxeCoverage()`: para cada nome, ler `{name}.test.tsx`; verificar regex `toHaveNoViolations|axe\(`.
3. Threshold: `coverageCount >= 30 && coverageCount / INTERACTIVE_PRIMITIVES.length >= 0.85` → pass; senão fail.
4. Chamar em main().

#### TDD
```
RED:
  test_axe_coverage_meets_threshold() — script test que counta arquivos com axe; assert ≥ 30
GREEN: adicionar testes em Phase 6 até bater threshold
REFACTOR: None
VERIFY: pnpm quality:structure
```

#### Acceptance Criteria
- [ ] Gate falha se cobertura cair abaixo de 30 primitives
- [ ] Após Phase 6, gate passa
- [ ] Lista INTERACTIVE_PRIMITIVES documentada com comentário sobre critério

#### DoD
- [ ] Gate implementado
- [ ] Após Phase 6, ativo e green

---

### T4.3 — Adicionar `validateCountConsistency` + `validateArchitectureCensus` gates

#### Objective
Bloquear drift entre badges, listas, architecture.md.

#### Evidence
- README badge "99" vs listas "88+14=102" (T3.2).
- architecture.md "36 primitives" vs realidade 88 (T3.1).

#### Files to edit
```
scripts/validate-quality-gates.ts — duas funções novas
```

#### Deep file dependency analysis
- `validateCountConsistency`: parse README; assert badge components-N == primitives.length + composites.length (named exports).
- `validateArchitectureCensus`: parse architecture.md; extract "Primitives (N)" e "Composites (M)"; assert iguais a named export counts; assert lista de primitives mencionada cobre 100% dos exports.

#### Deep Dives
- Pode haver primitives mencionados em architecture.md fora da regiãoBEGIN/END (em texto narrativo). Permitir? Sim — a validação foca apenas nas contagens e na seção dinâmica "Current census".

#### Tasks
1. `validateCountConsistency`: regex em README para badge + listas; assert.
2. `validateArchitectureCensus`: parse architecture.md region between `<!-- BEGIN:primitives-list -->` and `<!-- END:primitives-list -->`; assert names cobrem `parseIndexExports().primitives`.
3. Chamar ambos em main().

#### TDD
```
RED:
  test_count_consistency_fails_on_drift() — temporariamente editar README badge para número errado; rodar gate; assert exit !=0
  test_architecture_census_fails_on_drift() — idem para architecture.md
GREEN: implementar
REFACTOR: None
VERIFY: pnpm quality:structure
```

#### Acceptance Criteria
- [ ] Editar contagem à mão em README ou architecture.md faz CI falhar
- [ ] Após `pnpm sync:readme`, ambos os gates passam
- [ ] Gates rodam em <2s

#### DoD
- [ ] Gates implementados
- [ ] Integrados em pnpm quality:structure
- [ ] Verde

---

### T4.4 — Adicionar `validateNoStrayArtifacts` gate

#### Objective
Bloquear reaparecimento de `*.bak`, `*.json.tmp`, `*.orig` no working tree.

#### Evidence
- T0.1 limpou 97 arquivos; gate previne novo acúmulo.

#### Files to edit
```
scripts/validate-quality-gates.ts — adicionar função validateNoStrayArtifacts
```

#### Deep file dependency analysis
- Varre `src/`, `registry/`, `docs/`, `scripts/`, raiz; falha se encontra `*.bak`, `*.json.tmp`, `*.orig`, `*.rej` fora de node_modules.

#### Tasks
1. Implementar função (~20 LoC) usando `fast-glob` ou `node:fs` recursivo
2. Chamar em main()

#### TDD
```
RED: test_stray_artifacts_detected() — criar tmp registry/__test__.json.tmp; rodar gate; assert exit !=0; delete
GREEN: implementar
REFACTOR: None
VERIFY: pnpm quality:structure
```

#### Acceptance Criteria
- [ ] Gate detecta novo `.bak` / `.tmp` / `.orig` / `.rej`
- [ ] Performance: <500ms no working tree atual

#### DoD
- [ ] Implementado e ativo

---

### T4.5 — Converter test gate de warning para fail

#### Objective
Remover tolerância silenciosa a missing test files em registry items.

#### Evidence
- `validate-quality-gates.ts:86-93` — comentário "Test coverage is a soft requirement during the test-backfill phase" mas o repo já tem 102 test files.

#### Files to edit
```
scripts/validate-quality-gates.ts:86-93 — substituir warn() por fail()
```

#### Deep file dependency analysis
- Verificar antes que todos os 110 registry items realmente têm test file. Se algum não tem, ou adicionar test (preferível) ou excluir do registry.

#### Tasks
1. Auditar: para cada `registry/*.json` (não index, não tokens), confirmar `src/${path}/*.test.tsx` existe.
2. Para faltantes (esperar zero ou ≤5): criar smoke test (em coordenação com Phase 6) ou remover do registry.
3. Trocar `warn(...)` por `fail(...)` em validate-quality-gates.ts:89.
4. Remover comentário "soft requirement".

#### TDD
```
RED: test_all_registry_items_have_test_file() — iterar; assert exists; (esperar 0 falhas pré-fix se Phase 6 rodar antes)
GREEN: ajuste validate-quality-gates.ts
REFACTOR: remover comment obsoleto
VERIFY: pnpm quality:structure
```

#### Acceptance Criteria
- [ ] `warn(...)` removido em favor de `fail(...)`
- [ ] Todos os registry items têm test
- [ ] CI falha se item novo for adicionado sem test

#### DoD
- [ ] Gate hard-fail
- [ ] CI verde

---

## Phase 5: Registry install confidence

**Objective:** estratificar fixture install test para cobrir os modos de falha realistas.

### T5.1 — Estender fixture-shadcn-app para incluir Radix + cmdk peers

#### Objective
Permitir testar registry items com dependências complexas.

#### Evidence
- `tests/fixture-shadcn-app/package.json` declara apenas 7 deps. Items que dependem de Radix Dialog/Toast/cmdk não podem ser testados.

#### Files to edit
```
tests/fixture-shadcn-app/package.json — adicionar peers necessários
```

#### Deep file dependency analysis
- Peers a adicionar: `@radix-ui/react-dialog`, `@radix-ui/react-toast`, `@radix-ui/react-avatar`, `@radix-ui/react-radio-group`, `@radix-ui/react-tabs`, `cmdk`.
- Implicação: `pnpm install` em fixture leva mais tempo no CI (~30s extras). Mitigar com cache pnpm.

#### Tasks
1. Adicionar 6 deps em `tests/fixture-shadcn-app/package.json`
2. `cd tests/fixture-shadcn-app && pnpm install --ignore-workspace`
3. Verificar `tsc --noEmit` continua passando com fixture vazio

#### TDD
```
RED: test_fixture_can_resolve_radix_dialog() — install dialog item em fixture; tsc --noEmit; assert exit 0
GREEN: adicionar deps
REFACTOR: None
VERIFY: pnpm test:registry
```

#### Acceptance Criteria
- [ ] fixture instala dependencies sem erro
- [ ] `pnpm test:registry` ainda passa para os 4 items atuais

#### DoD
- [ ] package.json atualizado
- [ ] CI verde

---

### T5.2 — Estender `ITEMS_TO_INSTALL` para amostra estratificada

#### Objective
Cobrir 10 items diversos em vez de 4 homogêneos.

#### Evidence
- `test-registry-install.ts:43` — apenas `["cn", "types", "tokens", "button"]`.

#### Files to edit
```
scripts/test-registry-install.ts — estender ITEMS_TO_INSTALL
```

#### Deep file dependency analysis
- Items a cobrir (estratificados):
  - `cn` (lib zero-deps)
  - `types` (lib types)
  - `tokens` (CSS)
  - `button` (CVA + Radix Slot)
  - `card` (compound + Object.assign)
  - `dialog` (Radix Portal)
  - `avatar` (Radix simple)
  - `toast` (Radix Toast + toaster.tsx multi-file)
  - `command-palette` (cmdk + composite + import de dialog)
  - `deployment-row` (composite pure)
- Para cada um, app fixture exercita import e renderização básica.

#### Deep Dives
- App.tsx fixture cresce. Considerar gerar dinamicamente um App.tsx que importa cada item e renderiza um smoke.
- Para items com state (Dialog open prop), basta importar e renderizar sem trigger — TypeScript check só precisa do import resolver.

#### Tasks
1. Estender `ITEMS_TO_INSTALL` para 10 itens listados
2. Atualizar `App.tsx` template para importar e renderizar smoke de cada
3. Validar que `pnpm test:registry` continua passando

#### TDD
```
RED: test_registry_install_covers_stratified_sample() — script test que conta items; assert ≥ 10
GREEN: estender ITEMS_TO_INSTALL + App.tsx
REFACTOR: extrair App.tsx generation para função se ficar verboso
VERIFY: pnpm test:registry
```

#### Acceptance Criteria
- [ ] 10 items testados (snapshot de tipos de dependência)
- [ ] `pnpm test:registry` passa em <60s no CI
- [ ] Quebrar qualquer um dos 10 items via descriptor mal-formado falha o test

#### DoD
- [ ] Test estendido
- [ ] CI verde

---

## Phase 6: A11y expansion

**Objective:** vitest-axe ativamente usado em ≥30 primitives interativos; chart com fallback textual.

### T6.1 — Adicionar `toHaveNoViolations` em 24 testes de primitives interativos

#### Objective
Atingir cobertura ≥30/35 (~85%) de primitives interativos com asserção axe.

#### Evidence
- 6 atuais com axe. Lista de 35 candidatos em T4.2.

#### Files to edit
```
src/components/primitives/{button,checkbox,dialog,form-field,...}/(*.test.tsx) — adicionar
  import { axe } from "vitest-axe";
  it("has no a11y violations") {
    const { container } = render(<Component {...props} />);
    expect(await axe(container)).toHaveNoViolations();
  }
```

#### Deep file dependency analysis
- 35 test files candidatos. Já existem 6 com axe — confirmar quais. Adicionar nos 24-29 restantes.
- Setup `src/test/setup.ts` já extend axe matchers — sem mudança.

#### Deep Dives
- Algumas violations esperadas: portal-rendered content (Dialog content fora do container raiz) não é detectado por axe a menos que `<body>` é o container. Workaround: render dentro de container que contém o Portal target.
- Para Dialog/Sheet/Toast (Portal): wrappar com `document.body` ou usar `renderToString` alternativo. Documentar pattern.

#### Tasks
1. Listar os 35 primitives interativos
2. Para cada, abrir test file; adicionar bloco axe; rodar; corrigir violations encontradas (típicas: missing aria-label em icon button, missing alt em img, etc.)
3. Idealmente: paralelizar em sub-PRs por domínio (forms, layout, chat, agent).

#### TDD
```
RED: test_axe_coverage >= 30 (gate T4.2) — falha pré-fix
GREEN: adicionar axe block em ≥24 test files
REFACTOR: extrair helper `renderWithAxe(component)` se padrão repete
VERIFY: pnpm test
```

#### Acceptance Criteria
- [ ] ≥30 primitives interativos com `toHaveNoViolations`
- [ ] Zero violations reportadas
- [ ] Gate T4.2 passa

#### DoD
- [ ] Cobertura ≥30
- [ ] CI verde

---

### T6.2 — Adicionar fallback textual em `TokenUsageChart`

#### Objective
Screen readers acessam os dados numéricos do chart sem depender de hover.

#### Evidence
- `token-usage-chart.tsx` — SVG com role="img" + aria-label genérico. `<title>` per-bar inconsistentemente exposto.

#### Files to edit
```
src/components/primitives/token-usage-chart/token-usage-chart.tsx — adicionar <table className="sr-only">
src/components/primitives/token-usage-chart/token-usage-chart.test.tsx — adicionar teste verificando table exposta
```

#### Deep file dependency analysis
- `sr-only` classe já existe (Tailwind utility). Apenas markup adicional.
- Verificar que `table > caption + thead + tbody` resolve para screen readers tradicionais.

#### Tasks
1. Adicionar `<table className="sr-only">` após `<svg>` com caption + headers + body
2. Adicionar teste: render; query `table`; assert visible to a11y tree; assert tbody rows == series.length

#### TDD
```
RED:
  it("renders sr-only table with token data") — render; assert getByRole("table") presente; assert getAllByRole("row") match series + 1 header
  it("table caption describes the chart") — assert caption contém "Token usage"
GREEN: adicionar markup
REFACTOR: None
VERIFY: pnpm test src/components/primitives/token-usage-chart
```

#### Acceptance Criteria
- [ ] Table sr-only presente
- [ ] Axe `toHaveNoViolations` passa
- [ ] Conteúdo da tabela = série visualizada (binned)

#### DoD
- [ ] Markup adicionado
- [ ] Tests green

---

## Phase 7: Tailwind/CSS sanity

**Objective:** remover seletor dark-mode morto, documentar fonts CDN opt-out.

### T7.1 — Remover `[data-theme="dark"]` dead selector (Tailwind + tokens.css)

#### Objective
Single mechanism para dark mode: `.dark` class.

#### Evidence
- `tailwind.config.ts:7`: `darkMode: ["class", '[data-theme="dark"]']`. Segundo seletor nunca casa.
- `tokens.css:126`: `[data-theme="dark"], .dark` — primeiro seletor never matches.

#### Files to edit
```
tailwind.config.ts:7 — darkMode: "class"
src/styles/tokens.css:126 — remover `[data-theme="dark"], ` deixando só `.dark`
```

#### Deep file dependency analysis
- ThemeProvider seta `.dark` class. ThemeScript seta `.dark` class. Consumers que dependiam de setar `data-theme="dark"` manualmente (improvável) quebram.
- Documentar em CHANGELOG: breaking se aplicável.

#### Tasks
1. Editar tailwind.config.ts
2. Editar tokens.css
3. Validar dark mode funciona em playground + welcome story
4. CHANGELOG: "Changed: Dark mode acionado exclusivamente via `.dark` class em `<html>`. Selector `[data-theme="dark"]` (que nunca foi setado pelo ThemeProvider) foi removido. Consumers que dependiam manualmente desse selector devem trocar para a classe."

#### TDD
```
RED:
  it("ThemeProvider sets .dark class in dark mode") — render ThemeProvider; assert html.classList.contains("dark")
  (já existe provavelmente)
GREEN: edits
REFACTOR: None
VERIFY: pnpm test src/themes/ && pnpm dev (manual visual check)
```

#### Acceptance Criteria
- [ ] Dark mode funciona em ladle, playground, welcome story
- [ ] `grep "data-theme=\"dark\"" tailwind.config.ts src/styles/tokens.css` retorna 0
- [ ] Tests green

#### DoD
- [ ] Edits aplicados
- [ ] CHANGELOG atualizado

---

### T7.2 — Documentar opt-out de Google Fonts CDN

#### Objective
Permitir self-hosting de Geist sem editar `fonts.css` no source.

#### Evidence
- `fonts.css:15` — `@import url("https://fonts.googleapis.com/...")`.
- README quickstart instrui `@import "@usetheo/ui/styles.css"` que arrasta o CDN call.

#### Files to edit
```
src/styles/fonts.css — comentário documentando estratégia de self-host
README.md — seção "Self-hosting fonts" (opcional)
```

#### Deep file dependency analysis
- Não mexer no comportamento default — só documentar.
- Alternativa "real" (separar fonts-cdn.css de fonts.css com @font-face local) é refactor maior. Adiar.

#### Tasks
1. Adicionar comment block no topo de `fonts.css` explicando como self-hostar
2. Adicionar seção curta no README "Self-hosting fonts" se ainda não existir

#### TDD
```
N/A (documentation-only task)
VERIFY: revisão manual; lint passa
```

#### Acceptance Criteria
- [ ] Comment explicando opt-out
- [ ] README cobre o caso

#### DoD
- [ ] Comment + seção README

---

## Phase 8: Component cleanup

**Objective:** quebrar god-file de screen, reclassificar PermissionMatrix.

### T8.1 — Quebrar `screens/theo-code-shell.tsx` em sub-files por seção

#### Objective
Reduzir o god-file de 2193 LoC para ≤500 LoC no arquivo principal, com sub-files lógicos.

#### Evidence
- `src/screens/theo-code-shell.tsx` — 2193 linhas. Maior arquivo do projeto por 7× margem.

#### Files to edit
```
src/screens/theo-code-shell.tsx — manter como shell de composição (~300 LoC)
src/screens/theo-code-shell/ (NEW directory)
src/screens/theo-code-shell/chat-pane.tsx (NEW)
src/screens/theo-code-shell/code-pane.tsx (NEW)
src/screens/theo-code-shell/infra-pane.tsx (NEW)
src/screens/theo-code-shell/sidebar-pane.tsx (NEW)
src/screens/theo-code-shell/data.ts (NEW) — agents, sessions, runs mock data
```

#### Deep file dependency analysis
- Screen NÃO é exportado da library barrel — quebra interna não afeta consumers.
- Story `theo-code-shell.stories.tsx` (28 LoC) importa `TheoCodeShell` — manter export estável.
- Após split: ler o original linha a linha, mover blocos por responsabilidade.

#### Deep Dives
- Padrão sugerido:
  - `theo-code-shell.tsx`: estado top-level + composição
  - `chat-pane.tsx`: ChatThread + ChatComposer + history sheet
  - `code-pane.tsx`: AgentTimeline + DiffViewer + TerminalPanel + RunningTasksPanel
  - `infra-pane.tsx`: MetricsPanel + DeploymentRow + DomainConfig
  - `sidebar-pane.tsx`: ProjectSwitcher + SessionListItem
  - `data.ts`: arrays mock

#### Tasks
1. Criar diretório `src/screens/theo-code-shell/`
2. Identificar bordas naturais no arquivo (provavelmente por modo: chat/code/infra)
3. Mover seções para sub-files, deixando exports compatíveis
4. Atualizar imports no shell + na story
5. Validar Ladle ainda renderiza corretamente
6. Validar typecheck passa

#### TDD
```
RED:
  test_theo_code_shell_size() — wc -l src/screens/theo-code-shell.tsx; assert ≤ 500
GREEN: split
REFACTOR: extrair padrões repetidos
VERIFY: pnpm typecheck && pnpm test && pnpm ladle:build
```

#### Acceptance Criteria
- [ ] `theo-code-shell.tsx` ≤ 500 LoC
- [ ] Story continua renderizando o mesmo visual
- [ ] Typecheck + lint + ladle build verdes

#### DoD
- [ ] Split aplicado
- [ ] Visual paridade

---

### T8.2 — Decidir destino de `PermissionMatrix` (mover para composites ou manter primitive)

#### Objective
Resolver inconsistência: PermissionMatrix usa `<select>`/`<input>` nativos porque primitive não pode importar Select/Input — mas isso quebra consistência visual.

#### Evidence
- `permission-matrix.tsx:97-127` — usa nativos.
- Outros forms (EnvVarEditor, DomainConfig — ambos composites) usam Theo Input/Select.

#### Files to edit
```
Opção A (mover para composites):
  src/components/primitives/permission-matrix/* — DELETE
  src/components/composites/permission-matrix/* — NEW (cópia + uso de Input/Select)
  src/index.ts — atualizar import path
  registry/permission-matrix.json — atualizar path

Opção B (manter primitive, duplicar styling):
  src/components/primitives/permission-matrix/permission-matrix.tsx — refactor classes nas linhas 97-127 para casar com Input/Select visuals
```

#### Deep file dependency analysis
- **Opção A** consistente com architecture rule "compõe primitives → composite". Quebra import path no `src/index.ts` mas API JSX permanece (`PermissionMatrix` no mesmo lugar).
- **Opção B** mantém primitive simples mas duplica ~50 LoC de styling.
- Recomendação: **Opção A** — mais clean, segue a taxonomia mecânica do projeto.

#### Tasks
1. Decidir Opção A vs B (ADR/comentário no PR)
2. Se A: mover diretório, ajustar imports, atualizar registry descriptor, rodar tests
3. Validar render visual idêntico

#### TDD
```
RED:
  test_permission_matrix_uses_theo_inputs() (apenas Opção A) — read source; assert imports Input + Select
GREEN: refactor
REFACTOR: None
VERIFY: pnpm test src/components/{primitives,composites}/permission-matrix && pnpm quality:gates
```

#### Acceptance Criteria
- [ ] Decisão registrada em CHANGELOG
- [ ] Visual paridade
- [ ] Tests green

#### DoD
- [ ] Refactor aplicado
- [ ] Quality gates verdes

---

## Phase 9: Dogfood QA (MANDATORY)

> Esta phase roda APÓS todas as implementações. O plano só fecha se passar.

**Objective:** Validar que tudo acima funciona end-to-end como um consumer real experiencia.

### Execution

Run `/dogfood full`. Always full. No shortcuts.

### Acceptance Criteria

- [ ] Health score ≥ 75/100
- [ ] Zero CRITICAL issues introduzidos por este plano
- [ ] Zero HIGH issues em commands/features modificadas
- [ ] Issues pré-existentes documentadas

### If Dogfood Fails

1. Identificar quais issues são causadas por este plano vs pré-existentes
2. Fix all plan-caused CRITICAL e HIGH antes de declarar complete
3. Re-rodar `/dogfood full`
4. Pré-existentes loggadas mas não bloqueiam

---

## Coverage Matrix

Mapping dos 32 findings da auditoria → tasks:

| # | Finding | ID | Severidade | Task(s) |
|---|---|---|---|---|
| 1 | ThemeScript XSS via `</script>` | BLOCKER-001 | BLOCKER | T1.1 |
| 2 | architecture.md census stale (36/12) | BLOCKER-002 | BLOCKER | T3.1 + T4.3 |
| 3 | welcome.stories.tsx stats stale | BLOCKER-003 | BLOCKER | T3.1 + T4.3 |
| 4 | Compound pattern inconsistente | BLOCKER-004 | BLOCKER | T2.1 + T4.1 |
| 5 | FormField.Control spread bug | HIGH-005 | HIGH | T2.2 |
| 6 | useEffect anti-pattern (3 editors) | HIGH-006 | HIGH | T2.3 |
| 7 | vitest-axe coverage ralo (6/101) | HIGH-007 | HIGH | T6.1 + T4.2 |
| 8 | Tailwind `[data-theme="dark"]` dead | HIGH-008 | HIGH | T7.1 |
| 9 | README badge count drift | HIGH-009 | HIGH | T3.2 + T4.3 |
| 10 | Registry fixture cobre 4/110 | HIGH-010 | HIGH | T5.1 + T5.2 |
| 11 | ThemeProvider JSDoc drift | HIGH-011 | HIGH | T0.3 |
| 12 | tsup `cp` POSIX | HIGH-012 | HIGH | T0.2 |
| 13 | TokenUsageChart sem fallback | HIGH-013 | HIGH | T6.2 |
| 14 | quality-gates.md cita risco resolved | MEDIUM-014 | MEDIUM | T0.3 |
| 15 | classic-paper JSDoc "light-only" | MEDIUM-015 | MEDIUM | T0.3 |
| 16 | `.bak` files no repo | MEDIUM-016 | MEDIUM | T0.1 |
| 17 | `.json.tmp` files (95) | MEDIUM-017 | MEDIUM | T0.1 + T4.4 |
| 18 | Test gate é warning | MEDIUM-018 | MEDIUM | T4.5 |
| 19 | theo-code-shell.tsx 2193 LoC | MEDIUM-019 | MEDIUM | T8.1 |
| 20 | Fonts Google CDN no default | MEDIUM-020 | MEDIUM | T7.2 |
| 21 | lint:ci ignora playground/tests | MEDIUM-021 | MEDIUM | T0.4 |
| 22 | PermissionMatrix native inputs | MEDIUM-022 | MEDIUM | T8.2 |
| 23 | referencia/ citada em docs | LOW-023 | LOW | T0.4 (parcial — pode adicionar edit em quality-gates.md) |
| 24 | noConsole permite warn/error | LOW-024 | LOW | T0.4 |
| 25 | Whitelist com fontes deprecated | LOW-025 | LOW | T0.4 |
| 26 | engines.npm não declarado | LOW-026 | LOW | (não corrigido — log defer) |
| 27 | CSS @import duplicado | LOW-027 | LOW | T7.2 (parcial — documentar) |
| 28 | MODE_LABEL/ALL_MODES exports | NIT-028 | NIT | (defer — avaliar em audit de API surface) |
| 29 | LICENSE pode ter template fields | NIT-029 | NIT | (verificar manualmente — log defer) |
| 30 | defaultStory welcome agrava T0-1 | NIT-030 | NIT | T3.1 resolve |
| 31 | one-shot scripts em scripts/ | NIT-031 | NIT | (defer) |
| 32 | CHANGELOG só com [Unreleased] | NIT-032 | NIT | (release 0.1.0 após plano resolve) |

**Coverage: 28/32 findings cobertos (87.5%)**

Os 4 deferred (NIT-029, NIT-031, LOW-026, NIT-028) são cosméticos e podem virar issues separadas pós-release.

## Global Definition of Done

- [ ] Todas as phases 0-8 completas
- [ ] `pnpm quality:gates` green (incluindo 4 novos gates: validateCompoundPattern, validateAxeCoverage, validateCountConsistency + validateArchitectureCensus, validateNoStrayArtifacts)
- [ ] Bundle size `dist/index.js` ± 5% baseline
- [ ] vitest-axe coverage ≥30 primitives interativos
- [ ] Zero BLOCKERs abertos
- [ ] Zero HIGH abertos
- [ ] CHANGELOG `[Unreleased]` documenta todas as mudanças com migration notes
- [ ] **Dogfood QA PASS** — `/dogfood full` health ≥75, zero CRITICAL
- [ ] **Runtime-metric proof** — para cada gate novo, demonstrar que ele falha quando rebobinado para um bug intencional (não só compila)

---

**Próximo passo automático:** rodar `/edge-case-plan ui-audit-remediation-2026-05-14` para validar edge cases não cobertos.
