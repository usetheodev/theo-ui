# Edge Case Review — slide-rich-content

**Data:** 2026-05-19
**Plano:** `.claude/knowledge-base/plans/slide-rich-content-plan.md`
**Tasks analisadas:** 18 tasks distribuídas em 13 phases (incluindo Dogfood)
**Edge cases encontrados:** 15 (MUST FIX: 7, SHOULD TEST: 5, DOCUMENT: 3)

**Veredicto: PLANO PRECISA DE AJUSTE** — 7 MUST FIX, todos pequenos (1-5 linhas cada). A maioria vive nas fronteiras: plugin error handling, peer-dep ausente, sanitize-schema merge, conflict entre Marpit `![bg]()` extractor e schema, emoji escaping em code blocks. Fixes são cirúrgicos — ADRs novos D16-D18 cobrem três deles. Sem essas correções a plataforma de plugins quebra em casos comuns.

---

## MUST FIX

### EC-1: Plugin error isolation ausente — uma plugin com bug derruba o slide inteiro

- **Task afetada:** T0.2 (parseSlide integra plugins)
- **Família:** State / Resilience
- **Cenário:** `parseSlide` promete "never throws on input" (RFC 0002 D9). Mas o plan T0.2 mostra:
  ```ts
  const transformedMdast = await compose.runMdast(mdastTree);
  ```
  Se um plugin lança (e.g. `shikiPlugin` ao receber código com encoding inválido, ou `mathPlugin` com regex malformada), a exception propaga para o caller. Slide quebra em vez de renderizar fallback.
- **Impacto:** Bug em UM plugin destrói TODOS os slides daquele deck. Quebra contract de `parseSlide.never throws`.
- **Fix sugerido:** Envolver cada plugin invocation em try/catch dentro de `composePlugins.runMdast` e `runHast`:
  ```ts
  for (const p of plugins) {
    if (!p.mdastTransform) continue;
    try { current = await p.mdastTransform(current); }
    catch (e) {
      errors.push({ code: "PLUGIN_ERROR", path: [], message: `Plugin '${p.name}' failed: ${e}`, got: p.name });
    }
  }
  ```
  Adicionar `errors: SlideValidationError[]` como out-param ou retorno; `parseSlide` os agrega.

### EC-2: Plugin missing peer-dep crasha o slide em runtime

- **Task afetada:** T6.1 (Shiki), T7.1 (Math), T8.1 (Mermaid)
- **Família:** Boundary / Resource
- **Cenário:** Consumer importa `shikiPlugin` mas esquece de `pnpm add shiki`. Em runtime, `await import("shiki")` lança `ERR_MODULE_NOT_FOUND` no client. Slide quebra com tela branca + console error opaco.
- **Impacto:** Erro críptico em produção; consumer não sabe que peer-dep falta. Pior que crash silencioso pois usuário final vê tela branca.
- **Fix sugerido:** Cada plugin envolve o dynamic import em try/catch + return no-op com warn:
  ```ts
  async function getHighlighter() {
    try {
      const shiki = await import("shiki");
      // ...
    } catch {
      console.warn("[slide/plugins/shiki] peer-dep 'shiki' not installed; falling back to plain <pre>");
      return null;  // hastTransform short-circuits if null
    }
  }
  ```
  Ou emitir `errors.push({ code: "PLUGIN_PEER_DEP_MISSING", got: "shiki" })`.

### EC-3: Sanitize-schema extension não é aplicada — plugins falham silenciosamente

