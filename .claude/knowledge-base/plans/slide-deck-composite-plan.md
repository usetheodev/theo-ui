# Plan: `SlideDeck` — composite engine (multi-slide deck w/ navigation, presenter, fullscreen, PDF)

> **Version 1.1** (2026-05-19 — incorporates `/edge-case-plan` MUST FIX: frontmatter strip em splitDeck, popup blocker guard no presenter, transition timeout fallback, slides prop reconciliation, SSR hash lazy init). Edge case review: `.claude/knowledge-base/reviews/edge-cases/slide-deck-composite-edge-cases-2026-05-19.md`.

> **Version 1.0** — Entrega o `<SlideDeck>` em `@usetheo/ui/slide-deck` como **composite engine** que orquestra N `<Slide>` primitives com navegação (keyboard + touch + hash routing), thumbnails sidebar, presenter view (notas + próximo slide + timer), fullscreen, transições CSS, progressive fragments e PDF export via `window.print()`. Reusa o subpath `@usetheo/ui/slide` já shipado (RFC 0002) — mesmas peer-deps markdown, bundle isolado próprio, fora do barrel principal. Outcome esperado: agente do TheoCode/TheoKit emite um deck multi-slide markdown e o consumer obtém uma apresentação PowerPoint-like operável sem instalar Reveal.js / Marp / impress.js. Tier 3 do roadmap discutido com o usuário em 2026-05-19.

## Context

**Estado em 2026-05-19:**
- `<Slide>` primitive shipado em 2026-05-19 (RFC 0002, plan `slide-view-primitive-plan.md`). Subpath `@usetheo/ui/slide`, bundle isolado (~13 KB), markdown + frontmatter → React tree temado.
- `<Slide>` é **single-slide only** por contrato (D5 de RFC 0002): input multi-slide (contém top-level `thematicBreak`) dispara `MULTIPLE_SLIDES` validation error e renderiza só o primeiro slide. **Não há cobertura para deck.**
- Whiteboard primitive shipado em 2026-05-18 (RFC 0001) estabeleceu o pattern de engine isolada: subpath dedicado, peer-deps opcionais, fora do barrel + census.
- Demo do Slide existe (`playground/slide-demo.tsx`) renderizando 11 cenas single-slide. Não há demo de deck.
- Roadmap formalizado em `CLAUDE.md` (TheoUI) linha ~136: `SlideDeck` em **Explorer (RFC)** — "Orchestrates `Slide` primitives: navigation, progress, presenter mode, fullscreen, PDF export. Depends on Slide."
- Tier 3 do roadmap PowerPoint-level (discutido com o usuário em 2026-05-19) lista 8 features: navigation (←/→/space/touch), thumbnails sidebar, presenter view (notes + next + timer), fullscreen API, progressive fragments, transitions, PDF export, hash routing.

**Pivot de escopo (2026-05-19, decisão do usuário nesta sessão):**
SlideDeck é a **camada "experiência PowerPoint"** acima do Slide. Decisões previamente abertas no roadmap travadas:

| Decisão | Travada |
| --- | --- |
| Empacotamento | **Subpath isolado** `@usetheo/ui/slide-deck` (não barrel) — composite mas com engine peer-deps |
| Dependências novas | **Zero** — reutiliza as 7 peer-deps de `@usetheo/ui/slide` + roll-our-own para hotkeys, swipe, transitions |
| Deck splitter | **Reutiliza algoritmo mdast** do `validateSlide` (D12 do Slide) — mesma quebra por `thematicBreak` |
| Presenter view | **`window.open()` + `BroadcastChannel`** para sync entre janelas (fallback `localStorage` para Safari antigo) |
| PDF export | **`window.print()` + `@page` CSS** — sem headless chrome, sem marp-cli |
| Fragmentos | **Marpit `* fragment` lists** (asterisco em lista vira progressive reveal) |
| Transitions | **CSS-only** (slide, fade, none) — sem Framer Motion |
| Hash routing | **`#/N`** opt-in via `enableHashRouting` prop (default true) |

**Evidências concretas:**
- `pnpm view react-hotkeys-hook size` → ~5 KB gz. Decidimos rolar próprio (`~40 LOC`) porque a superfície é pequena (← → space home end esc f n) e adicionar peer-dep só para isso fere o D2 de "zero deps novas".
- `pnpm view @use-gesture/react size` → ~20 KB gz. Mesma decisão — Pointer Events nativos resolvem em ~30 LOC.
- `BroadcastChannel` MDN: suportado em Chrome 54+, Firefox 38+, Safari 15.4+ (March 2022). Cobertura > 95% global. Fallback `localStorage`+`storage` event para Safari < 15.4 (incluído).
- `referencia/marp/website/docs/guide/fragmented-list.md` (lido em deep-reference) — Marpit usa `*` (asterisco) em lista como marcador de fragmento. Adotamos.
- `CSS @page` é spec W3C há 20+ anos, todos browsers suportam para print preview. PDF export = chamar `window.print()` e CSS configura uma slide por página.
- `validateSlide.detectMultiSlide` (D12 do Slide) já é mdast-based + cachea Root no result. Reaproveitável: deck splitter pode usar a MESMA função mas em vez de truncar, devolver array de slides.

**Documento de referência:** `.claude/knowledge-base/reference/slide.md` (gerado em 2026-05-19) — 16 seções, inclui Reveal.js como divergent reference (§4.5 — scale-to-fit algorithm já implementado em `useSlideFit`; §11 — observability patterns relevantes para deck telemetry). RFC `docs/rfcs/0003-slide-deck.md` (T0.5) formaliza a entrada do composite.

## Objective

**Done = `pnpm quality:gates` verde com o subpath `@usetheo/ui/slide-deck` exportando `<SlideDeck>` que renderiza um array de slides com navegação completa, sem alterar o bundle baseline do barrel principal nem do subpath Slide.** Especificamente:

1. `@usetheo/ui/slide-deck` resolve para `dist/slide-deck/index.js` próprio, bundle target **< 25 KB gzipped** sem peer-deps embutidas.
2. `<SlideDeck>` aceita prop `slides` em DUAS formas: string markdown completa (split automático em `---`) OU array `SlideDeckSlide[]` pre-parsed.
3. Navegação **keyboard** funciona out-of-the-box: ← prev, → next, Space next, Home first, End last, Esc exit fullscreen, F fullscreen, N presenter, P presenter alias.
4. Navegação **touch** funciona em mobile: swipe left → next, swipe right → prev (threshold 50px, velocity > 0.3 px/ms).
5. **Hash routing** opcional (default on): `#/3` navega para slide 3; mudança de slide atualiza hash; back/forward do browser navega slides.
6. **Thumbnails sidebar** colapsável renderiza todos os slides em scale ~0.2 com indicador do atual (highlight border).
7. **Presenter view**: window separada via `window.open()` mostra (a) current slide, (b) next slide, (c) speaker notes do current, (d) timer (elapsed + remaining se duration set). Sincroniza com main window via `BroadcastChannel` (ou `localStorage` fallback).
8. **Fullscreen API**: botão dedicado + tecla F. Em fullscreen, chrome esconde, apenas slide visível.
9. **Progressive fragments**: listas com `*` (asterisco) em vez de `-` viram passos de reveal progressivo. Tecla → avança fragment dentro do slide ANTES de avançar para próximo slide.
10. **Transitions CSS**: prop `transition: "none" | "fade" | "slide"` (default `"fade"`). Respeita `prefers-reduced-motion: reduce` → cai para `"none"` automaticamente.
11. **PDF export**: tecla Ctrl+P (ou prop `onPrint`) injeta CSS de print que renderiza todos os slides em pages separadas no estilo `@page` A4 / 16:9. Saída é nativa do browser (`window.print()`).
12. A11y: aria-live region anuncia mudança de slide ("Slide 3 of 12"). Foco gerenciado: chrome controls têm focus rings, slide content é `aria-current="page"`.
13. Speaker notes extraídos de `<!-- notes: ... -->` HTML comments no markdown (sanitize NÃO strippa porque comments são processadas antes do sanitize stage no parseSlide pipeline).
14. Bundle do barrel principal (`dist/index.js`) **inalterado** (±0%).
15. Bundle do subpath Slide (`dist/slide/index.js`) **inalterado** (±0%) — SlideDeck não modifica Slide.
16. README, CHANGELOG, CLAUDE.md atualizados (SlideDeck: Explorer → Available).
17. RFC `docs/rfcs/0003-slide-deck.md` Status: PROPOSED → IMPLEMENTED, consumer documentado.
18. Dogfood QA via novo script `pnpm dogfood:slide-deck` (mirror de `dogfood:slide`).

## ADRs

### D1 — Subpath isolado `dist/slide-deck/` (não barrel, não junto com Slide)
- **Decisão:** SlideDeck ship em `@usetheo/ui/slide-deck` com bundle próprio. NÃO entra no barrel `src/index.ts`. NÃO mergeia no bundle do `@usetheo/ui/slide`.
- **Rationale:** (a) Consumer que só usa `<Slide>` single-slide não paga o custo do deck (navigation, presenter, thumbnails ≈ ~12 KB adicionais); (b) Mesma infra de ISOLATED_SUBPATHS já existe (sync-exports.ts, tsup multi-entry); (c) Padrão consistente com Whiteboard + Slide — engines isoladas; (d) Composite-em-barrel quebraria a regra de bundle isolation (CLAUDE.md TheoUI §Roadmap).
- **Consequences:** Habilita: zero impacto em consumer Slide-only. Constrange: SlideDeck precisa import Slide via `@usetheo/ui/slide` (mesmo path público do consumer) — sem atalho para src interno. Tsup config ganha mais um entry.

### D2 — Zero peer-deps novas além das que Slide já declara
- **Decisão:** SlideDeck NÃO adiciona nenhuma peer-dep ao `package.json`. Reusa as 7 markdown peer-deps de Slide. Hotkeys, swipe, transitions, broadcast — todos implementados em ~30-50 LOC cada.
- **Rationale:** (a) `react-hotkeys-hook` adicionaria 5 KB para 7 hotkeys; (b) `@use-gesture/react` adicionaria 20 KB para detectar swipe; (c) Pointer Events nativos resolvem em 30 LOC; (d) `KeyboardEvent.key` nativo resolve hotkeys em 40 LOC; (e) Reusar é caro — manter próprias funções pequenas é mais previsível. Princípio "Não Reinvente" (§9 global CLAUDE.md) NÃO se aplica quando o código próprio é < 50 LOC e a lib externa traz overhead > 5× o tamanho.
- **Consequences:** Habilita: bundle minúsculo (<25 KB target), manutenção dentro do projeto, zero surpresas de versão. Constrange: precisamos testar os hooks próprios (`useDeckKeyboard`, `useDeckSwipe`) com cobertura sólida — eles substituem libs maduras.

### D3 — Deck splitter reusa o mesmo algoritmo mdast do Slide (D12 do RFC 0002)
- **Decisão:** Função pública `splitDeck(markdown: string): SlideDeckSlide[]` usa `mdast-util-from-markdown` + walk de `Root.children` por `thematicBreak`. Cada chunk vira um `SlideDeckSlide { markdown, id, notes }`. Notes extraídas de `<!-- notes: ... -->` comments na mesma passada.
- **Rationale:** (a) Mesmo algoritmo já provado no Slide (zero false-positive em fenced code blocks com `---` dentro — EC-5 do edge case review); (b) Reaproveita o mdast Root cacheado caso o consumer chame `splitDeck` antes de passar para `<SlideDeck>`; (c) Evita regex que falharia em casos exóticos.
- **Consequences:** Habilita: split robusto e consistente com Slide. Constrange: depende de `mdast-util-from-markdown` peer-dep — se o consumer instala SlideDeck mas não Slide, peer-dep ainda precisa estar lá (que é o ponto: SlideDeck herda as deps de Slide).

### D4 — `<SlideDeck>` aceita slides como `string | SlideDeckSlide[]`
- **Decisão:** Prop `slides` é union type. String = markdown completa, internamente chamada `splitDeck`. Array = pre-split (consumer já tem deck estruturado, e.g. de uma DB).
- **Rationale:** (a) Markdown string é o caminho LLM-friendly (LLM emite markdown completa); (b) Array pre-split é o caminho enterprise (CMS, DB, JSON config); (c) Suportar ambos com type narrowing é trivial. Mesmo padrão que `<Slide markdown={string}>` usa.
- **Consequences:** Habilita: dois consumers principais cobertos. Constrange: documentação precisa explicar quando usar qual.

