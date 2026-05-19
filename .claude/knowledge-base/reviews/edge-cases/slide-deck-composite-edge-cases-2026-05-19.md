# Edge Case Review — slide-deck-composite

**Data:** 2026-05-19
**Plano:** `.claude/knowledge-base/plans/slide-deck-composite-plan.md`
**Tasks analisadas:** 29 tasks distribuídas em 11 phases (incluindo Dogfood)
**Edge cases encontrados:** 13 (MUST FIX: 5, SHOULD TEST: 5, DOCUMENT: 3)

**Veredicto: PLANO PRECISA DE AJUSTE** — 5 MUST FIX, todos pequenos (1-3 linhas de fix cada). Maioria está em fronteiras browser (popup blocker, fullscreen API, transitionend cancellation) ou em race condition de props vs state. SHOULD TEST viram tests adicionais nos TDD cycles existentes.

---

## MUST FIX

### EC-1: `splitDeck` confunde frontmatter delimiter com slide split

- **Task afetada:** T1.2 (`splitDeck` + `extractNotes`)
- **Família:** Format / Boundary
- **Cenário:** LLM emite markdown como `---\ntheme: violet-forge\n---\n# Slide 1\n\n---\n\n# Slide 2`. O `splitDeck` percorre mdast por `thematicBreak`. Sem extrair frontmatter primeiro, mdast vai parsear o PRIMEIRO `---` (delimitador de frontmatter) como `thematicBreak` legítimo → resulta em um slide vazio inicial + slides bagunçados. Slide single-slide já tem esse problema resolvido em `extractFrontmatter`, mas `splitDeck` não chama.
- **Impacto:** Qualquer deck com global frontmatter (uso comum) renderiza com slide #1 vazio + offset de 1 em todos os slides subsequentes. Hash routing aponta para slides errados.
- **Fix sugerido:** No início de `splitDeck`, strippar frontmatter global via `extractFrontmatter` (reutiliza função do Slide):
  ```ts
  const { body: bodyAfterFM, rawFrontmatter } = extractFrontmatter(markdown);
  // ... parsea `bodyAfterFM` em vez de `markdown`
  // Frontmatter global aplica ao primeiro slide (cada slide pode override)
  ```

### EC-2: `window.open()` retorna `null` (popup blocker) sem feedback

- **Task afetada:** T5.3 (`<SlideDeck.PresenterButton>`)
- **Família:** Boundary / Permission
- **Cenário:** Browsers (Safari/Firefox strict, Chrome com tracking protection) bloqueiam `window.open` quando: (a) chamado fora de user gesture síncrono OR (b) configurações strict do user. `window.open()` retorna `null`. Plano menciona "user gesture preservado" mas não trata o `null` retorno.
- **Impacto:** Botão "Open Presenter" silenciosamente falha. Sem feedback, usuário acha que está quebrado. Pior: code que faria `win.document.write(...)` em null lança `TypeError`.
- **Fix sugerido:** Guard explícito + callback de erro:
  ```ts
  const win = window.open(...);
  if (!win) { onPopupBlocked?.(); return; }
  // ... resto
  ```
  Adicionar prop `onPopupBlocked?: () => void` em `SlideDeckProps`.

### EC-3: `transitionend` não dispara em navegação rápida → state preso em `transitionDirection !== "none"`

- **Task afetada:** T6.1 (Transitions CSS)
- **Família:** State / Timing
- **Cenário:** User pressiona `→` 5x rapidamente. Cada press dispatcheia `NEXT_SLIDE` → `transitionDirection = "next"`. Antes do transition de 250ms terminar, próximo `NEXT_SLIDE` dispara — classe CSS é trocada mid-animation → o `transitionend` event do slide anterior é CANCELADO (não dispara). Reducer espera `TRANSITION_END` que nunca chega.
- **Impacto:** Próximos slides renderizam com classes erradas (`slide-out-left` permanente). Visual quebrado até refresh.
- **Fix sugerido:** Timeout fallback paralelo ao `transitionend` listener:
  ```ts
  useEffect(() => {
    if (state.transitionDirection === "none") return;
    const t = setTimeout(() => dispatch({ type: "TRANSITION_END" }), 300);
    return () => clearTimeout(t);
  }, [state.transitionDirection]);
  ```
  300ms = transition (250ms) + 50ms buffer.

