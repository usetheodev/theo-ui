# Plan: `Whiteboard` — view-only primitive (JSON → SVG, estilo Excalidraw)

> **Version 1.0** — Entrega o primitive `Whiteboard` em `@theokit/ui/whiteboard` como **view declarativo**: recebe um JSON pequeno e LLM-friendly e renderiza em SVG com o look hand-drawn do Excalidraw (rough.js para shapes, perfect-freehand para strokes). Não é editor — sem toolbar, sem drag/resize, sem undo/redo, sem hit-testing. Tem pan+zoom built-in para navegar diagramas grandes. Subpath isolado de bundle, peer-deps opcionais, fora do barrel principal. Outcome esperado: agente do TheoKit/TheoCode emite uma `tool_call` com `{"type": "whiteboard", "data": {...}}` e a UI renderiza imediatamente — análogo ao papel do `Diagram` (Mermaid-like) já no roadmap, mas com a estética Excalidraw em vez de fluxograma estruturado.

## Context

**Estado em 2026-05-18:**
- Whiteboard está em `Explorer (RFC)` no roadmap do TheoUI (`CLAUDE.md` linhas 131-148, `CHANGELOG.md` linha 11). Decisões "SVG-or-Canvas" e "selection model + undo/redo + pan/zoom" estavam **pendentes**.
- TheoUI tem 78 primitives + 21 composites (102 total no barrel). Bundle isolation é tratada como invariant.
- `referencia/excalidraw/` foi clonado para inspeção. Análise mecânica do código upstream: `packages/excalidraw/components/App.tsx` tem **13.055 linhas**; `packages/element/src/` soma **5.383 linhas** entre tipos, renderer, resize, collision, scene, selection. `types.ts` define **68 tipos**. Excalidraw upstream usa **Canvas** (`StaticCanvas`, `InteractiveCanvas`, `NewElementCanvas` — ver `App.tsx:452-453`) e renderiza via `rough.canvas` (`App.tsx:500, 832`).
- Replicar 100% num primitive isolado **não é viável** (escala de uma aplicação inteira vs um primitive de DS) e seria conflito direto com o princípio "Don't reinvent" (CLAUDE.md global §9) e a regra de bundle isolation por subpath (CLAUDE.md TheoUI §Roadmap).

**Pivot de escopo (2026-05-18, decisão do usuário nesta sessão):**
O componente é **view-only**, focado em consumir JSON gerado por LLM e renderizar. Sem edição. As três decisões previamente pendentes foram travadas:

| Decisão | Travada |
| --- | --- |
| Renderer | **SVG** (a11y nativa, hit-testing pelo DOM, export trivial, integração com tema CSS) |
| Algoritmo | **rough.js + perfect-freehand** (MIT, peer-deps optional, ~37KB combinado) |
| Escopo | **View-only com pan+zoom built-in**, 7 tipos de elemento, formato próprio enxuto |

**Evidências concretas:**
- `pnpm view roughjs license` → `MIT` (compatível Apache-2.0). `pnpm view perfect-freehand license` → `MIT`.
- `pnpm view roughjs dependencies` → 4 deps transitivas pequenas do mesmo autor. `pnpm view perfect-freehand dependencies` → `{}` (zero).
- `package.json` agora declara ambas em `devDependencies` (instaladas nesta sessão). Falta declarar como `peerDependencies` opcionais.
- Scripts existentes que governam exports e bundle: `scripts/sync-exports.ts` (assume um barrel único — não suporta entries isolados), `scripts/validate-quality-gates.ts` linha 67-120 (exige `<name>.tsx` + `index.ts` em cada pasta de `primitives/`), `scripts/validate-bundle-size.ts` (baseline do barrel principal).
- `tsup.config.ts` entry único `src/index.ts`.

**Documento de referência:** o resumo da exploração do Excalidraw e as decisões travadas vivem nesta conversa. O RFC `docs/rfcs/0001-whiteboard.md` (T0.6) formalizará a entrada do componente no projeto.

## Objective

**Done = `pnpm quality:gates` verde com o subpath `@theokit/ui/whiteboard` exportando um componente que renderiza o JSON v1 (com pan/zoom) em SVG estilo Excalidraw, sem alterar o bundle baseline do barrel principal.** Especificamente:

1. `@theokit/ui/whiteboard` resolve para um arquivo `dist/whiteboard/index.js` próprio (não re-export do barrel) e funciona sem que o consumer instale `roughjs`/`perfect-freehand` (lazy loaded via dynamic import dentro do subpath).
2. JSON v1 (formato `WhiteboardScene`) é definido com Zod, validável e documentado com exemplos LLM-friendly.
3. 7 tipos de elementos renderizam corretamente: `rect`, `ellipse`, `diamond`, `line`, `arrow`, `text`, `freedraw`.
4. Pan (drag com mouse esquerdo OU middle-click) + zoom (wheel) funcionam built-in via transformação de `viewBox`.
5. Bundle do barrel principal (`quality:bundle`) **inalterado** (±0% — Whiteboard não entra em `src/index.ts`).
6. README, CHANGELOG, CLAUDE.md, architecture.md atualizados (status de Whiteboard sai de "Roadmap/Explorer" para "Available").
7. RFC `docs/rfcs/0001-whiteboard.md` published, com consumer documentado (placeholder a ser preenchido — usuário confirmou que existe; ID do consumer entra no RFC antes de mergear).
8. Dogfood QA `pnpm quality:gates` + smoke manual em playground.

## ADRs

### D1 — SVG, não Canvas
- **Decisão:** Renderer único é SVG. Excalidraw upstream usa Canvas; nós divergimos conscientemente.
- **Rationale:** (a) Acessibilidade nativa por DOM (`role="img"` + `<title>` + `aria-describedby` no `<svg>`; elementos com `<text>` ficam selecionáveis e lidos por leitor de tela); (b) hit-testing por evento do DOM, sem matrix math — irrelevante para view-only mas habilita features de tooltip/click no futuro sem custo; (c) export SVG é roundtrip trivial (`element.outerHTML`); (d) integração com tema CSS via `currentColor` e custom properties (Violet Forge). Custo aceito: degradação de performance ao redor de 3–5k elementos por scene. Diagramas que uma LLM emite tipicamente têm 5–50 elementos. Fora do uso esperado.
- **Consequences:** Habilita: a11y sem trabalho extra, export sem dependência de canvas, theming via CSS. Constrange: scenes >5k elementos exigem virtualização (fora de escopo MVP, fica como follow-up se algum consumer pedir).

### D2 — rough.js + perfect-freehand como peer-deps opcionais
- **Decisão:** Adicionar `roughjs@4.6.6` e `perfect-freehand@1.2.3` como `peerDependencies` + `peerDependenciesMeta.optional=true`. Mantidos em `devDependencies` para build/test locais.
- **Rationale:** Consumer que **não** importa `@theokit/ui/whiteboard` não baixa essas libs. Consumer que importa, instala explicitamente — sinaliza intent. Optional peerDep evita warnings espúrios no `npm install` de quem só usa o barrel. CLAUDE.md TheoUI Roadmap exige exatamente isso: "Plan a subpath import (`@theokit/ui/whiteboard`) with peer-dep opt-in".
- **Consequences:** Habilita bundle isolation real. Constrange: subpath precisa documentar claramente os requisitos de instalação ("Install peers: `pnpm add roughjs perfect-freehand`").

### D3 — Subpath isolado com bundle próprio (não re-export do barrel)
- **Decisão:** `@theokit/ui/whiteboard` aponta para `./dist/whiteboard/index.js` — um bundle separado emitido pelo `tsup` com entry `src/components/primitives/whiteboard/index.ts`. NÃO entra no barrel `src/index.ts`. `sync-exports.ts` ganha um array `ISOLATED_SUBPATHS` que escapa do scan automático de `src/index.ts`.
- **Rationale:** Os 99 subpaths atuais re-exportam o mesmo `dist/index.js` — tree-shaking faz o trabalho. Para Whiteboard isso não basta: o consumer do barrel arrastaria `roughjs` + `perfect-freehand` mesmo sem usar (porque o barrel re-exportaria). Bundle separado garante zero impacto no `quality:bundle` do barrel. O custo é uma exceção no `sync-exports.ts` — explícita e auditável.
- **Consequences:** Habilita: `quality:bundle` baseline permanece intacto; consumers do barrel não pagam pelo Whiteboard. Constrange: `tsup` ganha entry adicional (build mais lento por ~1s); `sync-exports.ts` ganha complexidade (passa de scanner-only para scanner+overrides); `validateExportsMap` precisa aceitar o subpath isolado sem flagrar drift.

### D4 — JSON v1 enxuto e LLM-friendly, validado com Zod
- **Decisão:** Schema próprio mínimo — `{version, width, height, background?, elements[]}` onde `elements[]` é discriminated union por `type`. Campos por elemento: `x, y, w, h, label?, stroke?, fill?, strokeWidth?, fillStyle?, opacity?, seed?` (e específicos como `from/to/headStart/headEnd` para arrow, `points[]` para freedraw, `text/fontSize/align` para text). Não compatível com formato `.excalidraw` nativo (que tem 68 campos por elemento com `seed`, `version`, `versionNonce`, `index` fractional, `boundElements`, `frameId`, etc. — coisas que uma LLM não emite naturalmente).
- **Rationale:** O caso de uso central é "LLM gera JSON → render imediato". Cada campo extra é (a) probabilidade adicional da LLM errar; (b) superfície adicional para validar; (c) ruído no prompt. Zod dá runtime validation com mensagens úteis quando a LLM erra. Formato próprio também desacopla nosso schema da evolução de Excalidraw upstream.
- **Consequences:** Habilita: prompt simples, validação severa, evolução independente. Constrange: usuário que tem export `.excalidraw` precisa converter manualmente. Mitigação futura: função `fromExcalidraw()` opcional como follow-up se aparecer demanda.