### D5 — State management via `useReducer`, não múltiplos useStates
- **Decisão:** Estado interno do deck (currentIndex, currentFragment, presenterMode, fullscreen, transition direction) governado por um único `useReducer` com actions tipadas (`NEXT_SLIDE`, `PREV_SLIDE`, `JUMP_TO`, `NEXT_FRAGMENT`, `RESET_FRAGMENTS`, `TOGGLE_PRESENTER`, `TOGGLE_FULLSCREEN`).
- **Rationale:** (a) State machine tem 5+ campos com transições inter-relacionadas; spread de useStates causaria bug onde mudança em A esquece de zerar B (ex: navegar slide → resetar fragments); (b) Reducer + actions são testáveis em isolation (pure function); (c) Future-proof para Redux DevTools ou state log para debugging.
- **Consequences:** Habilita: state transitions auditáveis, debugging fácil, sem race conditions entre setStates. Constrange: mais boilerplate inicial (actions enum + reducer switch) vs useState scattered.

### D6 — Presenter view via `window.open()` + `BroadcastChannel`
- **Decisão:** Botão "Presenter" abre nova janela via `window.open()`. Sincronização de estado entre main e presenter usa `BroadcastChannel('theo-slide-deck-{deckId}')`. Fallback para `localStorage` + `storage` event quando `BroadcastChannel === undefined` (Safari < 15.4).
- **Rationale:** (a) `iframe` herda CSP do parent — quebra em sites com strict CSP; (b) `window.open()` é a abordagem do Reveal.js + Marpit Web; (c) `BroadcastChannel` é nativo, sync síncrono, zero deps; (d) Fallback `localStorage` cobre os 5% restantes (Safari antigo) sem custo runtime no browser moderno.
- **Consequences:** Habilita: presenter genuíno multi-monitor, sem CSP friction. Constrange: usuário precisa permitir popup (browser bloqueia popup sem user gesture — solucionado abrindo presenter dentro de handler de click direto, não em useEffect).

### D7 — PDF export via `window.print()` + `@page` CSS, sem libs externas
- **Decisão:** Não usar `html2pdf`, `jspdf`, `puppeteer`, marp-cli. Implementação: ao usuário pressionar Ctrl+P (ou clicar botão Print), injetar `<style>` dinamicamente com regras `@page { size: 1280px 720px; margin: 0; }` + ` @media print { ... }` que renderiza TODOS os slides empilhados na ordem, cada um forçando page-break-after. Chamar `window.print()`. CSS é removido on `afterprint` event.
- **Rationale:** (a) `html2pdf` adicionaria ~150 KB; (b) Headless chrome só roda backend; (c) marp-cli é fora de scope (require Node); (d) Browser print é nativo, gratuito, suporta save-as-PDF em todos OS desde 2014; (e) Limitação aceita: print não captura `<canvas>`/animações (irrelevante para slide com markdown).
- **Consequences:** Habilita: PDF export sem deps adicionais, com qualidade vetorial nativa do browser. Constrange: usuário precisa escolher "Save as PDF" no diálogo de print (não é one-click "Download PDF") — documentado.

### D8 — Transitions CSS-only com 3 presets, sem libs de animation
- **Decisão:** Prop `transition: "none" | "fade" | "slide"` (default `"fade"`). Implementação: classes CSS aplicadas no slide outgoing + incoming via state machine + `transitionend` event. Duração fixa 250ms. Respeita `@media (prefers-reduced-motion: reduce)` → cai para `"none"`.
- **Rationale:** (a) Framer Motion adicionaria 30-40 KB para 3 transitions; (b) CSS transitions são GPU-accelerated nativamente; (c) 250ms é o sweet spot estudado em motion design — rápido o suficiente para não chatear, lento o suficiente para perceber continuidade; (d) `prefers-reduced-motion` é WCAG 2.1 — não negociável.
- **Consequences:** Habilita: transições polidas + a11y compliant + bundle pequeno. Constrange: não tem flexibilidade de cubic-bezier custom (consumer override via CSS variable se quiser).

### D9 — Keyboard nav: implementação própria com mapa exato de bindings
- **Decisão:** Hook `useDeckKeyboard(dispatch, opts)` registra um único `keydown` listener no `document`. Mapa hardcoded: `ArrowRight`/`Space`/`PageDown` → NEXT, `ArrowLeft`/`PageUp` → PREV, `Home` → JUMP(0), `End` → JUMP(last), `Escape` → EXIT_FULLSCREEN, `f`/`F` → TOGGLE_FULLSCREEN, `n`/`N`/`p`/`P` → TOGGLE_PRESENTER, `Ctrl+P` ou `Meta+P` → PRINT (preventDefault e dispatch).
- **Rationale:** (a) `react-hotkeys-hook` adicionaria 5 KB + abstração; (b) Bindings são fixos e poucos (10); (c) Implementação direta tem ~50 LOC, testável em isolation. Não-confliction: listener checa `event.target` para ignorar bindings quando foco está em `<input>`/`<textarea>`/contentEditable (consumer pode estar usando deck em editor).
- **Consequences:** Habilita: bindings previsíveis, zero conflito com inputs. Constrange: consumer não pode reconfigurar bindings via prop em v0.4 (futuro: prop `keyMap` se houver demanda).

### D10 — Touch swipe: implementação própria com Pointer Events
- **Decisão:** Hook `useDeckSwipe(ref, dispatch)` registra `pointerdown`/`pointermove`/`pointerup` no elemento da deck. Detecta swipe horizontal: threshold 50px de deslocamento + velocity > 0.3 px/ms. Bloqueia swipe vertical (scroll prevail).
- **Rationale:** (a) `@use-gesture/react` adicionaria 20 KB para detectar 1 gesture; (b) Pointer Events são nativos, cross-platform (mouse + touch + pen); (c) Velocity threshold previne falsos positivos quando user faz drag lento horizontalmente.
- **Consequences:** Habilita: swipe nativo em mobile + desktop com mouse drag. Constrange: gestures complexos (pinch zoom, two-finger swipe) ficam fora — não necessários para deck nav.

### D11 — Speaker notes via `<!-- notes: ... -->` HTML comment no markdown
- **Decisão:** Sintaxe canonical para speaker notes: HTML comment no markdown body começando com `notes:` (ou `note:`, aceitar ambos). Extrator percorre mdast/raw markdown e remove comments + agrega texto. Resultado anexado ao `SlideDeckSlide.notes`.
- **Rationale:** (a) Marpit, Reveal.js, Marp todos convergem em alguma forma de comment-based notes; (b) HTML comments não renderizam (sanitize drops, ou parseSlide já ignora); (c) Sintaxe `notes:` distingue de outros comments (técnicos, TODO etc.) sem precisar de fence dedicado.
- **Consequences:** Habilita: notes invisíveis na slide principal, visíveis no presenter. Constrange: notas têm escopo só de inline plain text (sem markdown nested) na v0.4. v0.5 pode aceitar markdown dentro do comment.

### D12 — Fragments via Marpit-style `*` em lista (asterisco = progressive)
- **Decisão:** Em listas com `*` (asterisco) em vez de `-` ou `+`, cada item vira um fragment step. Tecla `→` avança fragments até chegar no último, então avança o slide. `←` faz o oposto. Renderização: itens não-revelados têm `opacity: 0; visibility: hidden` (mantém layout). Item atual com `data-fragment-current`.
- **Rationale:** (a) Marpit já estabeleceu essa convenção (`referencia/marp/website/docs/guide/fragmented-list.md`); (b) Não requer nova sintaxe markdown (asterisco é CommonMark válido); (c) Implementação: detectar marker `*` no mdast `listItem` parent → adicionar atributo `data-fragment-index` no DOM → CSS controla visibilidade via `[data-fragment-current-or-before]`.
- **Consequences:** Habilita: progressive reveal natural via markdown. Constrange: listas com `*` que NÃO querem ser fragmento (ex: shopping list comum) precisam usar `-` ou `+`. Documentado.

### D13 — Hash routing opcional default-on com prefixo `#/`
- **Decisão:** Prop `enableHashRouting: boolean` (default `true`). Pattern: `#/3` = slide 3 (1-indexed). Sub-fragment: `#/3.2` = slide 3 com fragment 2 revelado. Sincronização bidirecional: navegar slide atualiza hash; mudança de hash (back/forward, link compartilhado) sincroniza state.
- **Rationale:** (a) `/` no hash distingue de seções com IDs (`#section-foo`); (b) 1-indexed é amigável a humano (URL bonita); (c) Bidirectional permite compartilhar link com slide específico ("veja `https://meu.app/#/5`").
- **Consequences:** Habilita: deep-linking, back-button funciona, compartilhamento de slide específico. Constrange: conflita com hash routes do app consumer — sufficient para opt-out via prop = false.

### D15 — `splitDeck` strippa frontmatter antes do walk mdast (mirror Slide D12)
- **Decisão:** `splitDeck(markdown)` chama `extractFrontmatter(markdown)` antes de qualquer parse. O global frontmatter (delimitado por `---\n...\n---\n`) é separado e armazenado como `deck.frontmatter`. Apenas o `body` resultante é alimentado ao mdast walker para split por `thematicBreak`.
- **Rationale:** Sem isso, o PRIMEIRO `---` (delimitador de frontmatter global) é parseado pelo mdast como `thematicBreak` legítimo → primeiro slide vazio + offset de 1 em todos os subsequentes (EC-1 do edge case review). Slide single-slide já resolve via `extractFrontmatter` em `validateSlide`; SlideDeck precisa do mesmo.
- **Consequences:** Habilita: decks com frontmatter global funcionam corretamente. Constrange: cada slide individual ainda pode ter sua própria frontmatter (override). Documentado.

### D16 — Transitions têm timeout fallback de 300ms para destravar state
- **Decisão:** Reducer `useDeckState` mantém `transitionDirection`. Quando `transitionDirection !== "none"`, um `useEffect` paralelo dispara `setTimeout(() => dispatch({type:"TRANSITION_END"}), 300)`. O `transitionend` event listener dispatcheia o MESMO action — quem chegar primeiro vence (idempotente).
- **Rationale:** Em rapid navigation (user pressiona `→` 5x rápido), o `transitionend` event é CANCELADO quando a classe CSS é trocada mid-animation. Sem fallback, state fica preso em `transitionDirection != "none"` para sempre, classes CSS de animation permanecem → visual quebrado (EC-3 do edge case review). 300ms = transition (250ms) + 50ms buffer.
- **Consequences:** Habilita: navegação resiliente a interrupções. Constrange: em casos extremos, transition pode terminar 50ms "tarde" — visualmente imperceptível.

### D17 — Hash routing usa lazy initializer no useReducer para evitar SSR hydration mismatch
- **Decisão:** `useReducer(deckReducer, initialIndex, (init) => ({ currentIndex: readHashOrInit(init), ... }))`. Função `readHashOrInit` checa `typeof window !== "undefined"` antes de ler hash; em SSR, retorna `init`.
- **Rationale:** Sem lazy init, server renderiza com `initialIndex=0` mas client lê hash em `useEffect` e dispatcha JUMP_TO → React detecta hydration mismatch entre server HTML e client desired state (EC-5 do edge case review). Lazy init resolve: no SSR, `window` é undefined → usa `init`; no client, lê hash imediatamente — mesmo state em server e client.
- **Consequences:** Habilita: SSR-safe + zero hydration warnings + zero visual flash. Constrange: `useReducer` lazy initializer roda uma vez; mudanças subsequentes em `enableHashRouting` prop não re-leem hash — esperado (consumer ativa via prop estável).

### D14 — Component composition via dot-notation (`<SlideDeck.Controls>`)
- **Decisão:** Sub-componentes expostos como propriedades estáticas: `SlideDeck.Slides`, `SlideDeck.Controls`, `SlideDeck.ProgressBar`, `SlideDeck.SlideNumber`, `SlideDeck.Thumbnails`, `SlideDeck.PresenterButton`, `SlideDeck.FullscreenButton`, `SlideDeck.PrintButton`. Consumer pode compor chrome customizado ou usar `<SlideDeck.Default>` que monta o layout canônico.
- **Rationale:** (a) Mesmo pattern de Radix UI, Headless UI, Tabs do Radix etc.; (b) Permite "headless" mode (consumer compõe próprio layout) E "default" mode (uma linha de uso); (c) Discoverable via autocomplete.
- **Consequences:** Habilita: customização granular + uso one-liner. Constrange: requer Context interno para sub-componentes acessarem state — overhead de ~50 LOC para Context provider.

## Dependency Graph

