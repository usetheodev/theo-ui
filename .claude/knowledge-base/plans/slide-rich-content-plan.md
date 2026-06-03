# Plan: `Slide` rich content — Tier 1 (authoring richness) + Tier 2 (embedded primitives)

> **Version 1.1** (2026-05-19 — incorporates `/edge-case-plan` MUST FIX: plugin error isolation, peer-dep guard, sanitize-schema merge, MathML/SVG complete lists, marpit bg via ParsedSlide field, emoji ancestor check, backgroundImage cap). Edge case review: `.claude/knowledge-base/reviews/edge-cases/slide-rich-content-edge-cases-2026-05-19.md`.

> **Version 1.0** — Estende o `<Slide>` primitive (RFC 0002) e o `<SlideDeck>` composite (RFC 0003) com **conteúdo rico nível PowerPoint** sem reinventar parsers maduros. Tier 1 entrega GFM alerts/callouts, layouts pré-definidos via frontmatter, background images, headers/footers e pagination overlays — **zero peer-deps novas**. Tier 2 entrega syntax highlighting (shiki), math (KaTeX), Mermaid diagrams, Marpit-style `![bg]()` image directives e emoji shortcodes — **opt-in via plugin system** (cada plugin é peer-dep adicional). Arquitetura: extension point `<Slide plugins={[...]} components={{...}}>` que compõe mdast + hast transformers em ordem determinística. Outcome: agente LLM emite markdown rico (callouts, código colorido, fórmulas, fluxogramas) e o consumer obtém uma apresentação visualmente densa equivalente a Reveal.js + Marp Core, sem custo no bundle baseline.

## Context

**Estado em 2026-05-19:**
- Slide (RFC 0002, plan `slide-view-primitive-plan.md`) entrega CommonMark + GFM + frontmatter YAML. Pipeline: validateSlide → parseBody (micromark) → mdastToHast → sanitizeHast (defaultSchema, 8 banned tags) → hastToReact.
- SlideDeck (RFC 0003) orquestra N slides + navegação. Já shipa fragments via `*` lists.
- Conversa com o usuário em 2026-05-19 (após review visual do demo): o conteúdo "é só texto + tabela?". Resposta honesta: temos checkboxes, `<kbd>`, `<mark>`, `<details>`, listas, blockquotes, code blocks plain, imagens — tudo do defaultSchema do `hast-util-sanitize`. MAS visualmente nada disso explora o canvas (call-outs, layouts, backgrounds, math, diagrams, syntax highlight estão fora do MVP).
- Roadmap de tiers discutido com usuário (2026-05-19) — agora aprovado para implementação.

**Pivot de escopo (2026-05-19, decisão do usuário):**
Implementar Tier 1 + Tier 2 num único plan, com plugin architecture extensível. Decisões travadas:

| Decisão | Travada |
| --- | --- |
| Plugin system | **Explicit `plugins` prop** em `<Slide>` (e relayado via `<SlideDeck>` via plugin pass-through) — opt-in, não auto-detect |
| Alerts | **GFM alerts** (`> [!NOTE]` etc.) detectados via mdast post-process — zero parser dep nova |
| Layouts | **Frontmatter `layout: NAME`** → `data-theo-slide-layout` attribute + CSS grid templates |
| Background image | **Frontmatter `backgroundImage: "url(...)"`** com sanitize de URL + ![bg]() Marpit syntax (P5) |
| Header/Footer | **Frontmatter `header` / `footer`** → overlays absolutos |
| Pagination | **Frontmatter `paginate: true`** ativa SlideNumber por slide (deck-level já existe) |
| Syntax highlight | **Shiki** (HTML pre-rendered, melhor fidelidade que prismjs); lazy import + opt-in via `syntaxHighlightPlugin` |
| Math | **KaTeX** via `micromark-extension-math` + `mdast-util-math` + `katex` (peer-deps opcionais) |
| Mermaid | **mermaid** lib via custom `<MermaidDiagram>` component; lazy import; detecta ` ```mermaid ` no hast |
| Emoji | **Roll-our-own** map com 100 emojis comuns (sem dep) — twemoji em v0.4 se demanda |

**Evidências concretas:**
- `pnpm view shiki size` → `~600 KB` raw mas ESM com tree-shake de grammars → ~50 KB efetivos com 5-10 línguas. Lazy + on-demand grammar loading. Mais pesado que prismjs (~10 KB) mas TextMate-grade highlighting (melhor para apresentações).
- `pnpm view katex size` → `~280 KB` com fontes (CDN-only) ou `~70 KB` js + fontes via consumer.
- `pnpm view mermaid size` → `~370 KB` total mas vendora seu próprio parser; sem dep transitiva pesada. Lazy import obrigatório.
- `pnpm view @types/mdast` confirma que `Blockquote` mdast node já tem children fáceis de pattern-match para detectar `[!NOTE]` no primeiro `Text` token.
- GFM alerts são suportados por GitHub desde 2023; convenção estável. micromark-extension-gfm (já dep) parseia mas não distingue alerts de blockquotes regulares — pós-processamento mdast é necessário.
- Marpit `![bg]()` syntax: imagem em parágrafo com alt começando em `bg` é o sinal canonical (ver `referencia/marp/website/docs/guide/image-syntax.md`).
- Bundle isolation atual: `dist/index.js` (barrel) 328KB **inalterado** desde Slide; SlideDeck `48 KB`; Slide `13 KB`. Tier 1 deve adicionar **0 bytes** ao Slide bundle (apenas CSS + mdast walk inline). Tier 2 deve permanecer **0 bytes** no Slide bundle (peer-deps externalizados; plugins importados lazy).

**Documentos de referência:**
- `.claude/knowledge-base/reference/slide.md` (deep-reference do Slide, inclui §4.2 Marp Core features = nossa target list)
- `docs/rfcs/0002-slide.md` (Slide RFC com Non-goals do §6 que agora viram in-scope)
- `referencia/marp/website/docs/guide/{fragmented-list,image-syntax,theme,directives}.md` (Marpit conventions já lidas)

RFC `docs/rfcs/0004-slide-rich-content.md` (T0.5) formaliza a entrada destas features no projeto.

## Objective

**Done = `pnpm quality:gates` verde com `<Slide>` aceitando 5 features novas via frontmatter/markdown (Tier 1) + 4 plugins opt-in (Tier 2) sem regressão no bundle baseline do Slide nem do barrel.** Especificamente:

1. **GFM alerts** (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`) renderizam como `<aside class="theo-slide-alert" data-alert-type="...">` com ícone + título + texto, temados via CSS variables.
2. **Layout directives** (`layout: title | two-column | image-right | image-left | code-output | section`) aplicam CSS grid templates pré-definidos. Default = `default` (single column).
3. **Background image/gradient** via frontmatter (`backgroundImage`, `backgroundGradient`) sanitizada (sem `javascript:` / `data:` URLs) e Marpit `![bg](url)` syntax inline.
4. **Header/Footer overlays** via frontmatter (`header: "text"`, `footer: "text"`) renderizam como `<div>` absolutos top/bottom (respeitam padding do slide).
5. **Pagination overlay** ativado via frontmatter (`paginate: true`) — slide individual ganha indicator no canto. (Deck-level já existe em SlideDeck.)
6. **Plugin architecture** funcional: `<Slide plugins={[shikiPlugin, mathPlugin, mermaidPlugin, emojiPlugin]}>` aceita array tipado. Cada plugin é função `(opts) => SlidePlugin` com hooks `mdastTransform?`, `hastTransform?`, `components?`.
7. **Shiki plugin** (`@theokit/ui/slide/plugins/shiki`) — peer-dep opcional `shiki`. Detecta ` ```lang ` no mdast e injeta classes/spans estilo Shiki. Lazy: grammar do `lang` carregado on-demand.
8. **KaTeX plugin** (`@theokit/ui/slide/plugins/math`) — peer-deps opcionais `micromark-extension-math` + `mdast-util-math` + `katex`. Inline `$E=mc^2$` + block `$$ ... $$`.
9. **Mermaid plugin** (`@theokit/ui/slide/plugins/mermaid`) — peer-dep opcional `mermaid`. Detecta ` ```mermaid ` no hast e substitui por `<MermaidDiagram>` que renderiza SVG.
10. **Emoji plugin** (`@theokit/ui/slide/plugins/emoji`) — zero peer-deps. Substring replacement de 100 emoji shortcodes comuns (`:smile:`, `:rocket:`, `:check:`, etc.).
11. Bundle do barrel `dist/index.js` **inalterado**.
12. Bundle do Slide `dist/slide/index.js` **≤ 15 KB** (atual 13 KB; +2 KB para Tier 1 inline + plugin scaffolding).
13. Cada plugin sub-bundle (`dist/slide/plugins/{shiki,math,mermaid,emoji}/index.js`) **≤ 5 KB sem peer-deps embedded**.
14. README, CHANGELOG, CLAUDE.md, RFC 0004 atualizados.
15. Dogfood QA via novo script `pnpm dogfood:slide-rich` cobrindo 10+ cenários.
16. Playground demo ganha aba "Slide Rich" com cenas representativas de cada feature.

## ADRs

### D1 — Plugin system: explicit `plugins` prop, não auto-detect
- **Decisão:** `<Slide plugins={[...]}>` aceita array de funções `SlidePlugin`. Sem auto-detect via `require.resolve` ou similar. Cada plugin é importado pelo consumer e passado explicitamente.
- **Rationale:** Auto-detect cria comportamento condicional invisível (slide renderiza diferente dependendo se a peer-dep está no `node_modules`). Explicit é previsível, debuggable, e respeita o princípio de "consumer controla seu bundle".
- **Consequences:** Habilita: tipos sólidos, comportamento determinístico, lazy loading garantido. Constrange: consumer escreve `import { shikiPlugin } from "@theokit/ui/slide/plugins/shiki"; <Slide plugins={[shikiPlugin()]} />` — duas linhas extras vs auto-detect.

### D2 — Plugin shape: `{ mdastTransform?, hastTransform?, components? }`
- **Decisão:** Cada plugin retorna objeto com 3 hooks opcionais, todos async:
  ```ts
  interface SlidePlugin {
    name: string;  // for debugging
    mdastTransform?: (tree: MdastRoot) => Promise<MdastRoot> | MdastRoot;
    hastTransform?: (tree: HastRoot) => Promise<HastRoot> | HastRoot;
    components?: Record<string, React.FC<any>>;
  }
  ```
  `parseSlide` executa em ordem: validate → parseBody → for-each plugin.mdastTransform → mdastToHast → for-each plugin.hastTransform → sanitizeHast → hastToReact (com components merge).