### EC-4: `slides` prop muda com `currentIndex > newTotal` → render de slide undefined

- **Task afetada:** T8.1 (`<SlideDeck>` main component)
- **Família:** State / Input
- **Cenário:** Consumer passa `slides` array. User navegou até slide 7. Consumer atualiza `slides` para um array de 4 itens (e.g. user deletou slides). `state.currentIndex = 6` mas `slides[6]` é `undefined`. Plano não menciona reconciliação de state com prop changes.
- **Impacto:** `<Slide markdown={slides[currentIndex].markdown} />` → `Cannot read property 'markdown' of undefined` → crash.
- **Fix sugerido:** useEffect que clampa currentIndex quando totalSlides muda:
  ```ts
  useEffect(() => {
    if (state.currentIndex >= slides.length) {
      dispatch({ type: "JUMP_TO", index: Math.max(0, slides.length - 1) });
    }
  }, [slides.length]);
  ```

### EC-5: Hash routing causa SSR hydration mismatch

- **Task afetada:** T2.3 (`useDeckHashRouting`)
- **Família:** Boundary / State
- **Cenário:** Página renderizada com SSR (Next.js, Remix). Server renderiza com `currentIndex = initialIndex (e.g. 0)`. Client hidrata, useEffect lê `window.location.hash` (`#/3`) e dispatcha JUMP_TO 2. React detecta mismatch entre server HTML (slide 0 rendered) e client (slide 2 desejado) → hydration warning + visual flash.
- **Impacto:** Hydration warning no console (consumer-facing). Flash de slide 0 → slide 2 em ~16ms. Quebra UX em apps SSR.
- **Fix sugerido:** Inicializar reducer com lazy initializer que lê o hash, mas SOMENTE no client:
  ```ts
  const [state, dispatch] = useReducer(deckReducer, initialIndex, (init) => ({
    currentIndex: typeof window !== "undefined" && enableHashRouting
      ? parseHashIndex(window.location.hash) ?? init
      : init,
    // ... resto do state inicial
  }));
  ```
  Mantém SSR=client em prop `initialIndex` para SSR; hash sync acontece depois sem mismatch.

---

## SHOULD TEST

### EC-6: `pointercancel` mid-swipe deixa state preso

- **Task afetada:** T2.2 (`useDeckSwipe`)
- **Teste sugerido:** `test_useDeckSwipe_pointercancel_clears_pending_state` — disparar `pointerdown` seguido de `pointercancel` (sem `pointerup`); assertar que próximo `pointerdown` funciona normalmente (não está em estado "in-progress"). Fix: adicionar listener `pointercancel` que reseta o tracking state ao mesmo handler do `pointerup`.

### EC-7: Multi-touch causa swipe duplicado

- **Task afetada:** T2.2 (`useDeckSwipe`)
- **Teste sugerido:** `test_useDeckSwipe_multitouch_only_tracks_first_pointer` — simular dois `pointerdown` com `pointerId` diferentes; assertar que apenas o primeiro é tracked. Fix: armazenar `activePointerId` no estado do hook; ignorar events com `pointerId !== activePointerId`.

### EC-8: iOS Safari < 16 não suporta Fullscreen API em elementos arbitrários

- **Task afetada:** T5.2 (`useFullscreen`)
- **Teste sugerido:** `test_useFullscreen_graceful_fallback_when_api_unavailable` — mockar `requestFullscreen` retornando undefined / lançando NotAllowedError; assertar que toggle NÃO crashea. Em iOS Safari < 16, `<section>.requestFullscreen` lança `TypeError: undefined is not a function`. Fix: feature-detect antes de chamar; quando ausente, no-op + opcionalmente `onFullscreenUnsupported?` callback.