```
Phase 0 (scaffold + RFC + CHANGELOG)
    │
    ▼
Phase 1 (schema + splitDeck + useDeckState)
    │
    ▼
Phase 2 (navigation hooks: keyboard + touch + hash) ─┐
    │                                                 │
    ├──────────────────────────────────────────────────┤
    ▼                                                  │ (Phases 2, 3 paralelizáveis após 1)
Phase 3 (UI chrome: Controls + ProgressBar + SlideNumber)
    │
    ▼
Phase 4 (Thumbnails sidebar)
    │
    ▼
Phase 5 (Presenter view + Fullscreen)  ─┐
    │                                    │ (Phases 5, 6 paralelizáveis após 4)
    │                                    │
    │                                    ▼
    │                              Phase 6 (Transitions + Fragments)
    │                                    │
    └──────────────┬─────────────────────┘
                   ▼
              Phase 7 (PDF export via print CSS)
                   │
                   ▼
              Phase 8 (Main component composition + a11y + stories)
                   │
                   ▼
              Phase 9 (Docs + RFC closure + quality:gates)
                   │
                   ▼
              Phase 10 (Dogfood QA — MANDATORY)
```

Annotations:
- **Phase 0** blocker — tooling (sync-exports + tsup entry + scaffold) precede qualquer código.
- **Phase 1** blocker — schema + state compartilhado.
- **Phases 2 e 3 paralelizáveis** após 1 — hooks de navegação ↔ UI chrome.
- **Phase 4 (Thumbnails)** requer 2 + 3 (precisa de state + click handlers + chrome pattern).
- **Phases 5 e 6 paralelizáveis** após 4 — presenter/fullscreen ↔ transitions/fragments.
- **Phase 7 (PDF)** após 4 (precisa de full deck rendering capability).
- **Phase 8** junta tudo (main component + a11y + stories).
- **Phase 9** docs + gates finais.
- **Phase 10** dogfood mandatory.

---

## Phase 0: Scaffold + RFC

**Objective:** Wire subpath, scaffold dir, create RFC, CHANGELOG entry. Zero logic — purely infrastructure.

### T0.1 — Adicionar `./slide-deck` em `ISOLATED_SUBPATHS`

#### Objective
Registrar `@usetheo/ui/slide-deck` em `scripts/sync-exports.ts` mirrorando Whiteboard + Slide.

#### Evidence
- `scripts/sync-exports.ts:65` já tem `ISOLATED_SUBPATHS` com 2 entries (`./whiteboard`, `./slide`). Pattern estabelecido.
- Slide plan T0.1 referência direta.

#### Files to edit
```
scripts/sync-exports.ts — adicionar entry "./slide-deck" no ISOLATED_SUBPATHS
scripts/sync-exports.test.ts — adicionar 3 tests (presença, isolamento, colisão)
package.json — gerado por `pnpm sync:exports`
```

#### Deep file dependency analysis
- **`scripts/sync-exports.ts`** — ganha 1 entry. buildExports já valida colisão.
- **`scripts/sync-exports.test.ts`** — extende com 3 testes para `./slide-deck`.
- **`package.json#exports."./slide-deck"`** — output gerado.
- **Downstream:** `validate-quality-gates.ts` (já aceita ISOLATED entries), `validate-bundle-size.ts` (vai precisar de baseline novo em T0.3).

#### Deep Dives
```ts
"./slide-deck": {
  types: "./dist/slide-deck/index.d.ts",
  import: "./dist/slide-deck/index.js",
},
```
- **Invariante:** chave não colide com nome de primitive auto-scanned. `slide-deck` (kebab) é livre.

#### Tasks
1. Adicionar entrada em `ISOLATED_SUBPATHS`.
2. Atualizar JSDoc do map.
3. Adicionar 3 tests no sync-exports.test.ts (mirror dos 3 do Slide).
4. Rodar `pnpm sync:exports`.

#### TDD
```
RED:     sync-exports.test.ts — "ISOLATED_SUBPATHS contém ./slide-deck"
RED:     sync-exports.test.ts — "./slide-deck points to dist/slide-deck/index.js"
RED:     sync-exports.test.ts — "throws when slide-deck collides with auto-scanned subpath"
GREEN:   adicionar entrada em ISOLATED_SUBPATHS
REFACTOR: None expected
VERIFY:  pnpm test scripts/sync-exports.test.ts && jq '.exports."./slide-deck"' package.json
```

#### Acceptance Criteria
- [ ] `ISOLATED_SUBPATHS["./slide-deck"]` definido
- [ ] `package.json#exports."./slide-deck"` presente após sync
- [ ] 3 tests novos passam
- [ ] `pnpm registry:validate` verde
- [ ] `pnpm typecheck` verde

#### DoD
- [ ] Todas as tasks completas
- [ ] Tests verdes
- [ ] `pnpm quality:gates:fast` verde

---

### T0.2 — `tsup` emite bundle isolado `dist/slide-deck/`

#### Objective
Adicionar entry `slide-deck/index` em `tsup.config.ts`. Reusa externals do Slide.

#### Evidence
- `tsup.config.ts` já tem entries `index`, `whiteboard/index`, `slide/index`. Pattern estabelecido.
- Externals do Slide já incluem todas as 7 markdown peer-deps + react. SlideDeck reusa = zero externals novos.

#### Files to edit
```
tsup.config.ts — adicionar entry "slide-deck/index" + (opcionalmente) externalizar @usetheo/ui/slide se quisermos lazy
```

#### Deep file dependency analysis
- **`tsup.config.ts`** — entries cresce de 3 para 4.
- **Downstream:** `dist/slide-deck/index.{js,d.ts}` existe após build. Baseline JSON (T0.3) registra esses arquivos novos.

#### Deep Dives
- Decision point: importar `<Slide>` via path source (`../slide/index.js`) ou via package name (`@usetheo/ui/slide`)?
  - Source path = direct, mas tsup precisa NÃO vendorizar (externalizar `@usetheo/ui/slide`).
  - Package path = mesma coisa do consumer, mas requer alias no build OU tsup config para externalize `@usetheo/ui/slide`.
- **Decisão (sub-ADR):** Importar via source path `../slide/index.js` e adicionar `@usetheo/ui` paths à external list para qualquer self-import. Mais simples.
- **Invariante:** `dist/slide-deck/index.js` NÃO contém bytes de `dist/slide/index.js` — Slide carrega via `import` dinâmica.

#### Tasks
1. Adicionar entry `"slide-deck/index": "src/components/composites/slide-deck/index.ts"`.
2. Verificar externals — todos os de Slide já cobrem; nada adicional precisa.
3. Build manual: `pnpm build` para confirmar dist gerado.

#### TDD
```
RED:     scripts/build-output.test.ts — "dist/slide-deck/index.js exists after build"
RED:     scripts/build-output.test.ts — "dist/slide-deck/index.d.ts exists"
GREEN:   editar tsup config; manual build
REFACTOR: None expected
VERIFY:  pnpm build && test -f dist/slide-deck/index.js
```

#### Acceptance Criteria
- [ ] `dist/slide-deck/index.js` existe pós build
- [ ] `dist/slide-deck/index.d.ts` existe
- [ ] `dist/slide/index.js` size unchanged (Slide bundle não regrediu)
- [ ] `dist/index.js` (barrel) size unchanged

#### DoD
- [ ] Build artifacts presentes
- [ ] Bundle baseline não regredido (Slide + barrel)
- [ ] `pnpm quality:gates:fast` verde

---

### T0.3 — package.json scripts + bundle baseline + dogfood:slide-deck

#### Objective
Adicionar `dogfood:slide-deck` script ao package.json, estender `quality:gates`, adicionar entries no baseline JSON.

#### Evidence
- `package.json#scripts.quality:gates` já encadeia `dogfood:whiteboard && dogfood:slide`. Adicionar `&& dogfood:slide-deck`.
- `scripts/baselines/bundle-sizes.json` já tem entries para `dist/slide/*`. Adicionar `dist/slide-deck/*`.
- `scripts/validate-bundle-size.ts` já estende `ENGINE_PEER_DEPS` com markdown stack. SlideDeck reusa exatamente esses 6.

#### Files to edit
```
package.json — adicionar dogfood:slide-deck script; estender quality:gates
scripts/baselines/bundle-sizes.json — adicionar dist/slide-deck/index.js + .d.ts
scripts/dogfood-slide-deck.ts (NEW) — script de dogfood mirror de dogfood-slide.ts
```

#### Deep file dependency analysis
- **`package.json`** — 1 script novo, quality:gates ganha 1 etapa.
- **`bundle-sizes.json`** — 2 entries novos com tamanho zero inicialmente (atualizado em T0.4 após primeiro build).
- **`scripts/dogfood-slide-deck.ts`** — novo arquivo, 5-7 cenários canônicos (deck de 3 slides, navegação simulada via state machine, hash routing, etc.). SSR-only inicialmente.

#### Deep Dives
- Script dogfood-slide-deck.ts strategy:
  - Importar `@usetheo/ui/slide-deck` do dist
  - Cenário 1: deck simple (3 slides) renderiza primeiro slide SSR
  - Cenário 2: `splitDeck(markdown)` retorna array correto
  - Cenário 3: speaker notes extraction do `<!-- notes: ... -->`
  - Cenário 4: invalid input (empty deck) não throws
  - Cenário 5: bundle isolation runtime check (mesmo padrão Slide)
- **Invariante:** Script roda sem deps de browser (SSR-safe).

#### Tasks
1. Adicionar `dogfood:slide-deck` em `scripts`.
2. Estender `quality:gates` com `&& pnpm dogfood:slide-deck`.
3. Adicionar entries no `bundle-sizes.json` (tamanho zero, atualizado em T0.4).
4. Criar `scripts/dogfood-slide-deck.ts` com 5 cenários SSR.

#### TDD
```
RED:     scripts/dogfood-slide-deck.test.ts (NEW) — "renders deck of 3 slides without throwing"
RED:     scripts/dogfood-slide-deck.test.ts — "splitDeck splits markdown by top-level ---"
RED:     scripts/dogfood-slide-deck.test.ts — "speaker notes extracted from <!-- notes: -->"
GREEN:   implementar dogfood script
REFACTOR: extrair fixtures se >50 LOC inline
VERIFY:  pnpm build && pnpm dogfood:slide-deck (depois de T0.4 ter scaffold pronto)
```