- **Rationale:** Três pontos de inserção cobrem 100% dos casos: mdastTransform (math, mermaid AST injection), hastTransform (syntax highlight HTML injection), components (custom React renderers). Async em ambos permite lazy import de peer-deps dentro do plugin.
- **Consequences:** Habilita: composability total. Cada plugin auto-contained. Constrange: ordem de execução importa (e.g. shiki precisa rodar DEPOIS de sanitize? não — antes, para injetar spans estilizadas; mas mermaid precisa rodar DEPOIS de sanitize pra substituir o `<pre><code>`). Documentado em RFC 0004.

### D3 — GFM alerts via mdast post-process, sem dep nova
- **Decisão:** Detector inline no `parseSlide` (não em plugin) — alerts são CommonMark/GFM native. Walks `Blockquote` nodes; se primeiro `Paragraph > Text` matches `/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n?/i`, transforma em `<aside class="theo-slide-alert" data-alert-type="lower">` no hast.
- **Rationale:** GitHub Flavored Markdown adicionou alerts em 2023; convention estável. `remark-gfm` parseia o markdown mas não distingue alerts. Pós-processamento mdast é 30 linhas. Adicionar `remark-github-alerts` (5 KB) é over-engineering quando o pattern é trivial.
- **Consequences:** Habilita: callouts funcionais com zero deps. Constrange: regex pode missar variações (e.g. `> [!note]` minúsculo já coberto via `/i`).

### D4 — Layout directives: frontmatter + CSS data attribute + grid templates
- **Decisão:** Frontmatter `layout: "default" | "title" | "two-column" | "image-right" | "image-left" | "code-output" | "section"`. Aplicado como `data-theo-slide-layout={layout}` no `<section>`. CSS theme define `display: grid; grid-template-areas` por layout via `[data-theo-slide-layout="..."]` selector.
- **Rationale:** CSS-only (zero JS). Layouts pré-definidos cobrem 80% das apresentações reais. Permite layout custom via consumer CSS sem mudar o engine. Marpit faz idêntico via `<!-- class: -->` directive — adotamos frontmatter porque já é o nosso padrão (D4 do RFC 0002).
- **Consequences:** Habilita: layouts visuais sem JS. Constrange: layouts custom requerem CSS do consumer; v0.4 só ship os 7 default.

### D5 — Background image + gradient sanitizados via URL whitelist
- **Decisão:** Frontmatter `backgroundImage: "url(...)"` e `backgroundGradient: "linear-gradient(...)"`. Validador strict: rejeita `javascript:`, `data:` (exceto `data:image/...`), `vbscript:`. Aplica como inline `style.backgroundImage`. Adicionalmente, Marpit-style `![bg](url)` syntax: paragraph com SINGLE image cujo alt começa com `bg` é detectado no mdast → atributo no slide section + remove do tree.
- **Rationale:** Background é a feature visual mais impactante. Sanitize obrigatório porque background-image pode exfil via `url(http://attacker.com?cookies=…)` mesmo com referrer policy. Whitelist explícita de schemas (`http`, `https`, `data:image/`) é a postura mais defensável. Marpit `![bg]()` syntax é convention estabelecida — adotamos.
- **Consequences:** Habilita: backgrounds funcionais. Constrange: validação adiciona ~40 LOC; documentar limitação no JSDoc.

### D6 — Header/footer via overlay absoluto, não modificação do canvas
- **Decisão:** Frontmatter `header: "string"` e `footer: "string"` renderizam dois `<div>` absolutamente posicionados no topo e na base do slide. Texto plain (sem markdown nesting em v0.4 — Marpit também é plain). Sanitize trivial: strip todas as tags.
- **Rationale:** Overlay não interfere com layout do content área. Marpit também faz overlay (não reposiciona content). Plain text simplifica enormemente — markdown nested em header/footer é v0.5 se demanda.
- **Consequences:** Habilita: chrome consistente entre slides. Constrange: sem markdown em header/footer; documentado.

### D7 — Pagination = SlideNumber slide-level + frontmatter toggle
- **Decisão:** Frontmatter `paginate: true` ativa overlay com número do slide. Em SlideDeck, isso fica sempre ativo via `<SlideDeck.SlideNumber>` (já temos). Em Slide isolado, o número é "1" estático (o slide não sabe que faz parte de um deck). Frontmatter `paginate: "skip"` esconde explicitamente.
- **Rationale:** Marpit `paginate: skip` é a forma canônica de pular numeração em slides especiais (capa, agradecimentos). Frontmatter já é nosso padrão.
- **Consequences:** Habilita: control fino sobre numeração. Constrange: lógica deck-level (3/12) só funciona dentro de SlideDeck — Slide isolado mostra "1".

### D8 — Marpit `![bg](url)` syntax detectado no mdast e movido para frontmatter
- **Decisão:** Walker mdast detecta `Paragraph` com SINGLE `Image` cujo `alt.toLowerCase().startsWith("bg")`. Extrai `url` → aplica como `backgroundImage` da slide. Remove o `Paragraph` da árvore. Suporta variantes: `bg`, `bg cover`, `bg fit`, `bg right`, `bg left`. Modifiers viram CSS classes adicionais.
- **Rationale:** Marpit popularizou essa convenção; LLMs treinados com Marp emitirão essa syntax naturalmente. Implementação ~50 LOC.
- **Consequences:** Habilita: backgrounds via markdown inline (sem ir ao frontmatter). Constrange: usuário que QUER renderizar `![bg](url)` como imagem normal não pode — alt `bg` é reservado. Documentar.

### D9 — Syntax highlighting via Shiki (não Prismjs)
- **Decisão:** Plugin `@theokit/ui/slide/plugins/shiki`. Peer-dep `shiki ^1.0` opcional. Plugin recebe opts `{ themes: ["github-light","github-dark"], langs: ["ts","js","python",...] }`. Pre-renderiza highlighted HTML no hastTransform stage. Lazy imports tudo.
- **Rationale:** Shiki usa TextMate grammars (mesmas do VS Code) — fidelidade visual superior a Prismjs. Bundle maior bruto, mas dado o caso de uso (apresentações com code) o trade-off favorece qualidade. Lazy + opt-in mitigam custo.
- **Consequences:** Habilita: code blocks com cores idênticas ao VS Code. Constrange: peer-dep pesada (~50 KB com 5 línguas; ~200 KB com 30). Consumer escolhe quais línguas pré-carregar.

### D10 — Math via micromark-extension-math + mdast-util-math + KaTeX
- **Decisão:** Plugin `@theokit/ui/slide/plugins/math`. 3 peer-deps opcionais: `micromark-extension-math`, `mdast-util-math`, `katex`. Inline `$E=mc^2$` (single dollar) e block `$$ ... $$`. Renderização: KaTeX gera HTML pré-renderizado (não fórmula JS interativa).
- **Rationale:** KaTeX é o padrão de facto (mais rápido que MathJax, sem deps). Inline + block cobre 99% dos casos. Trade-off: KaTeX CSS + fontes devem ser servidos separadamente — consumer importa `katex/dist/katex.min.css`.
- **Consequences:** Habilita: fórmulas matemáticas profissionais. Constrange: requer CSS + fontes setup pelo consumer; documentado.

### D11 — Mermaid via hast-level detection + lazy component
- **Decisão:** Plugin `@theokit/ui/slide/plugins/mermaid`. Peer-dep `mermaid ^11` opcional. Detecta `<pre><code class="language-mermaid">` no hast → substitui por um placeholder hast element `<div data-theo-slide-mermaid>`. O `components` map do plugin troca essa div por `<MermaidDiagram>` React component que lazy-importa `mermaid`, renderiza SVG via `mermaid.render()` numa div invisível, e injeta no DOM.
- **Rationale:** Mermaid não tem mdast plugin oficial — todo mundo faz hast-level swap. Lazy mandatory porque mermaid sozinho é 370 KB. Render no client (mermaid não SSR friendly — usa DOM measurement).
- **Consequences:** Habilita: fluxogramas, sequence diagrams, mindmaps, etc. Constrange: render client-only (slide com mermaid mostra placeholder no SSR).

### D12 — Emoji shortcodes via roll-our-own map (sem twemoji)
- **Decisão:** Plugin `@theokit/ui/slide/plugins/emoji`. Zero peer-deps. Embutido: map literal de ~100 emojis comuns (`:smile:` → "😀", `:rocket:` → "🚀", `:check:` → "✅", `:warning:` → "⚠️", `:fire:` → "🔥", etc.). hastTransform walka text nodes e replace shortcodes via regex.
- **Rationale:** Twemoji adicionaria 200 KB+ para a "feature" de emoji bonito. Unicode nativo já funciona em todos OS modernos. 100 emojis cobre 99% dos casos. v0.5 pode adicionar plugin alternativo `slide/plugins/emoji-twemoji` se demanda real.
- **Consequences:** Habilita: shortcodes sem dep. Constrange: emojis seguem aparência nativa do OS do usuário (pode variar entre Mac/Windows/Linux); documentar.

### D13 — Plugin execution order documentada e tipada
- **Decisão:** Plugins executam na ORDEM DO ARRAY. mdastTransforms primeiro (todos em sequência), depois mdastToHast, depois hastTransforms (todos em sequência), depois sanitize, depois hastToReact com merged components. Ordem recomendada (de cima para baixo): emoji → math → mermaid (mdast) → shiki (hast pós-sanitize? NÃO — shiki injeta `<span>` que sanitize stripa — então shiki é hast-PRÉ-sanitize com `sanitizeSchema` opt-in que aceita as classes shiki).
- **Rationale:** Ordem determinística previne side effects. Plugins documentam quais hooks usam. Shiki é especial — precisa de sanitize-schema extension. Documentado no plugin `shikiPlugin({ extendSanitize: true })`.
- **Consequences:** Habilita: composability previsível. Constrange: documentação explícita necessária; tests cobrem ordem.

### D14 — Plugin sub-bundles via tsup multi-entry
- **Decisão:** Cada plugin é um sub-bundle em `dist/slide/plugins/{shiki,math,mermaid,emoji}/index.js`. tsup entries adicionais. Peer-deps específicas de cada plugin (shiki, katex, mermaid, etc.) declaradas em external. Subpaths declarados em ISOLATED_SUBPATHS: `@theokit/ui/slide/plugins/shiki` etc.
- **Rationale:** Cada plugin tem peer-deps próprias; agrupar todos em `@theokit/ui/slide` violaria bundle isolation. Sub-subpath é a evolução natural (Slide já é subpath; plugins ficam um nível abaixo).
- **Consequences:** Habilita: bundle granular — consumer paga apenas pelos plugins que usa. Constrange: 4 entries novos no tsup; 4 sync-exports entries novas.