### EC-9: Misturar `*` e `-` markers no mesmo slide — comportamento de fragments indefinido

- **Task afetada:** T6.2 (Fragments)
- **Teste sugerido:** `test_countFragmentsInSlide_mixed_markers_uses_first_only` — input com `* item 1\n- item 2\n* item 3`; assertar que apenas os 2 `*` items (1 e 3) viram fragments. Documentar no JSDoc: "fragments só são detectados em itens com marker `*`; itens com `-` ou `+` na mesma lista são revelados imediatamente (não-fragmento)."

### EC-10: Hash routing — verificar que `replaceState` realmente não dispara loop infinito

- **Task afetada:** T2.3 (`useDeckHashRouting`)
- **Teste sugerido:** `test_useDeckHashRouting_no_infinite_loop_on_state_change` — mockar `history.replaceState`; dispatch JUMP_TO; assertar que `hashchange` NÃO foi disparado (replaceState é silent). Se algum dia trocarmos para `pushState` ou `location.hash =`, esse test pega o loop antes do user.

---

## DOCUMENT

### EC-11: `BroadcastChannel` pode perder mensagens em race conditions

- **Risco aceito:** BroadcastChannel é best-effort entre janelas. Em raríssimos casos (window minimizado durante envio, browser throttling em background tabs) uma mensagem pode ser dropped. Mitigação: como o STATE message é enviado a cada change de state e contém o state COMPLETO (não delta), drop de uma mensagem é resolvido pela próxima — mas pode haver lag de UI até a próxima mudança. Documentar no JSDoc de `useBroadcastSync`: "Best-effort sync; in edge cases of message loss, state recovers on next dispatch."

### EC-12: Print durante transition em progresso pode capturar slide mid-animation

- **Risco aceito:** Se user pressiona Ctrl+P imediatamente após navegar slide, o slide pode estar em mid-transition (opacity 0.5, translateX(-30%)). O `@media print` CSS removerá as transition rules, mas o estado do DOM no momento do snapshot pode estar inconsistente. Mitigação: cancelar transition antes de print é over-engineering. Documentar em JSDoc do `<PrintButton>`: "If pressed during a slide transition, retry after the transition completes for best print output." User retry-trivial.

### EC-13: `IntersectionObserver` ausente em ambiente legado (e jsdom de tests)

- **Risco aceito:** IntersectionObserver é Chrome 51+/FF 55+/Safari 12.1+ (cobertura > 96%). Em ambientes onde está ausente, fallback simples: renderizar TODOS os thumbnails sem lazy load. Para 10-50 slides isso é fine; para 200+ slides pode causar lag. Documentar em JSDoc de `<SlideDeck.Thumbnails>`: "Thumbnails use IntersectionObserver for lazy rendering. In environments without IO, all thumbnails render eagerly; performance acceptable up to ~50 slides." Fix em 3 linhas:
  ```ts
  if (typeof IntersectionObserver === "undefined") {
    return /* render all eagerly */;
  }
  ```

---

## Padrões Sistêmicos Detectados

| Padrão | Encontrado? | Onde |
|--------|-------------|------|
| Implemented but not wired | Não | — |
| Correct code in wrong place | Não | — |
| Promise plan ≠ task code | Não | — |
| Browser API edge (popup, fullscreen, SSR) | **Sim** | EC-2, EC-5, EC-8 |
| State machine — transition cancellation | **Sim** | EC-3 (transitionend) |
| Input validation gap at boundary | **Sim** | EC-1 (splitDeck vs frontmatter), EC-4 (slides prop) |
| Cross-window sync race | **Sim (documented)** | EC-11 (BroadcastChannel) |
| Pointer events — multi-touch / cancel | **Sim** | EC-6, EC-7 |

---

## Resumo por Task