#### Acceptance Criteria
- [ ] `scripts.dogfood:slide-deck` existe
- [ ] `quality:gates` inclui dogfood:slide-deck no chain
- [ ] `bundle-sizes.json` tem entries para dist/slide-deck/*
- [ ] dogfood-slide-deck.ts existe e roda (mesmo que stub no momento)

#### DoD
- [ ] package.json válido
- [ ] Script executável
- [ ] `pnpm quality:gates:fast` verde

---

### T0.4 — Scaffold `src/components/composites/slide-deck/`

#### Objective
Criar a estrutura de diretório esperada pelos validators. Composites layer (não primitive — D1 sub-decisão).

#### Evidence
- `src/components/composites/` é a pasta canônica para composites no monorepo.
- Slide precedent (`src/components/primitives/slide/`) é a referência de estrutura interna.
- `validate-quality-gates.ts:67-120` exige `<name>.tsx` + `index.ts` + test + story em cada pasta de composite.

#### Files to edit
```
src/components/composites/slide-deck/slide-deck.tsx (NEW) — componente stub
src/components/composites/slide-deck/index.ts (NEW) — barrel
src/components/composites/slide-deck/schema.ts (NEW) — Zod (T1.1)
src/components/composites/slide-deck/split-deck.ts (NEW) — splitter (T1.2)
src/components/composites/slide-deck/use-deck-state.ts (NEW) — reducer (T1.3)
src/components/composites/slide-deck/use-deck-keyboard.ts (NEW) — T2.1
src/components/composites/slide-deck/use-deck-swipe.ts (NEW) — T2.2
src/components/composites/slide-deck/use-deck-hash-routing.ts (NEW) — T2.3
src/components/composites/slide-deck/controls.tsx (NEW) — T3.1
src/components/composites/slide-deck/progress-bar.tsx (NEW) — T3.2
src/components/composites/slide-deck/slide-number.tsx (NEW) — T3.3
src/components/composites/slide-deck/thumbnails.tsx (NEW) — T4.1
src/components/composites/slide-deck/presenter-view.tsx (NEW) — T5.1
src/components/composites/slide-deck/use-fullscreen.ts (NEW) — T5.2
src/components/composites/slide-deck/transitions.css (NEW) — T6.1
src/components/composites/slide-deck/fragments.ts (NEW) — T6.2
src/components/composites/slide-deck/print-styles.ts (NEW) — T7.1
src/components/composites/slide-deck/notes.ts (NEW) — speaker notes extractor (D11)
src/components/composites/slide-deck/slide-deck.test.tsx (NEW)
src/components/composites/slide-deck/slide-deck.stories.tsx (NEW)
```

#### Deep file dependency analysis
- Todos os arquivos começam como stubs com comentários `TODO(T{N}.{M})` apontando para tasks que vão preencher.
- **Invariante:** stubs DEVEM type-check e DEVEM passar `validate-quality-gates.ts` antes de avançar.

#### Deep Dives
- Stub do componente:
  ```tsx
  import type { FC } from "react";
  export const SlideDeck: FC<{ slides: string }> = ({ slides }) => {
    return <div data-theo-slide-deck>{slides.slice(0, 50)}...</div>;
  };
  ```
- Stub do barrel:
  ```ts
  export { SlideDeck } from "./slide-deck.js";
  ```

#### Tasks
1. Criar diretório + 20 arquivos stub.
2. Adicionar TODO comments apontando para tasks futuras.
3. Garantir cada arquivo compila isolado (sem unused imports).
4. Rodar `pnpm typecheck && pnpm lint`.

#### TDD
```
RED:     slide-deck.test.tsx — "SlideDeck renders without throwing"
GREEN:   stub component
REFACTOR: None expected
VERIFY:  pnpm test src/components/composites/slide-deck/
```

#### Acceptance Criteria
- [ ] Diretório `src/components/composites/slide-deck/` existe com todos os 20 arquivos
- [ ] `pnpm typecheck` verde
- [ ] `pnpm lint` verde
- [ ] `pnpm quality:structure` reconhece slide-deck como engine isolada (não conta no census)

#### DoD
- [ ] Scaffold completo
- [ ] Imports resolvem
- [ ] `pnpm quality:gates:fast` verde

---

### T0.5 — RFC `docs/rfcs/0003-slide-deck.md`

#### Objective
Formalizar SlideDeck no projeto via RFC mirror de `0002-slide.md`.

#### Files to edit
```
docs/rfcs/0003-slide-deck.md (NEW)
docs/rfcs/README.md — adicionar linha 0003
```

#### Deep Dives
- Estrutura idêntica a 0002-slide.md: Status, Summary, Motivation, ADRs (D1-D14), API pública, Non-goals, Security, Risks, Rollout, References.
- **Invariante:** Consumer documented placeholder marcado TODO (mesma regra dos RFCs anteriores).

#### Tasks
1. Criar RFC com 10 seções.
2. Atualizar README.md de RFCs.

#### TDD
```
RED:     scripts/validate-rfcs.test.ts (se existir) — "0003-slide-deck.md exists with Status field"
GREEN:   escrever RFC
VERIFY:  cat docs/rfcs/0003-slide-deck.md | head -20
```

#### Acceptance Criteria
- [ ] RFC criado em `docs/rfcs/0003-slide-deck.md`
- [ ] Status PROPOSED
- [ ] Referencia este plan + reference doc do Slide
- [ ] docs/rfcs/README.md atualizado

#### DoD
- [ ] RFC presente
- [ ] Markdown lint verde

---

### T0.6 — CHANGELOG Unreleased entry

#### Objective
Adicionar bullet em `[Unreleased] > Added` documentando início do trabalho no SlideDeck.

#### Files to edit
```
CHANGELOG.md
```

#### Deep Dives
- Estrutura mirror do Slide entry. Inclui menção a `@usetheo/ui/slide-deck`, RFC 0003, dependências reusadas de Slide.

#### Tasks
1. Editar CHANGELOG.md adicionando bullet em `[Unreleased] > Added` (acima do bullet do Slide).

#### TDD
```
N/A — doc-only task
VERIFY:  grep "SlideDeck composite" CHANGELOG.md
```

#### Acceptance Criteria
- [ ] CHANGELOG entry adicionada
- [ ] Inclui referência ao RFC 0003

#### DoD
- [ ] Diff visível no PR

---

## Phase 1: Schema + splitDeck + state machine

**Objective:** Definir o input shape, o splitter de deck, e o reducer state machine que governa todas as transições.

### T1.1 — Zod schema `SlideDeckSlide` + `SlideDeckInput`

#### Objective
Schema Zod completo aceitando `string | SlideDeckSlide[]` na prop `slides`.

#### Evidence
- Slide schema (`src/components/primitives/slide/schema.ts`) é referência direta.
- D4 explicit: union type.

#### Files to edit
```
src/components/composites/slide-deck/schema.ts
```

#### Deep Dives
```ts
export const slideDeckSlide = z.object({
  /** Markdown content. */
  markdown: z.string().max(50_000),
  /** Optional ID for hash routing (defaults to numeric index). */
  id: z.string().regex(/^[a-z0-9-]+$/).max(64).optional(),
  /** Speaker notes (plain text, extracted from <!-- notes: --> comments). */
  notes: z.string().max(5_000).optional(),
});

export const slideDeckInput = z.union([
  z.string().max(500_000),  // 500 KB = ~300 slides worth
  z.array(slideDeckSlide).max(500),
]);

export type SlideDeckSlide = z.infer<typeof slideDeckSlide>;
export type SlideDeckInput = z.infer<typeof slideDeckInput>;
```

#### Tasks
1. Implementar schemas.
2. Exportar tipos.

#### TDD
```
RED:     schema.test.ts — "accepts string"
RED:     schema.test.ts — "accepts array of SlideDeckSlide"
RED:     schema.test.ts — "rejects string > 500KB"
RED:     schema.test.ts — "rejects array > 500 slides"
RED:     schema.test.ts — "rejects slide with invalid id (uppercase)"
RED:     schema.test.ts — "rejects slide with notes > 5KB"
GREEN:   implementar
VERIFY:  pnpm test src/components/composites/slide-deck/schema.test.ts
```

#### Acceptance Criteria
- [ ] schema.ts implementado
- [ ] 6+ tests verdes
- [ ] `pnpm typecheck` verde
- [ ] Coverage ≥ 95% (arquivo pequeno)

#### DoD
- [ ] Schema documentado via JSDoc
- [ ] `pnpm quality:gates:fast` verde

---

### T1.2 — `splitDeck(markdown)` — mdast-based splitter + notes extractor

#### Objective
Função pública async `splitDeck(markdown: string): Promise<SlideDeckSlide[]>` que usa mdast para split + extrai speaker notes.

#### Evidence
- Slide `validateSlide.detectMultiSlide` (D12) é o padrão de referência.
- D3 do SlideDeck explicit: mesmo algoritmo.

#### Files to edit
```
src/components/composites/slide-deck/split-deck.ts
src/components/composites/slide-deck/notes.ts — extractor de <!-- notes: ... -->
```

#### Deep file dependency analysis
- **`split-deck.ts`** — depende de `mdast-util-from-markdown` (peer-dep já de Slide).
- **`notes.ts`** — função pura `extractNotes(markdown: string): { body: string, notes: string }`.
- **Downstream:** `slide-deck.tsx` (T8.1) chama splitDeck em useEffect/useMemo.

#### Deep Dives
- Algorithm:
  ```ts
  async function splitDeck(markdown: string): Promise<SlideDeckSlide[]> {
    // D15: strip frontmatter first, mirror Slide validateSlide D12.
    // Reuse extractFrontmatter from @usetheo/ui/slide (same package family).
    const { extractFrontmatter } = await import("../slide/frontmatter.js");
    const { body: bodyAfterFM } = extractFrontmatter(markdown);
    const { fromMarkdown } = await import("mdast-util-from-markdown");
    const tree = fromMarkdown(bodyAfterFM);
    const breakIndices = tree.children
      .map((node, i) => (node.type === "thematicBreak" ? i : -1))
      .filter((i) => i !== -1);

    if (breakIndices.length === 0) {
      // Single slide deck
      const { body, notes } = extractNotes(markdown);
      return [{ markdown: body, notes }];
    }

    const slides: SlideDeckSlide[] = [];
    let cursor = 0;
    const positions = [0, ...breakIndices.map((i) => tree.children[i].position!.start.offset!), markdown.length];
    for (let p = 0; p < positions.length - 1; p++) {
      const start = positions[p];
      const end = positions[p + 1];
      const chunk = markdown.slice(start, end).trim();
      if (chunk.length === 0) continue;
      const { body, notes } = extractNotes(chunk);
      if (body.trim().length > 0 || notes) {
        slides.push({ markdown: body, notes });
      }
    }
    return slides;
  }
  ```
- notes extractor regex (`notes.ts`):
  ```ts
  const NOTES_RE = /<!--\s*notes?:\s*([\s\S]*?)\s*-->/gi;
  export function extractNotes(md: string): { body: string; notes: string | undefined } {
    const matches = [...md.matchAll(NOTES_RE)];
    if (matches.length === 0) return { body: md, notes: undefined };
    const notes = matches.map((m) => m[1].trim()).filter(Boolean).join("\n\n");
    const body = md.replace(NOTES_RE, "").trim();
    return { body, notes: notes || undefined };
  }
  ```

#### Tasks
1. Implementar `extractNotes` em notes.ts.
2. Implementar `splitDeck` em split-deck.ts.
3. Edge cases: empty markdown, single slide, deck terminado com `---`, comments multi-line.

#### TDD
```
RED:     notes.test.ts — "extractNotes returns body unchanged when no notes"
RED:     notes.test.ts — "extractNotes returns notes content extracted"
RED:     notes.test.ts — "extractNotes removes notes comments from body"
RED:     notes.test.ts — "extractNotes handles multiple notes blocks (concatenates)"
RED:     notes.test.ts — "extractNotes handles 'note:' singular alias"
RED:     split-deck.test.ts — "splitDeck of empty string returns []"
RED:     split-deck.test.ts — "splitDeck of single slide returns 1 item"
RED:     split-deck.test.ts — "splitDeck splits on top-level ---"
RED:     split-deck.test.ts — "splitDeck ignores --- inside fenced code blocks (D3)"
RED:     split-deck.test.ts — "splitDeck strips global frontmatter first (D15 / EC-1)"
RED:     split-deck.test.ts — "splitDeck with frontmatter does NOT produce empty first slide (D15 / EC-1)"
RED:     split-deck.test.ts — "splitDeck attaches notes from each chunk"
RED:     split-deck.test.ts — "splitDeck skips empty chunks (trailing ---)"
RED:     split-deck.test.ts — "splitDeck returns slides preserving order"
GREEN:   implementar
REFACTOR: extrair offset-walk helper se duplicar com Slide
VERIFY:  pnpm test src/components/composites/slide-deck/{notes,split-deck}.test.ts
```

#### Acceptance Criteria
- [ ] splitDeck é async, retorna Promise<SlideDeckSlide[]>
- [ ] extractNotes é função pura, sync, sem deps externas
- [ ] 12 tests verdes
- [ ] Fenced code block com `---` dentro NÃO triggera split (regression test)
- [ ] Coverage ≥ 95%

#### DoD
- [ ] Tests verdes
- [ ] Edge cases (empty, single, trailing ---) cobertos
- [ ] `pnpm quality:gates:fast` verde

---

### T1.3 — `useDeckState` reducer hook

#### Objective
useReducer hook que centraliza state do deck: `currentIndex`, `currentFragment`, `presenterMode`, `fullscreen`, `transition`.

#### Evidence
- D5 explicit: useReducer over scattered useStates.
- Whiteboard precedent: `useViewport` é useReducer-based.

#### Files to edit
```
src/components/composites/slide-deck/use-deck-state.ts
```

#### Deep Dives
```ts
interface DeckState {
  currentIndex: number;
  currentFragment: number;  // 0 = no fragments revealed
  presenterMode: boolean;
  fullscreen: boolean;
  transitionDirection: "none" | "next" | "prev";
  totalSlides: number;
  totalFragmentsInCurrent: number;
}

type DeckAction =
  | { type: "NEXT_SLIDE" }
  | { type: "PREV_SLIDE" }
  | { type: "JUMP_TO"; index: number }
  | { type: "NEXT_FRAGMENT" }
  | { type: "PREV_FRAGMENT" }
  | { type: "RESET_FRAGMENTS" }
  | { type: "TOGGLE_PRESENTER" }
  | { type: "SET_FULLSCREEN"; value: boolean }
  | { type: "UPDATE_TOTAL_SLIDES"; total: number }
  | { type: "UPDATE_TOTAL_FRAGMENTS"; total: number }
  | { type: "TRANSITION_END" };

function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case "NEXT_SLIDE": {
      // Se ainda há fragmentos no slide atual, avança fragmento ao invés de slide
      if (state.currentFragment < state.totalFragmentsInCurrent) {
        return { ...state, currentFragment: state.currentFragment + 1 };
      }
      const next = Math.min(state.currentIndex + 1, state.totalSlides - 1);
      if (next === state.currentIndex) return state;
      return {
        ...state,
        currentIndex: next,
        currentFragment: 0,
        transitionDirection: "next",
      };
    }
    case "PREV_SLIDE": {
      // Se há fragmentos revelados, recolhe um (em vez de voltar slide)
      if (state.currentFragment > 0) {
        return { ...state, currentFragment: state.currentFragment - 1 };
      }
      const prev = Math.max(state.currentIndex - 1, 0);
      if (prev === state.currentIndex) return state;
      return {
        ...state,
        currentIndex: prev,
        currentFragment: 0,
        transitionDirection: "prev",
      };
    }
    case "JUMP_TO":
      return {
        ...state,
        currentIndex: Math.max(0, Math.min(action.index, state.totalSlides - 1)),
        currentFragment: 0,
        transitionDirection: "none",
      };
    case "TOGGLE_PRESENTER":
      return { ...state, presenterMode: !state.presenterMode };
    case "SET_FULLSCREEN":
      return { ...state, fullscreen: action.value };
    // ... outros casos
  }
}