- **Task afetada:** T0.2 (parseSlide integration)
- **Família:** State / Plugin contract
- **Cenário:** Plan ADR D13 + T0.1 definem `sanitizeSchemaExtension` no plugin shape. T0.2 menciona "estender sanitizeHast para aceitar schema extensions" mas o código de exemplo NÃO mostra como o `sanitizeHast` interno (que hoje chama `getSlideSanitizeSchema()` → `defaultSchema`) recebe as extensions. Sem o merge, plugins como Shiki/KaTeX/Mermaid injetam `<span style class>` que o sanitize defaultSchema STRIPPA → conteúdo desaparece silenciosamente.
- **Impacto:** Plugins parecem funcionar (não throw) mas o conteúdo highlighted é apagado pelo sanitize. Bug invisível em testes simples; aparece só em integração real.
- **Fix sugerido:** Esclarecer em T0.2 (e implementar em `sanitize.ts`):
  ```ts
  // sanitize.ts
  export async function getSlideSanitizeSchema(extensions?: SanitizeExtensions) {
    const { defaultSchema } = await import("hast-util-sanitize");
    if (!extensions) return defaultSchema;
    return {
      ...defaultSchema,
      tagNames: [...(defaultSchema.tagNames ?? []), ...(extensions.tagNames ?? [])],
      attributes: { ...(defaultSchema.attributes ?? {}), ...(extensions.attributes ?? {}) },
    };
  }
  // parseSlide.ts
  const ext = compose.mergedSanitizeExtensions();
  const { tree: safeTree, bannedTags } = await sanitizeHast(hastTree, ext);
  ```

### EC-4: KaTeX/Mermaid/Shiki HTML pode ser strippado mesmo com schema extension (lista incompleta)

- **Task afetada:** T7.1 (KaTeX), T8.1 (Mermaid)
- **Família:** Format / Security
- **Cenário:** Plan T7.1 lista `tagNames: ["span", "div", "math", "annotation", "semantics"]` para math, mas KaTeX produz dezenas de elementos MathML: `mtext`, `mn`, `mo`, `mi`, `mfrac`, `msqrt`, `msup`, `msub`, `munder`, `mover`, etc. Sanitize strippa os não-listados → fórmula renderiza como string crua.
- **Impacto:** Fórmulas KaTeX renderizam quebradas. Mesma classe de bug para Mermaid (SVG inteiro com `<g>`, `<path>`, `<line>`, `<text>`, `<rect>`).
- **Fix sugerido:** Estratégia mais segura: cada plugin define sua extension de schema GERADA via runtime walk do output real (ou lista exaustiva). Para v0.4, listas exaustivas baseadas na docs:
  ```ts
  // math plugin
  sanitizeSchemaExtension: {
    tagNames: ["span", "div", "math", "annotation", "semantics",
               "mtext", "mn", "mo", "mi", "ms", "mfrac", "msqrt",
               "msup", "msub", "msubsup", "munder", "mover", "munderover",
               "mrow", "mspace", "mphantom", "mstyle", "merror"],
    attributes: {
      "*": ["className", "style", "ariaHidden"],
      math: ["xmlns", "display"],
      annotation: ["encoding"],
    },
  }
  // mermaid plugin: ALL svg-related tags (svg, g, path, line, text, rect, polygon, marker, defs, foreignObject, ...)
  ```
  Documentar a lista exaustiva em cada plugin doc.

### EC-5: Marpit `![bg]()` extractor não consegue augmentar frontmatter já validado

- **Task afetada:** T4.1 (Marpit bg syntax) vs T3.1 (background schema)
- **Família:** State / Pipeline ordering
- **Cenário:** Pipeline atual:
  1. `validateSlide` parseia frontmatter (`backgroundImage` já set ou não).
  2. `parseBody` → mdast.
  3. `extractMarpitBackgrounds(mdastTree)` retorna `{ tree, background }`.
  4. Plan diz "augmenta frontmatter.backgroundImage se não setado" — mas o frontmatter object já foi validado e está em escopo separado.

  Sem retornar o background como dado paralelo, o slide component não tem acesso à URL extraída.
- **Impacto:** Marpit syntax parece detectada (no debug) mas NÃO aplicada. Background do slide fica branco.
- **Fix sugerido:** `ParsedSlide` ganha campo opcional + slide component dá preferência ao explicit frontmatter:
  ```ts
  interface ParsedSlide {
    // ...
    extractedBackground?: { url: string; modifier?: string };
  }
  // No Slide component:
  const bgUrl = frontmatter.backgroundImage ?? parsed?.extractedBackground?.url;
  ```