### D16 — Plugin error isolation: try/catch around every plugin invocation
- **Decisão:** `composePlugins.runMdast` e `runHast` envolvem CADA chamada de plugin em `try/catch`. Erro NÃO propaga — é coletado em array `pluginErrors[]` que `parseSlide` agrega no `ParsedSlide.errors[]` com `code: "PLUGIN_ERROR"`, `got: plugin.name`, `message: e.message`. Pipeline continua com o tree não-transformado (input do plugin que falhou).
- **Rationale:** `parseSlide` promete "never throws on input" (RFC 0002 D9). Sem try/catch, um plugin com bug derruba todos os slides do deck. Pior: bug em plugin de terceiros (consumer-fornecido) seria responsabilidade nossa de absorver — error isolation é a postura defensiva mínima.
- **Consequences:** Habilita: resilient pipeline (1 plugin falha, outros continuam). Constrange: errors silenciosos em produção podem mascarar bugs reais — mitigação: `errors[]` é exposed via `onValidationError` callback (consumer pode log/alerta).

### D17 — Sanitize-schema merge é OBRIGATÓRIO para plugins que injetam HTML não-default
- **Decisão:** `sanitizeHast` recebe segundo argumento `extensions?: SanitizeExtensions` com `tagNames[]` e `attributes` agregados via `composePlugins.mergedSanitizeExtensions()`. Implementação faz `{...defaultSchema, tagNames: [...defaultSchema.tagNames, ...ext.tagNames], attributes: {...defaultSchema.attributes, ...ext.attributes}}`. Sem essa merge, plugins que injetam `<span style class>` (Shiki), `<math>` (KaTeX), ou SVG (Mermaid) têm o conteúdo strippado silenciosamente pelo defaultSchema.
- **Rationale:** Sanitize é a barreira de segurança final (princípio inquebrável: plugins NUNCA bypass sanitize). Para um plugin injetar tags custom legalmente, declarar via `sanitizeSchemaExtension` é o contrato. Sem merge, contract não é honrado.
- **Consequences:** Habilita: Shiki/KaTeX/Mermaid funcionam corretamente. Constrange: cada plugin precisa MANTER sua extension list em sync com o output real (e.g. nova versão KaTeX adiciona `<mphantom>` → atualizar). Documentar lista exaustiva por plugin.

### D18 — Marpit `![bg]()` syntax produz `ParsedSlide.extractedBackground`, não muta frontmatter
- **Decisão:** `extractMarpitBackgrounds(mdastTree)` retorna `{ tree, background? }`. `parseSlide` passa o `background` para `ParsedSlide.extractedBackground?: { url, modifier? }`. Slide component aplica via:
  ```ts
  const bgUrl = frontmatter.backgroundImage ?? parsed?.extractedBackground?.url;
  ```
  Explicit frontmatter ganha prioridade sobre Marpit extract.
- **Rationale:** Frontmatter já foi validado em `validateSlide` (schema Zod). Mutar pós-validação cria dois caminhos para a mesma data, confunde error reporting, e quebra a invariante "frontmatter é immutable depois de validar". Campo separado mantém clareza.
- **Consequences:** Habilita: pipeline previsível com 1-way data flow. Constrange: Slide component tem 2 fontes de bg URL — documenta a precedência no JSDoc.

### D15 — SlideDeck relayed plugins prop sem alteração de API
- **Decisão:** `<SlideDeck plugins={[...]}>` aceita o mesmo array e passa para cada `<Slide>` interno. Default `[]`. Sem novas props além de `plugins`.
- **Rationale:** Composite engineering — quem usa o deck deve ter a mesma richness do primitive. Passar a prop é trivial.
- **Consequences:** Habilita: rich content no deck. Constrange: documentar que plugins precisam ser **estáveis em ref** (memoizar) — senão a cada render o slide re-parseia.

## Dependency Graph

```
Phase 0 (Plugin architecture foundation)
    │
    ▼
Phase 1 (GFM alerts — Tier 1)  ──┐
    │                              │
    ▼                              │ (Phases 1-5 paralelizáveis após 0)
Phase 2 (Layouts — Tier 1)        │
    │                              │
    ▼                              │
Phase 3 (Background image — Tier 1)
    │                              │
    ▼                              │
Phase 4 (Marpit ![bg]() bridge)
    │                              │
    ▼                              │
Phase 5 (Header/Footer/Pagination — Tier 1)
    │
    ├──────────────────────────────┘
    ▼
Phase 6 (Plugin: Shiki — Tier 2)  ──┐
    │                                │
    ▼                                │ (Phases 6-9 paralelizáveis)
Phase 7 (Plugin: KaTeX — Tier 2)    │
    │                                │
    ▼                                │
Phase 8 (Plugin: Mermaid — Tier 2)  │
    │                                │
    ▼                                │
Phase 9 (Plugin: Emoji — Tier 2)    │
    │                                │
    └────────────┬───────────────────┘
                 ▼
            Phase 10 (Docs + quality:gates)
                 │
                 ▼
            Phase 11 (Playground demo)
                 │
                 ▼
            Phase 12 (Dogfood QA — MANDATORY)
```

Annotations:
- **Phase 0** blocker — plugin shape + dispatch loop.
- **Phases 1-5** (Tier 1) podem ser paralelizadas após Phase 0; CSS-mostly, zero deps.
- **Phases 6-9** (Tier 2) podem ser paralelizadas após Phase 0 também — cada plugin é auto-contained.
- **Phase 10** docs + gates final.
- **Phase 11** playground demo cumulativo.
- **Phase 12** dogfood mandatory.

---

## Phase 0: Plugin architecture foundation

**Objective:** Adicionar `plugins` prop em `<Slide>` + `<SlideDeck>`, definir tipo `SlidePlugin`, modificar `parseSlide` para iterar transformers.

### T0.1 — `SlidePlugin` type definition + plugin contract

#### Objective
Definir o tipo público `SlidePlugin` e a função `composePlugins` que aplica array de plugins na pipeline.

#### Evidence
- ADR D2 define a shape: `{ name, mdastTransform?, hastTransform?, components? }`.
- ADR D13 define a ordem: mdast → hast → sanitize → components.
- Slide atual: `parseSlide.ts` é a fronteira onde isso entra.

#### Files to edit
```
src/components/primitives/slide/plugin.ts (NEW) — tipos + composePlugins helper
src/components/primitives/slide/plugin.test.ts (NEW)
src/components/primitives/slide/index.ts — re-export type SlidePlugin
```

#### Deep file dependency analysis
- **`plugin.ts`** — tipos puros + função helper. Sem imports de runtime (apenas types).
- **`plugin.test.ts`** — testa composePlugins com 3 fake plugins.
- **`index.ts`** — adiciona `export type { SlidePlugin }`.

#### Deep Dives
```ts
import type { Root as MdastRoot } from "mdast";
import type { Root as HastRoot } from "hast";

export interface SlidePlugin {
  /** Identifier (debugging + telemetry). */
  name: string;
  /** Transform the mdast tree before mdastToHast. Async-friendly. */
  mdastTransform?: (tree: MdastRoot) => Promise<MdastRoot> | MdastRoot;
  /** Transform the hast tree after mdastToHast, before sanitize. Async-friendly. */
  hastTransform?: (tree: HastRoot) => Promise<HastRoot> | HastRoot;
  /** React component overrides merged into the consumer's `components` map. */
  components?: Record<string, React.FC<any>>;
  /** Optional: extend the sanitize schema (e.g. shiki needs class allowance). */
  sanitizeSchemaExtension?: {
    tagNames?: string[];
    attributes?: Record<string, string[]>;
  };
}

/** Compose plugins into transformers + merged components. */
export function composePlugins(plugins: SlidePlugin[]) {
  return {
    async runMdast(tree: MdastRoot): Promise<MdastRoot> {
      let current = tree;
      for (const p of plugins) {
        if (p.mdastTransform) current = await p.mdastTransform(current);
      }
      return current;
    },
    async runHast(tree: HastRoot): Promise<HastRoot> {
      let current = tree;
      for (const p of plugins) {
        if (p.hastTransform) current = await p.hastTransform(current);
      }
      return current;
    },
    mergedComponents(): Record<string, React.FC<any>> {
      return plugins.reduce(
        (acc, p) => (p.components ? { ...acc, ...p.components } : acc),
        {} as Record<string, React.FC<any>>,
      );
    },
    mergedSanitizeExtensions() {
      const tagNames = new Set<string>();
      const attributes: Record<string, Set<string>> = {};
      for (const p of plugins) {
        if (p.sanitizeSchemaExtension?.tagNames) {
          for (const tag of p.sanitizeSchemaExtension.tagNames) tagNames.add(tag);
        }
        if (p.sanitizeSchemaExtension?.attributes) {
          for (const [tag, attrs] of Object.entries(p.sanitizeSchemaExtension.attributes)) {
            if (!attributes[tag]) attributes[tag] = new Set();
            for (const a of attrs) attributes[tag].add(a);
          }
        }
      }
      return {
        tagNames: Array.from(tagNames),
        attributes: Object.fromEntries(
          Object.entries(attributes).map(([k, v]) => [k, Array.from(v)]),
        ),
      };
    },
  };
}
```
- **Invariantes:**
  - Plugin order é preservada.
  - mdast e hast transforms são sequenciais (não paralelos).
  - Components merge: later plugin wins se conflitar (last write wins).

#### Tasks
1. Implementar tipos em `plugin.ts`.
2. Implementar `composePlugins` helper.
3. Exportar `SlidePlugin` no barrel `index.ts`.
4. Tests com 3 fake plugins (mdast-only, hast-only, components-only).

#### TDD
```
RED:     plugin.test.ts — "composePlugins returns 4 functions"
RED:     plugin.test.ts — "runMdast applies plugins in array order"
RED:     plugin.test.ts — "runHast applies plugins in array order"
RED:     plugin.test.ts — "mergedComponents combines all plugin components"
RED:     plugin.test.ts — "mergedComponents — later plugin wins on conflict"
RED:     plugin.test.ts — "mergedSanitizeExtensions deduplicates tag names"
RED:     plugin.test.ts — "plugin without hooks is no-op"
RED:     plugin.test.ts — "async plugin awaited properly"
GREEN:   implementar
VERIFY:  pnpm test src/components/primitives/slide/plugin.test.ts
```

#### Acceptance Criteria
- [ ] `SlidePlugin` type exported
- [ ] 8 tests verdes
- [ ] Coverage ≥ 95% em plugin.ts

#### DoD
- [ ] Tipos documentados via JSDoc
- [ ] `pnpm quality:gates:fast` verde

---

### T0.2 — `parseSlide` integra plugins

#### Objective
Modificar `parseSlide` para aceitar e executar plugins.

#### Evidence
- ADR D2/D13 fluxo definido.
- ParsedSlide atual já tem `errors[]` que pode receber erros de plugins.

#### Files to edit
```
src/components/primitives/slide/parse.ts — adicionar opts.plugins; iterar transformers
src/components/primitives/slide/parse.test.ts — adicionar testes de plugin integration
```