export function useDeckState(initialIndex: number, totalSlides: number) {
  const [state, dispatch] = useReducer(deckReducer, {
    currentIndex: Math.max(0, Math.min(initialIndex, totalSlides - 1)),
    currentFragment: 0,
    presenterMode: false,
    fullscreen: false,
    transitionDirection: "none",
    totalSlides,
    totalFragmentsInCurrent: 0,
  });
  return [state, dispatch] as const;
}
```

#### Tasks
1. Implementar interface + reducer + actions.
2. Hook publica `[state, dispatch]` tupla.
3. Edge cases: initialIndex fora do range → clamp. totalSlides=0 → state válido mas indices clampados.

#### TDD
```
RED:     use-deck-state.test.ts — "initial state respects initialIndex"
RED:     use-deck-state.test.ts — "initialIndex > totalSlides clamps to last"
RED:     use-deck-state.test.ts — "initialIndex < 0 clamps to 0"
RED:     use-deck-state.test.ts — "NEXT_SLIDE advances index by 1"
RED:     use-deck-state.test.ts — "NEXT_SLIDE on last slide is no-op"
RED:     use-deck-state.test.ts — "NEXT_SLIDE advances fragment if fragments remain"
RED:     use-deck-state.test.ts — "PREV_SLIDE decrements fragment first, then slide"
RED:     use-deck-state.test.ts — "JUMP_TO clamps to valid range"
RED:     use-deck-state.test.ts — "JUMP_TO resets currentFragment to 0"
RED:     use-deck-state.test.ts — "TOGGLE_PRESENTER flips boolean"
RED:     use-deck-state.test.ts — "SET_FULLSCREEN sets explicit value"
RED:     use-deck-state.test.ts — "totalSlides=0 produces valid state"
GREEN:   implementar
VERIFY:  pnpm test src/components/composites/slide-deck/use-deck-state.test.ts
```

#### Acceptance Criteria
- [ ] useReducer pattern
- [ ] 12 tests verdes (pure reducer + hook integration)
- [ ] Action types tipados (sem string magic)
- [ ] Coverage ≥ 95%

#### DoD
- [ ] Hook testado
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 2: Navigation hooks (keyboard + touch + hash routing)

**Objective:** Hooks isolated que conectam input dispositivos → dispatch actions.

### T2.1 — `useDeckKeyboard` hook

#### Objective
Hook registra keydown listener no document, mapeia bindings para dispatch actions.

#### Evidence
- D9 explicit: implementação própria, ~50 LOC.

#### Files to edit
```
src/components/composites/slide-deck/use-deck-keyboard.ts
```

#### Deep Dives
- Bindings:
  - `ArrowRight`, `Space`, `PageDown` → `NEXT_SLIDE`
  - `ArrowLeft`, `PageUp` → `PREV_SLIDE`
  - `Home` → `JUMP_TO 0`
  - `End` → `JUMP_TO last`
  - `Escape` → `SET_FULLSCREEN false`
  - `f`, `F` → toggle fullscreen (via callback)
  - `n`, `N`, `p`, `P` → `TOGGLE_PRESENTER`
  - `Ctrl+P` ou `Meta+P` → preventDefault + onPrint callback
- Guard: ignora event quando `event.target` é `INPUT`, `TEXTAREA`, `[contenteditable]`. Permite consumer ter inputs em modais sem conflito.

#### Tasks
1. Implementar listener com mapa de bindings.
2. Guard para inputs.
3. Cleanup no unmount.

#### TDD
```
RED:     use-deck-keyboard.test.ts — "ArrowRight dispatches NEXT_SLIDE"
RED:     use-deck-keyboard.test.ts — "ArrowLeft dispatches PREV_SLIDE"
RED:     use-deck-keyboard.test.ts — "Space dispatches NEXT_SLIDE"
RED:     use-deck-keyboard.test.ts — "Home dispatches JUMP_TO 0"
RED:     use-deck-keyboard.test.ts — "End dispatches JUMP_TO last"
RED:     use-deck-keyboard.test.ts — "Escape sets fullscreen false"
RED:     use-deck-keyboard.test.ts — "f toggles fullscreen via callback"
RED:     use-deck-keyboard.test.ts — "n toggles presenter"
RED:     use-deck-keyboard.test.ts — "ignores events from INPUT target"
RED:     use-deck-keyboard.test.ts — "ignores events from contenteditable"
RED:     use-deck-keyboard.test.ts — "Ctrl+P calls onPrint and prevents default"
RED:     use-deck-keyboard.test.ts — "cleanup on unmount removes listener"
GREEN:   implementar
VERIFY:  pnpm test src/components/composites/slide-deck/use-deck-keyboard.test.ts
```

#### Acceptance Criteria
- [ ] 12 tests verdes
- [ ] No conflict com inputs
- [ ] Cleanup verificado

#### DoD
- [ ] Hook funcional
- [ ] `pnpm quality:gates:fast` verde

---

### T2.2 — `useDeckSwipe` hook

#### Objective
Touch/pointer swipe horizontal navega slides.

#### Evidence
- D10 explicit: Pointer Events, ~30 LOC, threshold 50px + velocity > 0.3 px/ms.

#### Files to edit
```
src/components/composites/slide-deck/use-deck-swipe.ts
```

#### Deep Dives
- Algorithm:
  - `pointerdown` → registra start (x, y, timestamp)
  - `pointermove` → tracking opcional (não dispatched, só accumulated)
  - `pointerup` → calcula delta (dx, dy, dt), checa:
    - `Math.abs(dx) > 50` AND `Math.abs(dx) / dt > 0.3` AND `Math.abs(dx) > Math.abs(dy) * 2`
    - dx > 0 → PREV_SLIDE (swipe right = volta)
    - dx < 0 → NEXT_SLIDE (swipe left = avança)
- Cleanup nos handlers + pointer events scoped no `ref.current`.

#### Tasks
1. Implementar swipe detector com Pointer Events.
2. Cleanup ao unmount.

#### TDD
```
RED:     use-deck-swipe.test.ts — "swipe left (dx<0) dispatches NEXT_SLIDE"
RED:     use-deck-swipe.test.ts — "swipe right (dx>0) dispatches PREV_SLIDE"
RED:     use-deck-swipe.test.ts — "swipe below threshold (40px) does nothing"
RED:     use-deck-swipe.test.ts — "slow swipe (velocity < 0.3) does nothing"
RED:     use-deck-swipe.test.ts — "vertical swipe (|dy| > 2*|dx|) does nothing"
RED:     use-deck-swipe.test.ts — "cleanup removes pointer listeners"
GREEN:   implementar
VERIFY:  pnpm test src/components/composites/slide-deck/use-deck-swipe.test.ts
```

#### Acceptance Criteria
- [ ] 6 tests verdes
- [ ] No false-positive em vertical swipe (scroll)
- [ ] Cleanup verificado

#### DoD
- [ ] Hook funcional
- [ ] `pnpm quality:gates:fast` verde

---

### T2.3 — `useDeckHashRouting` hook

#### Objective
Sincroniza `currentIndex` ↔ `window.location.hash` no formato `#/N` (1-indexed).

#### Evidence
- D13 explicit: opt-in default-on, pattern `#/N`, bidirectional sync.

#### Files to edit
```
src/components/composites/slide-deck/use-deck-hash-routing.ts
```

#### Deep Dives
- Algorithm:
  - On mount: parse hash → dispatch JUMP_TO se válido
  - On `hashchange` event: parse → dispatch JUMP_TO
  - On state.currentIndex change: update hash via `history.replaceState` (não pushState — evita poluir history para cada slide)
- Hash format:
  - `#/1` → slide 1 (1-indexed)
  - `#/1.2` → slide 1 com fragment 2 (futuro)
  - `#/foo` → não-numérico, parseado como id (T4 do RFC: id lookup)
- Edge cases:
  - Hash inválido (`#/abc` quando não há id "abc") → clamp para 0 + warning console
  - Hash > total → clamp para last
  - enableHashRouting=false → hook é no-op

#### Tasks
1. Parser de hash.
2. Listener de `hashchange`.
3. Writer no hash quando currentIndex muda (via `history.replaceState`, NÃO `location.hash =` — replaceState NÃO dispara hashchange, evita loop).
4. Opt-out via prop.
5. **EC-5 / D17 — SSR-safe lazy init:** mudar `useDeckState` (T1.3) para aceitar uma função `initFromHash` no useReducer lazy initializer. Quando `enableHashRouting` está ativo, lê hash via `typeof window !== "undefined" && readHashIndex(window.location.hash) ?? initialIndex`. Garante que server e client começam com mesmo state.

#### TDD
```
RED:     use-deck-hash-routing.test.ts — "initial hash #/3 sets initial state via lazy init (no JUMP_TO action — EC-5 / D17)"
RED:     use-deck-hash-routing.test.ts — "hashchange #/5 dispatches JUMP_TO 4"
RED:     use-deck-hash-routing.test.ts — "invalid hash #/abc starts at initialIndex (no JUMP_TO needed)"
RED:     use-deck-hash-routing.test.ts — "hash > total clamps to last"
RED:     use-deck-hash-routing.test.ts — "currentIndex change updates hash via replaceState (NOT pushState, NOT location.hash =)"
RED:     use-deck-hash-routing.test.ts — "replaceState does NOT trigger hashchange (no infinite loop — EC-10)"
RED:     use-deck-hash-routing.test.ts — "enableHashRouting=false is no-op (skip lazy init read)"
RED:     use-deck-hash-routing.test.ts — "SSR-safe: typeof window === undefined uses initialIndex (EC-5 / D17)"
RED:     use-deck-hash-routing.test.ts — "cleanup removes hashchange listener"
GREEN:   implementar
VERIFY:  pnpm test src/components/composites/slide-deck/use-deck-hash-routing.test.ts
```

#### Acceptance Criteria
- [ ] 7 tests verdes
- [ ] Bidirectional sync sem loop infinito
- [ ] Opt-out funcional

#### DoD
- [ ] Hook testado
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 3: UI chrome sub-components

**Objective:** Sub-componentes de chrome: prev/next buttons, progress bar, slide number.

### T3.1 — `<SlideDeck.Controls>` — prev/next buttons + slide indicator

#### Objective
Sub-componente que renderiza botões prev/next + indicador (e.g. "3 / 12") com a11y.

#### Files to edit
```
src/components/composites/slide-deck/controls.tsx
```

#### Deep Dives
- Componente recebe `state` + `dispatch` via Context interno (criado em T8.1).
- Botões: `aria-label="Previous slide"` / `aria-label="Next slide"`. `disabled` em estados terminais (prev desabilitado em index=0, next em index=total-1).
- Estilização via classe `.theo-slide-deck-controls`.

#### Tasks
1. Implementar componente com 2 botões + span de indicador.
2. ARIA labels.
3. Disabled state.

#### TDD
```
RED:     controls.test.tsx — "renders Previous and Next buttons"
RED:     controls.test.tsx — "Previous button disabled at index 0"
RED:     controls.test.tsx — "Next button disabled at last index"
RED:     controls.test.tsx — "click Next dispatches NEXT_SLIDE"
RED:     controls.test.tsx — "click Previous dispatches PREV_SLIDE"
RED:     controls.test.tsx — "indicator shows '3 / 12' format"
RED:     controls.test.tsx — "aria-labels present"
GREEN:   implementar
VERIFY:  pnpm test src/components/composites/slide-deck/controls.test.tsx
```

#### Acceptance Criteria
- [ ] 7 tests verdes
- [ ] A11y zero axe violations
- [ ] Indicador formato "N / Total"

#### DoD
- [ ] Componente funcional
- [ ] `pnpm quality:gates:fast` verde

---

### T3.2 — `<SlideDeck.ProgressBar>`

#### Objective
Barra de progresso horizontal mostrando percent (currentIndex+1) / totalSlides.

#### Files to edit
```
src/components/composites/slide-deck/progress-bar.tsx
```

#### Deep Dives
- HTML5 `<progress>` element nativo + ARIA. Suporta theming via CSS variable `--theo-slide-deck-progress-color`.
- Calculate: `((currentIndex + 1) / totalSlides) * 100`. Edge case: totalSlides=0 → 0%.

#### Tasks
1. Implementar componente.
2. CSS scoped.