### D5 — Pan/zoom via SVG `viewBox`, não `transform` CSS
- **Decisão:** Pan e zoom alteram o atributo `viewBox` do `<svg>` raiz. Stateful via `useState` interno (ou `useReducer` se reducer ajudar). Sem libs externas (sem react-zoom-pan-pinch etc.).
- **Rationale:** (a) Mais limpo: coordenadas dos elementos são world coordinates; o `viewBox` é a câmera. Sem multiplicação de transforms por elemento; (b) Export SVG sai com `viewBox` correto sem trabalho extra; (c) zoom respeita aspect ratio sem ginástica de matrix; (d) hit-testing futuro é trivial (eventos chegam com `clientX/clientY` e há `svg.getScreenCTM().inverse()` nativo). Lib externa traria dep transitiva por uma feature de ~80 linhas.
- **Consequences:** Habilita: zero deps adicionais, export trivial, world coordinates limpas. Constrange: precisamos implementar momentum/inércia se quisermos polish (fora do MVP).

### D6 — Lazy import de rough.js e perfect-freehand dentro do subpath
- **Decisão:** O componente `<Whiteboard>` faz `dynamic import` das libs no primeiro render (via `React.lazy` + `Suspense` ou via top-level await numa entry separada). Stories e tests usam o caminho síncrono (`import rough from "roughjs"`).
- **Rationale:** Mesmo o subpath isolado se beneficia de code splitting — o bundle inicial do consumer renderiza fallback (`<Whiteboard.Skeleton />`) enquanto as libs carregam. Excalidraw upstream também lazy-loadeia em produção.
- **Consequences:** Habilita: TTI menor para o consumer. Constrange: precisa de skeleton; testes precisam aguardar resolução do dynamic import. **Decisão revisável**: se o overhead de Suspense for maior que o ganho real (libs combinadas ≈ 37KB), volta a ser import síncrono. Marcar para revisar após Phase 2.

### D7 — Sem hit-testing, sem selection, sem edição
- **Decisão:** Zero handlers de click em elementos internos no MVP. O `<svg>` raiz captura pan/zoom no container, não em elementos. `pointer-events: none` nos elementos por padrão (configurável via `interactive` prop futura).
- **Rationale:** É um view. Adicionar selection/click no MVP arrasta state, hit-testing, e mata o "simples" pedido pelo usuário. Quando um consumer pedir "quero saber qual nó foi clicado", revisitar via `onElementClick?: (id) => void` opcional — não bloqueia MVP.
- **Consequences:** Habilita: simplicidade extrema, fácil de testar (só verifica SVG output). Constrange: features de tooltip/popover em nó vêm em v2.

### D8 — Whiteboard fora do barrel `src/index.ts` E fora do census
- **Decisão:** Não adicionar `export { Whiteboard } from "./components/primitives/whiteboard/index.js"` no barrel. Whiteboard não conta no badge `components-N` do README, não aparece em `docs/architecture.md` Census, e não passa por `validateAxeCoverage`.
- **Rationale:** O barrel é o pacote "tudo junto" que carrega no `import { Anything } from "@theokit/ui"`. Engines pesadas (Whiteboard, Slide, SlideDeck, Diagram) vivem em subpaths dedicados. Isso é literalmente o que CLAUDE.md TheoUI §Roadmap exige: "do not include in the main barrel". O census reflete o barrel; subpaths isolados são documentados em README separado (`### Engines (subpath imports)` ou similar).
- **Consequences:** Habilita: census e badge ficam estáveis; futuras engines seguem mesmo padrão. Constrange: README precisa de seção própria para listar engines. `validateReadmeDrift` precisa whitelist-ar `Whiteboard` (ou a seção fica fora dos backticks que ele inspeciona).

### D9 — Seed determinístico em rough.js para evitar re-renders "tremulantes"
- **Decisão:** Cada elemento opcional `seed: number`. Se ausente, derivamos seed estável de `(type, x, y, w, h, label)` via hash simples (FNV-1a 32-bit). Isso garante que o mesmo JSON renderiza identicamente entre renders/SSR/snapshot tests.
- **Rationale:** rough.js usa randomness para criar o look hand-drawn. Sem seed determinístico, cada render produz traços ligeiramente diferentes → tests flaky, SSR hydration mismatch, animation jitter. Excalidraw upstream tem campo `seed` por essa razão (`types.ts:54`).
- **Consequences:** Habilita: snapshot tests estáveis, SSR-safe, animations sem jitter. Constrange: precisa de função de hash testada; LLM pode emitir seeds manualmente para garantir reproducibility.

## Dependency Graph

```
Phase 0 (tooling + scaffold)
    │
    ▼
Phase 1 (schema + types)  ─┐
    │                       │
    ▼                       │ (Phase 2 e 3 paralelizáveis após 1)
Phase 2 (SVG renderer)    Phase 3 (pan/zoom viewport)
    │                       │
    └───────────┬───────────┘
                ▼
        Phase 4 (compose + a11y + stories)
                │
                ▼
        Phase 5 (quality gates + docs)
                │
                ▼
        Phase 6 (Dogfood QA — MANDATORY)
```

Phase 2 e 3 podem paralelizar (renderer puro funcional vs viewport stateful — tocam arquivos diferentes). Tudo o resto é sequencial.

---

## Phase 0: Tooling + scaffold isolado

**Objective:** Preparar `package.json`, `tsup.config.ts`, `sync-exports.ts` e a estrutura de pasta do primitive antes de qualquer código de feature, garantindo que o tooling de bundle isolado funciona end-to-end.

### T0.1 — Adicionar suporte a `ISOLATED_SUBPATHS` em `sync-exports.ts`

#### Objective
Permitir que `sync-exports.ts` emita entries que apontam para arquivos `dist/*` próprios (não re-export do barrel), preservando o comportamento existente para os 99 subpaths atuais.

#### Evidence
- `scripts/sync-exports.ts:43-52` mostra `BASE_EXPORTS` (constantes) e `buildExports` que pega componentSubpaths do scanner do `src/index.ts` e emite todos apontando para `./dist/index.js`.
- `scripts/validate-quality-gates.ts:167-200` (`validateExportsMap`) chama `buildExports(extractComponentSubpaths(indexContent))` e compara JSON.stringify exato. Qualquer entry adicional manual no `package.json#exports` falha o gate.
- Sem essa mudança, ou o subpath não existe, ou o gate quebra.

#### Files to edit
```
scripts/sync-exports.ts                                       — adicionar ISOLATED_SUBPATHS constant + lógica de merge
scripts/sync-exports.test.ts (NEW)                            — meta-test garantindo que ISOLATED_SUBPATHS entra no buildExports output
```

#### Deep file dependency analysis
- `sync-exports.ts` hoje: pure functions exportadas (`buildExports`, `extractComponentSubpaths`) + CLI main. Importadas por `validate-quality-gates.ts:168`. Mudar a assinatura quebra o consumer; **adicionar** uma constante e mesclá-la dentro de `buildExports` é aditivo.
- `validate-quality-gates.ts:168` chama `buildExports(extractComponentSubpaths(indexContent))` sem saber de ISOLATED_SUBPATHS — vai funcionar porque o merge é interno a `buildExports`.

#### Deep Dives
- **Estrutura proposta:**
  ```ts
  const ISOLATED_SUBPATHS: Record<string, ExportEntry> = {
    "./whiteboard": {
      types: "./dist/whiteboard/index.d.ts",
      import: "./dist/whiteboard/index.js",
    },
  };
  // buildExports merges: { ...BASE_EXPORTS, ...autoScanned, ...ISOLATED_SUBPATHS }
  ```
- **Invariante:** ISOLATED_SUBPATHS keys NUNCA colidem com auto-scanned subpaths (que vêm do `primitives/composites/<name>/index.js` scan). Add um check explícito que falha se colidir.
- **Edge case:** se um dev acidentalmente adicionar `Whiteboard` ao `src/index.ts`, o auto-scan vai gerar `./whiteboard` → ./dist/index.js, e o merge com ISOLATED_SUBPATHS sobrescreveria silenciosamente. Solução: o merge dispara `fail()` se houver collision.

#### Tasks
1. Adicionar constante `ISOLATED_SUBPATHS` em `sync-exports.ts`, inicialmente com a entry de `./whiteboard`.
2. Alterar `buildExports` para mesclar `ISOLATED_SUBPATHS` no final, com check de colisão (lançar `Error` se key existe em auto-scanned).
3. Exportar `ISOLATED_SUBPATHS` para tests.
4. Criar `scripts/sync-exports.test.ts` (ou estender o test existente se houver) com 3 cases: scan vazio + ISOLATED retorna só o isolated; scan com `Button` retorna both; collision lança Error.

