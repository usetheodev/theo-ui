# Plan: `Slide` — view-only primitive (Markdown → themed surface, estilo Marp)

> **Version 1.1** (2026-05-19 — incorporates `/edge-case-plan` MUST FIX: validateSlide async, BANNED_TAG detection, aspectRatio guard, BOM strip, mdast-based multi-slide detection, frontmatter size cap). Edge case review: `.claude/knowledge-base/reviews/edge-cases/slide-view-primitive-edge-cases-2026-05-19.md`.

> **Version 1.0** — Entrega o primitive `Slide` em `@usetheo/ui/slide` como **view declarativo**: recebe uma string markdown (CommonMark + GFM + frontmatter YAML) e renderiza numa superfície temada com aspect-ratio fixo (default 16:9, 1280×720 lógico). Não é editor — sem toolbar, sem deck navigation, sem transições. Reusa `mdast-util-from-markdown` + `micromark-extension-gfm` + `mdast-util-to-hast` + `hast-util-sanitize` + `hast-util-to-jsx-runtime` (todos MIT). Subpath isolado de bundle, peer-deps opcionais, fora do barrel principal. Espelha o padrão entregue pelo `Whiteboard` (RFC 0001, 2026-05-18). Outcome esperado: agente do TheoCode/TheoKit emite `tool_call` com `{"type":"slide","markdown":"..."}` e a UI renderiza imediatamente, sem injeção XSS, com tema consistente.

## Context

**Estado em 2026-05-19:**
- Slide está em `Explorer (RFC)` no roadmap do TheoUI (`CLAUDE.md` linhas 131-148, entrada formalizada 2026-05-18). Decisões "parser stack", "frontmatter syntax", "theme inheritance", "isolation strategy" estavam **pendentes**.
- TheoUI tem 81 primitives + 21 composites no barrel + 1 engine isolada (Whiteboard) em `@usetheo/ui/whiteboard`. Bundle isolation é invariante: Whiteboard NÃO aparece em `dist/index.js`.
- `referencia/marp/` foi clonado para inspeção. Análise mecânica: contém apenas o workspace `website/` (não a engine `marpit`/`marp-core`). A engine real foi lida via WebFetch direto dos repos `marp-team/marpit` e `marp-team/marp-core`. **Marp React (`marp-team/marp-react`) está INACTIVE** — direct evidence de que redistribuir a engine completa como wrapper React não sobrevive.
- Pesquisa exaustiva concluída em `.claude/knowledge-base/reference/slide.md` (1089 linhas, 16 seções) — cobre Marpit, Marp Core, Marp website, Reveal.js (divergente), `mdast-util-from-markdown` (canonical). Identificados: 5 padrões convergentes, 5 divergentes, 12 edge cases com fonte, 6 anti-patterns, 3 cookbook snippets adaptados.

**Pivot de escopo (2026-05-19, alinhado com o usuário):**
O componente é **view-only single-slide**, focado em consumir markdown gerado por LLM e renderizar com tema. **Multi-slide markdown (contém top-level `---`) é validation error** — `<SlideDeck>` (composite futuro) orquestra N `<Slide>` separados. Decisões previamente pendentes foram travadas:

| Decisão | Travada |
| --- | --- |
| Parser | **micromark + mdast-util-from-markdown + mdast-util-gfm + mdast-util-to-hast + hast-util-sanitize + hast-util-to-jsx-runtime** (todos peer-deps opcionais) |
| Frontmatter syntax | **YAML only** (sem HTML comment syntax do Marpit — out of MVP) |
| Slide model | **Fixed 1280×720 lógico (16:9 default)**, escalado para container via algoritmo Reveal.js (CSS transform scale + ResizeObserver) |
| Theme system | **CSS variables sobre Violet Forge tokens**, dois temas built-in (`default`, `violet-forge`). Sem PostCSS runtime. |
| Mounting | **Normal DOM scoped por `.theo-slide`** (sem Shadow DOM no MVP; opt-in `isolate` prop em v0.2) |
| Output | **Real React VDOM** via `hast-util-to-jsx-runtime` (sem `dangerouslySetInnerHTML`) |

**Evidências concretas:**
- `pnpm view mdast-util-from-markdown license` → `MIT` (compatível Apache-2.0). Todas as deps escolhidas são MIT, verificadas no §4 e §16.4 de `slide.md`.
- Infraestrutura para subpath isolado **já existe** (gerada pelo Whiteboard):
  - `scripts/sync-exports.ts:65` define `ISOLATED_SUBPATHS` — basta adicionar `"./slide"`.
  - `tsup.config.ts:6-11` aceita múltiplas entries — basta adicionar `"slide/index": "src/components/primitives/slide/index.ts"`.
  - `scripts/baselines/bundle-sizes.json` já tem `tolerancePercent: 5` — adicionar `dist/slide/index.js` no commit final.
- `validate-quality-gates.ts:67-120` exige `<name>.tsx` + `index.ts` em cada pasta de `primitives/` — Slide segue este padrão.
- Marp Core's `default theme` (1280×720, padding 78.5px, font 29px) é a referência de canvas (`themes/default.scss:1`).
- `referencia/marp/website/components/Marp.tsx:1-182` é a única implementação real de "embed Marp slide in React" — usa Shadow DOM por causa do Tailwind do site. **Não copiamos esse padrão no MVP** (D6 abaixo).
- `referencia/marp/website/utils/markdown/renderer/sanitize.ts:1-11` é o sanitize schema usado pelo site — extende `defaultSchema` com `data*` allowlist e `clobberPrefix: ''`. **Não copiamos essa frouxidão** (D9 abaixo).

**Documento de referência:** `.claude/knowledge-base/reference/slide.md` (gerado por `/deep-reference Slide` em 2026-05-19). RFC `docs/rfcs/0002-slide.md` (T0.5) formaliza a entrada do componente no projeto, espelhando `0001-whiteboard.md`.

## Objective

**Done = `pnpm quality:gates` verde com o subpath `@usetheo/ui/slide` exportando um componente que renderiza markdown + frontmatter como surface temada single-slide, sem alterar o bundle baseline do barrel principal.** Especificamente:

1. `@usetheo/ui/slide` resolve para `dist/slide/index.js` próprio (não re-export do barrel) e funciona quando o consumer instala as 6 peer-deps de markdown opcionais.
2. Frontmatter YAML é extraído, validado via Zod (`SlideFrontmatter`), tipado, e tem mensagens de erro estruturadas para auto-correção LLM.
3. Markdown body é parseado (CommonMark + GFM), convertido para hast, sanitizado com `hast-util-sanitize.defaultSchema` (sem extensões em v0.1), convertido para React VDOM.
4. Multi-slide markdown (contém top-level `hr`/`---`) → emite `MULTIPLE_SLIDES` validation error, renderiza apenas o primeiro slide.
5. Conteúdo banido (`<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`) é strippado silenciosamente; `BANNED_TAG` validation error emitido via callback.
6. Container fit funciona: `ResizeObserver` mede o host, computa `scale = min(W/canvasW, H/canvasH)` clamped a `[minScale, maxScale]`, aplica via `transform: scale()` no inner container. Algoritmo idêntico ao Reveal.js (§14.2 do reference doc).
7. Dois temas built-in (`default`, `violet-forge`) shipam via CSS vars no namespace `--theo-slide-*`, layered sobre Violet Forge tokens.
8. A11y: `<section role="region" aria-roledescription="slide" aria-label={...}>` — zero axe violations no `quality:a11y` gate.
9. Bundle do barrel principal (`dist/index.js`) **inalterado** (±0% — Slide não entra em `src/index.ts`). Bundle do subpath (`dist/slide/index.js`) **abaixo de 30 KB gzip** sem peer-deps embutidas.
10. README, CHANGELOG, CLAUDE.md atualizados (status de Slide sai de "Roadmap/Explorer" para "Available").
11. RFC `docs/rfcs/0002-slide.md` published com consumer documentado (placeholder a ser preenchido antes de mergear; gating idêntico ao Whiteboard).
12. Dogfood QA via novo script `pnpm dogfood:slide` (mirror de `dogfood:whiteboard`).

## ADRs

### D1 — micromark + mdast/hast pipeline (não markdown-it/Marp Core)
- **Decisão:** Parser stack é `mdast-util-from-markdown` (tokenize via `micromark`) + `micromark-extension-gfm` + `mdast-util-gfm` + `mdast-util-to-hast` + `hast-util-sanitize` + `hast-util-to-jsx-runtime`. NÃO usamos `@marp-team/marp-core` nem `markdown-it` direto.
- **Rationale:** (a) Bundle: medição preliminar em `slide.md` §6 div. #1 estima micromark+utils ~25-30 KB gzip vs markdown-it ~50 KB; (b) Modular: cada utility é separadamente versionada e tem responsabilidade única — substituir o sanitizer ou o jsx-runtime é trocar uma dep; (c) AST tipado (mdast → hast) permite plugins futuros sem `.use(plugin)` API; (d) Marp React INACTIVE é evidência de que wrap-the-engine não sustenta; (e) micromark é mais novo, mantido ativamente pelo Titus Wormer (mesmo autor de remark/unified). Custo aceito: nosso código de pipeline precisa orquestrar 6 utilities em vez de chamar `marp.render()`.
- **Consequences:** Habilita: bundle menor, tree-shake real, tipos sólidos, ownership da pipeline. Constrange: 6 peer-deps a manter (semver convergente — todas no ecossistema unified/syntax-tree).

### D2 — Peer-deps opcionais para a markdown stack
- **Decisão:** Adicionar `mdast-util-from-markdown`, `mdast-util-gfm`, `micromark-extension-gfm`, `mdast-util-to-hast`, `hast-util-sanitize`, `hast-util-to-jsx-runtime`, `yaml` em `peerDependencies` + `peerDependenciesMeta.optional=true`. Em `devDependencies` para build/test locais.
- **Rationale:** Consumer que NÃO importa `@usetheo/ui/slide` não baixa nenhuma dessas. Consumer que importa, instala explicitamente — sinaliza intent. Mesmo princípio que motivou D2 do Whiteboard com roughjs/perfect-freehand. CLAUDE.md TheoUI §Roadmap exige: "Plan a subpath import with peer-dep opt-in".
- **Consequences:** Habilita: bundle isolation real. Constrange: README precisa documentar bloco de install (`pnpm add mdast-util-from-markdown mdast-util-gfm micromark-extension-gfm mdast-util-to-hast hast-util-sanitize hast-util-to-jsx-runtime yaml`); CI dev e usuários do barrel não pagam o custo.

### D3 — Subpath isolado com bundle próprio (não re-export do barrel)
- **Decisão:** `@usetheo/ui/slide` aponta para `./dist/slide/index.js`. Bundle separado emitido pelo tsup com entry `src/components/primitives/slide/index.ts`. Adicionado em `ISOLATED_SUBPATHS` do `sync-exports.ts`. NÃO entra em `src/index.ts`.
- **Rationale:** Reutiliza a infra criada para Whiteboard (`sync-exports.ts:65` já existe, `tsup.config.ts:6` já aceita múltiplas entries). Bundle separado garante que consumer do barrel não arrasta a stack markdown. O custo é uma entrada adicional em `ISOLATED_SUBPATHS` — auditável e padronizada.
- **Consequences:** Habilita: `quality:bundle` baseline do barrel permanece intacto. Constrange: tsup build ganha mais ~1s; baseline JSON ganha 1 entry (`dist/slide/index.js`).

### D4 — Frontmatter YAML único como directive syntax (sem HTML comments)
- **Decisão:** Directives são declaradas APENAS via YAML frontmatter (delimitado por `---` na primeira linha). NÃO suportamos `<!-- key: value -->` HTML comment syntax do Marpit em v0.1.
- **Rationale:** (a) Frontmatter é mais familiar para LLM (todo blog post tem); (b) HTML comments dentro de markdown são visualmente confusos e mais fáceis de errar no prompt; (c) Marpit's HTML comment foi historicamente um vetor de inconsistência (`directives.md` warning sobre repeated globals); (d) Single source-of-truth simplifica o sanitize layer. Spot directives (`_foo:`) ficam fora também — são per-slide-in-deck concerns que pertencem a `<SlideDeck>`.
- **Consequences:** Habilita: superfície menor de parsing, mais previsível, mais LLM-friendly. Constrange: usuários migrando de Marp precisam reescrever directives como frontmatter. Mitigação futura: helper `htmlCommentToFrontmatter(md)` se demanda aparecer.