#### TDD
```
RED:     progress-bar.test.tsx — "renders progress element"
RED:     progress-bar.test.tsx — "value reflects currentIndex"
RED:     progress-bar.test.tsx — "max = totalSlides"
RED:     progress-bar.test.tsx — "totalSlides=0 renders 0% safely"
GREEN:   implementar
VERIFY:  pnpm test src/components/composites/slide-deck/progress-bar.test.tsx
```

#### Acceptance Criteria
- [ ] 4 tests verdes
- [ ] Zero axe violations

#### DoD
- [ ] Componente funcional
- [ ] `pnpm quality:gates:fast` verde

---

### T3.3 — `<SlideDeck.SlideNumber>`

#### Objective
Overlay numérico opcional ("3 / 12") posicionado no canto inferior direito.

#### Files to edit
```
src/components/composites/slide-deck/slide-number.tsx
```

#### Deep Dives
- Posição via CSS `position: absolute; bottom: 12px; right: 16px`.
- Pode ser desativado via prop `showSlideNumber` no SlideDeck.

#### Tasks
1. Implementar componente.
2. CSS scoped.

#### TDD
```
RED:     slide-number.test.tsx — "renders 'N / Total' text"
RED:     slide-number.test.tsx — "aria-hidden true (decorative, already in progress aria)"
GREEN:   implementar
VERIFY:  pnpm test src/components/composites/slide-deck/slide-number.test.tsx
```

#### Acceptance Criteria
- [ ] 2 tests verdes

#### DoD
- [ ] Componente funcional
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 4: Thumbnails sidebar

**Objective:** Grid de mini-slides clicáveis para navegação direta.

### T4.1 — `<SlideDeck.Thumbnails>`

#### Objective
Sidebar colapsável renderiza TODOS os slides em scale ~0.2 com highlight do atual.

#### Evidence
- Tier 3 explicit (mensagem do usuário).
- Reveal.js + Marpit + PowerPoint têm esse padrão.

#### Files to edit
```
src/components/composites/slide-deck/thumbnails.tsx
```

#### Deep Dives
- Performance: renderizar 100 slides em scale 0.2 pode ser pesado. Estratégia:
  - Cada thumbnail é um `<Slide>` pequeno (scale via CSS transform), pointer-events disabled exceto no click do container.
  - Lazy parsing: só renderiza o thumbnail quando entra no viewport (IntersectionObserver).
  - Memo agressivo: cada thumbnail é memoized por `markdown` string (mudança rara).
- Layout: vertical sidebar à direita por default, com `display: flex; flex-direction: column; gap: 8px; overflow-y: auto`.
- Click handler: dispatch JUMP_TO + scrollIntoView no thumbnail atual.
- Keyboard: Tab navega entre thumbnails, Enter/Space ativa.

#### Tasks
1. Implementar thumbnail component (1 slide em mini).
2. Implementar container com IntersectionObserver lazy.
3. Click handler.
4. Keyboard nav (Tab + Enter).
5. Auto-scroll para thumbnail atual quando currentIndex muda.

#### TDD
```
RED:     thumbnails.test.tsx — "renders N thumbnails for N slides"
RED:     thumbnails.test.tsx — "click thumbnail dispatches JUMP_TO with correct index"
RED:     thumbnails.test.tsx — "current thumbnail has data-current=true"
RED:     thumbnails.test.tsx — "Enter on focused thumbnail jumps"
RED:     thumbnails.test.tsx — "lazy load: off-screen thumbnails render placeholder"
RED:     thumbnails.test.tsx — "auto-scroll: currentIndex change scrolls thumbnail into view"
GREEN:   implementar
VERIFY:  pnpm test src/components/composites/slide-deck/thumbnails.test.tsx
```

#### Acceptance Criteria
- [ ] 6 tests verdes
- [ ] Lazy parsing via IntersectionObserver
- [ ] Performance: 100-slide deck renderiza thumbnails em < 1s
- [ ] Zero axe violations

#### DoD
- [ ] Componente funcional
- [ ] Performance smoke test ok
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 5: Presenter view + fullscreen

**Objective:** Apresentador profissional view + integração fullscreen API.

### T5.1 — `<SlideDeck.PresenterView>` — janela separada

#### Objective
Botão "Open Presenter" abre `window.open()` mostrando current slide + next + notes + timer.

#### Evidence
- D6 explicit: window.open + BroadcastChannel + localStorage fallback.

#### Files to edit
```
src/components/composites/slide-deck/presenter-view.tsx
src/components/composites/slide-deck/use-broadcast-sync.ts (NEW)
```

#### Deep Dives
- Architecture:
  - Main window: deck state + dispatch.
  - Presenter window: lê state via BroadcastChannel (read-only).
  - Bidirectional: presenter pode dispatch (next/prev) e main aplica.
- BroadcastChannel:
  ```ts
  const channel = new BroadcastChannel(`theo-slide-deck-${deckId}`);
  channel.postMessage({ type: "STATE", state });
  channel.onmessage = (e) => handleMessage(e.data);
  ```
- Fallback localStorage:
  - Quando `typeof BroadcastChannel === "undefined"`, usa `localStorage.setItem(key, JSON.stringify(state))` + listen `storage` event.
- Presenter window HTML é gerado on-the-fly via `document.write` (script comum em prior art reveal.js / Marpit).
- Timer: `useTimer({ startedAt, durationMs })` mostra elapsed + remaining em formato `MM:SS`.

#### Tasks
1. Implementar `useBroadcastSync` (BroadcastChannel + fallback).
2. Implementar `<PresenterView>` (renderiza dentro da window aberta).
3. Implementar timer.
4. Click "Open Presenter" abre window via `window.open` (precisa ser dentro de user gesture).
5. Sincronização bidirectional testada.

#### TDD
```
RED:     use-broadcast-sync.test.ts — "BroadcastChannel sends state on dispatch"
RED:     use-broadcast-sync.test.ts — "BroadcastChannel receives state and dispatches"
RED:     use-broadcast-sync.test.ts — "fallback to localStorage when BroadcastChannel undefined"
RED:     use-broadcast-sync.test.ts — "cleanup closes channel"
RED:     presenter-view.test.tsx — "renders current + next slide"
RED:     presenter-view.test.tsx — "renders speaker notes from current slide"
RED:     presenter-view.test.tsx — "timer formats MM:SS"
RED:     presenter-view.test.tsx — "click open presenter calls window.open"
GREEN:   implementar
VERIFY:  pnpm test src/components/composites/slide-deck/{presenter-view,use-broadcast-sync}.test.tsx
```

#### Acceptance Criteria
- [ ] 8 tests verdes
- [ ] BroadcastChannel + fallback funcionais
- [ ] Timer correto
- [ ] window.open dentro de user gesture (popup não bloqueado em browser default)

#### DoD
- [ ] Sub-componente funcional
- [ ] `pnpm quality:gates:fast` verde

---

### T5.2 — `useFullscreen` hook + `<SlideDeck.FullscreenButton>`

#### Objective
Hook que abstrai Fullscreen API + botão dedicado.

#### Files to edit
```
src/components/composites/slide-deck/use-fullscreen.ts
src/components/composites/slide-deck/fullscreen-button.tsx
```

#### Deep Dives
- Fullscreen API quirks:
  - `element.requestFullscreen()` (standard)
  - `element.webkitRequestFullscreen()` (Safari)
  - Document level `document.fullscreenElement` para state read
- Listener `fullscreenchange` (+ webkit prefix) sincroniza state quando user pressiona Esc no native UI.
- Hook signature: `useFullscreen(ref): [isFullscreen, toggleFullscreen]`.

#### Tasks
1. Implementar hook com cross-browser API.
2. Implementar button.
3. Sync de state via listener.

#### TDD
```
RED:     use-fullscreen.test.ts — "toggleFullscreen calls requestFullscreen on element"
RED:     use-fullscreen.test.ts — "toggleFullscreen calls exitFullscreen when already fullscreen"
RED:     use-fullscreen.test.ts — "fullscreenchange listener updates state"
RED:     use-fullscreen.test.ts — "webkit prefix fallback (Safari)"
RED:     use-fullscreen.test.ts — "cleanup removes listener"
RED:     fullscreen-button.test.tsx — "click dispatches toggleFullscreen"
RED:     fullscreen-button.test.tsx — "aria-label='Enter fullscreen' / 'Exit fullscreen'"
GREEN:   implementar
VERIFY:  pnpm test src/components/composites/slide-deck/{use-fullscreen,fullscreen-button}.test.tsx
```

#### Acceptance Criteria
- [ ] 7 tests verdes
- [ ] Cross-browser (mock both APIs)
- [ ] Cleanup verificado

#### DoD
- [ ] Hook + button funcionais
- [ ] `pnpm quality:gates:fast` verde

---

### T5.3 — `<SlideDeck.PresenterButton>` + auto-discovery deckId

#### Objective
Botão dedicado que abre presenter window. DeckId auto-gerado (uuid ou via prop).

#### Files to edit
```
src/components/composites/slide-deck/presenter-button.tsx
```

#### Deep Dives
- DeckId: gera UUID v4 via `crypto.randomUUID()` se prop `deckId` não fornecido. Mesmo deckId em sessions diferentes → channels separados (não conflita).
- Click handler aberta window via:
  ```ts
  const win = window.open("", `presenter-${deckId}`, "width=1280,height=720");
  // EC-2: popup blocker → window.open returns null. Guard + callback.
  if (!win) {
    onPopupBlocked?.();
    return;
  }
  win.document.write(`<div id="root"></div>...`);
  win.document.title = "Presenter View";
  ```
  Em seguida monta React via portal ou ReactDOM.createRoot no DOM da nova window.
- Adicionar prop `onPopupBlocked?: () => void` em `SlideDeckProps` para consumer notificar usuário (toast, modal, etc.).

#### Tasks
1. Implementar button + window.open logic.
2. Mount React no doc da window aberta.
3. Cleanup quando window fecha.

#### TDD
```
RED:     presenter-button.test.tsx — "click calls window.open with target presenter-{deckId}"
RED:     presenter-button.test.tsx — "auto-generates deckId when not provided"
RED:     presenter-button.test.tsx — "aria-label='Open presenter view'"
RED:     presenter-button.test.tsx — "window.open returning null triggers onPopupBlocked callback (EC-2)"
RED:     presenter-button.test.tsx — "window.open null does NOT throw (defensive guard)"
GREEN:   implementar
VERIFY:  pnpm test src/components/composites/slide-deck/presenter-button.test.tsx
```

#### Acceptance Criteria
- [ ] 4 tests verdes
- [ ] User gesture preservado (click handler direto, não setTimeout)

#### DoD
- [ ] Button funcional
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 6: Transitions + Fragments

**Objective:** Animações CSS entre slides + reveal progressive de listas com `*`.

### T6.1 — Transitions CSS (fade + slide + none)

#### Objective
Estilo CSS scoped que aplica transição de entrada/saída entre slides.

#### Evidence
- D8 explicit: CSS-only, 3 presets, respeitar prefers-reduced-motion.

#### Files to edit
```
src/components/composites/slide-deck/transitions.css
src/components/composites/slide-deck/slide-deck.tsx — aplicar classes baseado em state.transitionDirection
```

#### Deep Dives
- Classes:
  - `.theo-slide-deck-transition-fade-out` / `.theo-slide-deck-transition-fade-in`
  - `.theo-slide-deck-transition-slide-out-left` / `.theo-slide-deck-transition-slide-in-right`
  - `.theo-slide-deck-transition-slide-out-right` / `.theo-slide-deck-transition-slide-in-left`
  - `.theo-slide-deck-transition-none` (instantâneo)