#### TDD
```
RED:     test_buildExports_includes_isolated_subpaths() — verifica que com componentSubpaths=[] o output contém "./whiteboard"
RED:     test_buildExports_collision_with_auto_scanned_throws() — passar componentSubpaths=["whiteboard"] e esperar Error
RED:     test_isolated_subpath_points_to_isolated_dist_file() — output["./whiteboard"].import === "./dist/whiteboard/index.js"
GREEN:   implementar ISOLATED_SUBPATHS + merge + collision check
REFACTOR: extrair `mergeWithCollisionCheck(a, b)` helper se ajudar legibilidade
VERIFY:  pnpm vitest run scripts/sync-exports.test.ts
```

#### Acceptance Criteria
- [ ] `pnpm sync:exports` gera `package.json#exports` com `./whiteboard` apontando para `./dist/whiteboard/index.js`
- [ ] `pnpm quality:structure` (que roda `validateExportsMap`) passa
- [ ] Meta-test do `sync-exports.test.ts` verde
- [ ] Zero diff em outros 99 subpaths

#### DoD
- [ ] Tasks 1-4 concluídas
- [ ] `pnpm format && pnpm lint && pnpm typecheck && pnpm vitest run scripts/sync-exports.test.ts` verde
- [ ] Não quebra `pnpm quality:gates:fast`

---

### T0.2 — `tsup` emite bundle isolado `dist/whiteboard/`

#### Objective
Configurar `tsup.config.ts` para produzir um segundo entrypoint que vira `dist/whiteboard/index.js` + `dist/whiteboard/index.d.ts`, sem afetar o bundle principal.

#### Evidence
- `tsup.config.ts:6` declara `entry: ["src/index.ts"]` — único entry. Sem suporte multi-entry no momento.
- Se Whiteboard ficar dentro do barrel, todo consumer do barrel arrasta rough.js/perfect-freehand (violação direta de CLAUDE.md TheoUI §Roadmap).
- `tsup` aceita `entry: { main: "src/index.ts", whiteboard: "src/components/primitives/whiteboard/index.ts" }` e emite `dist/main.js` + `dist/whiteboard.js` (ou customizado).

#### Files to edit
```
tsup.config.ts                                                — declarar entry adicional para whiteboard com outDir override
```

#### Deep file dependency analysis
- `tsup.config.ts` hoje: single entry, ESM only, dts, splitting:false, treeshake:true, external react/react-dom. O `onSuccess` copia CSS assets.
- Mudar entry de array para objeto + adicionar entry mantém comportamento existente para o barrel.
- `dist/whiteboard/index.js` precisa ter `roughjs` e `perfect-freehand` **bundled** (não externalizados) OU o consumer instala como deps. Optei por externalizar (peer-deps) — alinha com D2/D6 e mantém o subpath bundle pequeno (sem duplicar ~37KB).

#### Deep Dives
- **Configuração proposta:**
  ```ts
  entry: {
    index: "src/index.ts",
    "whiteboard/index": "src/components/primitives/whiteboard/index.ts",
  },
  external: ["react", "react-dom", "roughjs", "perfect-freehand", /^roughjs\//],
  ```
- **Por que `/^roughjs\//`:** rough.js tem submódulos (`roughjs/bin/svg`, `roughjs/bin/generator`). Regex no external pega todos.
- **Invariante:** o `dist/index.js` do barrel principal NÃO referencia `roughjs` ou `perfect-freehand`. Provar isso com um grep no output após build (T5.x).
- **`dts: true` com entry objeto:** tsup gera `dist/index.d.ts` + `dist/whiteboard/index.d.ts` automaticamente.

#### Tasks
1. Mudar `entry` para objeto literal com `index` e `whiteboard/index`.
2. Adicionar `roughjs`, `perfect-freehand`, e `/^roughjs\//` ao array `external`.
3. Rodar `pnpm build` e verificar manualmente que `dist/whiteboard/index.js` existe e não inlina rough.js.
4. Adicionar grep no `validateExportsMap` (ou novo gate `validateIsolatedSubpath`): após build, `cat dist/whiteboard/index.js | grep -c "rough"` deve ser baixo (zero ou só re-exports).

#### TDD
```
RED:     teste manual nesta fase — `pnpm build` produz dist/whiteboard/index.js (não automatizável até stub do componente existir)
GREEN:   ajustar tsup.config + criar stub mínimo em src/components/primitives/whiteboard/index.ts (T0.4 cobre o stub)
REFACTOR: None expected
VERIFY:  pnpm build && ls -la dist/whiteboard/index.{js,d.ts}
```

#### Acceptance Criteria
- [ ] `dist/whiteboard/index.js` existe após `pnpm build`
- [ ] `dist/whiteboard/index.d.ts` existe
- [ ] `dist/whiteboard/index.js` NÃO inclui código de rough.js inlined (grep — devem aparecer só como `import` externalizados)
- [ ] `dist/index.js` (barrel) tamanho **inalterado** vs baseline atual (`quality:bundle` confirma)
- [ ] Tarball `npm pack --dry-run` inclui `dist/whiteboard/` automaticamente (porque `package.json#files` já lista `dist`)

#### DoD
- [ ] Tasks 1-4 concluídas
- [ ] `pnpm build` verde
- [ ] `pnpm quality:bundle` baseline inalterado
- [ ] Manual: `head -5 dist/whiteboard/index.js` mostra imports de roughjs/perfect-freehand (não código inline)

---

### T0.3 — `package.json`: peerDependencies opcionais + sync de exports

#### Objective
Declarar `roughjs` e `perfect-freehand` como peer-deps opcionais, mantendo-os em devDependencies para build/test locais.

#### Evidence
- `package.json:453-456` tem `peerDependencies` só com react/react-dom hoje.
- `peerDependenciesMeta.optional=true` é o padrão npm/pnpm para "peer opcional, sem warning se ausente".
- Sem essa declaração, consumer que use `@theokit/ui/whiteboard` precisa adivinhar quais peers instalar.

#### Files to edit
```
package.json                                                  — adicionar peerDependencies + peerDependenciesMeta entries
```

#### Deep file dependency analysis
- `package.json` é tocado por: `sync-exports.ts` (apenas o campo `exports`), `validateExportsMap` (compara), `validateNpmTarball` (lê `files`), `validateScriptsAndCi` (lê `scripts`). Mudar `peerDependencies` não afeta nenhum gate diretamente.
- Devs locais: `pnpm install` resolve peer opcional ignorando — não há mudança no lockfile.

#### Deep Dives
- **Schema proposto:**
  ```json
  "peerDependencies": {
    "react": ">=18.2.0 <20",
    "react-dom": ">=18.2.0 <20",
    "roughjs": "^4.6.0",
    "perfect-freehand": "^1.2.0"
  },
  "peerDependenciesMeta": {
    "roughjs": { "optional": true },
    "perfect-freehand": { "optional": true }
  }
  ```
- **Por que ranges `^4.6.0` e `^1.2.0`:** semver permissivo para o consumer escolher versão minor compatível. Travados em `^` major.

#### Tasks
1. Adicionar `peerDependencies` entries para `roughjs` e `perfect-freehand`.
2. Adicionar `peerDependenciesMeta` com `optional: true` para ambos.
3. Rodar `pnpm install` para confirmar lockfile estável.
4. Rodar `pnpm format` para garantir formatação biome.

#### TDD
```
RED:     N/A (mudança declarativa em package.json sem lógica)
GREEN:   editar package.json
REFACTOR: None expected
VERIFY:  pnpm install --frozen-lockfile (deve passar) && pnpm format:check
```

#### Acceptance Criteria
- [ ] `package.json` declara `peerDependencies` para roughjs e perfect-freehand
- [ ] `peerDependenciesMeta` marca ambos como `optional: true`
- [ ] `pnpm install` sem warnings de peer
- [ ] `pnpm format:check` verde

#### DoD
- [ ] Tasks 1-4 concluídas
- [ ] Lockfile estável

---

### T0.4 — Scaffold `src/components/primitives/whiteboard/`

#### Objective
Criar a estrutura de pasta esperada pelo `validateComponentStructure` (`whiteboard.tsx` + `index.ts` + `whiteboard.test.tsx` + `whiteboard.stories.tsx`), com stubs que passam todas as gates antes de implementar features.

#### Evidence
- `validate-quality-gates.ts:86-89` exige `<name>.tsx` e `index.ts` para qualquer pasta em `primitives/`. Sem isso o gate falha com `missing whiteboard.tsx` / `missing index.ts`.
- `validate-quality-gates.ts:259-287` (`validateRegistryStoriesAndTests`) só roda para itens com descriptor em `registry/`. Como Whiteboard NÃO vai pro registry no MVP, não dispara aqui.
- Mas o **`tsup` precisa** de `src/components/primitives/whiteboard/index.ts` real para emitir `dist/whiteboard/index.js`.

#### Files to edit
```
src/components/primitives/whiteboard/index.ts (NEW)             — re-export do componente
src/components/primitives/whiteboard/whiteboard.tsx (NEW)       — stub do componente, sem features
src/components/primitives/whiteboard/whiteboard.test.tsx (NEW)  — smoke test (renders without crashing)
src/components/primitives/whiteboard/whiteboard.stories.tsx (NEW) — story mínima para Ladle
```