#### Deep Dives
- Signature change:
  ```ts
  export interface ParseSlideOptions {
    components?: Record<string, unknown>;
    plugins?: SlidePlugin[];  // NEW
  }
  ```
- Pipeline change in `parseSlide`:
  ```ts
  const compose = composePlugins(opts.plugins ?? []);
  const pluginErrors: SlideValidationError[] = [];
  const mdastTree = await parseBody(body);
  // D16: runMdast/runHast collect plugin errors; never throw.
  const transformedMdast = await compose.runMdast(mdastTree, pluginErrors);
  let hastTree = await mdastToHast(transformedMdast);
  hastTree = await compose.runHast(hastTree, pluginErrors);
  // D17: merge sanitize-schema extensions from all plugins.
  const ext = compose.mergedSanitizeExtensions();
  const { tree: safeTree, bannedTags } = await sanitizeHast(hastTree, ext);
  // ...
  errors.push(...pluginErrors);
  const tree = await hastToReact(safeTree, {
    ...opts.components,
    ...compose.mergedComponents(),
  });
  ```
- `sanitizeHast` ganha 2º arg `extensions` que mergeia com defaultSchema (D17):
  ```ts
  export async function sanitizeHast(tree: HastRoot, extensions?: SanitizeExtensions) {
    const { defaultSchema } = await import("hast-util-sanitize");
    const schema = !extensions ? defaultSchema : {
      ...defaultSchema,
      tagNames: [...(defaultSchema.tagNames ?? []), ...(extensions.tagNames ?? [])],
      attributes: { ...(defaultSchema.attributes ?? {}), ...(extensions.attributes ?? {}) },
    };
    // ... existing sanitize logic with schema
  }
  ```
- D16: `composePlugins` wraps each plugin call:
  ```ts
  for (const p of plugins) {
    if (!p.mdastTransform) continue;
    try { current = await p.mdastTransform(current); }
    catch (e) {
      errorsOut.push({
        code: "PLUGIN_ERROR",
        path: [],
        message: `Plugin '${p.name}' failed: ${e instanceof Error ? e.message : String(e)}`,
        got: p.name,
      });
    }
  }
  ```
- **Invariantes:**
  - Sanitize sempre executa DEPOIS dos transformers (plugins NÃO podem bypass).
  - **D16:** Plugin que throw NÃO propaga; pipeline continua com input não-transformado daquele plugin.
  - **D17:** Plugin que precisa de tags/attrs custom DEVE declarar via `sanitizeSchemaExtension`, senão conteúdo é strippado.

#### Tasks
1. Estender `ParseSlideOptions` com `plugins?`.
2. Compor pipeline com `composePlugins`.
3. Estender `sanitizeHast` para aceitar schema extensions.
4. Tests cobrindo mdast/hast/components/sanitize-extension paths.

#### TDD
```
RED:     parse.test.ts — "parseSlide passes plugins=[] safely"
RED:     parse.test.ts — "plugin mdastTransform mutates tree before hast conversion"
RED:     parse.test.ts — "plugin hastTransform mutates tree before sanitize"
RED:     parse.test.ts — "plugin components merged into final React tree"
RED:     parse.test.ts — "plugin sanitizeSchemaExtension extends allowed tags (D17 / EC-3)"
RED:     parse.test.ts — "plugin throwing in mdastTransform emits PLUGIN_ERROR + continues (D16 / EC-1)"
RED:     parse.test.ts — "plugin throwing in hastTransform emits PLUGIN_ERROR + continues (D16 / EC-1)"
RED:     parse.test.ts — "plugins applied in array order"
RED:     parse.test.ts — "sanitizeHast without extensions equals defaultSchema (regression)"
RED:     parse.test.ts — "mergedSanitizeExtensions deduplicates tag names across plugins"
GREEN:   implementar
VERIFY:  pnpm test src/components/primitives/slide/parse.test.ts
```

#### Acceptance Criteria
- [ ] `ParseSlideOptions.plugins` opcional
- [ ] 6 tests novos verdes (em adição aos existentes)
- [ ] Plugins NÃO bypass sanitize (regression test)

#### DoD
- [ ] Pipeline documentada via JSDoc atualizada
- [ ] `pnpm quality:gates:fast` verde

---

### T0.3 — `<Slide>` + `<SlideDeck>` aceitam prop `plugins`

#### Objective
Relayed plugins via prop pública nos dois componentes.

#### Files to edit
```
src/components/primitives/slide/slide.tsx — add plugins prop, forward to parseSlide
src/components/composites/slide-deck/slide-deck.tsx — add plugins prop, forward to internal <Slide>
src/components/primitives/slide/slide.test.tsx — verify plugins prop forwarded
```

#### Deep Dives
```tsx
// slide.tsx
export interface SlideProps {
  // ... existing
  plugins?: SlidePlugin[];
}

// passed to parseSlide:
parseSlide(markdown, { components, plugins }).then(...)
```
- SlideDeck passa `plugins` para cada `<Slide>` no `<SlidesView>` interno.
- **Invariante:** prop estável em ref (D15) — consumer responsável por memoizar.

#### Tasks
1. Estender `SlideProps` e `SlideDeckProps` com `plugins?`.
2. Forward para `parseSlide`.
3. Forward de SlideDeck → internal Slide.
4. Tests.

#### TDD
```
RED:     slide.test.tsx — "plugins prop forwarded to parseSlide"
RED:     slide-deck.test.tsx — "plugins prop forwarded to every internal <Slide>"
GREEN:   implementar
VERIFY:  pnpm test src/components/primitives/slide/slide.test.tsx src/components/composites/slide-deck/slide-deck.test.tsx
```

#### Acceptance Criteria
- [ ] `plugins?: SlidePlugin[]` em ambos
- [ ] Tests verdes
- [ ] Typecheck verde

#### DoD
- [ ] Props documentadas
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 1: GFM Alerts/Callouts (Tier 1)

**Objective:** Detectar `> [!NOTE]` etc. via mdast post-process, renderizar como `<aside>` temado.

### T1.1 — Detector mdast + transform para aside

#### Objective
Função `detectAlerts(mdastTree)` que walka blockquotes e converte alerts.

#### Evidence
- ADR D3 define o regex + tags.

#### Files to edit
```
src/components/primitives/slide/alerts.ts (NEW) — detector + transform
src/components/primitives/slide/alerts.test.ts (NEW)
src/components/primitives/slide/parse.ts — invoca detectAlerts antes de mdastToHast
```

#### Deep Dives
```ts
import { visit } from "unist-util-visit";

const ALERT_RE = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](\r?\n|\s)?/i;
const ALERT_TYPES = ["note", "tip", "important", "warning", "caution"] as const;

export function detectAlerts(tree: MdastRoot): MdastRoot {
  const { visit } = require("unist-util-visit");  // peer-dep already in slide stack
  visit(tree, "blockquote", (node: any) => {
    const firstChild = node.children[0];
    if (firstChild?.type !== "paragraph") return;
    const firstText = firstChild.children[0];
    if (firstText?.type !== "text") return;
    const match = ALERT_RE.exec(firstText.value);
    if (!match) return;
    const type = match[1]!.toLowerCase();
    // Strip the marker from the text node.
    firstText.value = firstText.value.replace(ALERT_RE, "");
    // Annotate the node so mdastToHast emits with data.
    node.data = {
      ...node.data,
      hName: "aside",
      hProperties: {
        className: ["theo-slide-alert"],
        "data-theo-slide-alert-type": type,
      },
    };
  });
  return tree;
}
```
- `mdast-util-to-hast` respeita `data.hName` + `data.hProperties` — convenção bem estabelecida.
- **Invariantes:**
  - Detector é idempotente.
  - Não touch blockquotes que NÃO são alerts.
  - 5 tipos suportados (NOTE, TIP, IMPORTANT, WARNING, CAUTION).

#### Tasks
1. Implementar `detectAlerts`.
2. Integrar em `parseSlide` (inline, antes de mdastToHast).
3. Tests cobrindo cada tipo + non-alert blockquote.

#### TDD
```
RED:     alerts.test.ts — "detects [!NOTE]"
RED:     alerts.test.ts — "detects case-insensitive [!warning]"
RED:     alerts.test.ts — "regular blockquote unchanged"
RED:     alerts.test.ts — "[!INVALID] is left as text"
RED:     alerts.test.ts — "strips marker from rendered text"
RED:     alerts.test.ts — "sets hName=aside and className"
RED:     alerts.test.ts — "supports all 5 GFM alert types"
RED:     parse.test.ts — "parseSlide renders alert as <aside> with data attribute"
GREEN:   implementar
VERIFY:  pnpm test src/components/primitives/slide/alerts.test.ts
```

#### Acceptance Criteria
- [ ] 5 tipos detectados
- [ ] Idempotente
- [ ] Regular blockquotes intactos
- [ ] 8 tests verdes

#### DoD
- [ ] `pnpm quality:gates:fast` verde

---

### T1.2 — Estilo CSS dos alerts (default + violet-forge themes)

#### Objective
Adicionar CSS para `aside.theo-slide-alert` com 5 variantes por `data-theo-slide-alert-type`.

#### Files to edit
```
src/components/primitives/slide/themes/default.css — add alert styles
src/components/primitives/slide/themes/violet-forge.css — add alert styles
```

#### Deep Dives
Cada alert tem cor + ícone via CSS pseudo-element:

```css
.theo-slide[data-theo-slide-theme="default"] aside.theo-slide-alert {
  margin: 0 0 0.75em 0;
  padding: 12px 16px 12px 48px;
  border-left: 4px solid;
  border-radius: 6px;
  background: color-mix(in srgb, currentColor 8%, transparent);
  position: relative;
}

.theo-slide[data-theo-slide-theme="default"] aside.theo-slide-alert::before {
  position: absolute;
  left: 16px;
  top: 12px;
  font-weight: 600;
  font-size: 0.95em;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.theo-slide[data-theo-slide-theme="default"] aside[data-theo-slide-alert-type="note"] {
  border-color: #3b82f6;
}
.theo-slide[data-theo-slide-theme="default"] aside[data-theo-slide-alert-type="note"]::before {
  content: "ⓘ Note";
  color: #3b82f6;
}
/* Similar for tip (✓ green), important (! purple), warning (⚠ yellow), caution (✗ red) */
```
- Mesma estrutura nos dois themes; apenas cores variam.

#### Tasks
1. CSS no default.css.
2. CSS no violet-forge.css.

#### TDD
```
RED:     N/A — CSS visual. Validado via slide.test.tsx integration + story.
VERIFY:  pnpm test src/components/primitives/slide/slide.test.tsx -t "alert"
```

#### Acceptance Criteria
- [ ] 5 variantes CSS em cada theme
- [ ] Ícone via `::before`
- [ ] Border-left colorida
- [ ] Background tinted via color-mix

#### DoD
- [ ] CSS validado em story
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 2: Layout directives (Tier 1)