- Duração: 250ms via CSS custom property `--theo-slide-deck-transition-duration` (overridable).
- Prefers-reduced-motion:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .theo-slide-deck * {
      transition-duration: 0ms !important;
    }
  }
  ```
- State management: quando `transitionDirection !== "none"`, aplica classe outgoing no slide anterior, classe incoming no novo. `transitionend` event dispatcheia `TRANSITION_END` reducer → reseta `transitionDirection`.

#### Tasks
1. Escrever CSS para 3 presets.
2. Aplicar classes baseado em state no slide-deck.tsx.
3. Hook `useTransitionEnd` que dispara dispatch `TRANSITION_END`.
4. **EC-3 / D16:** Adicionar `useEffect` paralelo com `setTimeout(300ms)` que também dispatcheia `TRANSITION_END` — destrava state se `transitionend` não dispara em rapid navigation:
   ```ts
   useEffect(() => {
     if (state.transitionDirection === "none") return;
     const t = setTimeout(() => dispatch({ type: "TRANSITION_END" }), 300);
     return () => clearTimeout(t);
   }, [state.transitionDirection]);
   ```
   Action `TRANSITION_END` no reducer DEVE ser idempotente (set transitionDirection: "none" se já não for) — `transitionend` event e timeout podem ambos disparar.

#### TDD
```
RED:     transitions.test.tsx — "NEXT_SLIDE applies 'slide-out-left' to outgoing"
RED:     transitions.test.tsx — "NEXT_SLIDE applies 'slide-in-right' to incoming"
RED:     transitions.test.tsx — "PREV_SLIDE inverte direction"
RED:     transitions.test.tsx — "transition='none' aplica classe none"
RED:     transitions.test.tsx — "transitionend dispatches TRANSITION_END"
RED:     transitions.test.tsx — "prefers-reduced-motion media query reduz duration"
RED:     transitions.test.tsx — "rapid navigation: 5 NEXT_SLIDE in 100ms timeout fallback fires TRANSITION_END (EC-3 / D16)"
RED:     transitions.test.tsx — "TRANSITION_END is idempotent (timeout + transitionend both fire safely)"
GREEN:   implementar
VERIFY:  pnpm test src/components/composites/slide-deck/transitions.test.tsx
```

#### Acceptance Criteria
- [ ] 6 tests verdes
- [ ] Prefers-reduced-motion respeitado
- [ ] CSS scoped (no leak)

#### DoD
- [ ] Transitions funcionais
- [ ] `pnpm quality:gates:fast` verde

---

### T6.2 — Fragments via `*` em lista (Marpit style)

#### Objective
Listas com `*` (asterisco) marker viram progressive reveal. Tecla → avança fragments antes de avançar slide.

#### Evidence
- D12 explicit: Marpit convention.

#### Files to edit
```
src/components/composites/slide-deck/fragments.ts — detector + helper
src/components/composites/slide-deck/fragments.css (NEW) — CSS de fragments
src/components/composites/slide-deck/slide-deck.tsx — integration
src/components/composites/slide-deck/use-deck-state.ts — atualização para support
```

#### Deep Dives
- Detector mdast: walk pelos `listItem` e checa o marker do parent `list` node:
  ```ts
  function countFragmentsInSlide(tree: MdastRoot): number {
    let count = 0;
    visit(tree, "list", (node) => {
      // Marpit usa o caractere literal '*' como marker; mdast normaliza, então
      // precisamos olhar o raw source via node.position.
      // Mais simples: walker por raw markdown regex /^\* /m
    });
    return count;
  }
  ```
  Alternativa pragmática: regex no markdown source `/^\* /gm` antes do parse.
- DOM: cada `<li>` filho de lista fragmented recebe `data-fragment-index={N}`.
- CSS:
  ```css
  .theo-slide [data-fragment-index] {
    opacity: 0;
    transition: opacity 200ms;
  }
  .theo-slide [data-fragment-current],
  .theo-slide [data-fragment-revealed] {
    opacity: 1;
  }
  ```
- State: `currentFragment` no useDeckState dispara CSS attribute update.

#### Tasks
1. Implementar `countFragmentsInSlide(markdown)` em fragments.ts (regex-based, simples).
2. CSS de fragments em fragments.css.
3. Integration no slide-deck.tsx: a cada slide change, parsea fragments e atualiza state.totalFragmentsInCurrent.
4. Hook nas teclas → avança fragment antes de slide (já implementado em reducer T1.3).

#### TDD
```
RED:     fragments.test.ts — "countFragmentsInSlide returns 0 when no '*' lists"
RED:     fragments.test.ts — "countFragmentsInSlide returns N for N '*' items"
RED:     fragments.test.ts — "fragments via '-' marker NOT counted (only '*' is fragment)"
RED:     fragments.test.ts — "nested fragment items count each level"
RED:     slide-deck.test.tsx — "NEXT_SLIDE on slide with fragments first advances fragment"
RED:     slide-deck.test.tsx — "NEXT_SLIDE after last fragment advances slide"
RED:     slide-deck.test.tsx — "PREV_SLIDE retracts fragment first, then slide"
GREEN:   implementar
VERIFY:  pnpm test src/components/composites/slide-deck/fragments.test.ts
```

#### Acceptance Criteria
- [ ] 7 tests verdes
- [ ] Fragment-only lists com `*` distinguidas de listas regular com `-`/`+`
- [ ] Navigation behavior correto

#### DoD
- [ ] Fragments funcional
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 7: PDF export via print CSS

**Objective:** Exportar deck para PDF via window.print() + @page CSS.

### T7.1 — Print CSS injection + print handler

#### Objective
Botão "Print"/Ctrl+P injeta CSS de print, renderiza TODOS os slides empilhados, chama window.print().

#### Evidence
- D7 explicit: window.print + @page.

#### Files to edit
```
src/components/composites/slide-deck/print-styles.ts — gera <style> dinamicamente
src/components/composites/slide-deck/print-button.tsx — botão UI
src/components/composites/slide-deck/slide-deck.tsx — integration
```

#### Deep Dives
- CSS print:
  ```css
  @media print {
    @page {
      size: 1280px 720px;
      margin: 0;
    }
    body * { visibility: hidden; }
    .theo-slide-deck-print-container,
    .theo-slide-deck-print-container * { visibility: visible; }
    .theo-slide-deck-print-container {
      position: absolute;
      left: 0;
      top: 0;
    }
    .theo-slide-deck-print-slide {
      page-break-after: always;
      width: 1280px;
      height: 720px;
    }
  }
  ```
- Sequence:
  1. Click button → estado entra em "print mode"
  2. Renderiza container hidden `.theo-slide-deck-print-container` com todos os slides
  3. Injeta `<style>` no document head
  4. Chama `window.print()` (browser dialog abre)
  5. Listener `afterprint` event → cleanup (remove style + esconde container)

#### Tasks
1. Implementar `injectPrintStyles()` + `removePrintStyles()`.
2. Implementar `<PrintButton>` que orchestra.
3. Render hidden container quando print mode.
4. Cleanup no `afterprint` event.

#### TDD
```
RED:     print-styles.test.ts — "injectPrintStyles adds <style> with @page rules"
RED:     print-styles.test.ts — "removePrintStyles removes the style element"
RED:     print-button.test.tsx — "click triggers print sequence"
RED:     print-button.test.tsx — "afterprint event cleans up"
RED:     print-button.test.tsx — "aria-label='Print or save as PDF'"
GREEN:   implementar
VERIFY:  pnpm test src/components/composites/slide-deck/{print-styles,print-button}.test.tsx
```

#### Acceptance Criteria
- [ ] 5 tests verdes
- [ ] CSS print scoped corretamente (não vaza para screen)
- [ ] Cleanup verificado via afterprint

#### DoD
- [ ] Print funcional
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 8: Main `<SlideDeck>` composition + a11y + stories

**Objective:** Componente principal que junta tudo + Context provider + stories Ladle.

### T8.1 — `<SlideDeck>` main component + Context provider

#### Objective
Substituir stub do T0.4. Componente cria Context que sub-componentes consomem.

#### Files to edit
```
src/components/composites/slide-deck/slide-deck.tsx — implementação completa
src/components/composites/slide-deck/context.tsx (NEW) — DeckContext + useDeckContext hook
src/components/composites/slide-deck/index.ts — exports finais
```

#### Deep Dives
- Context provider:
  ```ts
  interface DeckContextValue {
    state: DeckState;
    dispatch: Dispatch<DeckAction>;
    slides: SlideDeckSlide[];
    theme?: SlideTheme;
    transition: "none" | "fade" | "slide";
  }
  ```
- Main component composition:
  ```tsx
  <DeckContext.Provider value={ctx}>
    <div ref={rootRef} className="theo-slide-deck" data-theo-slide-deck-fullscreen={state.fullscreen}>
      <SlideDeck.Slides />          {/* renders current Slide + transition classes */}
      <SlideDeck.Controls />
      <SlideDeck.ProgressBar />
      <SlideDeck.SlideNumber />
      <SlideDeck.Thumbnails />
      <SlideDeck.PresenterButton />
      <SlideDeck.FullscreenButton />
      <SlideDeck.PrintButton />
    </div>
  </DeckContext.Provider>
  ```
  Ou modo "default layout":
  ```tsx
  <SlideDeck slides={md} />  // monta o layout canônico
  ```
  Vs modo "headless":
  ```tsx
  <SlideDeck slides={md}>
    <SlideDeck.Slides />
    <div className="my-chrome">
      <SlideDeck.Controls />
    </div>
  </SlideDeck>
  ```
- Internamente: se children passed, usa custom layout; senão, monta layout default.
- aria-live region: `<div role="status" aria-live="polite">Slide {N} of {Total}</div>` para anunciar mudanças.
- Foco: ref no `<div className="theo-slide-deck">`, foca quando entra fullscreen.

#### Tasks
1. Implementar Context + provider.
2. Implementar main component com layout default + headless mode.
3. Hooks integration (keyboard, swipe, hash, fullscreen).
4. aria-live region.
5. SSR-safe: useEffect para parsing (não em render).
6. **EC-4 — slides prop reconciliation:** useEffect que clampa currentIndex quando slides.length muda:
   ```ts
   useEffect(() => {
     if (state.currentIndex >= slides.length && slides.length > 0) {
       dispatch({ type: "JUMP_TO", index: slides.length - 1 });
     }
   }, [slides.length]);
   ```

#### TDD
```
RED:     slide-deck.test.tsx — "renders single slide for single-slide markdown"
RED:     slide-deck.test.tsx — "renders multi-slide deck splitting on ---"
RED:     slide-deck.test.tsx — "accepts SlideDeckSlide[] prop"
RED:     slide-deck.test.tsx — "keyboard ArrowRight advances slide"
RED:     slide-deck.test.tsx — "swipe left advances slide"
RED:     slide-deck.test.tsx — "hash #/2 jumps to slide 2"
RED:     slide-deck.test.tsx — "ariaLive region announces 'Slide N of M'"
RED:     slide-deck.test.tsx — "fullscreen prop applies data attribute"
RED:     slide-deck.test.tsx — "renders default layout when no children"
RED:     slide-deck.test.tsx — "renders custom layout when children provided"
RED:     slide-deck.test.tsx — "onIndexChange callback fires on navigation"
RED:     slide-deck.test.tsx — "initialIndex respected"
RED:     slide-deck.test.tsx — "empty slides prop renders empty deck without crashing"
RED:     slide-deck.test.tsx — "slides prop shrinks below currentIndex → clamps to last slide (EC-4)"
RED:     slide-deck.test.tsx — "slides prop grows → currentIndex unchanged"
RED:     slide-deck.a11y.test.tsx (vitest-axe) — "no violations on default render"
RED:     slide-deck.a11y.test.tsx — "no violations on fullscreen"
GREEN:   implementar
REFACTOR: extrair Layouts (Default vs Headless) se >100 LOC
VERIFY:  pnpm test src/components/composites/slide-deck/slide-deck.test.tsx
```

#### Acceptance Criteria
- [ ] 15+ tests verdes
- [ ] Zero axe violations
- [ ] SSR-safe (useEffect para async work)
- [ ] Both layout modes funcionais
- [ ] Coverage ≥ 85% no slide-deck.tsx

#### DoD
- [ ] Componente completo
- [ ] A11y validado
- [ ] `pnpm quality:gates:fast` verde

---

### T8.2 — Ladle stories representativas

#### Objective
Stories cobrindo cenários: default deck, single-slide deck, presenter mode, fullscreen, com fragments, com transições, headless mode, etc.

#### Files to edit
```
src/components/composites/slide-deck/slide-deck.stories.tsx
```

#### Deep Dives
- 10+ stories planejadas:
  1. `DefaultDeck` — 5 slides simples
  2. `WithGFMTable` — slide com tabela
  3. `WithSpeakerNotes` — notas + presenter open
  4. `WithFragments` — listas com `*`
  5. `WithFadeTransition` — transition prop
  6. `WithSlideTransition` — transition prop
  7. `HashRouting` — start em `#/3`
  8. `HeadlessLayout` — custom chrome
  9. `FullscreenMode` — start in fullscreen
  10. `LargeDeck` — 50 slides para perf testing
  11. `EmptyDeck` — slides=[] edge case
  12. `SingleSlideDeck` — só 1 slide (no nav)

#### Tasks
1. Escrever 12 stories.
2. Cada story tem comentário curto.
3. `pnpm ladle:build` verde.

#### TDD
```
RED:     N/A — stories são visuais. Axe coverage validada em a11y test (T8.1).
GREEN:   escrever stories
REFACTOR: extrair fixtures markdown se >30 LOC por story
VERIFY:  pnpm ladle:build && pnpm quality:a11y
```

#### Acceptance Criteria
- [ ] 12 stories named e funcionais
- [ ] `pnpm ladle:build` verde
- [ ] `pnpm quality:a11y` verde (axe sobre stories)

#### DoD
- [ ] Stories renderizam em Ladle dev
- [ ] `pnpm quality:gates:fast` verde

---

### T8.3 — Playground demo

#### Objective
Adicionar aba "Slide Deck" no playground (mirror das abas Slide e Whiteboard).

