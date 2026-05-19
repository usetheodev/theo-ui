# Edge Case Review — slide-view-primitive

**Data:** 2026-05-19
**Plano:** `.claude/knowledge-base/plans/slide-view-primitive-plan.md`
**Tasks analisadas:** 21 tasks distribuídas em 7 phases (incluindo Dogfood)
**Edge cases encontrados:** 15 (MUST FIX: 5, SHOULD TEST: 5, DOCUMENT: 5)

**Veredicto: PLANO PRECISA DE AJUSTE** — 5 MUST FIX (todos pequenos, 1-5 linhas cada ou ajuste de uma frase no plano). Bloqueiam consistência interna do plano (3 dos 5 são promessas feitas em uma task que outra task não cumpre). Resto é incorporável como testes adicionais aos TDD cycles existentes ou notas no RFC.

---

## MUST FIX

### EC-1: `BANNED_TAG` callback promised in 3 places but T2.5 explicitly defers detection to v0.2

- **Task afetada:** T2.5 vs T4.1 (AC) vs T4.2 (story `BannedScript`) vs §1 #5 vs Coverage Matrix #7
- **Família:** State / Consistency
- **Cenário:** `<script>`, `<iframe>` etc. são strippados pelo sanitize (defaultSchema, T2.3) — comportamento correto. Mas o plano promete em três lugares que `onValidationError` recebe um `BANNED_TAG` quando isso acontece (T4.1 AC; Coverage Matrix #7; story `BannedScript`). T2.5 explicitamente diz: *"For now, no per-tag detection — opt-in via opts.detectBanned in v0.2"*. Resultado: a acceptance criterion `calls onValidationError with BANNED_TAG for <script>` é unverifiable, e a story `BannedScript` testa visualmente que a tag foi strippada mas NÃO consegue afirmar que o callback disparou.
- **Impacto:** Plano internamente inconsistente. TDD cycle do T4.1 inclui *"strips <script>, returns BANNED_TAG"* — esse teste vai falhar consistentemente OU será silenciosamente ignorado. Cross-validation reprova.
- **Fix sugerido:** Implementar detecção barata em T2.3 (5-10 linhas). Comparar contagem por tag antes/depois do sanitize:
  ```ts
  // src/components/primitives/slide/parse.ts (estender sanitizeHast)
  function collectTagCounts(tree: HastRoot): Map<string, number> {
    const counts = new Map<string, number>();
    const walk = (node: any) => {
      if (node.type === "element") counts.set(node.tagName, (counts.get(node.tagName) ?? 0) + 1);
      for (const child of node.children ?? []) walk(child);
    };
    walk(tree); return counts;
  }
  // No orchestrator: comparar pre/pós sanitize, emitir BANNED_TAG por tag removida.
  ```
  Alternativa: remover as promessas em T4.1 AC + T4.2 BannedScript story + §1 #5 + Coverage Matrix #7 e adiar detecção para v0.2. **Decisão a tomar antes da Phase 2.**

### EC-2: `validateSlide` declarado sync mas `yaml.parse` é lazy-imported (async)

- **Task afetada:** T1.2
- **Família:** Concurrency / API signature
- **Cenário:** T1.2 declara `validateSlide(markdown: string): ValidationResult` (sync return) mas o corpo da task instrui: *"Se `rawFrontmatter !== null`: lazy import `yaml` (`const yaml = await import("yaml")`)"*. Dynamic `import()` retorna Promise — não dá para chamar de função sync.
- **Impacto:** Type-check falha (`await` em função não-async) OU a implementação faz top-level static import (vaza yaml para o bundle do barrel quando subpath é importado, mas é tolerável). Plano internamente inconsistente.
- **Fix sugerido:** Escolher um dos dois caminhos antes da Phase 1:
  - **A (recomendado):** Mudar signature para `validateSlide(markdown: string): Promise<ValidationResult>`. Adapta T4.1 useEffect chain (já é async, integra naturalmente).
  - **B:** Tornar yaml hard-import (sem lazy) — yaml é pequeno (~30 KB sem deps), mas atrasa parsing em consumers que nunca passam frontmatter. Marginal.

### EC-3: `aspectRatio: { width: 0, height: 0 }` causa divisão por zero em `useSlideFit`

- **Task afetada:** T3.1, T4.1 (`resolveCanvas`)
- **Família:** Input
- **Cenário:** `aspectRatio` é union; o branch custom `{ width: number; height: number }` aceita qualquer número finito. Se consumer passa `{ width: 0, height: 0 }` (typo, ou cálculo derivado), `useSlideFit` computa `min(W/0, H/0) = Infinity`, depois clampa para `maxScale = 4`. Slide renderiza com canvas 0×0 mas escala 4× — invisível mas não quebra. Pior: `{ width: -100, height: 100 }` → `transform: scale(-1)` → slide espelhado.
- **Impacto:** Silent surprise. Nada explode (Infinity/NaN não causam React crash), mas o slide some ou aparece espelhado. Frustrante de debugar.
- **Fix sugerido:** Adicionar guard no `resolveCanvas` (3 linhas):
  ```ts
  function resolveCanvas(ar: SlideProps["aspectRatio"]) {
    if (!ar || ar === "16:9") return ASPECT_PRESETS["16:9"];
    if (ar === "4:3") return ASPECT_PRESETS["4:3"];
    if (ar.width <= 0 || ar.height <= 0 || !Number.isFinite(ar.width) || !Number.isFinite(ar.height)) {
      // Invalid — fall back to 16:9 + emit warning via onValidationError if available.
      return ASPECT_PRESETS["16:9"];
    }
    return ar;
  }
  ```
  Adicionar test em T4.1: *"resolveCanvas returns 16:9 for invalid aspectRatio (zero/negative/NaN)"*.

### EC-4: Regex de frontmatter não tolera BOM (`﻿`) inicial

- **Task afetada:** T1.2 (`extractFrontmatter`)
- **Família:** Input / Format
- **Cenário:** `FRONTMATTER_RE = /^---\r?\n.../` exige `---` no exato byte 0. Markdown colado de Word, Notion, ou alguns editores tem BOM `﻿` antes — comum o suficiente. Regex falha silenciosamente; sistema trata como "sem frontmatter" e renderiza body com o YAML cru visível na slide.
- **Impacto:** UX silenciosa-mas-confusa: usuário vê `theme: violet-forge` aparecendo como texto no slide. Sem error, sem callback. Pesado para LLM agents que não vão saber o que está errado.
- **Fix sugerido:** Strip BOM no início de `extractFrontmatter` (1 linha):
  ```ts
  export function extractFrontmatter(md: string) {
    const normalized = md.startsWith("﻿") ? md.slice(1) : md;
    const match = FRONTMATTER_RE.exec(normalized);
    // ...
  }
  ```
  Test: *"extractFrontmatter handles input prefixed with BOM"*.

### EC-5: Multi-slide detection regex dispara false positive em `---` dentro de fenced code block

- **Task afetada:** T1.2 (`detectMultiSlide`)
- **Família:** Format
- **Cenário:** `MULTI_SLIDE_RE = /^---\s*$/m` casa qualquer linha contendo apenas `---`. Mas markdown legítimo com sample YAML em code fence dispara false positive:
  ```markdown
  # How to write frontmatter
  ```yaml
  ---
  theme: default
  ---
  ```
  ```
  Detecção via regex acima dispara `MULTIPLE_SLIDES`, truncando o slide no `---` interno. Usuário vê meio do code sample cortado. Esse caso é comum quando a LLM gera slides que ensinam Marp/Markdown.
- **Impacto:** Slides educacionais quebram silenciosamente. `onValidationError` dispara `MULTIPLE_SLIDES` mas o usuário não entende por quê.
- **Fix sugerido:** Detectar via mdast parsing (mais robusto que regex). Em `validateSlide`, depois de extrair body, chamar `parseBody(body)` e verificar se há um node `thematicBreak` (= `<hr>` = `---`) no nível 0 do `Root.children`:
  ```ts
  // validate.ts (substituir detectMultiSlide)
  async function detectMultiSlide(body: string): Promise<boolean> {
    const { fromMarkdown } = await import("mdast-util-from-markdown");
    const tree = fromMarkdown(body);
    return tree.children.some((node) => node.type === "thematicBreak");
  }
  ```
  Custo: validateSlide vira async (já vai virar por EC-2). Plus: parseBody será chamado duas vezes (uma para detecção, outra para render) — opcionalmente, cachear o tree na ValidationResult e reusar no parse.

---

## SHOULD TEST

### EC-6: Frontmatter sem `---` de fechamento é silenciosamente ignorado

- **Task afetada:** T1.2
- **Teste sugerido:** `test_extractFrontmatter_missing_closing_delimiter` — input `"---\ntheme: foo\n# heading"` (sem o `---\n` de fechamento). Asserts: `rawFrontmatter === null`, `body === entire input` (não há frontmatter detectado). Cobre o silent case onde usuário pensou que escreveu frontmatter mas faltou fechar.

### EC-7: Race condition em re-parse quando `markdown` prop muda rapidamente

- **Task afetada:** T4.1
- **Teste sugerido:** `test_Slide_rapid_markdown_change_resolves_to_latest` — disparar 3 mudanças de prop em sequência (markdown1, markdown2, markdown3) sem aguardar resolve. Mockar `parseSlide` para resolver markdown3 antes de markdown2. Assert: `parsed.tree` corresponde a markdown3 (último prop), não a markdown2 (último a resolver). Implementação: adicionar contador `versionRef.current++` no useEffect e descartar resultado se a versão mudou.

### EC-8: `onValidationError` inline callback causa re-parse em todo render

- **Task afetada:** T4.1
- **Teste sugerido:** `test_Slide_stable_callback_does_not_trigger_extra_parses` — render `<Slide markdown="x" onValidationError={fn} />` com `fn` recriado a cada render. Mockar `parseSlide` e contar invocações. Comparar com versão usando `useCallback`-memoized fn. Documentar diferença no JSDoc + sugerir `useCallback` na seção "Performance tips" do JSDoc.

### EC-9: Empty body (markdown só com frontmatter) renderiza slide vazio sem error

- **Task afetada:** T2.5
- **Teste sugerido:** `test_parseSlide_frontmatter_only_returns_empty_tree` — input `"---\ntheme: default\n---\n"` (frontmatter + EOL, body vazio). Assert: `frontmatter.theme === "default"`, `tree` é Fragment vazio (sem children), `errors.length === 0`. Renderiza apenas o chrome do slide (background + padding) sem conteúdo.

### EC-10: Frontmatter gigante (> 10 KB de YAML) é DOS surface

- **Task afetada:** T1.2
- **Teste sugerido:** `test_validateSlide_caps_frontmatter_size` — gerar markdown com 100 KB de frontmatter YAML válido (e.g. 10k linhas de `key: value`). Assert: `validateSlide` retorna `INVALID_FRONTMATTER` com `code: "FRONTMATTER_TOO_LARGE"` (novo subcódigo). Cap razoável: 10 KB de raw frontmatter (~200 linhas YAML densas). Fix: adicionar check `if (rawFrontmatter.length > 10240) return error` antes do `yaml.parse`.

---

## DOCUMENT

### EC-11: `<figure>` e `<figcaption>` strippados pelo defaultSchema

- **Risco aceito:** D8 documenta a escolha de não estender o schema. Mas o reader do README/JSDoc não saberá que `<figure>` cai. Adicionar 1 linha no JSDoc do `SlideProps` (acima do prop `markdown`): `/** Note: <figure>/<figcaption> are stripped by default sanitize schema. Use <img>+<p> for captioned images, or opt-in to loose schema in v0.2. */`.

### EC-12: SSR hydration: scale inicial é 1, ajusta após ResizeObserver disparar

- **Risco aceito:** §16.8 já lista isso como medium-likelihood. Mas não está no JSDoc. Adicionar: `/** SSR note: initial render uses scale=1; first client render adjusts after ResizeObserver fires. Consumers wrapping in Suspense or skeleton can mitigate visible jump. */`.

### EC-13: Setext heading `Title\n---` no início do markdown é confundido com frontmatter

- **Risco aceito:** Caso de uso raríssimo (LLMs não emitem setext, e usuários humanos sabem que `# Title` é mais legível). Adicionar nota em `extractFrontmatter` JSDoc: `// Setext headings starting at byte 0 (Title\n---\n) are parsed as frontmatter delimiters. Use ATX (# Title) to avoid this.`

### EC-14: Flash de slide vazio antes de `parseSlide` resolver

- **Risco aceito:** Tempo de parse + dynamic imports primeira vez é tipicamente < 100ms (peer-deps já em cache do consumer's package manager). Suficientemente curto para não justificar Suspense boundary default. Documentar no JSDoc: `/** First render returns empty section until async parse completes. For zero-flash UX, prefer pre-parsing on the server and passing the rendered React tree via custom prop (v0.2 feature). */`.

### EC-15: `clobberPrefix: "user-content-"` prefixa IDs gerados a partir do markdown

- **Risco aceito:** `<h1 id="introducao">` no markdown vira `<h1 id="user-content-introducao">` no output (proteção de hast-util-sanitize contra ID clobbering). Consumers que querem usar âncoras (`<a href="#introducao">`) precisam saber. Documentar no README seção `Engines > Slide`: linha sobre o `user-content-` prefix + workaround (passar custom heading component que strippa prefix se necessário).

---

## Padrões Sistêmicos Detectados

| Padrão | Encontrado? | Onde |
|--------|-------------|------|
| Implemented but not wired | **Sim** | EC-1 (BANNED_TAG callback promessa sem implementação) |
| Correct code in wrong place | Não | — |
| Project name vs ID | Não | — |
| API signature mismatch sync/async | **Sim** | EC-2 (validateSlide) |
| Promise plan ≠ task code | **Sim** | EC-1, EC-2 |
| Input validation gap at boundary | **Sim** | EC-3 (aspectRatio), EC-4 (BOM), EC-10 (frontmatter size) |
| Regex false positive on edge format | **Sim** | EC-5 (multi-slide regex vs code fence) |
| ResizeObserver / SSR mismatch | **Sim** | EC-12 (já reconhecido no §16.8, falta JSDoc) |

---

## Resumo por Task

| Task | Edges encontrados | MUST FIX | SHOULD TEST | DOCUMENT |
|------|-------------------|----------|-------------|----------|
| T0.1 | 0 | 0 | 0 | 0 |
| T0.2 | 0 | 0 | 0 | 0 |
| T0.3 | 0 | 0 | 0 | 0 |
| T0.4 | 0 | 0 | 0 | 0 |
| T0.5 | 0 | 0 | 0 | 0 |
| T0.6 | 0 | 0 | 0 | 0 |
| T1.1 | 1 | 0 | 1 (EC-10) | 0 |
| T1.2 | 4 | 2 (EC-2, EC-4) | 2 (EC-6, parcial EC-5) | 0 |
| T2.1 | 0 | 0 | 0 | 0 |
| T2.2 | 0 | 0 | 0 | 0 |
| T2.3 | 1 | 1 (EC-1) | 0 | 0 |
| T2.4 | 0 | 0 | 0 | 0 |
| T2.5 | 2 | 1 (EC-5 parcial) | 1 (EC-9) | 0 |
| T3.1 | 1 | 1 (EC-3) | 0 | 0 |
| T3.2 | 0 | 0 | 0 | 0 |
| T4.1 | 5 | 0 | 2 (EC-7, EC-8) | 3 (EC-11, EC-12, EC-14) |
| T4.2 | 0 | 0 | 0 | 0 |
| T5.1 | 1 | 0 | 0 | 1 (EC-15) |
| T5.2 | 0 | 0 | 0 | 0 |
| T5.3 | 0 | 0 | 0 | 0 |
| T5.4 | 0 | 0 | 0 | 0 |
| Phase 6 | 0 | 0 | 0 | 0 |
| **Total** | **15** | **5** | **5** | **5** |

---

## Ajustes propostos ao plano (antes de aprovar)

1. **T2.3 — adicionar implementação de `detectBannedTags` (5-10 LOC)** OU **T4.1 — remover promessa de `BANNED_TAG` callback do AC + remover story `BannedScript` + ajustar Coverage Matrix #7**. **Decisão:** implementar (mais valioso para agent surfaces).
2. **T1.2 — mudar signature de `validateSlide` para retornar `Promise<ValidationResult>`** e propagar em T4.1.
3. **T4.1 — adicionar guard contra `aspectRatio` inválido em `resolveCanvas`** (3 linhas + 1 teste).
4. **T1.2 — strip BOM em `extractFrontmatter`** (1 linha + 1 teste).
5. **T1.2 — substituir regex multi-slide por mdast-based detection** OU **aceitar o false-positive como trade-off documentado**. **Decisão:** mdast-based (custo é trivial — parseBody será chamado de qualquer forma).
6. **T1.2 — adicionar cap de 10 KB no raw frontmatter** (T1.2.2 sub-task ou inline em validate.ts), com novo error code `FRONTMATTER_TOO_LARGE` no enum.
7. **T4.1 — adicionar JSDoc com notas SSR + `useCallback` recommendation + `<figure>` strip warning** (não muda código, só doc).
8. **T5.1 — README Engines > Slide menciona `user-content-` ID prefix** (1 linha de docs).

Os SHOULD TEST viram tests adicionais nos TDD cycles existentes (não criam tasks novas).