### EC-6: Emoji plugin replace dentro de code blocks (regex walka todos os text nodes)

- **Task afetada:** T9.1 (Emoji plugin)
- **Família:** Format
- **Cenário:** Plan TDD test #4 diz "ignores shortcodes inside code blocks". MAS a implementação proposta usa `visit(tree, "text", ...)` que matcha qualquer text node — inclusive os filhos de `<code>` e `<pre>`. Regex substitui `:rocket:` → 🚀 dentro de string literals de código, alterando o que o usuário escreveu.
- **Impacto:** Code samples com `:colon:syntax` (Python type hints, YAML, etc.) ficam corrompidos. Bug silencioso.
- **Fix sugerido:** Usar `unist-util-visit-parents` (já trans-dep de mdast utilities) com ancestor check:
  ```ts
  import { visitParents } from "unist-util-visit-parents";
  visitParents(tree, "text", (node, ancestors) => {
    if (ancestors.some((a: any) => a.tagName === "code" || a.tagName === "pre")) return;
    node.value = node.value.replace(SHORTCODE_RE, ...);
  });
  ```

### EC-7: `backgroundImage` schema cap de 2KB rejeita data: URLs reais

- **Task afetada:** T3.1 (background image schema)
- **Família:** Input
- **Cenário:** Plan: `backgroundImage: z.string().max(2_000)`. Mas uma imagem 16:9 mesmo otimizada como base64 data URI é facilmente 50-500 KB. Cap 2KB rejeita 100% dos casos práticos de data: URLs.
- **Impacto:** Consumer que tenta inline image (e.g. agent-emitted base64) é silenciosamente rejeitado.
- **Fix sugerido:** Aumentar para 500_000 chars OU rejeitar data: URLs no sanitizer e documentar (consumer deve usar URL hospedada). Decisão: REJEITAR data: por segurança/perf. Atualizar `sanitizeBgUrl` para rejeitar `data:image/...` se quiser ser strict; deixar passar se aceitar; cap 500_000.
  ```ts
  backgroundImage: z.string().max(500_000).optional()
  // E sanitizeBgUrl decide se data: passa
  ```

---

## SHOULD TEST

### EC-8: Layout `two-column` distribui N children arbitrariamente — sem convenção definida

- **Task afetada:** T2.2 (Layout templates)
- **Teste sugerido:** `test_two_column_layout_with_N_children` — render com 1, 2, 3, 4 children; assertar que CSS grid coloca:
  - 1 child → span both columns
  - 2 children → 1 per column
  - 3+ children → first 2 split, rest stack below

  Documentar essa convenção no JSDoc do layout. Ou simplificar: forçar consumer a usar `---` horizontal-rule dentro do slide para indicar break de coluna (não é trivial em CommonMark — defer pra v0.5).

### EC-9: Plugin order — emoji DEPOIS de shiki replace tokens dentro de spans

- **Task afetada:** T6.1 (Shiki) + T9.1 (Emoji) + ADR D13 (order)
- **Teste sugerido:** `test_plugin_order_emoji_after_shiki_does_not_replace_in_highlighted_code` — passar plugins `[shikiPlugin(), emojiPlugin()]` (errado), assertar que `:rocket:` dentro de TypeScript string ainda renderiza como texto. Combinar com EC-6 fix: emoji ancestor-check resolve mesmo se ordem inverter. Doc: ordem recomendada é `[emojiPlugin(), shikiPlugin(), mathPlugin(), mermaidPlugin()]`.

### EC-10: Mermaid SSR placeholder não distinguível de erro

- **Task afetada:** T8.1 (Mermaid)
- **Teste sugerido:** `test_mermaid_ssr_renders_placeholder_with_aria_label` — `renderToString(<MermaidDiagram code="..."/>)` retorna `<div data-theo-slide-mermaid aria-label="Loading diagram">...</div>` com pelo menos um indicador textual. Para print mode (CSS @media print), placeholder deve mostrar source code mermaid como fallback (PDF não pode renderizar SVG dinâmico). Fix opcional no plan: print CSS mostra `<pre>{code}</pre>` em vez do placeholder.