#### Files to edit
```
playground/slide-deck-demo.tsx (NEW) — main demo component
playground/slide-deck-scenes.ts (NEW) — cenas representativas
playground/main.tsx — adicionar aba slide-deck
playground/vite.config.ts — adicionar aliases @usetheo/ui/slide-deck
```

#### Deep Dives
- 6+ cenas: full deck, presenter button, fragments, fullscreen, headless, edge case.
- UI mirror: toolbar Surface (Light/Dark/Auto), Layout (Grid/Stack/Two cols).

#### Tasks
1. Criar slide-deck-scenes.ts.
2. Criar slide-deck-demo.tsx.
3. Atualizar main.tsx + vite.config.ts.

#### TDD
```
N/A — playground demo is visual
VERIFY:  pnpm playground:build && pnpm playground (manual smoke)
```

#### Acceptance Criteria
- [ ] Aba Slide Deck no playground
- [ ] Deep-link via `#slide-deck` funciona
- [ ] `pnpm playground:build` verde

#### DoD
- [ ] Demo funcional
- [ ] `pnpm quality:gates:fast` verde

---

## Phase 9: Docs alignment + RFC closure + quality:gates

**Objective:** Sync de docs, fechar RFC, quality:gates full chain.

### T9.1 — README adicionar SlideDeck à seção Engines

#### Files to edit
```
README.md — adicionar bloco de install + import + status table
```

#### Deep Dives
- Bloco mirror de Slide:
  ```bash
  # SlideDeck — multi-slide deck w/ navigation, presenter, fullscreen, PDF
  pnpm add @usetheo/ui mdast-util-from-markdown mdast-util-gfm ...
  ```
- Status table linha:
  ```
  | SlideDeck (multi-slide deck, navigation + presenter + PDF) | `@usetheo/ui/slide-deck` | Available | [RFC 0003](./docs/rfcs/0003-slide-deck.md) |
  ```

#### Tasks
1. Editar README.md.

#### Acceptance Criteria
- [ ] README atualizado
- [ ] Engines table lista Slide, SlideDeck e Whiteboard

#### DoD
- [ ] Diff visível no PR

---

### T9.2 — CLAUDE.md + CHANGELOG sync

#### Files to edit
```
CLAUDE.md (TheoUI) — atualizar Roadmap (Slide Deck: Explorer → Available)
CHANGELOG.md — finalizar entry (substituir #TBD pelo PR ref)
```

#### Tasks
1. Editar tabela Roadmap.
2. Substituir #TBD no CHANGELOG.

#### Acceptance Criteria
- [ ] CLAUDE.md mostra SlideDeck como Available
- [ ] CHANGELOG entry final

#### DoD
- [ ] Diffs visíveis no PR

---

### T9.3 — RFC closure

#### Files to edit
```
docs/rfcs/0003-slide-deck.md — Status: PROPOSED → IMPLEMENTED, preencher Consumer documented
docs/rfcs/README.md — atualizar tabela
```

#### Tasks
1. Atualizar Status.
2. Preencher Consumer documented placeholder.

#### Acceptance Criteria
- [ ] Status: Implemented
- [ ] Consumer line preenchida

#### DoD
- [ ] RFC fechado

---

### T9.4 — Quality:gates full chain

#### Objective
Rodar `pnpm quality:gates`. Garantir 13 gates verdes (12 anteriores + dogfood:slide-deck).

#### Tasks
1. `pnpm build` para rebaseline dist.
2. `pnpm quality:bundle:update` para atualizar baseline (adicionando dist/slide-deck/*).
3. `pnpm quality:gates` full.
4. Investigar e corrigir regressões.

#### Acceptance Criteria
- [ ] format:check verde
- [ ] lint:ci verde
- [ ] typecheck verde
- [ ] test verde (coverage ≥ 85% no slide-deck/)
- [ ] build emite dist/slide-deck/{index.js,index.d.ts}
- [ ] registry:build + validate verdes
- [ ] quality:structure verde
- [ ] quality:bundle dentro do baseline
- [ ] quality:a11y verde
- [ ] ladle:build verde
- [ ] dogfood:whiteboard verde
- [ ] dogfood:slide verde
- [ ] dogfood:slide-deck verde

#### DoD
- [ ] Todos os 13 gates verdes
- [ ] CI verde no PR

---

## Phase 10: Dogfood QA (MANDATORY)

> Este phase roda DEPOIS de todos os outros phases. Plano NÃO está done até dogfood passar.

**Objective:** Validate que `<SlideDeck>` funciona como um real user experimentaria.

### Execution

1. `pnpm dogfood:slide-deck` (cenários SSR estruturados — T0.3).
2. Manual smoke em playground (`pnpm playground`):
   - Abre aba Slide Deck
   - Navega: ←/→/Space/Home/End — todos respondem
   - Touch swipe em mobile/touchpad
   - Click thumbnails → jumps to slide
   - Click "Open Presenter" → janela abre, navegação sincroniza
   - Toggle fullscreen → entra/sai
   - Hash routing: muda URL manual, deck sincroniza
   - Fragments: lista com `*` revela progressivamente
   - Ctrl+P: print preview abre com slides separados por page
3. Smoke em playground com 1 deck markdown gerado por LLM (3-5 slides).

### Acceptance Criteria

- [ ] `pnpm dogfood:slide-deck` exit 0
- [ ] Todas as stories renderizam OK em Ladle
- [ ] Navigation keyboard funcional
- [ ] Touch swipe funcional
- [ ] Hash routing funcional
- [ ] Presenter window abre e sincroniza
- [ ] Fullscreen entra e sai
- [ ] Fragments revelam progressivamente
- [ ] Print preview mostra todos os slides em pages separadas
- [ ] Zero CRITICAL issues introduzidos
- [ ] Zero HIGH issues nas superfícies modificadas

### If Dogfood Fails

1. Identificar issues do plano vs pre-existentes
2. Fix CRITICAL + HIGH antes de declarar complete
3. Re-rodar `pnpm dogfood:slide-deck` + smoke
4. Pre-existing logged, não bloqueia merge

---

## Coverage Matrix

| # | Gap / Requirement | Task(s) | Resolution |
|---|---|---|---|
| 1 | Subpath isolation `@usetheo/ui/slide-deck` | T0.1, T0.2, T0.3 | ISOLATED_SUBPATHS + tsup entry + baseline |
| 2 | Zero new peer-deps (reusa Slide) | D2, T0.3 | package.json sem novas entries |
| 3 | Slides input como string OR array | D4, T1.1 | slideDeckInput union schema |
| 4 | splitDeck via mdast (mirror Slide D12) | D3, T1.2 | mdast-util-from-markdown walker |
| 5 | Speaker notes extraction | D11, T1.2 | NOTES_RE regex + extractor |
| 6 | useReducer state machine | D5, T1.3 | useDeckState com actions tipadas |
| 7 | Keyboard navigation (10 bindings) | D9, T2.1 | useDeckKeyboard hook |
| 8 | Touch swipe | D10, T2.2 | useDeckSwipe via Pointer Events |
| 9 | Hash routing #/N | D13, T2.3 | useDeckHashRouting opt-in |
| 10 | Controls (prev/next + indicator) | T3.1 | <SlideDeck.Controls> |
| 11 | ProgressBar | T3.2 | <SlideDeck.ProgressBar> |
| 12 | SlideNumber overlay | T3.3 | <SlideDeck.SlideNumber> |
| 13 | Thumbnails sidebar lazy | T4.1 | <SlideDeck.Thumbnails> + IntersectionObserver |
| 14 | Presenter view via window.open + BroadcastChannel | D6, T5.1, T5.3 | <PresenterView> + useBroadcastSync |
| 15 | Fullscreen API cross-browser | T5.2 | useFullscreen + button |
| 16 | Transitions CSS (none/fade/slide) | D8, T6.1 | transitions.css + prefers-reduced-motion |
| 17 | Fragments via `*` lists (Marpit style) | D12, T6.2 | fragments.ts + CSS |
| 18 | PDF export via window.print + @page | D7, T7.1 | print-styles.ts + print-button |
| 19 | Main composition + Context | T8.1 | DeckContext + dot-namespace pattern |
| 20 | Dot-namespace sub-components | D14, T3-T7 | SlideDeck.X attachments |
| 21 | A11y: aria-live + focus | T8.1 | role=status announce |
| 22 | Default + headless layouts | D14, T8.1 | conditional children rendering |
| 23 | Ladle stories (12+ cenários) | T8.2 | 12 stories representativas |
| 24 | Playground demo | T8.3 | slide-deck-demo.tsx + aba |
| 25 | README Engines table | T9.1 | adicionar SlideDeck linha |
| 26 | CLAUDE.md Roadmap update | T9.2 | Explorer → Available |
| 27 | CHANGELOG entry | T0.6, T9.2 | [Unreleased] > Added |
| 28 | RFC 0003 published + closed | T0.5, T9.3 | docs/rfcs/0003-slide-deck.md |
| 29 | Quality gates 13/13 verdes | T9.4 | full chain |
| 30 | Dogfood:slide-deck script | T0.3, Phase 10 | 5+ cenários SSR + manual smoke |
| 31 | splitDeck strippa frontmatter primeiro (EC-1 / D15) | T1.2 | extractFrontmatter antes do walk mdast |
| 32 | window.open null guarded + onPopupBlocked (EC-2) | T5.3 | guard + new prop em SlideDeckProps |
| 33 | Transition timeout fallback 300ms (EC-3 / D16) | T6.1 | useEffect setTimeout dispatch TRANSITION_END |
| 34 | slides prop reconciliation: clamp currentIndex (EC-4) | T8.1 | useEffect on slides.length change |
| 35 | SSR-safe hash init via lazy initializer (EC-5 / D17) | T2.3, T1.3 | readHashOrInit in useReducer lazy init |

**Coverage: 35/35 requirements cobertos (100%)** — 30 originais + 5 derivados do edge-case review (EC-1/D15, EC-2, EC-3/D16, EC-4, EC-5/D17).

## Global Definition of Done

- [ ] Phases 0-9 completas
- [ ] `pnpm quality:gates` verde (13 gates incluindo dogfood:whiteboard + dogfood:slide + dogfood:slide-deck)
- [ ] Cobertura de `src/components/composites/slide-deck/` ≥ 85% (linhas + branches)
- [ ] Bundle do barrel (`dist/index.js`) **inalterado** — zero refs a slide-deck no barrel
- [ ] Bundle do Slide (`dist/slide/index.js`) **inalterado** — SlideDeck não regrediu Slide
- [ ] `dist/slide-deck/index.js` abaixo de 25 KB gzipped sem peer-deps
- [ ] RFC `0003-slide-deck.md` Status = IMPLEMENTED com consumer documentado
- [ ] CHANGELOG entry final
- [ ] CLAUDE.md Roadmap reclassifica SlideDeck como Available
- [ ] README Engines table inclui SlideDeck
- [ ] **Dogfood QA passa** (Phase 10) com screenshot/print
- [ ] **Runtime-metric proof:** ENGINE_PEER_DEPS (mesmas do Slide) **não** aparecem no barrel — verificado via grep no PR

## Final Phase: Dogfood QA (MANDATORY) — repeated reminder

Already detailed in Phase 10 above. **No exceptions.** O plano NÃO está done se Phase 10 falhar.

## Notas sobre escopo deliberadamente NÃO incluído

Para ancorar honestidade contra scope creep, registramos o que ficou de fora do MVP por decisão consciente:

- **Sem custom transitions além de fade/slide/none** — Framer Motion + 50 outras transições é overkill v0.4. Pode vir em v0.5.
- **Sem PPTX import** — out of scope (D7 do plano focou em export simples; import seria outro deep-reference).
- **Sem real-time collaboration** — Yjs/CRDT é projeto inteiro separado.
- **Sem custom keyboard remapping** — bindings hardcoded. Prop `keyMap` em v0.5 se demanda surgir.
- **Sem speaker view multi-monitor sync com mouse cursor** — apenas state sync via BroadcastChannel. Cursor sharing fica para v0.6.
- **Sem timer com warnings (5 min restantes)** — apenas display básico. Notifications em v0.5.
- **Sem auto-play / kiosk mode** — manual nav only. v0.5 considerando.
- **Sem export PNG por slide** — só PDF nativo. v0.5 via canvas roundtrip se demanda.
- **Sem chat / Q&A sidebar** — fora do escopo de presenter tool.
- **Sem analytics built-in** — consumer instrumenta via `onIndexChange` callback.
- **Sem voice control (Web Speech API)** — futuro experimental.
- **Sem slide search (Ctrl+F sobre o deck)** — v0.5.
- **Sem slide notes export como markdown** — agregado em PDF via print, suficiente.

Cada item acima vira candidato a follow-up RFC se um consumer concreto pedir.