### D5 — Multi-slide markdown (contém top-level `---`) é VALIDATION ERROR
- **Decisão:** Se o body markdown (depois de remover o frontmatter) contém um token `hr` no nível 0 (canonical Marpit slide split — `slide.md` §4.1 #3), `validateSlide` emite `{code: "MULTIPLE_SLIDES", path: [], ...}` e o renderizador devolve apenas o conteúdo ANTES do primeiro `hr`.
- **Rationale:** `<Slide>` é primitive single-slide por contrato. Multi-slide é `<SlideDeck>` (composite futuro). Aceitar multi-slide silenciosamente seria armadilha: tudo renderiza junto, sem separação visual, e o consumer não saberia. Marpit aceita `___`, `***`, `- - -` como split markers alternativos — em v0.1 detectamos APENAS canonical `---` (Q1 do reference doc fechada na direção mais estrita).
- **Consequences:** Habilita: contrato claro, callback de erro acionável (LLM pode self-correct fazendo split do lado do agente). Constrange: usuário que cola markdown Marp completo num `<Slide>` vê só o primeiro — documentado em JSDoc do prop `markdown`.

### D6 — Normal DOM scoped por `.theo-slide` (sem Shadow DOM no MVP)
- **Decisão:** Renderer monta no DOM normal. Scoping via classe `.theo-slide` + atributo `data-theo-slide-theme={themeName}`. Sem `attachShadow`.
- **Rationale:** (a) Violet Forge tokens são explicitamente designed para serem herdados (CSS vars no `:root`); (b) Shadow DOM quebra o `ThemeProvider` context do TheoUI; (c) Tailwind utility classes do host (`dark` etc.) DEVEM funcionar dentro do slide; (d) Marp website usa Shadow DOM porque o Tailwind do site colide com `.markdown-body` do Marp — nosso theme é nativo, não há colisão. Trade-off conhecido: se um consumer reportar CSS bleed, adicionamos prop `isolate` em v0.2 (opt-in Shadow DOM).
- **Consequences:** Habilita: tokens Violet Forge herdados sem ginástica, theme-provider context preservado, DevTools introspection nativa. Constrange: scoping deve ser disciplinado — toda regra do tema usa seletor com `.theo-slide` prefix.

### D7 — Fixed canvas + Reveal.js scale-to-fit via ResizeObserver
- **Decisão:** Slide tem canvas lógico fixo (default 1280×720, 16:9; configurável via `aspectRatio` prop). Container DOM externo é o host; inner container recebe `transform: scale(N)` calculado por hook `useSlideFit(ref, w, h)` que observa o host via `ResizeObserver` e computa `scale = clamp(min(W/cw, H/ch), minScale, maxScale)`.
- **Rationale:** Algoritmo lifted from Reveal.js (`reveal.js` `transformSlides`, ver `slide.md` §4.5 / §14.2). Razões: (a) Independência de tamanho do host — slide renderiza idêntico em 320×180 thumbnail ou 1920×1080 dashboard; (b) Layout interno usa pixel coordinates lógicos consistentes → tipografia previsível; (c) `transform: scale()` é GPU-accelerated, não dispara layout. Marp's auto-scaling (content-level via `::part(auto-scaling)`) é axis ortogonal — pode vir em v0.2.
- **Consequences:** Habilita: rendering consistente em qualquer container, zero coupling a aspect-ratio do host. Constrange: tipografia é nativa do canvas — usuário não pode usar `vw`/`vh` units (escalariam errado). Documentado em JSDoc.

### D8 — `hast-util-sanitize.defaultSchema` SEM extensões em v0.1
- **Decisão:** Sanitize schema é `hast-util-sanitize`'s `defaultSchema` sem nenhuma extensão de `tagNames` ou `attributes`. `clobberPrefix` mantém o default `"user-content-"`. Banned tags: `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`, `<style>`, `<link>` — tudo enforced pelo defaultSchema.
- **Rationale:** Marp website (`renderer/sanitize.ts:1-11`) estende com `data*` allowlist e desabilita `clobberPrefix` — escolhas conscientes para o caso deles, mas relaxam a barreira. Para um primitive que consome LLM output, o default estrito é o ponto de partida correto. Opt-in para `looseSlideSanitizeSchema` (com `figure`/`figcaption` adicionais) vem em v0.2 se um consumer pedir, com revisão de segurança explícita.
- **Consequences:** Habilita: superfície de ataque mínima, postura segura por default. Constrange: `<figure>` é strippado (não está em defaultSchema). Workaround imediato: usuário usa `<img>` nativo (que está no defaultSchema). Documentado em README + JSDoc.

### D9 — Real React VDOM via `hast-util-to-jsx-runtime` (não `dangerouslySetInnerHTML`)
- **Decisão:** Saída final é uma árvore React real via `hast-util-to-jsx-runtime` (passando `Fragment`, `jsx`, `jsxs` do `react/jsx-runtime`). Consumer pode opt-in overrides com prop `components?: Record<string, FC<any>>`.
- **Rationale:** (a) SSR-safe: React tree é serializável; `dangerouslySetInnerHTML` causa hydration mismatch sutil; (b) DevTools introspection — o tree aparece como nós React, não como string opaca; (c) Customização: consumer pode passar `components={{ pre: MyCodeBlock, table: MyTable }}` sem fork; (d) Mirror do Whiteboard precedent que retorna React tree puro. Custo: `hast-util-to-jsx-runtime` peer-dep, mas é pequeno (~3 KB).
- **Consequences:** Habilita: SSR sem hidratação quebrada, customização limpa, debug normal. Constrange: mais uma peer-dep (D2 cobre).

### D11 — `validateSlide` é async (sem caminho sync)
- **Decisão:** Signature pública é `validateSlide(markdown: string): Promise<ValidationResult>`. Sem variante sync. Dynamic imports de `yaml` e `mdast-util-from-markdown` (para multi-slide detection robusta — D12) são internos da função.
- **Rationale:** Tentar ser sync force ou (a) lazy import = quebra type-check; ou (b) hard import = vaza yaml/mdast para qualquer consumer que apenas validar (sem renderizar). Async é o caminho honesto. T4.1 já é async (useEffect + parseSlide), integração natural. Tests usam `await validateSlide(...)`.
- **Consequences:** Habilita: validation usa as MESMAS libs do parse, sem duplicação. Constrange: consumers chamando `validateSlide` em contexto puramente sync precisam `await` (ou adapt para `.then`). Documentado.

### D12 — Multi-slide detection via mdast (não regex)
- **Decisão:** Detectar splits multi-slide chamando `fromMarkdown(body)` e verificando se há `thematicBreak` no nível 0 do `Root.children`. Não usar regex `^---\s*$/m` (proposta inicial).
- **Rationale:** Regex dispara false-positive em `---` dentro de fenced code blocks — comum em slides educacionais que mostram YAML/markdown samples. mdast já distingue thematicBreak top-level de `---` literal em code. Custo: precisamos chamar parseBody. Mitigação: cachear o tree no ValidationResult e reusar no parse (parse stage não re-parseia).
- **Consequences:** Habilita: zero false-positive em code samples. Constrange: validateSlide depende de mdast-util-from-markdown (já é peer-dep, sem custo adicional). Detection assíncrona (D11 cobre).

### D13 — BANNED_TAG detection cheap-and-correct: tag-count diff pre/post sanitize
- **Decisão:** Em `parse.ts`, antes do sanitize, contar elementos por tagName via walk recursivo. Após sanitize, contar de novo. Diferença → emit `BANNED_TAG` errors no `ParsedSlide.errors[]`.
- **Rationale:** Detecção sem custos: walk é O(nodes), feito 2x no mesmo tree (já em memória). Plano original (T2.5) adiava para v0.2 com `opts.detectBanned` — mas T4.1 AC e Coverage Matrix #7 prometem o callback. Implementar agora reconcilia internamente.
- **Consequences:** Habilita: agent surfaces auto-corrigem (LLM vê `BANNED_TAG: script` e re-emite o markdown sem o script). Constrange: walk O(nodes) duplicado (negligível para slides típicos < 1k nodes).

### D14 — Input boundary guards: BOM, aspectRatio inválido, frontmatter size cap
- **Decisão:** Três guards de entrada explícitos:
  - Strip BOM (`﻿`) no início do markdown em `extractFrontmatter` (1 linha).
  - `aspectRatio` custom com `width<=0 || height<=0 || !Number.isFinite(...)` → fallback silencioso para 16:9 (não throw).
  - Raw frontmatter > 10 KB → `FRONTMATTER_TOO_LARGE` validation error antes de chamar `yaml.parse`.
- **Rationale:** Cada guard é trivial (1-3 linhas) e fecha um caso específico observado: BOM em paste from Word/Notion; consumer passa width=0 por cálculo derivado errado; LLM gera frontmatter gigante por loop. Boundaries do reference doc §10 confirmam: validar na entrada, depois confiar.
- **Consequences:** Habilita: zero surprise UX em casos comuns. Constrange: enum `SlideValidationErrorCode` ganha `FRONTMATTER_TOO_LARGE`. Tests adicionais.

### D10 — Slide fora do barrel `src/index.ts` E fora do census
- **Decisão:** Não adicionar `export { Slide } from "./components/primitives/slide/index.js"` no barrel. Slide não conta no badge `components-N` do README, não aparece no Census de `docs/architecture.md`, não passa por `validateAxeCoverage` (mas tem testes vitest-axe próprios — D11 abaixo deles está coberto na T4).
- **Rationale:** Idêntico ao D8 do Whiteboard. O barrel é o pacote "tudo junto"; engines com peer-deps pesadas (Whiteboard, Slide, futuras SlideDeck/Diagram) vivem em subpaths dedicados. CLAUDE.md §Roadmap exige: "do not include in the main barrel".
- **Consequences:** Habilita: census/badge estáveis, padrão consistente entre engines. Constrange: README precisa listar Slide na seção "Engines (subpath imports)" que o Whiteboard já criou; `validateReadmeDrift` whitelist (ou seção fora dos backticks que ele inspeciona) precisa estender para Slide.

## Dependency Graph

```
Phase 0 (tooling + scaffold + RFC)
    │
    ▼
Phase 1 (schema + frontmatter + validation)
    │
    ▼
Phase 2 (markdown pipeline: mdast → hast → sanitize → React)  ─┐
    │                                                          │ (Phase 2 e 3 paralelizáveis após 1)
    ▼                                                          │
Phase 3 (themes + container fit hook)                          │
    │                                                          │
    └──────┬─────────────────────────────────────────┬─────────┘
           ▼                                         ▼
       Phase 4 (composição final + a11y + stories)
           │
           ▼
       Phase 5 (quality gates + docs + RFC closure)
           │
           ▼
       Phase 6 (Dogfood QA — MANDATORY)
```

Annotations:
- **Phase 0** é blocker — tooling (sync-exports + tsup multi-entry + scaffold dir) precisa existir antes de qualquer código rodar.
- **Phase 1** é blocker para todo o resto (schema é compartilhado).
- **Phases 2 e 3 são paralelizáveis** após Phase 1 — duas pessoas podem trabalhar em paralelo (pipeline markdown ↔ themes/fit).
- **Phase 4** junta tudo (componente + stories) — requer 2 e 3 fechados.
- **Phase 5** roda gates finais e docs — requer 4.
- **Phase 6** é o gate final mandatório.

---

## Phase 0: Tooling + scaffold isolado

**Objective:** Wire subpath isolation, scaffold the slide directory, create the RFC and CHANGELOG entry. Zero rendering logic — purely infrastructure.

### T0.1 — Adicionar `./slide` em `ISOLATED_SUBPATHS` (sync-exports.ts)

#### Objective
Registrar o subpath isolado `@usetheo/ui/slide` em `scripts/sync-exports.ts` para que `pnpm sync:exports` emita o entry correto em `package.json#exports`.

#### Evidence
- `scripts/sync-exports.ts:65` já tem `ISOLATED_SUBPATHS` mapa (criado pelo Whiteboard, D3).
- Atualmente contém apenas `"./whiteboard"`. Slide segue padrão idêntico.
- `buildExports` (linha 96 do mesmo arquivo) já valida colisão com auto-scanned subpaths — confiável.

#### Files to edit
```
scripts/sync-exports.ts — adicionar entrada "./slide" no objeto ISOLATED_SUBPATHS
package.json — gerado automaticamente por `pnpm sync:exports` após edição
```

#### Deep file dependency analysis
- **`scripts/sync-exports.ts`** — hoje exporta o registry `ISOLATED_SUBPATHS` consumido por `validate-quality-gates.ts`. Adicionar entrada nova é mecanismo previsto; sem mudança estrutural.
- **`package.json#exports`** — output gerado. Será diff de uma linha (`"./slide": { types, import }`).
- **Downstream:** `validate-quality-gates.ts` aceita entradas em `ISOLATED_SUBPATHS` como exceções legítimas ao "barrel-only" check.

#### Deep Dives
- Estrutura do entry segue o shape de `./whiteboard` (TypeScript-derived path):
  ```ts
  "./slide": {
    types: "./dist/slide/index.d.ts",
    import: "./dist/slide/index.js",
  },
  ```
- Sem `require` field — pacote é ESM-only (`"type": "module"` em `package.json`).
- **Invariante:** chave em `ISOLATED_SUBPATHS` NÃO pode colidir com nome auto-scanned de primitive. Por isso o nome do directory em `src/components/primitives/slide/` deve ser `slide` (não plural).

#### Tasks
1. Adicionar entrada `"./slide"` em `ISOLATED_SUBPATHS` (sync-exports.ts:65-69 region).
2. Atualizar JSDoc do mapa caso necessário (mencionar Slide além de Whiteboard).
3. Rodar `pnpm sync:exports` — package.json deve ganhar entry `./slide`.
4. `pnpm registry:validate` permanece verde (engines isoladas não entram em registry).

#### TDD
```
RED:     scripts/sync-exports.test.ts (NEW or extend) — "ISOLATED_SUBPATHS contém ./slide com paths ./dist/slide/{index.d.ts,index.js}"
RED:     scripts/sync-exports.test.ts — "buildExports inclui ./slide quando ISOLATED_SUBPATHS tem ./slide"
GREEN:   adicionar entrada em ISOLATED_SUBPATHS
REFACTOR: None expected
VERIFY:  pnpm test && pnpm sync:exports && jq '.exports."./slide"' package.json
```

#### Acceptance Criteria
- [ ] `ISOLATED_SUBPATHS["./slide"]` definido em sync-exports.ts
- [ ] `package.json#exports."./slide"` aparece após `pnpm sync:exports`
- [ ] Pass: `pnpm test scripts/sync-exports.test.ts`
- [ ] Pass: `pnpm registry:validate`
- [ ] Pass: `pnpm typecheck`

#### DoD
- [ ] Todas as tasks completadas
- [ ] Tests verdes
- [ ] Zero biome warnings (`pnpm lint`)
- [ ] `pnpm quality:gates:fast` verde

---

### T0.2 — `tsup` emite bundle isolado `dist/slide/`

#### Objective
Adicionar entry `slide/index` em `tsup.config.ts` para que o build emita `dist/slide/index.js` + `dist/slide/index.d.ts` separados do barrel.

#### Evidence
- `tsup.config.ts:6-11` já tem entry `whiteboard/index`. Slide segue padrão idêntico.
- `external` em `tsup.config.ts:18` precisa ganhar as 7 markdown peer-deps para que NÃO sejam vendoradas no bundle isolado.

#### Files to edit
```
tsup.config.ts — adicionar entry "slide/index" + estender external com as 7 peer-deps de markdown
```

#### Deep file dependency analysis
- **`tsup.config.ts`** — hoje configura entries `index` + `whiteboard/index` + external de roughjs/perfect-freehand. Adicionar entry e externals novos é mecanismo previsto.
- **Downstream:** após próximo `pnpm build`, `dist/slide/index.js` existe. `validate-bundle-size.ts` precisa ser atualizado (T0.3) para incluir o novo arquivo no baseline.

#### Deep Dives
- Externals a adicionar:
  ```ts
  "mdast-util-from-markdown",
  "mdast-util-gfm",
  "micromark-extension-gfm",
  "mdast-util-to-hast",
  "hast-util-sanitize",
  "hast-util-to-jsx-runtime",
  "yaml",
  // já há: "react", "react-dom", "roughjs", /^roughjs\//, "perfect-freehand"
  ```
- Note que `react/jsx-runtime` é usado por `hast-util-to-jsx-runtime` mas já é coberto por `"react"` external (sub-import).
- **Invariante:** o bundle final `dist/slide/index.js` NÃO pode conter bytes literais de `mdast-util-*` ou `hast-util-*` ou `micromark-extension-gfm`. Verificado em T5.4 via grep.

#### Tasks
1. Adicionar entry `"slide/index": "src/components/primitives/slide/index.ts"` em tsup.config.ts.
2. Adicionar as 7 strings de external (lista acima).
3. Rodar `pnpm build` — `dist/slide/index.{js,d.ts}` deve existir; `dist/index.js` size deve permanecer no baseline (±5%).
4. Confirmar via `node -e 'import("./dist/slide/index.js").then(m=>console.log(Object.keys(m)))'` — deve imprimir exports do barrel `index.ts` da Slide (mesmo que stub no momento).

#### TDD
```
RED:     scripts/build-output.test.ts (NEW) — "after pnpm build, dist/slide/index.js exists and dist/slide/index.d.ts exists"
RED:     scripts/build-output.test.ts — "dist/slide/index.js does NOT contain literal 'mdast-util-from-markdown' source bytes (only import statement)"
GREEN:   editar tsup.config.ts; rodar build manualmente para validar
REFACTOR: None expected
VERIFY:  pnpm build && test -f dist/slide/index.js && test -f dist/slide/index.d.ts
```

#### Acceptance Criteria
- [ ] `dist/slide/index.js` existe após `pnpm build`
- [ ] `dist/slide/index.d.ts` existe após `pnpm build`
- [ ] `dist/index.js` size dentro do baseline ±5% (`pnpm quality:bundle`)
- [ ] Grep `mdast-util-from-markdown` em `dist/slide/index.js` retorna apenas import statement (não source bytes)
- [ ] Pass: `pnpm build`

#### DoD
- [ ] Todas as tasks completadas
- [ ] Build artifacts presentes
- [ ] Bundle baseline não regredido
- [ ] `pnpm quality:gates:fast` verde

---

### T0.3 — `package.json`: peerDependencies opcionais + bundle baseline + scripts

#### Objective
Declarar as 7 peer-deps de markdown como optional, adicionar `dist/slide/index.js` ao baseline de bundle, e criar script `dogfood:slide` espelhando `dogfood:whiteboard`.

#### Evidence
- `package.json#peerDependencies` já lista `react`, `react-dom`, `roughjs`, `perfect-freehand`. Padrão estabelecido.
- `package.json#peerDependenciesMeta` já marca roughjs/perfect-freehand como `{ "optional": true }`.
- `scripts/baselines/bundle-sizes.json` é o ground truth do `quality:bundle`. Update via `pnpm quality:bundle:update` ou edit manual + commit.
- `package.json#scripts.dogfood:whiteboard` é referência para `dogfood:slide`.

#### Files to edit
```
package.json — adicionar 7 peer-deps + optional metas + dogfood:slide script; estender quality:gates
scripts/baselines/bundle-sizes.json — adicionar entry "dist/slide/index.js" + "dist/slide/index.d.ts"
scripts/dogfood-slide.ts (NEW) — script de dogfood mirror de dogfood-whiteboard.ts
```

#### Deep file dependency analysis
- **`package.json`** — campo `peerDependencies` cresce de 4 para 11 entries. `peerDependenciesMeta` cresce equivalentemente. Campo `scripts.quality:gates` precisa estender com `&& pnpm dogfood:slide` no final.
- **`scripts/baselines/bundle-sizes.json`** — entries novos com valor inicial coletado após primeira build válida. Tolerance ±5% se aplica.
- **`scripts/dogfood-slide.ts`** — novo arquivo TS executável via tsx. Função: rodar um cenário canônico (renderizar 5 markdown samples) e validar via Playwright/happy-dom que o output é healthy.

#### Deep Dives
- Versões dos peer-deps a pinar (latest stable como de 2026-05):
  ```json
  "mdast-util-from-markdown": "^2.0.0",
  "mdast-util-gfm": "^3.0.0",
  "micromark-extension-gfm": "^3.0.0",
  "mdast-util-to-hast": "^13.0.0",
  "hast-util-sanitize": "^5.0.0",
  "hast-util-to-jsx-runtime": "^2.0.0",
  "yaml": "^2.0.0"
  ```
- **Invariante:** todas optional para que `pnpm install` de quem só usa o barrel não pague nada. Confirmado via `pnpm install --frozen-lockfile` em fixture vazia.

#### Tasks
1. Adicionar as 7 peer-deps em `package.json#peerDependencies`.
2. Marcar todas como optional em `peerDependenciesMeta`.
3. Adicionar entry `dogfood:slide` em `scripts`, apontando para `tsx scripts/dogfood-slide.ts`.
4. Estender `scripts.quality:gates` para incluir `&& pnpm dogfood:slide` (mantendo a ordem após `dogfood:whiteboard`).
5. Criar `scripts/dogfood-slide.ts` com 5 cenários markdown canônicos (happy path, GFM table, frontmatter completo, banned tag, multi-slide).
6. Rodar `pnpm build && pnpm quality:bundle:update` para registrar baselines iniciais; commit do diff.

#### TDD
```
RED:     scripts/dogfood-slide.test.ts (NEW) — "renders happy path markdown without errors"
RED:     scripts/dogfood-slide.test.ts — "emits MULTIPLE_SLIDES error for input with top-level ---"
RED:     scripts/dogfood-slide.test.ts — "strips <script> and emits BANNED_TAG"
GREEN:   implementar dogfood-slide.ts com os 5 cenários; passar testes
REFACTOR: extrair fixtures markdown para arquivo separado se >50 LOC inline
VERIFY:  pnpm dogfood:slide
```

#### Acceptance Criteria
- [ ] 7 peer-deps declaradas como optional em `package.json`
- [ ] `scripts.dogfood:slide` existe e roda sem erro de path
- [ ] `scripts/baselines/bundle-sizes.json` inclui `dist/slide/index.js` (e `.d.ts`)
- [ ] Pass: `pnpm install --frozen-lockfile` em fixture vazia (peer-deps não baixadas a menos que importadas)
- [ ] Pass: `pnpm quality:bundle`
- [ ] Pass: `pnpm dogfood:slide` (mesmo que cenários ainda stub no momento — exitar com 0 quando estiver completo na Phase 5)

#### DoD
- [ ] package.json válido (`jq . package.json`)
- [ ] Baseline JSON committado com diff visível no PR
- [ ] dogfood script existente e executável
- [ ] `pnpm quality:gates:fast` verde

---

### T0.4 — Scaffold `src/components/primitives/slide/`

#### Objective
Criar a estrutura de diretório esperada pelos validators (validate-quality-gates.ts:67-120 exige `<name>.tsx` + `index.ts`), com stubs vazios que apenas exportam tipos placeholder.

#### Evidence
- Whiteboard tree existente é referência canônica (`src/components/primitives/whiteboard/{whiteboard.tsx,index.ts,schema.ts,validate.ts,...}`).
- `validate-quality-gates.ts:67-120` exige pelo menos: `<name>.tsx` (componente), `index.ts` (barrel), `<name>.test.tsx` (test), `<name>.stories.tsx` (story).

#### Files to edit
```
src/components/primitives/slide/slide.tsx (NEW) — componente stub
src/components/primitives/slide/index.ts (NEW) — barrel
src/components/primitives/slide/schema.ts (NEW) — schema stub (preenchido em T1.1)
src/components/primitives/slide/validate.ts (NEW) — validator stub (preenchido em T1.2)
src/components/primitives/slide/parse.ts (NEW) — parser stub (preenchido em Phase 2)
src/components/primitives/slide/sanitize.ts (NEW) — schema sanitize stub (preenchido em T2.3)
src/components/primitives/slide/use-slide-fit.ts (NEW) — hook stub (preenchido em T3.1)
src/components/primitives/slide/themes/default.css (NEW) — theme stub
src/components/primitives/slide/themes/violet-forge.css (NEW) — theme stub
src/components/primitives/slide/slide.test.tsx (NEW) — test placeholder
src/components/primitives/slide/slide.stories.tsx (NEW) — story placeholder
```

#### Deep file dependency analysis
- **`slide.tsx`** — componente stub retorna `<section role="region">` vazia; será preenchido em T4.1.
- **`index.ts`** — barrel atual exporta apenas types do schema (em T1 preenchidos).
- **Todos os outros arquivos** — stubs vazios com TODO comments referenciando a task correspondente. Existência é o que importa para os gates.

#### Deep Dives
- Stub do componente:
  ```tsx
  // src/components/primitives/slide/slide.tsx (stub)
  import type { FC } from "react";
  export const Slide: FC<{ markdown: string }> = ({ markdown }) => {
    // TODO(T4.1): implementar parse + sanitize + render
    return <section role="region" aria-roledescription="slide">{markdown}</section>;
  };
  ```
- Stub do barrel:
  ```ts
  // src/components/primitives/slide/index.ts (stub)
  export { Slide } from "./slide.js";
  ```
- **Invariante:** stubs DEVEM type-check e DEVEM passar `validate-quality-gates.ts` antes de qualquer Phase posterior começar.

#### Tasks
1. Criar diretório `src/components/primitives/slide/` e `src/components/primitives/slide/themes/`.
2. Criar 11 arquivos stub com comentários TODO apontando para tasks futuras.
3. Garantir que cada arquivo TS compila (sem unused imports, sem `any` implícito).
4. Rodar `pnpm typecheck && pnpm lint` — verde.

#### TDD
```
RED:     src/components/primitives/slide/slide.test.tsx — "Slide renders without throwing" (apenas existência testa)
GREEN:   stub component renderiza markdown como texto bruto (placeholder)
REFACTOR: None expected — código real vem nas próximas phases
VERIFY:  pnpm test src/components/primitives/slide/slide.test.tsx
```

#### Acceptance Criteria
- [ ] Todos os 11 arquivos novos existem
- [ ] `pnpm typecheck` verde
- [ ] `pnpm lint` verde
- [ ] `pnpm quality:structure` reconhece `slide` como engine isolada
- [ ] Stories file existe e Ladle build não quebra

#### DoD
- [ ] Diretório scaffolded
- [ ] Imports resolvem
- [ ] `pnpm quality:gates:fast` verde

---

### T0.5 — RFC `docs/rfcs/0002-slide.md`

#### Objective
Formalizar a entrada do componente no projeto via RFC espelhando `0001-whiteboard.md` em estrutura.

#### Evidence
- Whiteboard precedent: `docs/rfcs/0001-whiteboard.md` (estrutura: Summary, Motivation, Decision com tabela de ADRs, JSON v1 schema, API, etc.).
- Roadmap entry em `CLAUDE.md` linha ~141 — Slide está como "Explorer (RFC)" — RFC é o que move para Available.

#### Files to edit
```
docs/rfcs/0002-slide.md (NEW) — RFC PROPOSED
docs/rfcs/README.md — adicionar linha apontando para 0002 (se README listar RFCs)
```

#### Deep file dependency analysis
- **`docs/rfcs/0002-slide.md`** — arquivo novo, segue template de 0001. Status inicial: PROPOSED. Vira IMPLEMENTED em T5.3.
- **`docs/rfcs/README.md`** — lista índice de RFCs; ganha entry.

#### Deep Dives
- Conteúdo do RFC herda da síntese deste plano (Context, Decision, ADRs D1-D10, API, Phases).
- Status table na primeira tabela do RFC:
  ```
  | Author | paulohenriquevn |
  | Date | 2026-05-19 |
  | Status | PROPOSED → IMPLEMENTED na T5.3 |
  | Subpath | `@usetheo/ui/slide` |
  | Plan | `.claude/knowledge-base/plans/slide-view-primitive-plan.md` |
  | Reference | `.claude/knowledge-base/reference/slide.md` |
  | Consumer documented | TODO (placeholder — bloqueia merge) |
  ```
- **Invariante:** RFC referencia o plano e o reference doc por path. Plano e RFC vivem em sync.

#### Tasks
1. Criar `docs/rfcs/0002-slide.md` com 10 seções (Status, Summary, Motivation, Decision/ADRs, Frontmatter schema, API, Out-of-scope, Risks, Rollout, References).
2. Atualizar `docs/rfcs/README.md` com entry para 0002.
3. Validar links internos (Markdown lint via biome ou manual).

#### TDD
```
RED:     scripts/validate-rfcs.test.ts (NEW or extend) — "0002-slide.md exists with Status field"
RED:     scripts/validate-rfcs.test.ts — "0002-slide.md references plans/slide-view-primitive-plan.md"
GREEN:   escrever o conteúdo do RFC
REFACTOR: None expected
VERIFY:  pnpm test scripts/validate-rfcs.test.ts (se existir validator)
```

#### Acceptance Criteria
- [ ] `docs/rfcs/0002-slide.md` exists com 10 seções preenchidas
- [ ] Status PROPOSED
- [ ] Referencia o plano por path absoluto
- [ ] Consumer placeholder marcado claramente como TODO
- [ ] `docs/rfcs/README.md` atualizado

#### DoD
- [ ] RFC criado
- [ ] Lint markdown verde
- [ ] PR review-ready com link explícito para reference doc

---

### T0.6 — `CHANGELOG.md` Unreleased entry

#### Objective
Adicionar entrada `[Unreleased] > Added` documentando o início do trabalho na Slide primitive.

#### Evidence
- Princípio inquebrável §6 do `/home/paulo/.claude/CLAUDE.md`: "Toda entry DEVE ter referência ao ticket/issue/PR entre parênteses".
- Whiteboard precedent: CHANGELOG ganhou entry no Phase 0 e foi atualizada no Phase 5 quando bateu IMPLEMENTED.

#### Files to edit
```
CHANGELOG.md — adicionar bullet em [Unreleased] > Added
```

#### Deep file dependency analysis
- **`CHANGELOG.md`** — formato Keep a Changelog. `[Unreleased]` é seção obrigatória. `Added` é categoria primária para feature nova.

#### Deep Dives
- Conteúdo:
  ```markdown
  ### Added
  - `<Slide>` view-only primitive at `@usetheo/ui/slide` (RFC 0002). Renders markdown + YAML frontmatter into a themed surface (16:9 default canvas, scale-to-fit container). Single-slide only — multi-slide input emits `MULTIPLE_SLIDES` validation error. Peer-deps opt-in: `mdast-util-from-markdown`, `mdast-util-gfm`, `micromark-extension-gfm`, `mdast-util-to-hast`, `hast-util-sanitize`, `hast-util-to-jsx-runtime`, `yaml`. (#TBD)
  ```
- **Invariante:** `(#TBD)` é placeholder; substituído por PR number quando PR for aberto.

#### Tasks
1. Editar `CHANGELOG.md` adicionando o bullet acima na seção `[Unreleased] > Added`.
2. Confirmar formato (Keep a Changelog) com snapshot test (se existir).

#### TDD
```
RED:     scripts/validate-changelog.test.ts (se existir) — "[Unreleased] Added contém menção a 'Slide primitive'"
GREEN:   adicionar a entrada
REFACTOR: None expected
VERIFY:  grep -A 3 "Unreleased" CHANGELOG.md | grep -i "slide"
```

#### Acceptance Criteria
- [ ] CHANGELOG.md atualizado em `[Unreleased] > Added`
- [ ] Entry inclui referência ao RFC 0002
- [ ] Entry inclui menção do subpath `@usetheo/ui/slide`
- [ ] Formato Keep a Changelog respeitado

#### DoD
- [ ] CHANGELOG diff visível no PR
- [ ] Sem placeholders TODO no texto principal (apenas `(#TBD)` é aceito)

---

## Phase 1: Schema + frontmatter + validation

**Objective:** Definir o schema Zod do frontmatter, escrever o extractor lightweight de frontmatter YAML, e criar o validator que retorna `Result<SlideInput, SlideValidationError[]>`.

### T1.1 — Zod schema `SlideFrontmatter` + `SlideInput`

#### Objective
Definir o schema Zod completo do frontmatter aceito por `<Slide>`, com discriminated unions onde aplicável, e o tipo `SlideInput` que une `{ frontmatter, body }`.

#### Evidence
- Whiteboard precedent: `src/components/primitives/whiteboard/schema.ts:1-60+` define `whiteboardScene` Zod schema com discriminated union por `type`.
- Reference doc §16.3 enumera os campos esperados: `theme?`, `lang?`, `color?`, `backgroundColor?`.
- D4 (Frontmatter-only) define os limites: sem spot directives, sem header/footer (deferidos a SlideDeck).

#### Files to edit
```
src/components/primitives/slide/schema.ts — preencher com Zod schema completo
```

#### Deep file dependency analysis
- **`schema.ts`** — agora stub; vira fonte de verdade do contrato de input.
- **Downstream:** `validate.ts` (T1.2), `parse.ts` (Phase 2), `slide.tsx` (Phase 4) importam tipos daqui.

#### Deep Dives
- Schema design:
  ```ts
  // src/components/primitives/slide/schema.ts (planned)
  import { z } from "zod";

  export const slideTheme = z.enum(["default", "violet-forge"]);

  const finiteNumber = z.number().finite();
  const cssColor = z.string().max(64); // sanity cap; validation de cores reais é CSS-level
  const langTag = z.string().regex(/^[a-z]{2,3}(-[A-Z]{2,4})?$/, "BCP-47 language tag").max(35);

  export const slideFrontmatter = z.object({
    theme: slideTheme.optional(),
    lang: langTag.optional(),
    color: cssColor.optional(),
    backgroundColor: cssColor.optional(),
  }).strict(); // unknown keys → validation error com path

  export type SlideFrontmatter = z.infer<typeof slideFrontmatter>;

  export const slideInput = z.object({
    frontmatter: slideFrontmatter,
    body: z.string().max(50_000), // sanity cap: 50KB markdown ≈ 30 slides worth de texto
  });
  export type SlideInput = z.infer<typeof slideInput>;
  ```
- **Invariantes:**
  - `frontmatter` sempre é objeto (mesmo que vazio `{}`). Frontmatter ausente do markdown vira `{}`.
  - `body` aceita até 50KB. Acima → `CONTENT_TOO_LARGE`.
  - `strict()` em frontmatter — qualquer key não declarada vira `INVALID_FRONTMATTER` com caminho específico.
- Edge cases tratados pelo schema:
  - `NaN`/`Infinity` em campos numéricos → bloqueado por `.finite()`.
  - Strings excessivamente longas em color → bloqueadas por `.max(64)`.
  - Theme não-enumerado → bloqueado por `slideTheme.enum()`.
  - Lang com formato errado → bloqueado por regex BCP-47.
  - Body vazio (`""`) é aceito — renderiza slide vazio com chrome (theme background).

#### Tasks
1. Implementar `slideFrontmatter` Zod schema.
2. Implementar `slideInput` Zod schema (compõe frontmatter + body).
3. Exportar tipos via `export type`.
4. Inline JSDoc com referência ao RFC 0002 §Frontmatter e ADR D4.

#### TDD
```
RED:     schema.test.ts — "valid frontmatter (theme: 'default') passes"
RED:     schema.test.ts — "unknown key in frontmatter fails with INVALID_FRONTMATTER path"
RED:     schema.test.ts — "theme not in enum fails"
RED:     schema.test.ts — "lang format invalid fails"
RED:     schema.test.ts — "body > 50000 chars fails with CONTENT_TOO_LARGE-shaped error"
RED:     schema.test.ts — "empty body is valid"
RED:     schema.test.ts — "NaN/Infinity in numeric fields fails (preempt future fields)"
GREEN:   escrever os schemas Zod
REFACTOR: Extrair primitivos compartilhados (`finiteNumber`, `cssColor`, `langTag`) para reuso futuro
VERIFY:  pnpm test src/components/primitives/slide/schema.test.ts
```

#### Acceptance Criteria
- [ ] `slideFrontmatter` é Zod schema com `.strict()`
- [ ] `slideInput` compõe frontmatter + body
- [ ] Todos os 7 tests do TDD verdes
- [ ] `pnpm typecheck` verde — tipos exportados pelo barrel (`index.ts`)
- [ ] Pass: code-audit complexity (cyclomatic ≤ 10 em `schema.ts`)
- [ ] Pass: code-audit size (≤ 200 linhas em `schema.ts`)

#### DoD
- [ ] Schema testado com 7+ casos
- [ ] Documentação inline com referências
- [ ] `pnpm quality:gates:fast` verde

---

### T1.2 — Frontmatter extractor + `validateSlide(input): Promise<Result>` (async — D11)

#### Objective
Escrever um extractor lightweight que separa `---\n...\n---\n<body>` do resto, parseia o YAML via `yaml` peer-dep, detecta multi-slide via mdast (D12), e expõe `validateSlide(markdown: string): Promise<ValidationResult>` (async — D11) que retorna `{ ok: true, input: SlideInput } | { ok: false, errors: SlideValidationError[] }`. Aplica guards de entrada (D14): strip BOM, cap raw frontmatter size 10 KB.

#### Evidence
- Whiteboard precedent: `validate.ts:1-80` retorna shape similar (`{ok, scene} | {ok:false, errors[]}`).
- Marpit's frontmatter parsing tem "loose mode" — silenciosamente aceita malformed. Decidimos contra (D5 do reference doc §6): emitimos `INVALID_FRONTMATTER` via callback.
- Reference doc §10 lista vetor: "Frontmatter injection" — usar `yaml.parse()` (safe schema), nunca `yaml.parseDocument()` com schema custom.

#### Files to edit
```
src/components/primitives/slide/validate.ts — preencher
src/components/primitives/slide/frontmatter.ts (NEW) — extractor helper
```

#### Deep file dependency analysis
- **`frontmatter.ts`** — função pura `extractFrontmatter(md): { rawFrontmatter: string | null, body: string }`. Regex no início do markdown.
- **`validate.ts`** — depende de `frontmatter.ts` + `schema.ts`. Orquestra: extract → yaml parse → zod validate → multi-slide detection → return Result.
- **Downstream:** `slide.tsx` chama `validateSlide(markdown)` em useEffect (não em render — mirror Whiteboard EC-6).

#### Deep Dives
- Extractor com BOM strip (D14):
  ```ts
  // frontmatter.ts
  const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const MAX_RAW_FRONTMATTER = 10240; // 10 KB cap — D14
  export function extractFrontmatter(md: string): {
    rawFrontmatter: string | null;
    body: string;
    tooLarge?: boolean;
  } {
    const normalized = md.startsWith("﻿") ? md.slice(1) : md; // EC-4 / D14
    const match = FRONTMATTER_RE.exec(normalized);
    if (!match) return { rawFrontmatter: null, body: normalized };
    const raw = match[1];
    if (raw.length > MAX_RAW_FRONTMATTER) {
      return { rawFrontmatter: raw, body: match[2], tooLarge: true };
    }
    return { rawFrontmatter: raw, body: match[2] };
  }
  ```
- Multi-slide detection via mdast (D12 — substitui regex):
  ```ts
  // validate.ts
  async function detectMultiSlide(body: string): Promise<{
    multi: boolean;
    firstSlideBody: string;
    cachedTree?: import("mdast").Root;
  }> {
    const { fromMarkdown } = await import("mdast-util-from-markdown");
    const tree = fromMarkdown(body); // sem GFM aqui; só thematicBreak detection
    const hrIdx = tree.children.findIndex((n) => n.type === "thematicBreak");
    if (hrIdx === -1) return { multi: false, firstSlideBody: body, cachedTree: tree };
    // Multi-slide: extract first slide body (string slice por position).
    const firstHr = tree.children[hrIdx];
    if (!firstHr.position) return { multi: true, firstSlideBody: body }; // fallback
    const offset = firstHr.position.start.offset ?? body.length;
    return { multi: true, firstSlideBody: body.slice(0, offset) };
  }
  ```
- **Invariantes:**
  - Frontmatter ausente é OK — retorna `frontmatter: {}` (default).
  - Frontmatter presente mas YAML malformado → `INVALID_FRONTMATTER` com `path: []`, `got: rawFrontmatter`.
  - Frontmatter raw > 10 KB → `FRONTMATTER_TOO_LARGE` antes de invocar yaml (D14).
  - Body contém top-level `thematicBreak` (mdast — D12) → `MULTIPLE_SLIDES` com `path: []`. Render prossegue com `firstSlideBody`.
  - `yaml.parse` chamado com `{ strict: true }` quando disponível para fail-fast em dups.
  - **Signature async (D11)**: retorna `Promise<ValidationResult>`; callers (T4.1 useEffect) já são async.
  - **BOM (`﻿`) stripped** antes da regex (D14).

#### Tasks
1. Implementar `extractFrontmatter` em `frontmatter.ts` (função pura, sem deps externas).
2. Implementar `validateSlide` em `validate.ts`:
   - Calls `extractFrontmatter`.
   - Se `rawFrontmatter !== null`: lazy import `yaml` (`const yaml = await import("yaml")`). Parse.
   - Roda `slideFrontmatter.safeParse(parsed)`. Emite errors estruturados.
   - Detecta multi-slide em body.
   - Retorna Result.
3. Definir `SlideValidationError` interface e `SlideValidationErrorCode` union.
4. Exportar pelo barrel.

#### TDD
```
RED:     frontmatter.test.ts — "extractFrontmatter returns null for markdown without --- block"
RED:     frontmatter.test.ts — "extractFrontmatter splits frontmatter and body correctly"
RED:     frontmatter.test.ts — "handles CRLF line endings"
RED:     frontmatter.test.ts — "strips leading BOM before regex match" (EC-4 / D14)
RED:     frontmatter.test.ts — "returns tooLarge:true when raw frontmatter > 10240 chars" (EC-10 / D14)
RED:     frontmatter.test.ts — "missing closing --- → rawFrontmatter:null, whole input as body" (EC-6)
RED:     validate.test.ts — "validateSlide is async (returns Promise)" (D11)
RED:     validate.test.ts — "validateSlide returns ok for markdown without frontmatter"
RED:     validate.test.ts — "validateSlide returns INVALID_FRONTMATTER for malformed YAML"
RED:     validate.test.ts — "validateSlide returns INVALID_FRONTMATTER for unknown key with path"
RED:     validate.test.ts — "validateSlide returns FRONTMATTER_TOO_LARGE for raw frontmatter > 10KB" (D14)
RED:     validate.test.ts — "validateSlide returns MULTIPLE_SLIDES for body containing top-level thematicBreak" (D12)
RED:     validate.test.ts — "validateSlide does NOT return MULTIPLE_SLIDES for --- inside fenced code block" (EC-5 / D12)
RED:     validate.test.ts — "validateSlide returns CONTENT_TOO_LARGE for body > 50KB"
RED:     validate.test.ts — "validateSlide attaches 'got' field for type mismatches"
GREEN:   implementar extractFrontmatter + validateSlide (async)
REFACTOR: Extrair tipo `SlideValidationError` para schema.ts (compartilhado com parse.ts)
VERIFY:  pnpm test src/components/primitives/slide/{frontmatter,validate}.test.ts
```

#### Acceptance Criteria
- [ ] `extractFrontmatter` é função pura, sync, sem deps; **strippa BOM** (D14)
- [ ] `validateSlide` é **async** (`Promise<ValidationResult>` — D11) e cobre os 7 códigos de erro: `INVALID_FRONTMATTER`, `MULTIPLE_SLIDES`, `CONTENT_TOO_LARGE`, `FRONTMATTER_TOO_LARGE` (D14), `BANNED_TAG`, `BANNED_ATTRIBUTE`, `INVALID_ASPECT_RATIO`
- [ ] Erros incluem `path[]`, `message`, `code`, `got?` quando relevante
- [ ] Multi-slide detection via **mdast `thematicBreak`** (D12) — fenced-code-block test passa
- [ ] `yaml` e `mdast-util-from-markdown` importados dinamicamente
- [ ] Pass: code-audit complexity (cyclomatic ≤ 10)
- [ ] Pass: code-audit coverage (≥ 90% em validate.ts)

#### DoD
- [ ] 9+ testes verdes
- [ ] Coverage ≥ 90%
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 2: Markdown pipeline (mdast → hast → sanitize → React)

**Objective:** Implementar a transformação puramente funcional do body markdown em uma árvore React renderizável, com sanitize estrito.

### T2.1 — `parseBody(body, opts)` — mdast + GFM

#### Objective
Função pura `parseBody(body: string, opts?)` que tokeniza markdown CommonMark+GFM via micromark e produz uma árvore mdast.

#### Evidence
- Cookbook §14.1 do reference doc tem o snippet completo.
- `mdast-util-from-markdown@2` aceita `{ extensions, mdastExtensions }`.
- GFM precisa de `micromark-extension-gfm()` E `mdast-util-gfm.gfmFromMarkdown()`.

#### Files to edit
```
src/components/primitives/slide/parse.ts — preencher seção parseBody
```

#### Deep file dependency analysis
- **`parse.ts`** — orquestra: parseBody (T2.1) → hastConvert (T2.3) → sanitize (T2.3) → toReact (T2.4).
- **Downstream:** `slide.tsx` chama `parseSlide(body)` no useEffect/useMemo.

#### Deep Dives
- Implementação:
  ```ts
  // src/components/primitives/slide/parse.ts (T2.1 fragment)
  import type { Root } from "mdast";

  export async function parseBody(body: string): Promise<Root> {
    const [{ fromMarkdown }, { gfmFromMarkdown }, { gfm }] = await Promise.all([
      import("mdast-util-from-markdown"),
      import("mdast-util-gfm"),
      import("micromark-extension-gfm"),
    ]);
    return fromMarkdown(body, {
      extensions: [gfm()],
      mdastExtensions: [gfmFromMarkdown()],
    });
  }
  ```
- **Invariantes:**
  - `parseBody` é async (dynamic import).
  - Nunca lança em input válido — retorna Root vazio se body for `""`.
  - Body com HTML raw já vem coberto por sanitize (T2.3) — nunca confiar no parser.

#### Tasks
1. Adicionar `parseBody` em `parse.ts`.
2. Lazy imports (mdast-util-from-markdown, mdast-util-gfm, micromark-extension-gfm).
3. Inline tests no parse.test.ts.

#### TDD
```
RED:     parse.test.ts — "parseBody returns Root with 0 children for empty body"
RED:     parse.test.ts — "parseBody parses simple heading and paragraph"
RED:     parse.test.ts — "parseBody parses GFM table (mdast type 'table')"
RED:     parse.test.ts — "parseBody parses GFM strikethrough (mdast type 'delete')"
RED:     parse.test.ts — "parseBody parses autolink"
GREEN:   implementar parseBody
REFACTOR: None expected — função única, pequena
VERIFY:  pnpm test src/components/primitives/slide/parse.test.ts -t parseBody
```

#### Acceptance Criteria
- [ ] `parseBody` é async, retorna `Root` (mdast type)
- [ ] GFM tables, strikethrough, autolinks reconhecidos como tipos mdast específicos
- [ ] Pass: typecheck (mdast types importados corretamente)

#### DoD
- [ ] 5 tests verdes
- [ ] Lazy imports confirmados (não há `import mdast-util-from-markdown` top-level em `parse.ts`)

---

### T2.2 — `mdastToHast(tree)` — mdast → hast

#### Objective
Converter Root mdast em Root hast via `mdast-util-to-hast`, com `allowDangerousHtml: false`.

#### Evidence
- mdast-util-to-hast v13 é o canonical. WebFetch da [mdast-util-from-markdown README](https://github.com/syntax-tree/mdast-util-from-markdown) confirmou pipeline.
- `allowDangerousHtml: false` strippa HTML raw em mdast (e.g. `<script>foo</script>` literal no markdown).

#### Files to edit
```
src/components/primitives/slide/parse.ts — adicionar mdastToHast
```

#### Deep file dependency analysis
- **`parse.ts`** — função `mdastToHast(tree: Root): Promise<HastRoot>`. Sequencial com parseBody.

#### Deep Dives
- Implementação:
  ```ts
  async function mdastToHast(tree: MdastRoot): Promise<HastRoot> {
    const { toHast } = await import("mdast-util-to-hast");
    const hast = toHast(tree, { allowDangerousHtml: false });
    // toHast retorna Element | Root | Doctype | undefined; precisamos garantir Root.
    if (!hast || hast.type !== "root") {
      return { type: "root", children: hast ? [hast] : [] };
    }
    return hast;
  }
  ```
- **Invariantes:**
  - Output é sempre `{ type: "root", children: [...] }`.
  - HTML raw em mdast vira `<comment>` ou é dropped por `allowDangerousHtml: false`.

#### Tasks
1. Implementar `mdastToHast`.
2. Tests.

#### TDD
```
RED:     parse.test.ts — "mdastToHast converts mdast heading to hast h1 element"
RED:     parse.test.ts — "mdastToHast strips raw HTML when allowDangerousHtml: false"
RED:     parse.test.ts — "mdastToHast preserves GFM table → hast table"
GREEN:   implementar
REFACTOR: None expected
VERIFY:  pnpm test -t mdastToHast
```

#### Acceptance Criteria
- [ ] 3 tests verdes
- [ ] Raw HTML strippado deterministicamente

#### DoD
- [ ] Função testada
- [ ] `pnpm typecheck` verde

---

### T2.3 — `sanitize.ts` schema + `sanitizeHast(tree)` wrapper

#### Objective
Definir `slideSanitizeSchema` (defaultSchema sem extensões — D8) e função `sanitizeHast(tree)`.

#### Evidence
- D8 explícita: `defaultSchema` sem extensões. `clobberPrefix` mantém default `"user-content-"`.
- Marp website's sanitize.ts é o template **NEGATIVO** — fazemos o oposto (sem `data*`, sem `clobberPrefix: ''`).
- `hast-util-sanitize@5` ESM-only.

#### Files to edit
```
src/components/primitives/slide/sanitize.ts — preencher
src/components/primitives/slide/parse.ts — adicionar sanitizeHast helper
```

#### Deep file dependency analysis
- **`sanitize.ts`** — exporta schema.
- **`parse.ts`** — importa schema, chama hast-util-sanitize.

#### Deep Dives
- Implementação `sanitize.ts`:
  ```ts
  import { defaultSchema, type Schema } from "hast-util-sanitize";
  export const slideSanitizeSchema: Schema = { ...defaultSchema };
  // Sem extensões em v0.1. v0.2 pode adicionar looseSlideSanitizeSchema com figure/figcaption.
  ```
- `sanitizeHast` (em parse.ts):
  ```ts
  async function sanitizeHast(tree: HastRoot): Promise<HastRoot> {
    const { sanitize } = await import("hast-util-sanitize");
    const safe = sanitize(tree, slideSanitizeSchema);
    if (safe.type !== "root") return { type: "root", children: [safe] };
    return safe as HastRoot;
  }
  ```
- **Invariantes:**
  - `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`, `<style>`, `<link>` SEMPRE strippados.
  - **Detection ativa (D13)**: `collectTagCounts(tree)` walk recursivo conta elementos por `tagName` antes e depois do sanitize; a diff vira `BANNED_TAG` errors no orchestrator (T2.5).
  ```ts
  // sanitize.ts (D13 helper)
  export function collectTagCounts(tree: import("hast").Root): Map<string, number> {
    const counts = new Map<string, number>();
    const walk = (node: any) => {
      if (node.type === "element") counts.set(node.tagName, (counts.get(node.tagName) ?? 0) + 1);
      for (const child of node.children ?? []) walk(child);
    };
    walk(tree);
    return counts;
  }
  ```

#### Tasks
1. Implementar `slideSanitizeSchema`.
2. Implementar `sanitizeHast` em parse.ts.
3. Tests cobrindo cada banned tag.

#### TDD
```
RED:     sanitize.test.ts — "slideSanitizeSchema === defaultSchema (deep equal, no extensions)"
RED:     parse.test.ts — "sanitizeHast strips <script>"
RED:     parse.test.ts — "sanitizeHast strips <iframe>"
RED:     parse.test.ts — "sanitizeHast strips <object>"
RED:     parse.test.ts — "sanitizeHast strips <embed>"
RED:     parse.test.ts — "sanitizeHast strips <form>"
RED:     parse.test.ts — "sanitizeHast strips <input>"
RED:     parse.test.ts — "sanitizeHast strips <style>"
RED:     parse.test.ts — "sanitizeHast preserves <p>, <h1>, <a href>, <img src>, <code>, <pre>, <table>, <thead>, <tbody>, <tr>, <td>, <th>"
GREEN:   implementar
REFACTOR: None expected
VERIFY:  pnpm test src/components/primitives/slide/{sanitize,parse}.test.ts
```

#### Acceptance Criteria
- [ ] 9 tests verdes
- [ ] Schema sem extensões verificável por deep-equal contra defaultSchema importado
- [ ] Banned tags cobertos individualmente

#### DoD
- [ ] Coverage ≥ 95% em sanitize.ts (arquivo pequeno)
- [ ] `pnpm quality:gates:fast` verde

---

### T2.4 — `hastToReact(tree, components?)` — saída final

#### Objective
Converter hast Root em React tree via `hast-util-to-jsx-runtime`, com suporte a overrides via prop `components`.

#### Evidence
- D9 explícita: real React VDOM, sem `dangerouslySetInnerHTML`.
- `hast-util-to-jsx-runtime` requer `Fragment`, `jsx`, `jsxs` do `react/jsx-runtime`.

#### Files to edit
```
src/components/primitives/slide/parse.ts — adicionar hastToReact
```

#### Deep Dives
- Implementação:
  ```ts
  import { Fragment, jsx, jsxs } from "react/jsx-runtime";
  import type { ReactElement } from "react";

  async function hastToReact(
    tree: HastRoot,
    components?: Record<string, React.FC<unknown>>,
  ): Promise<ReactElement> {
    const { toJsxRuntime } = await import("hast-util-to-jsx-runtime");
    return toJsxRuntime(tree, {
      Fragment,
      jsx,
      jsxs,
      components,
    }) as ReactElement;
  }
  ```
- **Invariantes:**
  - Output é ReactElement renderizável.
  - `components` prop override por nome de tag (e.g. `{ table: MyTable }`).

#### Tasks
1. Implementar `hastToReact`.
2. Tests usando `@testing-library/react`.

#### TDD
```
RED:     parse.test.ts — "hastToReact renders <h1> from hast h1 element"
RED:     parse.test.ts — "hastToReact applies components override (pre)"
RED:     parse.test.ts — "hastToReact renders empty tree as empty fragment"
GREEN:   implementar
REFACTOR: None expected
VERIFY:  pnpm test -t hastToReact
```

#### Acceptance Criteria
- [ ] 3 tests verdes
- [ ] Override de component funciona

#### DoD
- [ ] Função testada
- [ ] Typecheck verde (assinatura compatível com React 18 jsx-runtime)

---

### T2.5 — `parseSlide(markdown, opts)` orchestrator

#### Objective
Função pública `parseSlide(markdown: string, opts?)` que orquestra a pipeline completa: extract → validate → parse body → mdast→hast → sanitize → React tree. Retorna `{ frontmatter, tree, errors }`.

#### Evidence
- Cookbook §14.1 mostra o orchestrator completo.
- Mirror do shape Whiteboard `validateScene` + `renderScene` combinados.

#### Files to edit
```
src/components/primitives/slide/parse.ts — adicionar parseSlide top-level
src/components/primitives/slide/index.ts — exportar parseSlide
```

#### Deep Dives
- Implementação:
  ```ts
  export interface ParsedSlide {
    frontmatter: SlideFrontmatter;
    tree: ReactElement;
    errors: SlideValidationError[];
    /** True if multi-slide detected and only first slide was rendered. */
    truncated: boolean;
  }

  export async function parseSlide(
    markdown: string,
    opts: { components?: Record<string, React.FC<unknown>> } = {},
  ): Promise<ParsedSlide> {
    const validation = validateSlide(markdown);
    const errors: SlideValidationError[] = [];
    let frontmatter: SlideFrontmatter = {};
    let body = markdown;
    let truncated = false;
    if (validation.ok) {
      frontmatter = validation.input.frontmatter;
      body = validation.input.body;
    } else {
      errors.push(...validation.errors);
      // For MULTIPLE_SLIDES, truncate to first slide.
      const multi = validation.errors.find((e) => e.code === "MULTIPLE_SLIDES");
      if (multi) {
        truncated = true;
        const { body: extracted } = extractFrontmatter(markdown);
        const split = extracted.split(/^---\s*$/m);
        body = split[0] ?? "";
      }
    }
    const mdastTree = await parseBody(body);
    const hastTree = await mdastToHast(mdastTree);
    // D13: detect banned tags via count diff pre/post sanitize.
    const preCount = collectTagCounts(hastTree);
    const safeTree = await sanitizeHast(hastTree);
    const postCount = collectTagCounts(safeTree);
    for (const [tag, before] of preCount) {
      const after = postCount.get(tag) ?? 0;
      if (after < before) {
        errors.push({
          code: "BANNED_TAG",
          path: ["body"],
          message: `Tag <${tag}> was stripped by the slide sanitizer.`,
          got: tag,
        });
      }
    }
    const tree = await hastToReact(safeTree, opts.components);
    return { frontmatter, tree, errors, truncated };
  }
  ```
- **Invariantes:**
  - Sempre retorna `ParsedSlide` (nunca lança). Erros vão em `errors[]`.
  - `tree` é sempre renderizável (pode ser fragment vazio).

#### Tasks
1. Implementar `parseSlide`.
2. Exportar via index.ts.
3. Tests integrados.

#### TDD
```
RED:     parse.test.ts — "parseSlide(simpleMd) returns frontmatter {} and tree with h1"
RED:     parse.test.ts — "parseSlide(mdWithFrontmatter) populates frontmatter correctly"
RED:     parse.test.ts — "parseSlide(invalidFrontmatter) returns errors[] with INVALID_FRONTMATTER"
RED:     parse.test.ts — "parseSlide(multiSlideMd) returns truncated: true and renders first slide only"
RED:     parse.test.ts — "parseSlide(mdWithScript) strips <script>, returns BANNED_TAG (when detection enabled)"
GREEN:   implementar
REFACTOR: Extrair detectBanned helper para arquivo separado se >30 LOC
VERIFY:  pnpm test src/components/primitives/slide/parse.test.ts
```

#### Acceptance Criteria
- [ ] 5+ tests integrados verdes
- [ ] `truncated` flag exposed
- [ ] `errors[]` shape estável e tipado
- [ ] Coverage ≥ 90%

#### DoD
- [ ] parseSlide é o entrypoint público do pipeline
- [ ] Exportado pelo barrel
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 3: Themes + container fit

**Objective:** Tema CSS layered sobre Violet Forge + hook de container fit.

### T3.1 — Hook `useSlideFit(ref, canvasW, canvasH, opts?)`

#### Objective
Hook React que observa o container via `ResizeObserver` e retorna `scale` clampado para uso em `transform: scale()`.

#### Evidence
- Cookbook §14.2 do reference doc tem o snippet completo.
- Algoritmo Reveal.js: `scale = clamp(min(W/cw, H/ch), minScale, maxScale)`.
- Whiteboard tem `viewport/use-pointer-pan.ts` + `viewport/use-viewport.ts` como precedent de hooks viewport.

#### Files to edit
```
src/components/primitives/slide/use-slide-fit.ts — preencher
src/components/primitives/slide/use-slide-fit.test.ts (NEW) — tests
```

#### Deep Dives
- Implementação (do cookbook):
  ```ts
  import { useEffect, useState, type RefObject } from "react";
  export function useSlideFit(
    ref: RefObject<HTMLElement>,
    canvasW: number,
    canvasH: number,
    opts: { minScale?: number; maxScale?: number } = {},
  ): number {
    const { minScale = 0.1, maxScale = 4 } = opts;
    const [scale, setScale] = useState(1);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const update = () => {
        const { width, height } = el.getBoundingClientRect();
        const raw = Math.min(width / canvasW, height / canvasH);
        setScale(Math.max(minScale, Math.min(raw, maxScale)));
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }, [ref, canvasW, canvasH, minScale, maxScale]);
    return scale;
  }
  ```
- **Invariantes:**
  - `scale > 0` sempre.
  - Clamp respeita `minScale` e `maxScale`.
  - Cleanup via `ro.disconnect()` no unmount.
  - Recomputa quando dimensões do canvas mudam (via deps do useEffect).

#### Tasks
1. Implementar o hook.
2. Tests com `ResizeObserver` mockado (`happy-dom` shimmed).

#### TDD
```
RED:     use-slide-fit.test.ts — "returns initial scale 1 before measurement"
RED:     use-slide-fit.test.ts — "computes scale = min(W/cw, H/ch) after first observation"
RED:     use-slide-fit.test.ts — "clamps scale to maxScale"
RED:     use-slide-fit.test.ts — "clamps scale to minScale"
RED:     use-slide-fit.test.ts — "recomputes when canvasW/canvasH change"
RED:     use-slide-fit.test.ts — "disconnects ResizeObserver on unmount"
GREEN:   implementar
REFACTOR: None expected
VERIFY:  pnpm test src/components/primitives/slide/use-slide-fit.test.ts
```

#### Acceptance Criteria
- [ ] 6 tests verdes
- [ ] ResizeObserver cleanup verificável
- [ ] Coverage ≥ 95%

#### DoD
- [ ] Hook testado com happy-dom
- [ ] Typecheck verde

---

### T3.2 — Themes CSS (`default.css` + `violet-forge.css`)

#### Objective
Definir CSS variables no namespace `--theo-slide-*`, layered sobre Violet Forge tokens. Dois temas built-in.

#### Evidence
- Marp Core's `default.scss` é o template de variables (`--h1-color`, `--header-footer-color`, com `light-dark()` para dark mode).
- TheoUI's Violet Forge expõe tokens em `src/styles/tokens.css` — adopt como base.

#### Files to edit
```
src/components/primitives/slide/themes/default.css (NEW)
src/components/primitives/slide/themes/violet-forge.css (NEW)
src/components/primitives/slide/themes/index.ts (NEW) — registry de temas
tsup.config.ts — adicionar onSuccess copy dos temas para dist/slide/themes/
```

#### Deep Dives
- `default.css`:
  ```css
  .theo-slide[data-theo-slide-theme="default"] {
    --theo-slide-canvas-width: 1280px;
    --theo-slide-canvas-height: 720px;
    --theo-slide-padding: 64px;
    --theo-slide-font-base: 28px;
    --theo-slide-font-family: var(--vf-font-family-sans);
    --theo-slide-color-text: light-dark(#1f2937, #f3f4f6);
    --theo-slide-color-bg: light-dark(#ffffff, #0f172a);
    --theo-slide-color-heading: light-dark(#0f172a, #f8fafc);
    --theo-slide-color-link: light-dark(#2563eb, #60a5fa);
    --theo-slide-color-code-bg: light-dark(#f1f5f9, #1e293b);
  }
  .theo-slide[data-theo-slide-theme="default"] h1 { font-size: 1.8em; }
  .theo-slide[data-theo-slide-theme="default"] h2 { font-size: 1.4em; }
  /* ... cobertura completa de p, ul, ol, blockquote, code, pre, table, etc. */
  ```
- `violet-forge.css`: paleta Violet Forge (purple gradient, hand-drawn-friendly).
- `themes/index.ts`:
  ```ts
  export const slideThemes = ["default", "violet-forge"] as const;
  export type SlideTheme = (typeof slideThemes)[number];
  ```
- **Invariantes:**
  - Toda regra usa seletor `.theo-slide[data-theo-slide-theme="..."]` para isolamento.
  - Sem dependência de CSS reset global — slide content controla próprio reset interno.

#### Tasks
1. Escrever `default.css` cobrindo todos os elementos HTML produzidos por hast (h1-h6, p, ul, ol, li, blockquote, code, pre, a, table, thead, tbody, tr, td, th, img, hr, em, strong, del, br, kbd, sub, sup).
2. Escrever `violet-forge.css` com paleta Violet Forge.
3. Criar `themes/index.ts` com registry.
4. Atualizar `tsup.config.ts` `onSuccess` para copiar `*.css` para `dist/slide/themes/`.
5. Adicionar entries em `package.json#exports` (via `sync-exports.ts` ISOLATED_SUBPATHS).

#### TDD
```
RED:     slide.test.tsx (integration) — "render <Slide theme='default'> applies data-theo-slide-theme='default'"
RED:     slide.test.tsx — "render <Slide theme='violet-forge'> applies data-theo-slide-theme='violet-forge'"
RED:     themes/themes.test.ts (NEW) — "slideThemes registry inclui 'default' e 'violet-forge'"
GREEN:   escrever CSS + registry
REFACTOR: Extrair tokens compartilhados (color, spacing) para `themes/base.css` se duplicação > 20 LOC entre temas
VERIFY:  pnpm test && pnpm build && test -f dist/slide/themes/default.css
```

#### Acceptance Criteria
- [ ] `dist/slide/themes/default.css` existe após build
- [ ] `dist/slide/themes/violet-forge.css` existe após build
- [ ] CSS cobre todos os elementos HTML que hast pode produzir (h1-h6, p, ul, ol, li, blockquote, code, pre, a, table, img, hr, em, strong, del, br)
- [ ] CSS usa `light-dark()` para dark mode (mirror Marp)
- [ ] `package.json#exports."./slide/themes/default.css"` existe

#### DoD
- [ ] CSS testado em story (T4.2)
- [ ] Build copies confirmados
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 4: Composição final + a11y + stories

**Objective:** Substituir o stub `slide.tsx` pelo componente real e criar stories Ladle representativas.

### T4.1 — Componente `<Slide>` real

#### Objective
Substituir o stub do T0.4 pelo componente final que orquestra parseSlide + useSlideFit + theme aplication + onValidationError callback.

#### Evidence
- Whiteboard `whiteboard.tsx:1-200` é o template (props shape, validation in useEffect, ARIA defaults).
- Reference doc §16.3 define a API pública.

#### Files to edit
```
src/components/primitives/slide/slide.tsx — substituir stub pelo componente real
src/components/primitives/slide/index.ts — exportar Slide + types
```

#### Deep Dives
- Estrutura do componente:
  ```tsx
  // src/components/primitives/slide/slide.tsx (final)
  import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
  import { parseSlide, type ParsedSlide } from "./parse.js";
  import { useSlideFit } from "./use-slide-fit.js";
  import { slideThemes, type SlideTheme } from "./themes/index.js";

  export type SlideValidationErrorCode =
    | "INVALID_FRONTMATTER"
    | "MULTIPLE_SLIDES"
    | "CONTENT_TOO_LARGE"
    | "BANNED_TAG"
    | "BANNED_ATTRIBUTE";

  export interface SlideValidationError {
    code: SlideValidationErrorCode;
    path: (string | number)[];
    message: string;
    got?: unknown;
  }

  export interface SlideProps {
    markdown: string;
    theme?: SlideTheme;
    aspectRatio?: "16:9" | "4:3" | { width: number; height: number };
    minScale?: number;
    maxScale?: number;
    onValidationError?: (errors: SlideValidationError[]) => void;
    components?: Record<string, React.FC<any>>;
    className?: string;
    "aria-label"?: string;
  }

  const ASPECT_PRESETS = {
    "16:9": { width: 1280, height: 720 },
    "4:3": { width: 960, height: 720 },
  };

  function resolveCanvas(ar: SlideProps["aspectRatio"]): { width: number; height: number; invalid?: boolean } {
    if (!ar || ar === "16:9") return ASPECT_PRESETS["16:9"];
    if (ar === "4:3") return ASPECT_PRESETS["4:3"];
    // D14: guard against zero/negative/NaN/Infinity in custom aspectRatio.
    if (ar.width <= 0 || ar.height <= 0 || !Number.isFinite(ar.width) || !Number.isFinite(ar.height)) {
      return { ...ASPECT_PRESETS["16:9"], invalid: true };
    }
    return ar;
  }

  export const Slide: React.FC<SlideProps> = ({
    markdown,
    theme = "default",
    aspectRatio = "16:9",
    minScale,
    maxScale,
    onValidationError,
    components,
    className,
    "aria-label": ariaLabel = "Slide",
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvas = useMemo(() => resolveCanvas(aspectRatio), [aspectRatio]);
    const scale = useSlideFit(containerRef, canvas.width, canvas.height, { minScale, maxScale });

    const [parsed, setParsed] = useState<ParsedSlide | null>(null);
    // EC-7: version counter prevents older parses from overwriting newer ones on rapid prop changes.
    const versionRef = useRef(0);
    useEffect(() => {
      const myVersion = ++versionRef.current;
      let cancelled = false;
      parseSlide(markdown, { components }).then((result) => {
        if (cancelled || myVersion !== versionRef.current) return;
        setParsed(result);
        if (result.errors.length > 0 && onValidationError) {
          onValidationError(result.errors);
        }
      });
      return () => { cancelled = true; };
    }, [markdown, components, onValidationError]);

    return (
      <div
        ref={containerRef}
        className={`theo-slide-host ${className ?? ""}`}
        data-theo-slide-host
        style={{ overflow: "hidden", display: "grid", placeItems: "center" }}
      >
        <section
          role="region"
          aria-roledescription="slide"
          aria-label={ariaLabel}
          className="theo-slide"
          data-theo-slide-theme={theme}
          style={{
            width: canvas.width,
            height: canvas.height,
            transform: `scale(${scale})`,
            transformOrigin: "center",
            background: "var(--theo-slide-color-bg, #fff)",
            color: "var(--theo-slide-color-text, #1f2937)",
            padding: "var(--theo-slide-padding, 64px)",
            fontFamily: "var(--theo-slide-font-family, sans-serif)",
            fontSize: "var(--theo-slide-font-base, 28px)",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {parsed?.tree ?? null}
        </section>
      </div>
    );
  };
  ```
- **Invariantes:**
  - `<section>` SEMPRE tem role=region + aria-roledescription=slide.
  - Errors são emitidos via callback no useEffect, NUNCA via throw em render (mirror EC-6 do Whiteboard).
  - Cancellation via `cancelled` flag previne setState após unmount.

#### Tasks
1. Implementar componente final.
2. Adicionar `useMemo` para `canvas` (evita recompute trivial).
3. Adicionar cleanup com `cancelled` flag.
4. Exportar do barrel.

#### TDD
```
RED:     slide.test.tsx — "renders <section role='region' aria-roledescription='slide'>"
RED:     slide.test.tsx — "renders heading from markdown input"
RED:     slide.test.tsx — "applies data-theo-slide-theme attribute"
RED:     slide.test.tsx — "calls onValidationError with MULTIPLE_SLIDES for multi-slide input"
RED:     slide.test.tsx — "calls onValidationError with INVALID_FRONTMATTER for malformed YAML"
RED:     slide.test.tsx — "strips <script> silently"
RED:     slide.test.tsx — "applies transform: scale based on container size"
RED:     slide.test.tsx — "respects components override"
RED:     slide.test.tsx — "uses default aspectRatio 16:9 → canvas 1280x720"
RED:     slide.test.tsx — "switches canvas to 4:3 → 960x720 when aspectRatio prop changes"
RED:     slide.test.tsx — "resolveCanvas returns 16:9 fallback for aspectRatio={width:0,height:0}" (EC-3 / D14)
RED:     slide.test.tsx — "resolveCanvas returns 16:9 fallback for negative/NaN aspectRatio" (EC-3 / D14)
RED:     slide.test.tsx — "rapid markdown prop changes resolve to latest input (version counter)" (EC-7)
RED:     slide.test.tsx — "calls onValidationError with BANNED_TAG for <script>" (EC-1 / D13)
RED:     slide.test.tsx — "does not setState after unmount (cancelled flag)"
RED:     slide.a11y.test.tsx (vitest-axe) — "no axe violations on rendered slide"
GREEN:   implementar
REFACTOR: extrair canvas/style logic se >30 LOC inline
VERIFY:  pnpm test src/components/primitives/slide/slide.test.tsx
```

#### Acceptance Criteria
- [ ] 12 tests verdes
- [ ] Zero axe violations
- [ ] ARIA: role + roledescription + label sempre presentes
- [ ] Coverage ≥ 90% em slide.tsx
- [ ] Pass: code-audit complexity ≤ 10
- [ ] Pass: code-audit size ≤ 300 linhas

#### DoD
- [ ] Componente testado
- [ ] A11y validado
- [ ] `pnpm quality:gates:fast` verde

---

### T4.2 — Stories Ladle representativas

#### Objective
Cobrir cenários canônicos no `slide.stories.tsx`: happy path, GFM, frontmatter completo, dark theme, edge cases (multi-slide, banned tag, invalid YAML), aspect 4:3.

#### Evidence
- Whiteboard `whiteboard.stories.tsx` é template.
- Reference doc §16.7 lista os 12 cenários esperados.

#### Files to edit
```
src/components/primitives/slide/slide.stories.tsx — substituir placeholder por stories reais
```

#### Deep Dives
- Stories planejadas (cada uma é um export):
  1. `HappyPath` — markdown simples com h1 + p + lista
  2. `GfmTable` — markdown com tabela GFM
  3. `WithFrontmatter` — `theme: violet-forge`, color, backgroundColor
  4. `VioletForgeTheme` — mesmo conteúdo, theme prop
  5. `AspectFourByThree` — `aspectRatio="4:3"`
  6. `MultiSlideTruncated` — input multi-slide, callback dispara
  7. `MalformedFrontmatter` — YAML inválido, callback dispara
  8. `BannedScript` — `<script>` no markdown, strippado
  9. `LongContent` — 500 chars de body, scale ajusta
  10. `CustomComponents` — `components={{ pre: MyPre }}`
  11. `SmallContainer` — host 320×180 → scale 0.25
  12. `LargeContainer` — host 1920×1080 → scale 1.5

#### Tasks
1. Escrever 12 stories.
2. Cada story tem comentário breve explicando o que testa visualmente.
3. Rodar `pnpm ladle:build` — sem erros.

#### TDD
```
RED:     stories existem mas não há TDD direto (stories são visual; testes a11y vão em slide.a11y.test.tsx).
GREEN:   escrever stories
REFACTOR: extrair fixtures markdown se >30 LOC por story
VERIFY:  pnpm ladle:build && pnpm quality:a11y
```

#### Acceptance Criteria
- [ ] 12 stories named e funcionais
- [ ] `pnpm ladle:build` verde
- [ ] `pnpm quality:a11y` (vitest-axe sobre ladle stories) verde
- [ ] Pelo menos 1 story para cada edge case do reference doc §12

#### DoD
- [ ] Stories renderizam em Ladle dev
- [ ] Axe coverage validada
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 5: Quality gates + docs + RFC closure

**Objective:** Atualizar README, CLAUDE.md, CHANGELOG, fechar o RFC, e rodar o quality:gates full chain.

### T5.1 — README — adicionar Slide à seção "Engines (subpath imports)"

#### Objective
Estender a seção criada pelo Whiteboard para incluir Slide.

#### Files to edit
```
README.md — adicionar Slide na lista de engines
scripts/sync-readme.ts — se necessário, adicionar whitelist
```

#### Deep Dives
- Conteúdo a inserir:
  ```markdown
  - **Slide** (`@usetheo/ui/slide`) — markdown → themed surface, 16:9 default, peer-deps opcionais (mdast/micromark/hast stack).
  ```

#### Tasks
1. Editar README.md.
2. Rodar `pnpm sync:readme` se necessário.

#### TDD
```
RED:     README contém "Slide" na seção "Engines"
GREEN:   editar
VERIFY:  grep -A 10 "Engines" README.md | grep -i slide
```

#### Acceptance Criteria
- [ ] README atualizado
- [ ] Engines section lista Slide e Whiteboard

#### DoD
- [ ] `pnpm sync:readme` verde se houver validator
- [ ] PR diff visível

---

### T5.2 — CLAUDE.md + CHANGELOG — mover Slide de Roadmap para Available

#### Files to edit
```
CLAUDE.md (TheoUI) — atualizar tabela Roadmap, mover Slide para "Available"
CHANGELOG.md — finalizar entry de [Unreleased] (já existe desde T0.6)
```

#### Tasks
1. Editar tabela Roadmap em `CLAUDE.md`.
2. Substituir `(#TBD)` no CHANGELOG pelo PR number quando PR for aberto.

#### Acceptance Criteria
- [ ] CLAUDE.md Roadmap mostra Slide como "Available"
- [ ] CHANGELOG entry final (com PR ref)

#### DoD
- [ ] Diffs visíveis no PR
- [ ] Aprovação cross-doc do reviewer

---

### T5.3 — RFC closure (`docs/rfcs/0002-slide.md` → IMPLEMENTED)

#### Files to edit
```
docs/rfcs/0002-slide.md — Status: PROPOSED → IMPLEMENTED; preencher Consumer documented
```

#### Tasks
1. Atualizar Status.
2. Preencher Consumer documented (placeholder até consumer real ser confirmado).
3. Validar links de plan + reference doc.

#### Acceptance Criteria
- [ ] Status: Implemented
- [ ] Consumer line preenchida (ou bloqueia merge)

#### DoD
- [ ] RFC fechado

---

### T5.4 — Quality gates full chain

#### Objective
Rodar `pnpm quality:gates` completo. Garantir os 11 gates verdes.

#### Tasks
1. `pnpm quality:gates`.
2. Investigar e corrigir qualquer regressão.
3. Confirmar baseline bundle update foi committado (T0.3 + atualizações pós-implementação).

#### Acceptance Criteria
- [ ] format:check verde
- [ ] lint:ci verde
- [ ] typecheck verde
- [ ] test verde (coverage total ≥ 85% em src/components/primitives/slide/)
- [ ] build emite dist/slide/{index.js,index.d.ts,themes/*.css}
- [ ] registry:build + validate verdes
- [ ] quality:structure verde
- [ ] quality:bundle dentro do baseline
- [ ] quality:a11y verde (axe sobre stories)
- [ ] ladle:build verde
- [ ] dogfood:whiteboard verde (não regredido)
- [ ] dogfood:slide verde (preenchido em T0.3)

#### DoD
- [ ] Todos os 12+ gates verdes
- [ ] CI verde no PR

---

## Phase 6: Dogfood QA (MANDATORY)

> This phase runs AFTER all implementation phases are complete. The plan is NOT done until dogfood passes.

**Objective:** Validate that the implemented `<Slide>` works as a real user would experience it.

### Execution

1. Rodar `pnpm dogfood:slide` (cenários estruturados — T0.3).
2. Rodar manual smoke em Ladle (`pnpm dev`) — abrir cada story e inspecionar:
   - Visualização correta em light + dark mode.
   - Container resize adapta scale.
   - Callback `onValidationError` registra erros no console em stories de edge case.
   - GFM table renderiza com tabela semântica (verificar DOM via DevTools).
   - Banned tag strip em story `BannedScript` (verificar HTML resultante).
3. Smoke em playground (`pnpm playground`) com 1 markdown LLM real (e.g. ChatGPT/Claude output emitindo um slide).

### Acceptance Criteria

- [ ] `pnpm dogfood:slide` exit 0
- [ ] Todas as 12 stories renderizam visualmente OK em Ladle
- [ ] Light + dark mode validados manualmente
- [ ] Zero CRITICAL issues introduzidos
- [ ] Zero HIGH issues nas superfícies modificadas (slide.tsx, parse.ts, schema.ts)
- [ ] Pre-existing issues documentados como pre-existentes

### If Dogfood Fails

1. Identificar issues causados por este plano vs pre-existentes.
2. Fix plan-caused CRITICAL e HIGH antes de declarar complete.
3. Re-rodar `pnpm dogfood:slide` + ladle smoke.
4. Pre-existing issues são logados mas NÃO bloqueiam o merge.

---

## Coverage Matrix

| # | Gap / Requirement | Task(s) | Resolution |
|---|---|---|---|
| 1 | Subpath isolation `@usetheo/ui/slide` sem inflar barrel | T0.1, T0.2, T0.3 | ISOLATED_SUBPATHS + tsup entry + bundle baseline |
| 2 | Peer-deps de markdown opcionais (7 packages) | T0.3 | peerDependencies + optional metas em package.json |
| 3 | Stack mdast/micromark/hast em vez de markdown-it | D1, T2.1-T2.4 | Pipeline implementada via 6 utilities unified-style |
| 4 | YAML frontmatter validado via Zod | D4, T1.1, T1.2 | slideFrontmatter strict schema + validateSlide |
| 5 | Multi-slide input é validation error | D5, T1.2, T4.1 | MULTI_SLIDE_RE detection + MULTIPLE_SLIDES code |
| 6 | Sanitize estrito (defaultSchema sem extensões) | D8, T2.3 | slideSanitizeSchema deep-equal defaultSchema |
| 7 | Banned tags sempre strippados | D8, T2.3 | 8 tags individualmente cobertas |
| 8 | Real React VDOM (sem dangerouslySetInnerHTML) | D9, T2.4 | hast-util-to-jsx-runtime |
| 9 | Container fit via ResizeObserver + scale transform | D7, T3.1, T4.1 | useSlideFit hook + transform: scale() inline style |
| 10 | Aspect-ratio configurável (16:9, 4:3, custom) | T4.1 | aspectRatio prop + resolveCanvas helper |
| 11 | Two themes built-in (default + violet-forge) | D6, T3.2 | CSS files + slideThemes registry |
| 12 | A11y: role=region + aria-roledescription | T4.1, T4.2 | Atributos sempre presentes + axe coverage |
| 13 | onValidationError callback estruturado | T1.2, T4.1 | SlideValidationError shape + useEffect emit |
| 14 | Stories Ladle representativas (12+) | T4.2 | 12 stories cobrindo happy + edge + theme |
| 15 | RFC 0002 formalizado | T0.5, T5.3 | RFC PROPOSED → IMPLEMENTED |
| 16 | CHANGELOG entry conforme Keep a Changelog | T0.6, T5.2 | [Unreleased] > Added |
| 17 | CLAUDE.md Roadmap atualizado | T5.2 | Slide: Explorer → Available |
| 18 | README seção Engines estendida | T5.1 | Engines lista Slide |
| 19 | Bundle baseline registra dist/slide/index.js | T0.3 | baselines/bundle-sizes.json estendido |
| 20 | dogfood:slide script existe e roda | T0.3, Phase 6 | scripts/dogfood-slide.ts + 5 cenários canônicos |
| 21 | Quality:gates passa 12 gates | T5.4 | full chain green |
| 22 | Dogfood QA mandatory passa | Phase 6 | manual + automated smoke |
| 23 | BANNED_TAG detection via tag-count diff (D13) | T2.3, T2.5, T4.1 | collectTagCounts pre/post sanitize → errors[] |
| 24 | validateSlide async (D11) | T1.2, T4.1 | Promise<ValidationResult> + integration em useEffect |
| 25 | Multi-slide via mdast thematicBreak (D12) | T1.2 | detectMultiSlide com fromMarkdown + tree.children check |
| 26 | Input guards: BOM strip + aspectRatio validation + frontmatter size cap (D14) | T1.2, T4.1 | extractFrontmatter strip BOM, resolveCanvas fallback, FRONTMATTER_TOO_LARGE error |
| 27 | Race-resistant re-parse com version counter (EC-7) | T4.1 | versionRef + check em .then() |

**Coverage: 27/27 requirements cobertos (100%)** — 22 originais + 5 derivados do edge-case review (EC-1/D13, EC-2/D11, EC-3/D14, EC-4/D14, EC-5/D12, EC-7).

## Global Definition of Done

- [ ] Phases 0-5 completas
- [ ] `pnpm quality:gates` verde (12 gates incluindo dogfood:whiteboard E dogfood:slide)
- [ ] Cobertura de `src/components/primitives/slide/` ≥ 85% (linhas + branches)
- [ ] Zero `mdast-util-*` / `hast-util-*` / `micromark-extension-*` no bundle do barrel (`dist/index.js`) — confirmado via `grep -c "mdast-util\|hast-util\|micromark-extension" dist/index.js → 0`
- [ ] `dist/slide/index.js` existe e abaixo de 30 KB gzip
- [ ] `dist/slide/themes/{default,violet-forge}.css` existem e copiados via tsup onSuccess
- [ ] RFC `0002-slide.md` Status = IMPLEMENTED com consumer concreto preenchido
- [ ] CHANGELOG entry final em `[Unreleased] > Added` com PR reference
- [ ] CLAUDE.md Roadmap reclassifica Slide como Available
- [ ] **Dogfood QA passa** (Phase 6) com screenshot/print de LLM-rendered slide anexo
- [ ] **Runtime-metric proof:** peer-deps **não** aparecem no `dist/index.js` barrel — confirmado via grep no PR. (Lesson from prior plans: "code exists + tests pass" não basta — precisa observar o output real.)

## Notas sobre escopo deliberadamente NÃO incluído

Para ancorar honestidade contra scope creep, registramos o que ficou de fora do MVP por decisão consciente (lista alinhada com §1 non-goals do reference doc):

- **Sem deck navigation, transitions, presenter mode** — `<SlideDeck>` (composite futuro, próprio RFC).
- **Sem editor / authoring surface** — view-only por design.
- **Sem export PDF/PPTX** — marp-cli faz; não competimos.
- **Sem math (KaTeX/MathJax)** — opt-in plugin em v0.2 se consumer pedir.
- **Sem Mermaid / diagrams** — futuro `<Diagram>` primitive separado (roadmap).
- **Sem Twemoji / emoji shortcodes** — defer.
- **Sem fitting headers (Marp's auto-scaling)** — content-level scaling diferente do container-fit; v0.2 se demandado.
- **Sem header/footer per-slide** — concerns de deck; vão para `<SlideDeck>`.
- **Sem heading divider directive** — concern de deck.
- **Sem spot directives (`_foo:`)** — concern de deck; D4 explicit.
- **Sem HTML comment syntax para directives** — D4 explicit; frontmatter only.
- **Sem `<style>` tag inline** — D8 strip por defaultSchema; opt-in `allowInlineStyle` em v0.2 com CSS sanitizer.
- **Sem Shadow DOM no MVP** — D6 explicit; opt-in `isolate` prop em v0.2.
- **Sem looseSlideSanitizeSchema** — D8 explicit; opt-in em v0.2 com review de segurança.
- **Sem custom theme registration por consumer** — apenas dois themes built-in. Custom themes via CSS override do consumer (com `data-theo-slide-theme="default"` + override de vars `--theo-slide-*`).
- **Sem virtualização para markdown gigante** — body capped a 50KB via schema (sanity).
- **Sem CommonMark extensions além de GFM** — sem footnotes (CommonMark spec extension), sem definition lists. Defer.
- **Sem syntax highlighting de code blocks** — código renderiza como `<pre><code>` sem highlighter. Opt-in em v0.2 via prop `codeHighlighter`.
- **Sem CVE audit do dep set** — Q5 do reference doc, blocked step antes do Phase 5 final.
- **Sem benchmark de performance** — Q4 do reference doc, nice-to-have v0.2.

Cada item acima vira candidato a follow-up RFC se um consumer concreto pedir.