#### Deep file dependency analysis
- `validateComponentStructure` (linha 67-120) escaneia `primitives/` e exige os dois arquivos. Stub passa.
- `whiteboard.tsx` stub renderiza `<svg width={data.width} height={data.height} />` vazio — suficiente para gates.
- `index.ts` exporta `export { Whiteboard } from "./whiteboard.js";` (mesmo padrão dos 78 primitives).
- **Crítico**: Whiteboard NÃO deve ser adicionado a `src/index.ts` (D8). `validatePublicExports` vai estar OK porque só checa exports declarados em `src/index.ts`.

#### Deep Dives
- **Stub `whiteboard.tsx`:**
  ```tsx
  import * as React from "react";

  export interface WhiteboardData {
    version: 1;
    width: number;
    height: number;
    elements: unknown[];
  }

  export interface WhiteboardProps {
    data: WhiteboardData;
    className?: string;
  }

  export function Whiteboard({ data, className }: WhiteboardProps): React.ReactElement {
    return (
      <svg
        viewBox={`0 0 ${data.width} ${data.height}`}
        width={data.width}
        height={data.height}
        className={className}
        role="img"
        aria-label="Whiteboard"
      />
    );
  }
  ```
- **Stub `whiteboard.test.tsx`:** smoke test (`render` + `getByRole("img")` + axe).
- **Stub `whiteboard.stories.tsx`:** uma story `Empty` que passa `data: { version:1, width:400, height:300, elements:[] }`.

#### Tasks
1. Criar a pasta `src/components/primitives/whiteboard/`.
2. Escrever `whiteboard.tsx` stub.
3. Escrever `index.ts` com re-export.
4. Escrever `whiteboard.test.tsx` smoke.
5. Escrever `whiteboard.stories.tsx` story `Empty`.
6. Confirmar que `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm quality:structure` passam.

#### TDD
```
RED:     test_whiteboard_renders_empty_svg() — espera <svg role="img" aria-label> com viewBox correto
RED:     test_whiteboard_a11y() — axe passa com 0 violations no stub vazio
GREEN:   implementar stub conforme acima
REFACTOR: None expected
VERIFY:  pnpm vitest run src/components/primitives/whiteboard/whiteboard.test.tsx
```

#### Acceptance Criteria
- [ ] Pasta + 4 arquivos existem
- [ ] `pnpm vitest run src/components/primitives/whiteboard/` verde
- [ ] `pnpm quality:structure` verde
- [ ] `pnpm build` produz `dist/whiteboard/index.js` válido
- [ ] Whiteboard NÃO aparece em `src/index.ts`

#### DoD
- [ ] Tasks 1-6 concluídas
- [ ] Todos os gates relevantes verdes
- [ ] Ladle build inclui a story `Whiteboard / Empty`

---

### T0.5 — RFC `docs/rfcs/0001-whiteboard.md`

#### Objective
Documentar a decisão formal (todas as 9 ADRs deste plano + consumer documentado + plano de fases) em um RFC versionado, criando a pasta `docs/rfcs/` como padrão para futuras engines (Slide, SlideDeck, Diagram).

#### Evidence
- CLAUDE.md TheoUI §Roadmap: "They will land through individual RFCs, each running the full quality-gate chain". Hoje não existe pasta `docs/rfcs/`.
- Os 4 engines no roadmap (Whiteboard, Slide, SlideDeck, Diagram) vão repetir o mesmo padrão de subpath isolado + peer-deps opcionais + bundle separado — uma forma RFC formal ajuda a próxima.
- CLAUDE.md TheoUI §Roadmap exige: "no engine moves out of 'Explorer' without a documented agent-surface or PaaS-dashboard consumer asking for it". Esse RFC tem o slot para registrar o consumer.

#### Files to edit
```
docs/rfcs/0001-whiteboard.md (NEW)                            — RFC formal
docs/rfcs/README.md (NEW)                                     — index dos RFCs (curto)
```

#### Deep file dependency analysis
- `docs/architecture.md` referencia `docs/quality-gates.md`, `docs/design-system.md`. Adicionar `docs/rfcs/` é aditivo.
- README pode futuramente linkar a `docs/rfcs/` na seção Roadmap.

#### Deep Dives
- **Estrutura do RFC:**
  1. Metadata (id, autor, data, status: Proposed → Accepted após merge)
  2. Summary
  3. Motivation (consumer documentado — **placeholder a ser preenchido com referência concreta**)
  4. Decisão (todas as 9 ADRs deste plano em prosa)
  5. Schema JSON v1 com exemplos LLM-friendly
  6. API pública (`<Whiteboard data={...} />`)
  7. Plano de fases (link para este plan)
  8. Quality gates impactados
  9. Riscos + mitigações — incluir todos os 6 itens **DOCUMENT** do edge-case-plan (EC-17 hash collision FNV, EC-18 RTL/emoji, EC-19 >5k elementos, EC-20 pointer-events:none, EC-21 peer-dep version, EC-22 coords fora da scene)
  10. Alternatives considered (Canvas, formato compatível Excalidraw, lib externa, etc.)
- **Status no merge:** `Proposed`. Move para `Accepted` quando Phase 5 fecha. Move para `Implemented` quando Phase 6 fecha.

#### Tasks
1. Criar `docs/rfcs/README.md` com índice (apenas linha "0001 — Whiteboard (Proposed, 2026-05-18)").
2. Escrever `docs/rfcs/0001-whiteboard.md` cobrindo os 10 tópicos acima.
3. Adicionar placeholder explícito `**Consumer documentado:** TODO — preencher antes de merge de Phase 5` na seção Motivation.

#### TDD
```
RED:     N/A (docs)
GREEN:   escrever markdown
REFACTOR: None
VERIFY:  pnpm format:check (biome formata MD se configurado? — verificar; senão skip)
```

#### Acceptance Criteria
- [ ] `docs/rfcs/0001-whiteboard.md` criado
- [ ] `docs/rfcs/README.md` criado
- [ ] RFC referencia todas as 9 ADRs
- [ ] Schema JSON v1 incluído com 2-3 exemplos LLM-friendly

#### DoD
- [ ] Tasks 1-3 concluídas
- [ ] `pnpm format:check` verde

---

### T0.6 — `CHANGELOG.md` Unreleased entry

#### Objective
Registrar a abertura do RFC + scaffold em `CHANGELOG.md` na seção `[Unreleased] > Added`.

#### Evidence
- Global CLAUDE.md §6: "Toda entry DEVE ter referência ao ticket/issue/PR entre parênteses". TheoUI CLAUDE.md §Inviolable §6: "Changelog discipline. Every code change updates `CHANGELOG.md` here."
- CHANGELOG já tem precedente de Roadmap formalization (linha 11). Whiteboard saindo de Explorer para "in progress" merece uma entry.

#### Files to edit
```
CHANGELOG.md                                                  — adicionar entry em [Unreleased] > Added
```

#### Tasks
1. Adicionar bullet em `[Unreleased] > Added`: "**Whiteboard primitive — Phase 0 (scaffold)**. Subpath `@theokit/ui/whiteboard` esqueleto com bundle isolado, peer-deps opcionais (`roughjs`, `perfect-freehand`), RFC `docs/rfcs/0001-whiteboard.md` em `Proposed`. View-only render de JSON LLM-friendly estilo Excalidraw, com pan/zoom built-in. (#TBD)"
2. Confirmar que `validateGovernanceFiles` continua passando (procura `## [Unreleased]`).

#### TDD
```
RED:     N/A (docs)
GREEN:   editar CHANGELOG.md
REFACTOR: None
VERIFY:  pnpm quality:structure passa
```

#### Acceptance Criteria
- [ ] CHANGELOG entry adicionada
- [ ] `## [Unreleased]` presente
- [ ] Gate `validateGovernanceFiles` verde

#### DoD
- [ ] Task 1 concluída

---

## Phase 1: Schema + tipos + validation

**Objective:** Definir o contrato JSON v1 com Zod, gerar tipos TS, e fornecer validador puro que retorna erros úteis para a LLM corrigir.

### T1.1 — Zod schema `WhiteboardScene` com discriminated union

#### Objective
Especificar o JSON v1 como Zod schema com discriminated union por `type`, derivando tipos TS automaticamente.

#### Evidence
- D4 trava o formato: `{version, width, height, background?, elements[]}` com 7 tipos.
- Zod é leve (~12KB gz), maduro, já é padrão em vários projetos TS modernos. Não existe outra lib de validação em uso aqui.
- **Decisão (edge-case-plan 2026-05-18, EC-5 opção A):** Zod entra em `dependencies` **normais** do pacote (não peer-dep opcional). Justificativa: validação sempre ativa por default no `<Whiteboard>`. Se ficasse peer-dep opcional, consumer que omitisse instalar receberia `Cannot find module 'zod'` em runtime ao importar o subpath. ~12KB gz extras vivem só no `dist/whiteboard/index.js` (não vazam para o barrel — `tsup` external lista só `react`, `react-dom`, `roughjs`, `perfect-freehand`).

#### Files to edit
```
src/components/primitives/whiteboard/schema.ts (NEW)          — Zod schema + tipos derivados
src/components/primitives/whiteboard/schema.test.ts (NEW)     — testes de validação (positive + negative)
package.json                                                  — adicionar zod a dependencies (não peer-dep — ver EC-5 opção A)
```