### EC-11: `paginate: "hold"` e `"skip"` comportamento undefined

- **Task afetada:** T5.1, T7 (Pagination)
- **Teste sugerido:** `test_paginate_skip_hides_overlay` + `test_paginate_hold_shows_previous_number` (em SlideDeck context). Marpit define: skip = não conta no total e oculta; hold = conta mas mostra o anterior. Em v0.4, pragmatic: implementar só `true` e `"skip"`; `"hold"` é v0.5 (requer state externo do deck).

### EC-12: Plugin que retorna mdast/hast tree NÃO Root quebra pipeline

- **Task afetada:** T0.1 (SlidePlugin contract)
- **Teste sugerido:** `test_composePlugins_validates_return_is_Root` — plugin que retorna `null` ou `undefined` ou `{ type: "paragraph" }` quebra o pipeline. Composer faz guard: se return não é objeto com `type === "root"`, usa o tree anterior + emite error. Defensive programming.

---

## DOCUMENT

### EC-13: Shiki bundle size escala linear com línguas

- **Risco aceito:** Plan diz ~50KB com 5 línguas; ~200KB com 30. Sem fix possível (cada grammar é dado). Documentar no JSDoc do plugin que `langs` array decide o footprint. Sugerir fingerless tree-shaking: ` shikiPlugin({ langs: ["ts","python"] })` é diferente de `[...].`

### EC-14: KaTeX requires CSS + fonts setup pelo consumer

- **Risco aceito:** KaTeX usa fontes próprias (KaTeX_AMS, KaTeX_Caligraphic, etc.). Consumer precisa de:
  ```ts
  import "katex/dist/katex.min.css";  // 23 KB
  // E as fontes resolvem-se via URLs relativos no CSS
  ```
  Documentar no README seção "Plugins > Math" + sample setup. Sem isso, fórmulas renderizam sem estilo.

### EC-15: Mermaid theme não alinha com Violet Forge

- **Risco aceito:** Mermaid tem temas internos (`default`, `forest`, `dark`, `neutral`, `base`). Mermaid renderizado dentro de slide `violet-forge` vai parecer visualmente desconectado. v0.4 documenta; v0.5 considera `mermaidPlugin({ themeVariables: { ... } })` mapeando para CSS vars do Violet Forge.

---

## Padrões Sistêmicos Detectados

| Padrão | Encontrado? | Onde |
|--------|-------------|------|
| Implemented but not wired | **Sim** | EC-3 (sanitize-schema extension não mergeada), EC-5 (marpit bg não chega ao component) |
| Plugin error isolation gap | **Sim** | EC-1 (sem try/catch), EC-2 (peer-dep missing) |
| Schema mismatch / sanitize gap | **Sim** | EC-3, EC-4 (listas incompletas) |
| Input validation gap at boundary | **Sim** | EC-7 (cap muito apertado), EC-6 (regex escopo errado) |
| Order-of-operations matters | **Sim** | EC-9 (plugin order), EC-12 (return shape) |

---

## Resumo por Task

| Task | Edges encontrados | MUST FIX | SHOULD TEST | DOCUMENT |
|------|-------------------|----------|-------------|----------|
| T0.1 — SlidePlugin contract | 1 | 0 | 1 (EC-12) | 0 |
| T0.2 — parseSlide integration | 2 | 2 (EC-1, EC-3) | 0 | 0 |
| T0.3 — Props forwarding | 0 | 0 | 0 | 0 |
| T1.1 / T1.2 — GFM alerts | 0 | 0 | 0 | 0 |
| T2.1 — Layout schema | 0 | 0 | 0 | 0 |
| T2.2 — Layout CSS | 1 | 0 | 1 (EC-8) | 0 |
| T3.1 — Background schema | 1 | 1 (EC-7) | 0 | 0 |
| T4.1 — Marpit ![bg]() | 1 | 1 (EC-5) | 0 | 0 |
| T5.1 — Header/footer/paginate | 1 | 0 | 1 (EC-11) | 0 |
| T6.1 — Shiki plugin | 2 | 1 (EC-2 partial) | 1 (EC-9) | 1 (EC-13) |
| T7.1 — Math plugin | 2 | 2 (EC-2 partial, EC-4 partial) | 0 | 1 (EC-14) |
| T8.1 — Mermaid plugin | 2 | 1 (EC-4 partial) | 1 (EC-10) | 1 (EC-15) |
| T9.1 — Emoji plugin | 1 | 1 (EC-6) | 0 | 0 |
| T10-T12 — Docs + dogfood | 0 | 0 | 0 | 0 |
| **Total** | **15** | **7** | **5** | **3** |