**Objective:** Frontmatter `layout: NAME` → CSS grid template.

### T2.1 — Schema extension + data attribute

#### Files to edit
```
src/components/primitives/slide/schema.ts — adicionar `layout` no slideFrontmatter
src/components/primitives/slide/slide.tsx — aplicar data-theo-slide-layout no <section>
```

#### Deep Dives
```ts
export const slideLayout = z.enum([
  "default",
  "title",
  "two-column",
  "image-right",
  "image-left",
  "code-output",
  "section",
]);

export const slideFrontmatter = z.object({
  theme: slideTheme.optional(),
  layout: slideLayout.optional(),  // NEW
  lang: langTag.optional(),
  color: cssColor.optional(),
  backgroundColor: cssColor.optional(),
}).strict();
```
- Component: `<section data-theo-slide-layout={frontmatter.layout ?? "default"}>`.
- **Invariante:** Layout custom NÃO suportado em v0.4 — só os 7 enumerados.

#### Tasks
1. Schema add layout enum.
2. Slide.tsx aplica data attribute.
3. Tests do schema.

#### TDD
```
RED:     schema.test.ts — "accepts layout: 'two-column'"
RED:     schema.test.ts — "rejects layout: 'unknown'"
RED:     slide.test.tsx — "renders data-theo-slide-layout when frontmatter sets it"
GREEN:   implementar
VERIFY:  pnpm test
```

#### Acceptance Criteria
- [ ] 7 layouts no enum
- [ ] Schema rejeita unknown
- [ ] Atributo aplicado

#### DoD
- [ ] `pnpm quality:gates:fast` verde

---

### T2.2 — CSS grid templates para cada layout

#### Files to edit
```
src/components/primitives/slide/themes/layouts.css (NEW) — todos os layouts
src/components/primitives/slide/themes/default.css — @import layouts.css
src/components/primitives/slide/themes/violet-forge.css — @import layouts.css
tsup.config.ts — copiar layouts.css para dist/slide/themes/
```

#### Deep Dives
```css
/* Default — vertical flow */
.theo-slide[data-theo-slide-layout="default"] {
  /* No-op; children stack normally */
}

/* Title — centered hero */
.theo-slide[data-theo-slide-layout="title"] {
  display: grid;
  place-items: center;
  text-align: center;
}
.theo-slide[data-theo-slide-layout="title"] h1 {
  font-size: 3em;
}

/* Two-column — equal split */
.theo-slide[data-theo-slide-layout="two-column"] {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  /* heuristic: pairs of children fall into 2 columns;
     CSS subgrid would be cleaner but consumer needs to structure markdown */
}

/* Image-right — text left, first <img> right */
.theo-slide[data-theo-slide-layout="image-right"] {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 32px;
  align-items: center;
}
.theo-slide[data-theo-slide-layout="image-right"] img {
  grid-column: 2;
  max-width: 100%;
  border-radius: 8px;
}

/* image-left — mirror */
.theo-slide[data-theo-slide-layout="image-left"] {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 32px;
  align-items: center;
}
.theo-slide[data-theo-slide-layout="image-left"] img {
  grid-column: 1;
  grid-row: 1;
  max-width: 100%;
  border-radius: 8px;
}

/* code-output — code block left, prose right */
.theo-slide[data-theo-slide-layout="code-output"] {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
}

/* section — full-bleed colored banner (for chapter dividers) */
.theo-slide[data-theo-slide-layout="section"] {
  display: grid;
  place-items: center;
  background: color-mix(in srgb, currentColor 10%, transparent);
}
.theo-slide[data-theo-slide-layout="section"] h1 {
  font-size: 4em;
  letter-spacing: -0.03em;
}
```

#### Tasks
1. layouts.css com 7 layouts.
2. @import em default + violet-forge.
3. tsup copia layouts.css.

#### Acceptance Criteria
- [ ] 7 layouts funcionais
- [ ] Layout default mantém comportamento atual
- [ ] CSS scoped via data attribute

#### DoD
- [ ] Validado em story dedicado
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 3: Background image (Tier 1)

**Objective:** Frontmatter `backgroundImage`/`backgroundGradient` + URL sanitize.

### T3.1 — Schema + URL whitelist

#### Files to edit
```
src/components/primitives/slide/schema.ts — backgroundImage + backgroundGradient + sanitizeBgUrl
src/components/primitives/slide/slide.tsx — aplicar inline style
```

#### Deep Dives
```ts
// EC-7: backgroundImage cap raised to 500_000 (permite remote URLs longas com query strings);
// data: URLs são REJEITADAS no sanitizer por segurança/perf (slides grandes via data URI
// inflam o markdown source de cada slide do deck, prejudicando parse time + transmissão).
// Consumer que precisa de inline image deve hospedar e referenciar via https://.
const SAFE_URL_SCHEMES = ["http:", "https:"];

function sanitizeBgUrl(input: string): string | null {
  try {
    const trimmed = input.trim();
    // Allow url(...) wrapper or raw URL.
    const url = trimmed.startsWith("url(")
      ? trimmed.replace(/^url\(['"]?/, "").replace(/['"]?\)$/, "")
      : trimmed;
    // Block dangerous schemes.
    const lower = url.toLowerCase();
    if (lower.startsWith("javascript:") || lower.startsWith("vbscript:")) return null;
    // EC-7: reject ALL data: URLs (inclusive data:image/*) — perf + DoS hardening.
    if (lower.startsWith("data:")) return null;
    // Only http(s) are allowed past this point.
    if (!lower.startsWith("http://") && !lower.startsWith("https://")) return null;
    new URL(url);  // throws on malformed
    return url;
  } catch {
    return null;
  }
}

export const slideFrontmatter = z.object({
  // ... existing
  // EC-7: cap raised from 2_000 → 500_000 (data: URLs are sanitized out anyway,
  // but remote URLs with long query strings or SVG markup must pass).
  backgroundImage: z.string().max(500_000).optional().transform((v) => {
    if (!v) return undefined;
    return sanitizeBgUrl(v) ?? undefined;
  }),
  backgroundGradient: z.string().max(500).regex(
    /^(linear|radial|conic)-gradient\(/i,
    "Must start with linear-/radial-/conic-gradient(",
  ).optional(),
});
```
- Component aplica inline style:
  ```tsx
  style={{
    ...existing,
    backgroundImage: frontmatter.backgroundGradient ?? (frontmatter.backgroundImage ? `url(${frontmatter.backgroundImage})` : undefined),
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
  ```
- **Invariantes:**
  - URL sanitizada — `javascript:` rejected.
  - data: only para image/*.
  - Gradient string validada por prefix.

#### Tasks
1. Implementar `sanitizeBgUrl` helper.
2. Adicionar 2 campos no schema.
3. Aplicar no inline style.
4. Tests.

#### TDD
```
RED:     schema.test.ts — "accepts backgroundImage with https URL"
RED:     schema.test.ts — "rejects backgroundImage with javascript:"
RED:     schema.test.ts — "rejects backgroundImage with data:text/html"
RED:     schema.test.ts — "rejects backgroundImage with data:image/png (EC-7)"
RED:     schema.test.ts — "accepts backgroundImage up to 500_000 chars (EC-7)"
RED:     schema.test.ts — "rejects backgroundImage over 500_000 chars (EC-7)"
RED:     schema.test.ts — "accepts backgroundGradient: 'linear-gradient(...)'"
RED:     schema.test.ts — "rejects backgroundGradient without gradient prefix"
RED:     slide.test.tsx — "applies backgroundImage to inline style"
GREEN:   implementar
VERIFY:  pnpm test
```

#### Acceptance Criteria
- [ ] Sanitize rejeita javascript:, vbscript:, data: (qualquer subtipo)
- [ ] backgroundImage cap = 500_000 chars
- [ ] 9 tests verdes
- [ ] Inline style aplicado

#### DoD
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 4: Marpit `![bg](url)` syntax (Tier 1 bridge)

**Objective:** Detectar imagem com alt `bg` no mdast → extrair URL para frontmatter virtual + remover do tree.

### T4.1 — Detector mdast inline + ParsedSlide.extractedBackground (D18)

#### Files to edit
```
src/components/primitives/slide/marpit-bg.ts (NEW)
src/components/primitives/slide/parse.ts — invoca após detectAlerts; passa background para ParsedSlide
src/components/primitives/slide/types.ts — adicionar campo extractedBackground em ParsedSlide
src/components/primitives/slide/slide.tsx — preferência: frontmatter.backgroundImage > extractedBackground.url
```

#### Deep Dives
```ts
import type { Image, Paragraph, Root } from "mdast";

const BG_ALT_RE = /^bg(?:\s+(\w+))?/i;

export interface ExtractedBackground {
  url: string;
  modifier?: "cover" | "fit" | "left" | "right";
}

export function extractMarpitBackgrounds(tree: Root): {
  tree: Root;
  background?: ExtractedBackground;
} {
  let background: ExtractedBackground | undefined;
  const filtered = tree.children.filter((node) => {
    if (node.type !== "paragraph") return true;
    const p = node as Paragraph;
    if (p.children.length !== 1) return true;
    const child = p.children[0];
    if (child?.type !== "image") return true;
    const img = child as Image;
    const match = BG_ALT_RE.exec(img.alt ?? "");
    if (!match) return true;
    // It's a bg image — extract.
    if (!background) {
      background = {
        url: img.url,
        modifier: match[1]?.toLowerCase() as "cover" | "fit" | "left" | "right" | undefined,
      };
    }
    return false;  // drop this paragraph from the tree
  });
  return {
    tree: { ...tree, children: filtered },
    background,
  };
}
```

**EC-5 / D18 integration:** o resultado NÃO muta o frontmatter (já validado por Zod). Vai num campo separado em `ParsedSlide`:

```ts
// types.ts
export interface ParsedSlide {
  // ... existing
  /** EC-5/D18: background extraído de Marpit ![bg](url). Component dá preferência ao
   *  frontmatter.backgroundImage explícito. */
  extractedBackground?: { url: string; modifier?: "cover" | "fit" | "left" | "right" };
}

// parse.ts (depois do detectAlerts):
const { tree: mdastNoBg, background } = extractMarpitBackgrounds(mdastTree);
// passar adiante; mdastNoBg vai para mdastToHast
// background entra em ParsedSlide.extractedBackground