#### Deep file dependency analysis
- `schema.ts` é puro (sem React, sem DOM). Pode ser usado em Node (server-side validation).
- Importado por `whiteboard.tsx` (validação opcional) e por consumers que queiram pre-validar antes de renderizar.

#### Deep Dives
- **Schema esqueleto:**
  ```ts
  import { z } from "zod";

  // EC-3 fix: .finite() em todo z.number() para rejeitar NaN/Infinity (LLM emite "x: 100-100" virando NaN às vezes)
  // EC-4 fix: .max() em dimensões da scene para evitar valores absurdos (1e9) que travam browser
  const finiteNumber = z.number().finite();
  const finitePositive = finiteNumber.positive();

  const baseElement = z.object({
    id: z.string().optional(),
    x: finiteNumber,
    y: finiteNumber,
    stroke: z.string().optional(),
    strokeWidth: finitePositive.max(50).optional(),
    strokeStyle: z.enum(["solid", "dashed", "dotted"]).optional(),
    fill: z.string().optional(),
    fillStyle: z.enum(["hachure", "solid", "cross-hatch", "zigzag"]).optional(),
    opacity: finiteNumber.min(0).max(1).optional(),
    roughness: finiteNumber.min(0).max(3).optional(),
    seed: z.number().int().finite().optional(),
  });

  const rectElement = baseElement.extend({
    type: z.literal("rect"),
    w: finitePositive.max(20000),
    h: finitePositive.max(20000),
    label: z.string().max(500).optional(),
    roundness: z.enum(["sharp", "round"]).optional(),
  });
  const ellipseElement = baseElement.extend({ type: z.literal("ellipse"), w: finitePositive.max(20000), h: finitePositive.max(20000), label: z.string().max(500).optional() });
  const diamondElement = baseElement.extend({ type: z.literal("diamond"), w: finitePositive.max(20000), h: finitePositive.max(20000), label: z.string().max(500).optional() });
  const lineElement = baseElement.extend({ type: z.literal("line"), to: z.tuple([finiteNumber, finiteNumber]) });
  const arrowElement = baseElement.extend({ type: z.literal("arrow"), to: z.tuple([finiteNumber, finiteNumber]), label: z.string().max(500).optional(), headStart: z.boolean().optional(), headEnd: z.boolean().default(true) });
  const textElement = baseElement.extend({ type: z.literal("text"), text: z.string().max(5000), fontSize: finitePositive.max(500).optional(), align: z.enum(["left", "center", "right"]).optional(), fontFamily: z.enum(["sans", "serif", "mono", "hand"]).optional() });
  const freedrawElement = baseElement.extend({ type: z.literal("freedraw"), points: z.array(z.tuple([finiteNumber, finiteNumber, finiteNumber.optional()])).min(2).max(5000) });

  export const whiteboardElement = z.discriminatedUnion("type", [rectElement, ellipseElement, diamondElement, lineElement, arrowElement, textElement, freedrawElement]);

  export const whiteboardScene = z.object({
    version: z.literal(1),
    width: finitePositive.max(20000),  // EC-4: clamp upper bound
    height: finitePositive.max(20000), // EC-4: clamp upper bound
    background: z.string().optional(),
    elements: z.array(whiteboardElement).max(5000), // sanity cap
  });

  export type WhiteboardElement = z.infer<typeof whiteboardElement>;
  export type WhiteboardScene = z.infer<typeof whiteboardScene>;
  ```
- **Invariante:** `version === 1` literal — força que mudanças no schema bumpem major.
- **Edge case:** elemento com `w: 0` rejeitado (rough.js produz lixo com width zero); idem `strokeWidth: 0`; freedraw com 1 ponto rejeitado.

#### Tasks
1. `pnpm add zod@latest` (NÃO -D — entra em `dependencies` reais, decisão EC-5 opção A).
2. Escrever `schema.ts` conforme acima.
3. Escrever `schema.test.ts` com:
   - Positive: cada um dos 7 tipos válido.
   - Negative: tipo desconhecido, dimensões zero, freedraw com 1 ponto, version errada.
   - **EC-3:** schema rejeita NaN em `x`, `y`, `w`, `h`, `strokeWidth`, `opacity`, `roughness`.
   - **EC-3:** schema rejeita `Infinity` nos mesmos campos.
   - **EC-4:** schema rejeita `width: 1e9` na scene (excede max 20000).
   - **EC-4:** schema aceita `width: 19999` (dentro do clamp).
   - Round-trip: `whiteboardScene.parse(json)` produz objeto que `.parse` de novo retorna idêntico.

#### TDD
```
RED:     test_schema_accepts_minimal_valid_rect()
RED:     test_schema_accepts_all_7_types_in_one_scene()
RED:     test_schema_rejects_unknown_type() — espera ZodError com path[0]==="elements"
RED:     test_schema_rejects_zero_width_rect()
RED:     test_schema_rejects_freedraw_with_single_point()
RED:     test_schema_rejects_version_other_than_1()
RED:     test_schema_rejects_NaN_in_coordinates() — EC-3
RED:     test_schema_rejects_Infinity_in_dimensions() — EC-3
RED:     test_schema_rejects_scene_width_over_20000() — EC-4
RED:     test_schema_round_trip_idempotent()
GREEN:   implementar schema.ts
REFACTOR: extrair commonStyles helper se múltiplos elementos compartilharem campos (já feito via baseElement)
VERIFY:  pnpm vitest run src/components/primitives/whiteboard/schema.test.ts
```

#### Acceptance Criteria
- [ ] 7 testes RED viram GREEN
- [ ] `WhiteboardScene` e `WhiteboardElement` exportados como types
- [ ] Zod em devDeps + peerDeps opcionais
- [ ] `pnpm typecheck` verde

#### DoD
- [ ] Tasks 1-3 concluídas
- [ ] Cobertura do `schema.ts` >= 90%

---

### T1.2 — Validator function `validateScene(input): Result`

#### Objective
Wrapper público que recebe `unknown` e devolve `{ok: true, scene} | {ok: false, errors: FormattedError[]}`, com erros formatados para LLM consumir (mensagem + path + suggestion).

#### Evidence
- LLMs erram JSON. Mensagens crus do Zod (`Invalid input` + path numérico) são pouco úteis para auto-correção pelo agente.
- Formato `{path: "elements[2].type", message: "Expected one of: rect, ellipse, ...", got: "rectangle"}` é mais acionável.

#### Files to edit
```
src/components/primitives/whiteboard/validate.ts (NEW)        — validateScene + FormattedError type
src/components/primitives/whiteboard/validate.test.ts (NEW)   — testes do formatter
```

#### Deep Dives
- Usa `result.error.issues` do Zod (Zod v3+).
- Mapeia cada issue para `{path: issue.path.join("."), message, got: issue.code === "invalid_type" ? issue.received : undefined, suggestion?: string}`.

#### Tasks
1. Implementar `validateScene` em `validate.ts`.
2. Implementar `formatZodIssue` helper.
3. Testes: 4 issues distintos (invalid_type, invalid_literal, invalid_union_discriminator, too_small).

#### TDD
```
RED:     test_validate_returns_ok_for_valid_scene()
RED:     test_validate_formats_unknown_type_with_suggestion()
RED:     test_validate_formats_too_small_with_minimum()
RED:     test_validate_returns_multiple_errors_aggregated()
GREEN:   implementar validate.ts
REFACTOR: extrair `suggestionsForType(received)` se a lista crescer
VERIFY:  pnpm vitest run src/components/primitives/whiteboard/validate.test.ts
```

#### Acceptance Criteria
- [ ] 4 testes RED → GREEN
- [ ] Mensagens incluem `path`, `message`, `got` quando aplicável
- [ ] Zero `console.log` no código de produção

#### DoD
- [ ] Tasks 1-3 concluídas

---

## Phase 2: SVG renderer (puro)

**Objective:** Funções puras `renderElement(el): SVGElementDescriptor` para cada um dos 7 tipos, agregadas por `renderScene(scene): JSX.Element`. Sem state, sem hooks. Determinístico via seed.

### T2.1 — Hash determinístico para seed default

#### Objective
Gerar seed reproduzível a partir de `(type, x, y, w, h, label)` para elementos sem `seed` explícito, garantindo snapshots estáveis.

#### Evidence
- D9: rough.js precisa de seed para evitar tremor entre renders.
- FNV-1a 32-bit: ~10 linhas, sem deps.

#### Files to edit
```
src/components/primitives/whiteboard/seed.ts (NEW)            — fnvHash + deriveSeed
src/components/primitives/whiteboard/seed.test.ts (NEW)       — propriedades: determinístico, distribuição básica
```

#### TDD
```
RED:     test_same_input_same_seed()
RED:     test_different_input_different_seed()
RED:     test_seed_fits_int32()
GREEN:   implementar FNV-1a + deriveSeed(el)
REFACTOR: None
VERIFY:  pnpm vitest run src/components/primitives/whiteboard/seed.test.ts
```

#### Acceptance Criteria
- [ ] 3 testes verdes
- [ ] Hash é deterministic + 32-bit signed

#### DoD
- [ ] Implementação + testes

---

### T2.2 — `renderShape` para `rect`, `ellipse`, `diamond`

#### Objective
Função pura que recebe um element + RoughGenerator e retorna um `<path>` SVG (ou grupo) com o look hand-drawn.