| Task | Edges encontrados | MUST FIX | SHOULD TEST | DOCUMENT |
|------|-------------------|----------|-------------|----------|
| T0.1 — ISOLATED_SUBPATHS | 0 | 0 | 0 | 0 |
| T0.2 — tsup entry | 0 | 0 | 0 | 0 |
| T0.3 — peerDeps/baseline/dogfood | 0 | 0 | 0 | 0 |
| T0.4 — scaffold | 0 | 0 | 0 | 0 |
| T0.5 — RFC | 0 | 0 | 0 | 0 |
| T0.6 — CHANGELOG | 0 | 0 | 0 | 0 |
| T1.1 — Zod schema | 0 | 0 | 0 | 0 |
| T1.2 — splitDeck + notes | 1 | 1 (EC-1) | 0 | 0 |
| T1.3 — useDeckState | 0 | 0 | 0 | 0 |
| T2.1 — useDeckKeyboard | 0 | 0 | 0 | 0 |
| T2.2 — useDeckSwipe | 2 | 0 | 2 (EC-6, EC-7) | 0 |
| T2.3 — useDeckHashRouting | 2 | 1 (EC-5) | 1 (EC-10) | 0 |
| T3.1 — Controls | 0 | 0 | 0 | 0 |
| T3.2 — ProgressBar | 0 | 0 | 0 | 0 |
| T3.3 — SlideNumber | 0 | 0 | 0 | 0 |
| T4.1 — Thumbnails | 1 | 0 | 0 | 1 (EC-13) |
| T5.1 — PresenterView | 1 | 0 | 0 | 1 (EC-11) |
| T5.2 — useFullscreen | 1 | 0 | 1 (EC-8) | 0 |
| T5.3 — PresenterButton | 1 | 1 (EC-2) | 0 | 0 |
| T6.1 — Transitions | 1 | 1 (EC-3) | 0 | 0 |
| T6.2 — Fragments | 1 | 0 | 1 (EC-9) | 0 |
| T7.1 — Print CSS | 1 | 0 | 0 | 1 (EC-12) |
| T8.1 — Main component | 1 | 1 (EC-4) | 0 | 0 |
| T8.2 — Stories | 0 | 0 | 0 | 0 |
| T8.3 — Playground demo | 0 | 0 | 0 | 0 |
| T9.1-9.4 — Docs + gates | 0 | 0 | 0 | 0 |
| Phase 10 — Dogfood | 0 | 0 | 0 | 0 |
| **Total** | **13** | **5** | **5** | **3** |

---

## Ajustes propostos ao plano (antes de aprovar)

1. **T1.2 — `splitDeck` strippa frontmatter via `extractFrontmatter` antes do walk mdast** (EC-1). Adicionar 2 linhas + 1 teste novo.
2. **T5.3 — `PresenterButton` trata `window.open() === null`** (EC-2). Adicionar prop `onPopupBlocked` + guard + 1 teste.
3. **T6.1 — `useEffect` timeout fallback para `TRANSITION_END`** (EC-3). 4 linhas + 1 teste de rapid-nav.
4. **T8.1 — useEffect clampa `currentIndex` quando `slides.length` muda** (EC-4). 4 linhas + 1 teste.
5. **T2.3 — Lazy initializer no useReducer lê hash apenas no client** (EC-5). Reescrever inicialização do useReducer + adicionar teste de SSR hydration mismatch.

Os SHOULD TEST viram tests adicionais nos TDD cycles existentes (EC-6, EC-7 em T2.2; EC-8 em T5.2; EC-9 em T6.2; EC-10 em T2.3) — não criam tasks novas.

Os 3 DOCUMENT viram notas em JSDoc + README (EC-11 em T5.1, EC-12 em T7.1, EC-13 em T4.1) — não mudam código nem tests.

Novos ADRs sugeridos (para o plano):
- **D15** — splitDeck strippa frontmatter primeiro (mirror do extractFrontmatter do Slide).
- **D16** — Transitions têm timeout fallback de 300ms para destravar `transitionDirection` quando `transitionend` não dispara (rapid navigation).
- **D17** — Hash routing usa lazy initializer no useReducer para evitar SSR hydration mismatch.