// slide.tsx — render:
const bgUrl = frontmatter.backgroundImage ?? parsed?.extractedBackground?.url;
const bgModifier = parsed?.extractedBackground?.modifier;
const bgClasses = bgModifier ? `theo-slide-bg-${bgModifier}` : "";
```

**Sanitize do extracted URL:** o `extractedBackground.url` vem direto do mdast e NÃO passou pelo `sanitizeBgUrl` do schema. T4.1 deve aplicar `sanitizeBgUrl` ANTES de armazenar no `ParsedSlide`:

```ts
// parse.ts
if (background) {
  const safe = sanitizeBgUrl(background.url);
  if (safe) parsed.extractedBackground = { url: safe, modifier: background.modifier };
  else parsed.errors.push({
    code: "MARPIT_BG_UNSAFE_URL",
    path: [],
    message: `Marpit ![bg](url) rejected: unsafe scheme or malformed URL`,
    got: background.url.slice(0, 80),
  });
}
```

#### Tasks
1. Implementar extractor (`marpit-bg.ts`).
2. Adicionar campo `extractedBackground` em `ParsedSlide`.
3. Integrar com parseSlide (sanitize antes de armazenar).
4. Slide component aplica `frontmatter.backgroundImage ?? extractedBackground.url`.
5. Tests.

#### TDD
```
RED:     marpit-bg.test.ts — "extracts ![bg](url) and drops paragraph"
RED:     marpit-bg.test.ts — "extracts ![bg cover](url) with modifier"
RED:     marpit-bg.test.ts — "ignores ![not-bg](url)"
RED:     marpit-bg.test.ts — "ignores paragraph with multiple children"
RED:     marpit-bg.test.ts — "first bg wins when multiple"
RED:     parse.test.ts — "extractedBackground field populated on ParsedSlide (D18 / EC-5)"
RED:     parse.test.ts — "extractedBackground sanitized via sanitizeBgUrl (data: rejected → MARPIT_BG_UNSAFE_URL)"
RED:     slide.test.tsx — "frontmatter.backgroundImage wins over Marpit ![bg]() (D18)"
RED:     slide.test.tsx — "Marpit ![bg](url) applied when frontmatter.backgroundImage absent"
GREEN:   implementar
VERIFY:  pnpm test
```

#### Acceptance Criteria
- [ ] 9 tests verdes
- [ ] Imagem removida do tree (sem render duplicado)
- [ ] `ParsedSlide.extractedBackground` populado quando aplicável
- [ ] Sanitize aplicado antes de armazenar (data: → erro tipado)
- [ ] Precedência: frontmatter > extracted (D18)

#### DoD
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 5: Header/Footer/Pagination overlays (Tier 1)

**Objective:** Frontmatter `header`/`footer`/`paginate` → overlays absolutos no slide.

### T5.1 — Schema + Slide component overlays

#### Files to edit
```
src/components/primitives/slide/schema.ts — adicionar header, footer, paginate
src/components/primitives/slide/slide.tsx — renderizar overlays
src/components/primitives/slide/themes/*.css — CSS para overlays
```

#### Deep Dives
```ts
export const slideFrontmatter = z.object({
  // ... existing
  header: z.string().max(200).optional(),
  footer: z.string().max(200).optional(),
  paginate: z.union([z.boolean(), z.literal("skip"), z.literal("hold")]).optional(),
});
```
- Render no Slide:
  ```tsx
  {frontmatter.header ? (
    <div className="theo-slide-header" aria-hidden="true">{frontmatter.header}</div>
  ) : null}
  {/* slide body */}
  {frontmatter.footer ? (
    <div className="theo-slide-footer" aria-hidden="true">{frontmatter.footer}</div>
  ) : null}
  {frontmatter.paginate === true ? (
    <div className="theo-slide-paginate" aria-hidden="true">1</div>
  ) : null}
  ```
- CSS:
  ```css
  .theo-slide-header { position: absolute; top: 16px; left: 32px; right: 32px; opacity: 0.7; font-size: 0.8em; }
  .theo-slide-footer { position: absolute; bottom: 16px; left: 32px; right: 32px; opacity: 0.7; font-size: 0.8em; text-align: center; }
  .theo-slide-paginate { position: absolute; bottom: 16px; right: 32px; opacity: 0.5; font-variant-numeric: tabular-nums; }
  ```

#### Tasks
1. Schema fields.
2. Component overlays.
3. CSS.
4. Tests.

#### TDD
```
RED:     schema.test.ts — "accepts header/footer strings up to 200 chars"
RED:     slide.test.tsx — "renders header overlay when frontmatter sets it"
RED:     slide.test.tsx — "renders footer overlay when frontmatter sets it"
RED:     slide.test.tsx — "renders pagination overlay when paginate: true"
RED:     slide.test.tsx — "no overlays when frontmatter empty"
GREEN:   implementar
VERIFY:  pnpm test
```

#### Acceptance Criteria
- [ ] 3 overlays funcionais
- [ ] Schema rejeita > 200 chars
- [ ] 5 tests verdes

#### DoD
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 6: Plugin Shiki (Tier 2)

**Objective:** Syntax highlighting via Shiki, lazy + opt-in.

### T6.1 — Bundle isolation: sub-subpath `dist/slide/plugins/shiki/`

#### Files to edit
```
scripts/sync-exports.ts — adicionar ./slide/plugins/shiki
tsup.config.ts — adicionar entry slide/plugins/shiki/index
package.json — adicionar shiki como peerDep opcional
src/components/primitives/slide/plugins/shiki/index.ts (NEW)
src/components/primitives/slide/plugins/shiki/index.test.ts (NEW)
```

#### Deep Dives
```ts
// src/components/primitives/slide/plugins/shiki/index.ts
import type { SlidePlugin } from "../../plugin.js";
import type { Element, Root } from "hast";

export interface ShikiPluginOptions {
  themes?: { light: string; dark: string };
  langs?: string[];
}

export function shikiPlugin(opts: ShikiPluginOptions = {}): SlidePlugin {
  const themes = opts.themes ?? { light: "github-light", dark: "github-dark" };
  const langs = opts.langs ?? ["ts", "js", "tsx", "jsx", "python", "rust", "go", "json"];
  let highlighter: any = null;

  let peerDepMissing = false;

  async function getHighlighter() {
    if (highlighter) return highlighter;
    if (peerDepMissing) return null;
    try {
      const shiki = await import("shiki");
      highlighter = await shiki.createHighlighter({
        themes: [themes.light, themes.dark],
        langs,
      });
      return highlighter;
    } catch (e) {
      // EC-2: peer-dep guard. Mark missing once so we don't spam logs on every slide.
      peerDepMissing = true;
      // Plugin returns null; hastTransform short-circuits to plain <pre><code>.
      // Error is also surfaced via D16 plugin-error path (caller can listen).
      throw new Error(
        `[slide/plugins/shiki] peer-dep 'shiki' not installed. ` +
        `Run: pnpm add shiki. Falling back to plain code blocks.`,
      );
    }
  }

  return {
    name: "shiki",
    sanitizeSchemaExtension: {
      tagNames: ["span"],
      attributes: { "*": ["style", "class"] },
    },
    async hastTransform(tree: Root): Promise<Root> {
      const hl = await getHighlighter();
      // EC-2: if peer-dep missing, return tree unchanged (plain <pre><code> survives sanitize).
      if (!hl) return tree;
      // walk pre > code.language-XXX, replace with highlighted html
      const { visit } = await import("unist-util-visit");
      const fromHtml = await import("hast-util-from-html");
      visit(tree, "element", (node: Element, _idx, parent: any) => {
        if (node.tagName !== "code") return;
        const className = (node.properties?.className as string[]) ?? [];
        const langClass = className.find((c) => c.startsWith("language-"));
        if (!langClass) return;
        const lang = langClass.replace("language-", "");
        if (!langs.includes(lang)) return;
        const codeText = (node.children?.[0] as any)?.value ?? "";
        const html = hl.codeToHtml(codeText, { lang, themes });
        const newTree = fromHtml.fromHtml(html, { fragment: true });
        // replace parent <pre> with the new highlighted tree
        if (parent?.tagName === "pre" && parent.children?.length === 1) {
          Object.assign(parent, newTree.children[0]);
        }
      });
      return tree;
    },
  };
}
```
- **EC-2 (peer-dep guard):** o `throw` no `getHighlighter` é absorvido pelo `try/catch` do D16 em `composePlugins.runHast`. Resultado: `errors.push({ code: "PLUGIN_ERROR", got: "shiki", message: "peer-dep 'shiki' not installed..." })`. Slide renderiza com plain `<pre><code>` (defaultSchema permite). Consumer vê o erro via `onValidationError` callback.
- **Invariantes:**
  - Highlighter cached (singleton por plugin instance).
  - Línguas não-listadas passam through (plain `<pre><code>`).
  - sanitize-schema extension permite `<span style class>` que shiki gera.

#### Tasks
1. Adicionar entry tsup + sync-exports.
2. Adicionar shiki em peerDependenciesMeta optional.
3. Implementar plugin.
4. Tests com mock shiki.

#### TDD
```
RED:     shiki.test.ts — "plugin returns object with name 'shiki'"
RED:     shiki.test.ts — "hastTransform replaces <pre><code class='language-ts'> with highlighted html"
RED:     shiki.test.ts — "skips unknown langs"
RED:     shiki.test.ts — "sanitizeSchemaExtension allows span style"
RED:     shiki.test.ts — "missing peer-dep: hastTransform returns tree unchanged + caller sees PLUGIN_ERROR (EC-2)"
RED:     shiki.test.ts — "missing peer-dep: subsequent calls do not retry import (cache flag)"
GREEN:   implementar
VERIFY:  pnpm test
```

#### Acceptance Criteria
- [ ] Subpath `@theokit/ui/slide/plugins/shiki` resolve
- [ ] 6 tests verdes
- [ ] Bundle `dist/slide/plugins/shiki/index.js` < 5 KB sem shiki
- [ ] Peer-dep ausente: degrade graceful para `<pre><code>` + erro tipado (EC-2)

#### DoD
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 7: Plugin KaTeX/Math (Tier 2)

### T7.1 — Math plugin

#### Files to edit
```
src/components/primitives/slide/plugins/math/index.ts (NEW)
src/components/primitives/slide/plugins/math/index.test.ts (NEW)
tsup.config.ts — entry
sync-exports.ts — subpath
package.json — peerDeps opcionais: micromark-extension-math, mdast-util-math, katex
```

#### Deep Dives
```ts
export interface MathPluginOptions {
  /** KaTeX render options (passed to renderToString). */
  katexOptions?: Record<string, unknown>;
}