#### Evidence
- rough.js API: `rough.generator()` → `gen.rectangle(x,y,w,h,options)` → retorna `Drawable` com `sets[]` → conversão para SVG via `opsToPath(opSet)`.
- Para diamond: rough.js não tem `diamond` nativo. Usar `gen.polygon(points)` com 4 pontos.

#### Files to edit
```
src/components/primitives/whiteboard/render/shape.ts (NEW)            — renderRect, renderEllipse, renderDiamond
src/components/primitives/whiteboard/render/shape.test.ts (NEW)       — snapshot SVG por tipo (com seed fixo)
src/components/primitives/whiteboard/render/rough-to-svg.ts (NEW)     — opsToPath helper (extraído da doc do rough.js)
```

#### Deep Dives
- `RoughGenerator` é singleton por scene. Criar uma vez por render.
- **Snapshot testing**: usar `vitest`'s `expect(svg).toMatchSnapshot()` com seed fixo (seed=42) — garante reproducibility.
- Label dentro de shape: SVG `<text>` separado, posicionado no centro do bounding box.

#### TDD
```
RED:     test_renderRect_outputs_path_with_d_attribute()
RED:     test_renderRect_snapshot_with_seed_42()
RED:     test_renderEllipse_snapshot_with_seed_42()
RED:     test_renderDiamond_uses_polygon_points()
RED:     test_renderShape_respects_strokeColor()
RED:     test_renderShape_includes_label_text_centered()
GREEN:   implementar 3 renderers + opsToPath
REFACTOR: extrair `renderLabel(x, y, w, h, label)` se duplicação aparecer
VERIFY:  pnpm vitest run src/components/primitives/whiteboard/render/shape.test.ts
```

#### Acceptance Criteria
- [ ] 3 tipos renderizam com seed determinístico
- [ ] Label centralizado funciona
- [ ] Stroke color respeita prop
- [ ] FillStyle (`hachure`, `solid`, etc.) respeita prop

#### DoD
- [ ] 6 testes verdes
- [ ] Snapshots commitados

---

### T2.3 — `renderLine` + `renderArrow`

#### Objective
Linhas e setas hand-drawn. Setas usam o cabeçalho de seta clássico do Excalidraw (V invertido).

#### Evidence
- rough.js `gen.line(x1,y1,x2,y2)` → drawable.
- Arrow head é geometria pura: dois segmentos formando um V a 25° do segmento principal, comprimento 15-20px relativo ao strokeWidth.

#### Files to edit
```
src/components/primitives/whiteboard/render/line.ts (NEW)
src/components/primitives/whiteboard/render/line.test.ts (NEW)
```

#### Deep Dives
- **Arrow head geometria:**
  ```ts
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headLen = 12 + strokeWidth * 2;
  const headAngle = Math.PI / 7; // ~25°
  const x1 = toX - headLen * Math.cos(angle - headAngle);
  const y1 = toY - headLen * Math.sin(angle - headAngle);
  const x2 = toX - headLen * Math.cos(angle + headAngle);
  const y2 = toY - headLen * Math.sin(angle + headAngle);
  // dois <line> de (toX,toY) → (x1,y1) e (toX,toY) → (x2,y2)
  ```
- **Label em arrow:** posicionar no midpoint, com pequeno offset perpendicular ao segmento.

#### TDD
```
RED:     test_renderLine_two_points()
RED:     test_renderArrow_horizontal_has_arrowhead_at_end()
RED:     test_renderArrow_diagonal_arrowhead_angle()
RED:     test_renderArrow_with_headStart_has_both_heads()
RED:     test_renderArrow_label_at_midpoint()
RED:     test_renderArrow_zero_length_does_not_crash() — EC-7 (from===to → sem NaN em atributos; head omitido)
RED:     test_renderArrow_short_segment_clamps_headLen() — EC-7 (headLen <= dist*0.4 quando dist<headLen)
GREEN:   implementar line + arrow + arrowHead helper
REFACTOR: extrair `arrowHeadGeometry(from, to, strokeWidth)` se reusável
VERIFY:  pnpm vitest run src/components/primitives/whiteboard/render/line.test.ts
```

#### Acceptance Criteria
- [ ] 5 testes verdes
- [ ] Arrow head matemática correta (verificar via assertion de ângulos)

#### DoD
- [ ] Tasks concluídas

---

### T2.4 — `renderText`

#### Objective
Renderizar `<text>` SVG com fonte hand-drawn (`Virgil` se disponível, senão fallback `Caveat` ou `Comic Sans`), align e size respeitados.

#### Evidence
- Excalidraw upstream usa `Virgil` (open source) como fonte hand-drawn.
- Para MVP, declarar a fonte como CSS `font-family` chain `"Virgil", "Caveat", "Comic Sans MS", cursive` — Whiteboard NÃO embute woff2; consumer pode self-host se quiser fidelidade total (documentado no RFC).

#### Files to edit
```
src/components/primitives/whiteboard/render/text.ts (NEW)
src/components/primitives/whiteboard/render/text.test.ts (NEW)
```

#### Deep Dives
- Multi-line: split por `\n`, emitir `<tspan dy="1.2em">` para cada linha.
- Align: `text-anchor` (`start`/`middle`/`end`).
- Coordenadas: `x, y` referem ao baseline do primeiro caractere; ajustar para baseline-aware via `dominant-baseline="hanging"` se desejado.

#### TDD
```
RED:     test_renderText_single_line()
RED:     test_renderText_multiline_uses_tspan()
RED:     test_renderText_multiline_center_align_each_tspan_has_x() — EC-9 (cada tspan precisa x={baseX}, não dx)
RED:     test_renderText_align_center_sets_text_anchor_middle()
RED:     test_renderText_respects_fontSize()
RED:     test_renderText_escapes_html_via_react() — XSS smoke (script tag em text)
GREEN:   implementar
REFACTOR: None
VERIFY:  pnpm vitest run src/components/primitives/whiteboard/render/text.test.ts
```

#### Acceptance Criteria
- [ ] 4 testes verdes
- [ ] Multi-line via `\n` funciona

#### DoD
- [ ] Tasks concluídas

---

### T2.5 — `renderFreedraw` com perfect-freehand

#### Objective
Converter `points: [x,y,pressure?][]` em um `<path>` SVG suave via `getStroke` do perfect-freehand → `svgPathFromStroke`.

#### Evidence
- `perfect-freehand` API: `getStroke(points, options)` → array de pontos perimétricos → converte para `d="M ... L ... Z"`.
- Boilerplate `svgPathFromStroke(points)` está documentado no README do perfect-freehand.

#### Files to edit
```
src/components/primitives/whiteboard/render/freedraw.ts (NEW)
src/components/primitives/whiteboard/render/freedraw.test.ts (NEW)
```

#### TDD
```
RED:     test_renderFreedraw_simple_stroke()
RED:     test_renderFreedraw_handles_pressure_when_provided()
RED:     test_renderFreedraw_snapshot_with_fixed_input()
RED:     test_renderFreedraw_two_points_produces_valid_path() — EC-8 (mínimo do schema; d= não vazio, sem NaN)
GREEN:   implementar
REFACTOR: None
VERIFY:  pnpm vitest run src/components/primitives/whiteboard/render/freedraw.test.ts
```

#### Acceptance Criteria
- [ ] 3 testes verdes
- [ ] Snapshot estável

#### DoD
- [ ] Tasks concluídas

---

### T2.6 — `renderScene` orchestrator

#### Objective
Compor todos os renderers em uma função que recebe `WhiteboardScene` e devolve `JSX.Element` (`<g>` com children).

#### Files to edit
```
src/components/primitives/whiteboard/render/scene.ts (NEW)
src/components/primitives/whiteboard/render/scene.test.ts (NEW)
```

#### Deep Dives
- Ordem de render = ordem do array `elements[]` (último por cima — z-order natural).
- Cada elemento ganha `<g data-element-id={id ?? index}>` para SVG export legível.

#### TDD
```
RED:     test_renderScene_handles_all_7_types_in_one_call()
RED:     test_renderScene_preserves_z_order()
RED:     test_renderScene_uses_derived_seed_when_not_provided()
GREEN:   implementar dispatch por type
REFACTOR: None
VERIFY:  pnpm vitest run src/components/primitives/whiteboard/render/scene.test.ts
```

#### Acceptance Criteria
- [ ] 3 testes verdes
- [ ] Cobertura render/ folder >= 90%

#### DoD
- [ ] Tasks concluídas

---

## Phase 3: Viewport (pan + zoom)

**Objective:** Adicionar pan (drag esquerdo + middle-click) e zoom (wheel) que atualizam o `viewBox` do `<svg>` raiz.

### T3.1 — Hook `useViewport` (camera state)

#### Objective
Estado interno `{x, y, zoom}` com handlers `pan(dx, dy)`, `zoomAt(clientX, clientY, delta)`, `reset()`, `fitTo(bbox)`.

#### Files to edit
```
src/components/primitives/whiteboard/viewport/use-viewport.ts (NEW)
src/components/primitives/whiteboard/viewport/use-viewport.test.tsx (NEW)
```

#### Deep Dives
- `useReducer` para state (mais previsível que múltiplos `useState`).
- `viewBox = "$(x) $(y) $(width/zoom) $(height/zoom)"`.
- `zoomAt(clientX, clientY, delta)`: zoom relativo ao ponto sob o cursor — fórmula clássica de "zoom to cursor".
- Clamps: `zoom` entre `[0.1, 8]` (mesmo do Excalidraw).