---

## Ajustes propostos ao plano (antes de aprovar)

1. **T0.1 / T0.2 — Plugin error isolation (EC-1):** `composePlugins.runMdast` e `runHast` envolvem cada plugin call em try/catch; coletam erros em array. Reducer adiciona ao `errors[]` retornado pelo parseSlide com `code: "PLUGIN_ERROR"`. Adicionar **ADR D16** explicitamente.

2. **T0.2 — Sanitize-schema merge (EC-3):** Mostrar implementação explícita de `sanitizeHast(tree, extensions)` que mergeia `defaultSchema` com extensions. Sem isso, plugins funcionam silenciosamente errados. **Update T0.2 deep dive.**

3. **T6.1 / T7.1 / T8.1 — Plugin peer-dep guard (EC-2):** Cada plugin envolve `await import("...")` em try/catch + emite `PLUGIN_PEER_DEP_MISSING` error code. Default behavior: no-op gracefully. **Update each plugin's Deep Dives section.**

4. **T7.1 — Listar TODAS as tags MathML (EC-4):** Substituir lista `["span","div","math","annotation","semantics"]` por lista exaustiva (~20 tags). **Update T7.1 deep dive.**

5. **T8.1 — Listar TODAS as tags SVG mermaid (EC-4):** Lista exaustiva SVG + atributos comuns (`d`, `transform`, `viewBox`, etc.). **Update T8.1 deep dive.**

6. **T4.1 — ParsedSlide.extractedBackground (EC-5):** Adicionar campo opcional ao ParsedSlide e ajustar Slide component para preferi-lo após `frontmatter.backgroundImage`. **Update T4.1 deep dive + slide.tsx integration.**

7. **T9.1 — Emoji ancestor check (EC-6):** Trocar `visit(tree, "text", ...)` por `visitParents(tree, "text", (node, ancestors) => ...)` com check de code/pre. **Update T9.1 deep dive.**

8. **T3.1 — Aumentar backgroundImage cap OU rejeitar data: (EC-7):** Cap para 500_000 chars OU rejeitar `data:image/` no sanitizer. Decisão: REJEITAR `data:` URLs no sanitizer para preservar perf (slides grandes via data URI são anti-pattern). Adicionar regra explícita em `sanitizeBgUrl`. **Update T3.1.**

SHOULD TEST e DOCUMENT viram tests adicionais nos TDD cycles existentes — sem novas tasks.

**Novos ADRs sugeridos:**
- **D16 — Plugin error isolation:** Cada plugin call em try/catch; errors agregados em `ParsedSlide.errors[]` com `code: "PLUGIN_ERROR" | "PLUGIN_PEER_DEP_MISSING"`. parseSlide nunca propaga exception de plugin.
- **D17 — Sanitize-schema merge é OBRIGATÓRIO:** `sanitizeHast` aceita `extensions` arg e mergeia com `defaultSchema`. Plugin que precisa de tags custom DEVE declarar via `sanitizeSchemaExtension`, senão o conteúdo é strippado.
- **D18 — Marpit `![bg]()` resultado vai em `ParsedSlide.extractedBackground`:** Não tentar mutar frontmatter já validado; preferência: explicit frontmatter > extracted Marpit > undefined.