export function mathPlugin(opts: MathPluginOptions = {}): SlidePlugin {
  return {
    name: "math",
    // EC-4: KaTeX produz dezenas de elementos MathML. Lista exaustiva baseada em
    // KaTeX docs (https://katex.org/docs/options.html) e MathML Core spec.
    // Sem essa lista, o sanitize STRIPPA o output e a fórmula renderiza como string crua.
    sanitizeSchemaExtension: {
      tagNames: [
        "span", "div",
        // MathML root + grouping
        "math", "semantics", "annotation", "annotation-xml",
        // MathML token elements
        "mtext", "mn", "mo", "mi", "ms", "mglyph",
        // MathML general layout
        "mrow", "mfrac", "msqrt", "mroot", "mstyle", "merror",
        "mpadded", "mphantom", "menclose", "mspace",
        // MathML scripts and limits
        "msub", "msup", "msubsup", "munder", "mover", "munderover",
        "mmultiscripts", "mprescripts",
        // MathML tables (matrices)
        "mtable", "mtr", "mtd", "mlabeledtr",
        // MathML elementary math
        "mstack", "mlongdiv", "msgroup", "msrow", "mscarries", "mscarry",
      ],
      attributes: {
        "*": ["style", "class", "ariaHidden", "ariaLabel"],
        span: ["style", "class"],
        math: ["xmlns", "display"],
        annotation: ["encoding"],
        "annotation-xml": ["encoding"],
        mfrac: ["linethickness"],
        mspace: ["width", "height", "depth"],
        mover: ["accent"],
        munder: ["accentunder"],
        mo: ["fence", "form", "lspace", "rspace", "stretchy", "symmetric"],
      },
    },
    async mdastTransform(tree) {
      // EC-2: peer-dep guard via dynamic import wrapped (no-op if missing — fórmula sobra como texto).
      try {
        await import("micromark-extension-math");
        await import("mdast-util-math");
      } catch {
        return tree;  // mdast walk skipped; hastTransform será o no-op também.
      }
      // micromark extension is applied at parse stage, but for lazy plugins
      // we walk the existing tree for $...$ inline patterns AND $$...$$ block
      // (since the existing parseBody doesn't pass `extensions: [math()]`).
      // Simplest: render inline patterns directly to KaTeX HTML in hast stage.
      return tree;
    },
    async hastTransform(tree) {
      // EC-2: peer-dep guard. Se katex não está instalado, plugin é no-op.
      // O `$...$` no markdown sobra como texto literal (degrade graceful).
      let katex: any;
      let fromHtml: any;
      let visit: any;
      try {
        katex = await import("katex");
        fromHtml = await import("hast-util-from-html");
        visit = (await import("unist-util-visit")).visit;
      } catch (e) {
        throw new Error(
          `[slide/plugins/math] peer-dep missing (katex / hast-util-from-html). ` +
          `Run: pnpm add katex micromark-extension-math mdast-util-math. ` +
          `Math formulas remain as plain text. Error: ${e}`,
        );
      }
      // Walk text nodes, find $...$ and $$...$$ patterns, replace with rendered HTML.
      visit(tree, "text", (node: any, idx, parent: any) => {
        if (!parent) return;
        const value = node.value as string;
        const inlineRe = /\$([^$\n]+)\$/g;
        const blockRe = /\$\$([\s\S]+?)\$\$/g;
        const replacements: Array<{ start: number; end: number; html: string; display: boolean }> = [];
        for (const m of value.matchAll(blockRe)) {
          replacements.push({
            start: m.index!,
            end: m.index! + m[0].length,
            html: katex.default.renderToString(m[1]!, { ...opts.katexOptions, displayMode: true }),
            display: true,
          });
        }
        for (const m of value.matchAll(inlineRe)) {
          // skip if inside a $$...$$ block
          if (replacements.some((r) => m.index! >= r.start && m.index! < r.end)) continue;
          replacements.push({
            start: m.index!,
            end: m.index! + m[0].length,
            html: katex.default.renderToString(m[1]!, { ...opts.katexOptions, displayMode: false }),
            display: false,
          });
        }
        if (replacements.length === 0) return;
        // Build replacement children: alternating text + math nodes.
        replacements.sort((a, b) => a.start - b.start);
        const newChildren: any[] = [];
        let cursor = 0;
        for (const r of replacements) {
          if (r.start > cursor) {
            newChildren.push({ type: "text", value: value.slice(cursor, r.start) });
          }
          const fragment = fromHtml.fromHtml(r.html, { fragment: true });
          newChildren.push(...fragment.children);
          cursor = r.end;
        }
        if (cursor < value.length) {
          newChildren.push({ type: "text", value: value.slice(cursor) });
        }
        // Replace the text node with multiple children inline.
        parent.children.splice(idx, 1, ...newChildren);
        return idx + newChildren.length;
      });
      return tree;
    },
  };
}
```
- **Invariantes:**
  - KaTeX é DOM-less (renderToString).
  - Inline `$...$` e block `$$...$$`.
  - Consumer importa `katex/dist/katex.min.css` separadamente.

#### Tasks
1. Tsup entry + sync-exports + peer-deps.
2. Implementar plugin.
3. Tests.

#### TDD
```
RED:     math.test.ts — "inline $E=mc^2$ renders KaTeX HTML"
RED:     math.test.ts — "block $$ ... $$ renders display KaTeX"
RED:     math.test.ts — "non-math text unchanged"
RED:     math.test.ts — "extends sanitize schema with all MathML tags (EC-4)"
RED:     math.test.ts — "sanitize keeps <mfrac>/<msqrt>/<msup>/<munder> after pipeline (EC-4)"
RED:     math.test.ts — "missing peer-dep: hastTransform throws → caller absorbs as PLUGIN_ERROR (EC-2)"
RED:     math.test.ts — "missing peer-dep: mdastTransform returns tree unchanged (EC-2)"
GREEN:   implementar
VERIFY:  pnpm test
```

#### Acceptance Criteria
- [ ] Inline + block functional
- [ ] 7 tests verdes
- [ ] Lista MathML cobre ≥ 30 tags (EC-4)
- [ ] Peer-dep ausente: degrade graceful + erro tipado (EC-2)

#### DoD
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 8: Plugin Mermaid (Tier 2)

### T8.1 — Mermaid plugin com lazy render

#### Files to edit
```
src/components/primitives/slide/plugins/mermaid/index.tsx (NEW)
src/components/primitives/slide/plugins/mermaid/mermaid-diagram.tsx (NEW)
... (tsup, sync, peer-dep)
```

#### Deep Dives
```tsx
// MermaidDiagram component
export function MermaidDiagram({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    // EC-2: peer-dep guard via try/catch no dynamic import.
    import("mermaid")
      .then((mermaid) => {
        if (cancelled) return;
        mermaid.default.initialize({ startOnLoad: false, theme: "default" });
        const id = `mmd-${Math.random().toString(36).slice(2)}`;
        return mermaid.default.render(id, code);
      })
      .then((result) => {
        if (!cancelled && result && ref.current) ref.current.innerHTML = result.svg;
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          e?.message?.includes("Cannot find module") || e?.code === "ERR_MODULE_NOT_FOUND"
            ? "Mermaid not installed. Run: pnpm add mermaid"
            : `Mermaid render failed: ${e?.message ?? e}`,
        );
      });
    return () => { cancelled = true; };
  }, [code]);
  // EC-10: SSR placeholder + error fallback são distinguíveis.
  if (error) {
    return (
      <div data-theo-slide-mermaid data-state="error" role="img" aria-label={error}>
        <pre style={{ fontSize: "0.8em", opacity: 0.6 }}>{code}</pre>
      </div>
    );
  }
  return (
    <div
      ref={ref}
      data-theo-slide-mermaid
      data-state="loading"
      role="img"
      aria-label="Loading mermaid diagram"
    >
      <pre style={{ fontSize: "0.8em", opacity: 0.4 }}>{code}</pre>
    </div>
  );
}

// Plugin
export function mermaidPlugin(): SlidePlugin {
  return {
    name: "mermaid",
    // EC-4: Mermaid renderiza SVG complexo. Lista exaustiva baseada em mermaid.js
    // output (todos os diagram types: flowchart, sequence, class, state, ER, gantt, pie).
    // Sem essa lista, o sanitize STRIPPA o SVG inteiro e o diagrama somente.
    sanitizeSchemaExtension: {
      tagNames: [
        "div",
        // SVG root + grouping
        "svg", "g", "defs", "use", "symbol", "marker", "pattern", "mask", "clipPath",
        // SVG shapes
        "path", "rect", "circle", "ellipse", "line", "polyline", "polygon",
        // SVG text
        "text", "tspan", "textPath", "title", "desc",
        // SVG gradients + filters
        "linearGradient", "radialGradient", "stop", "filter",
        "feGaussianBlur", "feOffset", "feColorMatrix", "feComponentTransfer",
        "feComposite", "feMerge", "feMergeNode", "feFlood",
        // SVG foreign content (mermaid uses for HTML labels)
        "foreignObject",
        // HTML inside foreignObject (controlled — already in defaultSchema mostly)
        "span", "br",
      ],
      attributes: {
        "*": [
          "id", "class", "style", "transform", "fill", "stroke",
          "strokeWidth", "strokeDasharray", "strokeLinecap", "strokeLinejoin",
          "opacity", "fillOpacity", "strokeOpacity",
          "ariaLabel", "ariaHidden", "role",
        ],
        svg: [
          "xmlns", "viewBox", "width", "height", "preserveAspectRatio",
          "xmlnsXlink", "version",
        ],
        path: ["d", "markerEnd", "markerStart", "markerMid"],
        rect: ["x", "y", "width", "height", "rx", "ry"],
        circle: ["cx", "cy", "r"],
        ellipse: ["cx", "cy", "rx", "ry"],
        line: ["x1", "y1", "x2", "y2"],
        polyline: ["points"],
        polygon: ["points"],
        text: ["x", "y", "dx", "dy", "textAnchor", "dominantBaseline", "fontSize", "fontFamily", "fontWeight"],
        tspan: ["x", "y", "dx", "dy"],
        textPath: ["xlinkHref", "href", "startOffset"],
        marker: ["markerUnits", "markerWidth", "markerHeight", "refX", "refY", "orient", "viewBox"],
        use: ["xlinkHref", "href", "x", "y", "width", "height"],
        linearGradient: ["x1", "y1", "x2", "y2", "gradientUnits"],
        radialGradient: ["cx", "cy", "r", "fx", "fy", "gradientUnits"],
        stop: ["offset", "stopColor", "stopOpacity"],
        foreignObject: ["x", "y", "width", "height"],
        div: ["data-state"],
      },
    },
    components: {
      "theo-mermaid": (props: any) => <MermaidDiagram code={props["data-code"] ?? ""} />,
    },
    async hastTransform(tree) {
      const { visit } = await import("unist-util-visit");
      visit(tree, "element", (node: any) => {
        if (node.tagName !== "code") return;
        const classNames = (node.properties?.className as string[]) ?? [];
        if (!classNames.includes("language-mermaid")) return;
        const code = (node.children?.[0] as any)?.value ?? "";
        // Replace this code element with a custom one that triggers our component.
        // Approach: change the parent <pre> to a custom element name.
        // hast-util-to-jsx-runtime maps element tagName to a component if found in `components` map.
        // We use a hyphenated tag name "theo-mermaid" so React lower-cases it correctly.
        // The mermaidPlugin.components above wires the React renderer.
        // Implementation: change tagName + property carrying the code.
        // ...
      });
      return tree;
    },
  };
}
```
- **Invariantes:**
  - Render client-only (mermaid measures DOM).
  - SVG injetado via innerHTML (mermaid SVG é trusted output).
  - SSR mostra placeholder.

#### Tasks
1. Plugin + component (com peer-dep guard EC-2 + error/loading states EC-10).
2. Tsup, sync, peer-dep.
3. Tests cobrindo SSR placeholder, error fallback, sanitize-schema preservando SVG.

#### TDD
```
RED:     mermaid.test.ts — "plugin returns object with name 'mermaid'"
RED:     mermaid.test.ts — "hastTransform converts <code class='language-mermaid'> into <theo-mermaid>"
RED:     mermaid.test.ts — "sanitizeSchemaExtension preserves <svg><g><path>..</path></g></svg> (EC-4)"
RED:     mermaid.test.ts — "MermaidDiagram SSR renders placeholder with role=img + aria-label (EC-10)"
RED:     mermaid.test.ts — "MermaidDiagram peer-dep missing renders error fallback with source code (EC-2/EC-10)"
RED:     mermaid.test.ts — "non-mermaid code blocks unchanged"
GREEN:   implementar
VERIFY:  pnpm test
```

#### Acceptance Criteria
- [ ] ` ```mermaid ` block renderiza diagrama
- [ ] SSR não crashea (placeholder com source code)
- [ ] Plugin sub-bundle isolado
- [ ] Lista SVG cobre ≥ 30 tags (EC-4)
- [ ] Peer-dep ausente: error fallback (EC-2) — não tela branca
- [ ] 6 tests verdes