#### TDD
```
RED:     test_useViewport_initial_state()
RED:     test_useViewport_pan_updates_x_y()
RED:     test_useViewport_zoom_at_point_preserves_world_coords_under_cursor()
RED:     test_useViewport_zoom_clamps_min_max()
RED:     test_useViewport_reset_returns_to_initial()
RED:     test_useViewport_fitTo_centers_bbox()
GREEN:   implementar hook + reducer
REFACTOR: None
VERIFY:  pnpm vitest run src/components/primitives/whiteboard/viewport/use-viewport.test.tsx
```

#### Acceptance Criteria
- [ ] 6 testes verdes
- [ ] Zoom-to-cursor mantém coordenada do mundo sob o cursor (assertion de invariância)

#### DoD
- [ ] Tasks concluídas

---

### T3.2 — Event handlers no `<svg>` root

#### Objective
Plugar mouse/touch handlers ao `<svg>` para acionar `useViewport`.

#### Files to edit
```
src/components/primitives/whiteboard/viewport/viewport.tsx (NEW)
src/components/primitives/whiteboard/viewport/viewport.test.tsx (NEW)
```

#### Deep Dives
- **EC-2:** `onWheel` JSX **não** funciona para `preventDefault()` — React 18+ usa listener passivo por padrão. Solução obrigatória:
  ```tsx
  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const handler = (e: WheelEvent) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, -e.deltaY * 0.01); };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoomAt]);
  ```
- `onPointerDown` + `onPointerMove` + `onPointerUp`: drag-to-pan com botão esquerdo OU middle. Tracker `pointerId` para multi-touch correto.
- **EC-11:** `pointercancel` (system gesture, swipe-from-edge) precisa limpar state do drag — adicionar listener.
- Espaço: tecla `Space` mantida pressionada habilita pan com qualquer botão (modo "hand").
- Touch: pinch-to-zoom usando dois pointers (cálculo de distância delta).

#### TDD
```
RED:     test_viewport_wheel_zooms_in_at_cursor()
RED:     test_viewport_wheel_uses_native_addEventListener_with_passive_false() — EC-2 (verifica via spy em addEventListener)
RED:     test_viewport_drag_pans()
RED:     test_viewport_drag_started_outside_svg_does_not_pan() — EC-10
RED:     test_viewport_pointercancel_resets_drag_state() — EC-11
RED:     test_viewport_middle_click_drag_pans()
RED:     test_viewport_space_key_enables_pan_with_any_button()
RED:     test_viewport_touch_pinch_zooms() — verifica que dois pointers que se aproximam fazem zoom out
GREEN:   implementar handlers + state machine de pointer tracking
REFACTOR: extrair `usePointerTracking` se a state machine for >50 linhas
VERIFY:  pnpm vitest run src/components/primitives/whiteboard/viewport/viewport.test.tsx
```

#### Acceptance Criteria
- [ ] 5 testes verdes
- [ ] No-op em scroll quando cursor está fora do `<svg>`
- [ ] `event.preventDefault()` chamado em wheel para evitar scroll da página

#### DoD
- [ ] Tasks concluídas
- [ ] testing-library + happy-dom OK

---

## Phase 4: Composição final + a11y + stories

**Objective:** Compor schema + renderer + viewport no componente público `<Whiteboard>`, garantir acessibilidade, adicionar stories Ladle representativas.

### T4.1 — Substituir stub `whiteboard.tsx` pelo componente real

#### Files to edit
```
src/components/primitives/whiteboard/whiteboard.tsx           — substituir stub
src/components/primitives/whiteboard/whiteboard.test.tsx      — substituir smoke por testes integrados
```

#### Deep Dives
- Props finais:
  ```ts
  export interface WhiteboardProps {
    data: WhiteboardScene | unknown; // valida internamente se !== WhiteboardScene typed
    className?: string;
    initialZoom?: number;
    initialCenter?: [number, number];
    fitOnLoad?: boolean; // se true, fitTo(bounds of all elements) no mount
    onValidationError?: (errors: FormattedError[]) => void;
    "aria-label"?: string;
  }
  ```
- Internamente: `useViewport()`, `validateScene(data)` (no useMemo), `renderScene(scene)` (no useMemo).
- **EC-6:** `onValidationError` callback **nunca** é chamado no body do render ou dentro de `useMemo` (anti-pattern: causa "Cannot update a component while rendering" em StrictMode). Sempre via `useEffect`:
  ```tsx
  const validation = useMemo(() => validateScene(data), [data]);
  useEffect(() => {
    if (!validation.ok && onValidationError) onValidationError(validation.errors);
  }, [validation, onValidationError]);
  ```
- **EC-13/14:** `fitOnLoad` mede container via `getBoundingClientRect` dentro de `useEffect`, não no render (SSR-safe e evita primeiro paint com size 0).
- Render:
  ```tsx
  <svg viewBox={viewBox} className={cn("usetheo-whiteboard", className)} role="img" aria-label={ariaLabel ?? "Whiteboard diagram"} {...handlers}>
    <title>{ariaLabel ?? "Whiteboard diagram"}</title>
    {scene && <g>{renderScene(scene, generator)}</g>}
  </svg>
  ```
- **Fallback de validação inválida:** quando `validation.ok === false`, renderiza `<svg>` vazio com `data-whiteboard-state="invalid"` + `console.warn` em dev. Não silently no-op; não throws.

#### TDD
```
RED:     test_whiteboard_renders_valid_scene()
RED:     test_whiteboard_calls_onValidationError_when_invalid()
RED:     test_whiteboard_does_not_call_callback_during_render() — EC-6 (StrictMode + render twice)
RED:     test_whiteboard_invalid_data_renders_empty_svg_with_data_attr() — fallback de validação
RED:     test_whiteboard_pan_via_drag()
RED:     test_whiteboard_zoom_via_wheel()
RED:     test_whiteboard_rerenders_when_data_prop_changes() — EC-12
RED:     test_whiteboard_ssr_renders_static_svg() — EC-13 (renderToString sem window)
RED:     test_whiteboard_fitOnLoad_uses_effect_not_render() — EC-14
RED:     test_whiteboard_fitOnLoad_centers_content()
RED:     test_whiteboard_a11y_axe_clean()
GREEN:   implementar componente final
REFACTOR: split em sub-components se whiteboard.tsx >300 linhas
VERIFY:  pnpm vitest run src/components/primitives/whiteboard/whiteboard.test.tsx
```

#### Acceptance Criteria
- [ ] 6 testes verdes
- [ ] vitest-axe: 0 violations
- [ ] Cobertura `whiteboard.tsx` >= 85%

#### DoD
- [ ] Tasks concluídas

---

### T4.2 — Stories Ladle representativas

#### Files to edit
```
src/components/primitives/whiteboard/whiteboard.stories.tsx  — substituir story Empty por 5+ stories
```

#### Deep Dives
- Stories obrigatórias:
  1. `Empty` — scene vazia
  2. `Flowchart` — rect + diamond + arrows + text (caso clássico LLM)
  3. `Architecture` — boxes + ellipses + arrows com labels
  4. `Sketch` — só freedraw
  5. `MixedAll` — todos os 7 tipos
  6. `InvalidJSON` — demonstra onValidationError
- Cada story exporta `meta` com `title: "Primitives / Whiteboard"`.

#### Acceptance Criteria
- [ ] 6 stories visíveis em `pnpm dev` (Ladle)
- [ ] `pnpm ladle:build` verde

#### DoD
- [ ] Tasks concluídas

---

## Phase 5: Quality gates + docs alignment

**Objective:** Fechar todos os gates verdes, atualizar README/CLAUDE.md/architecture.md para refletir Whiteboard como Available (não mais Roadmap).

### T5.1 — README — seção `Engines (subpath imports)`

#### Files to edit
```
README.md                                                     — adicionar nova seção após "Component catalog"
scripts/sync-readme.ts                                        — extender para listar engines (se houver mais)
```

#### Deep Dives
- Texto da seção: explica que engines são subpath-imports separados, com peer-deps próprios. Lista Whiteboard como Available; Slide/SlideDeck/Diagram como Roadmap.
- Garantir que `validateReadmeDrift` não disparae (whitelist se necessário, ou texto sem backticks em nomes não exportados).

#### Acceptance Criteria
- [ ] Seção criada
- [ ] `validateReadmeDrift` verde

#### DoD
- [ ] Tasks concluídas

---

### T5.2 — CLAUDE.md + CHANGELOG — mover Whiteboard de Roadmap para Available

#### Files to edit
```
CLAUDE.md                                                     — tabela Roadmap muda status Whiteboard para "Available (v0.x)"
CHANGELOG.md                                                  — entry final em [Unreleased] consolidando Phase 0-5
docs/architecture.md                                          — nova seção "Engines (subpath)" descrevendo o padrão
```

#### Acceptance Criteria
- [ ] Tabela atualizada
- [ ] CHANGELOG cita o PR de finalização
- [ ] `pnpm quality:structure` verde

#### DoD
- [ ] Tasks concluídas

---

### T5.3 — RFC closure

#### Files to edit
```
docs/rfcs/0001-whiteboard.md                                  — status muda de Proposed para Implemented
docs/rfcs/0001-whiteboard.md                                  — preencher Consumer documentado com referência concreta
```

#### Acceptance Criteria
- [ ] Status = Implemented
- [ ] Consumer documented field preenchido (NÃO placeholder)

#### DoD
- [ ] Tasks concluídas
- [ ] **Se consumer não estiver concreto, BLOQUEAR merge** (D7 / CLAUDE.md TheoUI §Roadmap)

---

### T5.4 — Quality gates full chain

#### Files to edit
```
scripts/validate-bundle-size.ts                               — adicionar verificação EC-1 de bundle isolation
```

#### Tasks
1. **EC-1:** Estender `validate-bundle-size.ts` com check que falha se `dist/index.js` (barrel) contém strings `roughjs` ou `perfect-freehand`:
   ```ts
   // após o check de tamanho existente
   const barrel = readFileSync("dist/index.js", "utf-8");
   for (const forbidden of ["roughjs", "perfect-freehand"]) {
     if (barrel.includes(forbidden)) {
       throw new Error(`Bundle isolation regression: dist/index.js leaks ${forbidden}. Engine bundle must stay in dist/whiteboard/.`);
     }
   }
   ```
2. Adicionar teste do gate em `scripts/validate-bundle-size.test.ts` (se ainda não existir, ou inline em `validate-quality-gates.test`).
3. `pnpm quality:gates` end-to-end.
4. Resolver qualquer falha (mantra: "se falhar, conserta a causa raiz, não a gate").

#### Acceptance Criteria
- [ ] `pnpm format:check` verde
- [ ] `pnpm lint:ci` verde
- [ ] `pnpm typecheck` verde
- [ ] `pnpm test` verde (incluindo todos os whiteboard tests)
- [ ] `pnpm build` verde (gera `dist/whiteboard/`)
- [ ] `pnpm registry:build && pnpm registry:validate` verde
- [ ] `pnpm quality:structure` verde
- [ ] `pnpm quality:bundle` verde (baseline barrel **inalterado** **E** EC-1 check passa: `dist/index.js` sem roughjs/perfect-freehand)
- [ ] `pnpm quality:a11y` verde
- [ ] `pnpm ladle:build` verde (com 6 stories de Whiteboard)

#### DoD
- [ ] Todos os 10 gates verdes

---

## Phase 6: Dogfood QA (MANDATORY)

**Objective:** Validar que o Whiteboard funciona como um consumer real experienciaria: instala, importa via subpath, renderiza JSON gerado por LLM real.

### Execution

1. **Playground integration:** adicionar `playground/whiteboard-demo.tsx` que importa `import { Whiteboard } from "@theokit/ui/whiteboard"` (via path resolution local), passa um JSON gerado por uma LLM (Claude Sonnet, prompt: "produza um diagrama de arquitetura simples no formato `{version:1, width, height, elements:[]}` com 5-10 elementos"), valida que renderiza sem erros e parece correto visualmente.
2. **Self-pack install:** `pnpm pack && cd /tmp/install-test && pnpm init && pnpm add ../theo-ui/usetheo-ui-*.tgz roughjs perfect-freehand` — confirmar resolução do subpath.
3. **Browser smoke:** abrir `playground:build` em browser, exercitar pan+zoom em uma scene grande (50+ elementos), checar 60fps em devtools performance tab.

### Acceptance Criteria

- [ ] LLM-gerado JSON renderiza corretamente em playground (com print/screenshot anexo no PR)
- [ ] `pnpm pack` + install em `/tmp` → import funciona
- [ ] Pan+zoom suave (sem jank visível) em scene de 50 elementos
- [ ] Zero CRITICAL/HIGH issues novos
- [ ] axe DevTools (manual): 0 violations na story `MixedAll`

### If Dogfood Fails

1. Issues plan-caused: corrigir, voltar ao Phase 5.4, re-rodar dogfood.
2. Issues pré-existentes (de outros componentes): logar mas não bloquear.

---

## Coverage Matrix

| # | Gap / Requirement | Task(s) | Resolution |
|---|---|---|---|
| 1 | Whiteboard sair de Explorer status | T0.5, T5.2, T5.3 | RFC publicado + CLAUDE.md atualizado |
| 2 | Decisão SVG-or-Canvas pendente | ADR D1 + T2.* | SVG escolhido + implementado |
| 3 | Bundle isolation via subpath | T0.1, T0.2, T0.3 | sync-exports.ts ISOLATED_SUBPATHS + tsup entry + peerDeps opcionais |
| 4 | Não reinventar algoritmo (rough.js + perfect-freehand) | T2.2-T2.5 | Wrappers finos, libs externas fazem o trabalho |
| 5 | Apache-2.0 compatibilidade | T0.3 + RFC ADR D2 | Ambas libs MIT (compatível) |
| 6 | YAGNI gate (consumer documentado) | T5.3 | Bloqueador explícito para merge |
| 7 | JSON LLM-friendly | T1.1 + RFC ADR D4 | Schema próprio enxuto + Zod validation |
| 8 | Pan + zoom built-in | T3.1, T3.2 | useViewport + handlers |
| 9 | 7 tipos de elemento (rect, ellipse, diamond, line, arrow, text, freedraw) | T2.2-T2.5 | Cada tipo coberto por renderer + testes |
| 10 | A11y | T4.1 + T0.4 | role="img" + aria-label + axe testing |
| 11 | Quality gates inviolável | T5.4 | 10 gates verdes obrigatórios |
| 12 | Stories Ladle | T4.2 | 6 stories cobrindo casos reais |
| 13 | Snapshot tests reprodutíveis | T2.1 (seed determinístico) | FNV-1a hash → seed estável |
| 14 | Validation errors úteis para LLM | T1.2 | FormattedError com path + got + suggestion |
| 15 | Dogfood mandatório | Phase 6 | LLM-gerado JSON validado em playground |
| 16 | EC-1 bundle isolation regression | T5.4 | Gate script grep em `dist/index.js` por roughjs/perfect-freehand |
| 17 | EC-2 onWheel passive listener | T3.2 | addEventListener manual com `{passive:false}` |
| 18 | EC-3 NaN/Infinity em coords | T1.1 | `.finite()` em todos `z.number()` |
| 19 | EC-4 dimensões absurdas | T1.1 | `.max(20000)` em width/height + caps em strokeWidth/fontSize/text length/elements length |
| 20 | EC-5 Zod missing em runtime | T1.1 + T4.1 | Zod em `dependencies` reais do pacote (decisão opção A) |
| 21 | EC-6 callback durante render | T4.1 | Callback movido para `useEffect` |
| 22 | EC-7 a EC-14 (SHOULD TEST) | T2.3-T4.1 | 10 testes adicionais incorporados aos TDD cycles |

**Coverage: 22/22 (100%) — incluindo os 6 MUST FIX + 10 SHOULD TEST do edge-case-plan 2026-05-18**

## Global Definition of Done

- [ ] Phases 0-5 completas
- [ ] `pnpm quality:gates` verde (10 gates)
- [ ] Cobertura de `src/components/primitives/whiteboard/` ≥ 85% (linhas + branches)
- [ ] Zero `roughjs` ou `perfect-freehand` no bundle do barrel (`dist/index.js`)
- [ ] `dist/whiteboard/index.js` existe e funciona em consumer com peer-deps instalados
- [ ] RFC `0001-whiteboard.md` status = Implemented, com consumer concreto preenchido
- [ ] CHANGELOG entry final em `[Unreleased] > Added`
- [ ] CLAUDE.md Roadmap reclassifica Whiteboard como Available
- [ ] **Dogfood QA passa** (Phase 6) com screenshot/print de LLM-rendered scene anexo
- [ ] **Runtime-metric proof:** peer-deps **não** aparecem no `dist/index.js` barrel — confirmado via `grep -c "roughjs\|perfect-freehand" dist/index.js → 0` no PR. (Lesson from prior plans: "code exists + tests pass" não basta — precisa observar o output real.)

## Notas sobre escopo deliberadamente NÃO incluído

Para ancorar honestidade contra scope creep, registramos o que ficou de fora do MVP por decisão consciente:

- **Sem editor**: nenhum toolbar, sem drawing tools no UI, sem selection/drag/resize. View-only.
- **Sem undo/redo**: aplicável só a editor. Não cabe em view.
- **Sem persistência**: caller controla dados (passa via prop).
- **Sem collaboration / multiplayer**: completamente fora.
- **Sem library/components**: feature do Excalidraw para reusar shapes — não aplicável.
- **Sem embeddables (iframe, video, etc.)**: superfície de segurança grande, deferred.
- **Sem frames**: agrupamento visual ao estilo Excalidraw frames — deferred.
- **Sem grid/snap**: irrelevante para view.
- **Sem rotação por elemento (`angle`)**: deferred. Não comum em diagramas LLM.
- **Sem `boundElements` ou bindings entre arrow e shape**: aro arrow é independente; LLM emite coordenadas explícitas.
- **Sem export PNG nativo**: SVG é o formato. Quem quer PNG converte via canvas roundtrip externo.
- **Sem fontes embutidas**: CSS font-family chain. Consumer self-host se quiser fidelidade Virgil.
- **Sem virtualização para >5k elementos**: deferred até consumer pedir.

Cada item acima vira candidato a follow-up RFC se um consumer concreto pedir.