#### DoD
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 9: Plugin Emoji (Tier 2)

### T9.1 — Emoji plugin com map literal

#### Files to edit
```
src/components/primitives/slide/plugins/emoji/index.ts (NEW)
src/components/primitives/slide/plugins/emoji/map.ts (NEW) — 100 emojis
src/components/primitives/slide/plugins/emoji/index.test.ts (NEW)
... (tsup, sync — NO peer-dep)
```

#### Deep Dives
```ts
// map.ts — top 100 emojis common in tech presentations
export const EMOJI_MAP: Record<string, string> = {
  smile: "😀", grin: "😁", joy: "😂", heart_eyes: "😍",
  rocket: "🚀", fire: "🔥", star: "⭐", sparkles: "✨",
  check: "✅", x: "❌", warning: "⚠️", question: "❓",
  thumbsup: "👍", thumbsdown: "👎", clap: "👏", wave: "👋",
  // ... ~100 total
};

// index.ts
const SHORTCODE_RE = /:([a-z_+-]+):/g;

// EC-6: ancestor check para NÃO replace dentro de <code>/<pre>. Caso contrário,
// code samples com `:colon:syntax` (Python type hints, YAML keys, Ruby symbols)
// são corrompidos silenciosamente.
function isInsideCodeOrPre(ancestors: Array<{ type: string; tagName?: string }>): boolean {
  for (const a of ancestors) {
    if (a.type !== "element") continue;
    if (a.tagName === "code" || a.tagName === "pre") return true;
  }
  return false;
}

export function emojiPlugin(): SlidePlugin {
  return {
    name: "emoji",
    async hastTransform(tree) {
      // visitParents é trans-dep de unist-util-visit (mesmo pacote unist) — sem peer-dep nova.
      const { visitParents } = await import("unist-util-visit-parents");
      visitParents(tree, "text", (node: any, ancestors: any[]) => {
        if (isInsideCodeOrPre(ancestors)) return;
        node.value = node.value.replace(SHORTCODE_RE, (m: string, code: string) => {
          return EMOJI_MAP[code] ?? m;
        });
      });
      return tree;
    },
  };
}
```
- **Invariantes:**
  - Unknown shortcode left as-is (`:foo:` text).
  - Zero peer-deps de runtime (unist-util-visit-parents já é dep transitiva do hast stack).
  - **EC-6:** shortcodes dentro de `<code>` ou `<pre>` NÃO são replaced.

#### Tasks
1. Map de 100 emojis.
2. Plugin.
3. Tests.

#### TDD
```
RED:     emoji.test.ts — "replaces :smile: with 😀"
RED:     emoji.test.ts — "leaves :unknown: as-is"
RED:     emoji.test.ts — "handles multiple shortcodes in one text"
RED:     emoji.test.ts — "ignores shortcodes inside <code> blocks (EC-6)"
RED:     emoji.test.ts — "ignores shortcodes inside <pre> blocks (EC-6)"
RED:     emoji.test.ts — "ignores shortcodes inside nested code (e.g. <p><code>:rocket:</code></p>) (EC-6)"
RED:     emoji.test.ts — "replaces shortcodes outside code even when sibling has code"
GREEN:   implementar
VERIFY:  pnpm test
```

#### Acceptance Criteria
- [ ] 100 emojis suportados
- [ ] 7 tests verdes
- [ ] Ancestor check via visitParents (EC-6)
- [ ] Zero peer-deps de runtime adicionais

#### DoD
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 10: Docs + RFC + quality:gates

### T10.1 — RFC 0004

#### Files to edit
```
docs/rfcs/0004-slide-rich-content.md (NEW)
docs/rfcs/README.md
```

### T10.2 — README + CHANGELOG + CLAUDE.md

### T10.3 — quality:gates full chain

---

## Phase 11: Playground demo

### T11.1 — Aba "Slide Rich" no playground

Cenas para cada feature:
- Alert each type (5 callouts)
- Each layout (7 layouts)
- Background image + gradient
- Marpit `![bg]()`
- Header/footer/paginate
- Shiki syntax highlight (TS, Python, JSON)
- KaTeX inline + block
- Mermaid flowchart + sequence
- Emoji shortcodes

---

## Phase 12: Dogfood QA (MANDATORY)

### Execution

1. `pnpm dogfood:slide-rich` (novo script — SSR check de cada feature).
2. Manual smoke em playground com cada cena.
3. Bundle isolation final check (8 banned deps + 4 plugin peer-deps externos).

### Acceptance Criteria

- [ ] dogfood:slide-rich exit 0
- [ ] Todas as cenas Ladle renderizam
- [ ] Tier 1 features funcionam SEM plugins prop
- [ ] Tier 2 features funcionam COM plugins prop (cada plugin testado isoladamente)
- [ ] Bundle baseline OK
- [ ] Zero CRITICAL issues

---

## Coverage Matrix

| # | Gap / Requirement | Task(s) | Resolution |
|---|---|---|---|
| 1 | Plugin architecture functional | T0.1, T0.2, T0.3 | SlidePlugin type + composePlugins + parseSlide integration |
| 2 | GFM alerts (5 types) | T1.1, T1.2 | mdast post-process + CSS themes |
| 3 | Layout directives (7 layouts) | T2.1, T2.2 | Schema enum + CSS grid templates |
| 4 | Background image sanitized | T3.1 | sanitizeBgUrl + inline style |
| 5 | Marpit `![bg]()` syntax | T4.1 | mdast walk + ParsedSlide.extractedBackground (D18) |
| 6 | Header/footer/pagination overlays | T5.1 | Schema + absolute-positioned divs |
| 7 | Shiki plugin (lazy + opt-in) | T6.1 | hastTransform + sanitize-schema ext |
| 8 | KaTeX plugin (inline + block) | T7.1 | mdast + hast transforms |
| 9 | Mermaid plugin (lazy + client) | T8.1 | MermaidDiagram component + plugin |
| 10 | Emoji plugin (no deps) | T9.1 | 100-emoji map + regex replace |
| 11 | Sub-subpath isolation for plugins | T6.1, T7.1, T8.1, T9.1 | tsup entries + sync-exports |
| 12 | RFC 0004 published | T10.1 | docs/rfcs/0004-slide-rich-content.md |
| 13 | README + CHANGELOG + CLAUDE.md | T10.2 | docs alignment |
| 14 | quality:gates verde | T10.3 | full chain |
| 15 | Playground demo each feature | T11.1 | 13+ cenas representativas |
| 16 | Dogfood QA mandatory | Phase 12 | SSR + manual smoke + bundle |
| 17 | **EC-1 Plugin error isolation** (D16) | T0.2 | try/catch em cada plugin call; coleta em `errors[]` com `PLUGIN_ERROR` |
| 18 | **EC-2 Plugin peer-dep guard** | T6.1, T7.1, T8.1 | try/catch em `await import(...)`; degrade graceful + erro tipado |
| 19 | **EC-3 Sanitize-schema merge** (D17) | T0.2 | `sanitizeHast(tree, extensions)` mergeia defaultSchema |
| 20 | **EC-4 MathML/SVG complete tag lists** | T7.1, T8.1 | ≥30 MathML tags + ≥30 SVG tags + atributos explícitos |
| 21 | **EC-5 Marpit bg → ParsedSlide.extractedBackground** (D18) | T4.1 | Campo novo; frontmatter ganha precedência |
| 22 | **EC-6 Emoji ancestor check** | T9.1 | `visitParents` + skip `<code>`/`<pre>` |
| 23 | **EC-7 backgroundImage cap + data: reject** | T3.1 | Cap 500_000 chars + `sanitizeBgUrl` rejeita `data:` URLs |

**Coverage: 23/23 requirements (100%)** — incluindo todos os 7 MUST FIX do edge-case review.

## Global Definition of Done

- [ ] Phases 0-11 completas
- [ ] `pnpm quality:gates` verde (incluindo `dogfood:slide-rich`)
- [ ] Cobertura de `src/components/primitives/slide/plugins/` ≥ 85%
- [ ] Bundle `dist/index.js` (barrel) inalterado
- [ ] Bundle `dist/slide/index.js` ≤ 15 KB
- [ ] Cada `dist/slide/plugins/X/index.js` ≤ 5 KB sem peer-deps
- [ ] RFC 0004 Status = IMPLEMENTED + consumer documentado
- [ ] CHANGELOG entry final
- [ ] CLAUDE.md atualizado
- [ ] Playground demo "Slide Rich" funcional
- [ ] **Dogfood QA passa** (Phase 12)
- [ ] Runtime-metric proof: plugin peer-deps (shiki/katex/mermaid) NÃO aparecem no barrel nem no Slide base

## Notas sobre escopo deliberadamente NÃO incluído

- **PPTX import** — out of scope.
- **Custom themes registrados via prop** — apenas 2 built-in.
- **Footnotes / definition lists / superscript** — defaultSchema já permite via HTML inline.
- **Twemoji** — emoji plugin em v0.5 se demanda.
- **Mermaid SSR** — render client-only por design.
- **Math via MathJax** — KaTeX é a escolha; MathJax é v0.5 se necessário.
- **Highlight de output** (terminal/log lines) — fora; consumer usa shiki com lang adequado.
- **Spot directives Marpit (`_layout:`)** — `<SlideDeck>` v0.5.
