# Edge Case Review — dashboard-primitives-brief-5

**Data:** 2026-05-25
**Plano:** `.claude/knowledge-base/plans/dashboard-primitives-brief-5-plan.md`
**Tasks analisadas:** 13 (T0.1, T1.1, T2.1, T3.1, T4.1, T5.1, T6.1, T6.2, T6.3, T7.1, T8.1, T9.1-T9.4, T10.1, T11.1)
**Edge cases encontrados:** 22 (MUST FIX: 1, SHOULD TEST: 14, DOCUMENT: 7)
**Padrões Theo PaaS aplicáveis:** N/A (UI library)

---

## MUST FIX

### EC-1: `<DataTable>` expanded row `colSpan` miscalculation when `rowActions` present
- **Task afetada:** T4.1
- **Família:** Format / State
- **Cenário:** Plano descreve "Expanded row renders BELOW the row, spanning all columns: `<tr><td colSpan={columns.length + 1}>{expandable(row)}</td></tr>`" — o `+1` cobre a chevron column. **Mas** quando `rowActions` também é fornecido, há uma SEGUNDA coluna extra (a coluna de actions). Resultado: o conteúdo expandido fica subdimensionado em 1 coluna; visual quebra (last column fica órfã sem alinhamento).
- **Impacto:** Layout quebra silenciosamente toda vez que `expandable + rowActions` são usados juntos. Para o Domains DNS records (canonical use case do brief), isso significa o conteúdo expandido com 1 coluna a menos. Bug visual em produção.
- **Fix sugerido:** Calcular colSpan dinamicamente:
  ```ts
  const extraCols = (expandable ? 1 : 0) + (rowActions ? 1 : 0);
  const expandedColSpan = columns.length + extraCols;
  ```
  Adicionar test: `RED: test_expanded_row_colspan_accounts_for_actions_column`.

---

## SHOULD TEST

### EC-2: `<DropdownMenu>` SSR safety (Portal rendering)
- **Task afetada:** T1.1
- **Teste sugerido:** `test_dropdown_menu_ssr_safe` — `renderToString(<DropdownMenu.Root>...</DropdownMenu.Root>)` deve NÃO crash. Radix Portal lida com `typeof window === "undefined"` internamente, mas confirmar via teste protege contra regressões.

### EC-3: `<PinInput>` `onComplete` should NOT fire on mount when value already complete
- **Task afetada:** T3.1
- **Teste sugerido:** `test_oncomplete_does_not_fire_on_initial_full_value` — render `<PinInput value="123456" length={6} onComplete={spy} />`; assert `spy` NOT called. `onComplete` deve fire APENAS em transições (não em mount). Caso contrário, consumer pode disparar callback inesperadamente. Implementação: track previous-complete state via ref; só fire quando `wasComplete=false → isComplete=true`.

### EC-4: `<PinInput>` `disabled` prop is in spec but not in TDD
- **Task afetada:** T3.1
- **Teste sugerido:** `test_disabled_blocks_input` — `disabled=true`; assert all slots have `disabled` attribute AND typing/paste no-op. Plan lista `disabled?: boolean` na API mas o TDD não verifica.

### EC-5: `<PinInput>` paste from middle slot — convention test
- **Task afetada:** T3.1
- **Teste sugerido:** Plano JÁ inclui `test_paste_from_middle_slot` — confirmar que fill-from-current (não fill-from-start). Já no plano; só validar implementação respeita.

### EC-6: `<ActionBar>` `primaryAction.loading=true` behavior not in TDD
- **Task afetada:** T2.1
- **Teste sugerido:** `test_primary_action_loading_disables_and_shows_spinner` — `primaryAction.loading=true`; assert button disabled + Loader2 visible. Spec do plano menciona `loading?: boolean` mas TDD não cobre.

### EC-7: `<DataTable>` loading vs empty precedence
- **Task afetada:** T4.1
- **Teste sugerido:** `test_loading_overrides_empty_state` — `data=[]` AND `loading=true`; assert skeleton rows visible, NOT empty state. Convention: loading > empty (matches PageShell precedence). Plano não especifica.

### EC-8: `<DataTable>` sort change resets pagination to page 0
- **Task afetada:** T4.1
- **Teste sugerido:** `test_sort_change_resets_to_page_one` — pagination current page=3; click sort header; assert current page reset to 0. Risk register diz "convention: yes" mas TDD não tem o teste.

### EC-9: `<DataTable>` `pagination.pageSize <= 0` edge
- **Task afetada:** T4.1
- **Teste sugerido:** `test_pagination_pagesize_zero_clamps_to_one` OR documents impossibility. Realistic: pageSize=0 in TheoCloud's config file could happen. Pragmatic clamp: `const pageSize = Math.max(1, props.pagination?.pageSize ?? 10);`. Adds 1 line.

### EC-10: `<DataTable>` controlled `sort === null` renders no sort indicator
- **Task afetada:** T4.1
- **Teste sugerido:** `test_controlled_sort_null_no_indicator` — `onSortChange={fn}` + `sort={null}`; assert no chevron-with-opacity-100 visible on any header. Controlled mode + null is valid combo (consumer says "no sort applied").

### EC-11: `<DataTable>` row actions dropdown survives row removal
- **Task afetada:** T4.1
- **Teste sugerido:** `test_row_actions_dropdown_cleans_up_when_row_removed` — open dropdown on row B; remove row B from `data`; assert dropdown closes / no React warning. Radix Portal should cleanup via unmount, but verify.

### EC-12: `<PageShell>` `aria-busy="true"` placement
- **Task afetada:** T5.1
- **Teste sugerido:** Plano lista `test_aria_busy_when_loading` mas não especifica QUAL elemento. Sugestão: `aria-busy` no `<main>` outer wrapper (semantic landmark), NOT no spinner Card. Teste deve assertar exato: `screen.getByRole("main")` has `aria-busy="true"`.

### EC-13: `<PageShell>` `onTitleChange` callback identity stability
- **Task afetada:** T5.1
- **Teste sugerido:** `test_onTitleChange_fires_only_when_title_string_changes` — render with title="A", onTitleChange=spy; rerender SAME title="A"; assert spy called only 1x (not 2x). useEffect deps array `[title]` should dedupe — verify via test.

### EC-14: `<PageShell>` empty `children` (null or undefined)
- **Task afetada:** T5.1
- **Teste sugerido:** `test_pageshell_renders_when_children_null` — `<PageShell title="x">{null}</PageShell>`; assert no crash, renders title + empty content area. TS marca `children: ReactNode` (which accepts null), but verify graceful.

### EC-15: `<DropdownMenu>` MDX sub-component access in Next dynamic()
- **Task afetada:** T9.2
- **Teste sugerido:** Plano JÁ menciona aplicar Brief #2 lesson (flat aliases). Adicionar verificação explícita no T9.4 deploy: `<DropdownMenu.Trigger>` em preview MDX deve OR funcionar OR ser substituído por `<DropdownMenuTrigger>` alias com show-don't-tell em code snippet.

---

## DOCUMENT

### EC-16: `<DropdownMenu>` z-index conflict with `<Dialog>`
- **Risco aceito:** Radix DropdownMenu Portal uses z-50 by default. `<Dialog>` Content also z-50. If a consumer opens Dialog containing DropdownMenu, z-stacking depends on portal mount order. Radix internally elevates child portals correctly via React tree, but consumer using DropdownMenu and Dialog as siblings could see ordering bugs. Document in ADR; accept the edge.

### EC-17: `<ActionBar>` mobile / narrow viewport overflow
- **Risco aceito:** ActionBar usa `flex-1` no search input. Em viewports muito estreitos (< 320px), search input pode espremer o primary action button. Mobile dashboards não são prioridade do TheoCloud hoje (desktop-first). Aceitar; consumer responsável por responsive wrapping se precisar.

### EC-18: `<PinInput>` IME composition (Japanese/Chinese/Korean keyboards)
- **Risco aceito:** Pin inputs com IME composition (`compositionstart` / `compositionend`) são notoriamente difíceis. Para 6-digit codes em apps SaaS, usuários usam keyboard numeric (sem IME). Documentar limitation: PinInput não suporta IME composition; consumers que precisarem de inputs internacionalizados devem usar `<Input>`. KISS.

### EC-19: `<DataTable>` `expandable(row)` performance em large tables
- **Risco aceito:** Plano já documenta no risk register: consumer deve memoizar `expandable(row)` para tabelas com 1000+ rows. Repetir como nota no JSDoc do prop. Aceito.

### EC-20: `<DataTable>` sticky header sem overflow container
- **Risco aceito:** `position: sticky` requer um ancestor com `overflow: auto` ou `overflow: scroll`. Se DataTable é renderizado sem container scroll, sticky não funciona (degrada graciosamente para non-sticky). Documentar no JSDoc do `stickyHeader` prop. Aceito.

### EC-21: `<DataTable>` uncontrolled state persists across `data` prop changes
- **Risco aceito:** Se consumer trocar `data` via refetch, internal sort/page/expand state persiste. Pode confundir (user vê página 3 mas total agora é 1 página). Pragmatic: aceitar como controlled-mode-prefers-server-state escape hatch. Consumer pode forçar reset via `key` prop change.

### EC-22: TheoCloud canary may not run if consumer doesn't bump dep
- **Risco aceito:** Phase 10 mede contra TheoCloud assuming bump aconteceu. Se TheoCloud team prefere ficar em 0.10 até validation, Phase 10 fica pendente. Documentar como "T10 happens whenever TheoCloud chooses to upgrade; not blocking for npm publish". Brief #4 também teve essa dependência.

---

## Padrões Sistemicos Detectados

| Padrão | Encontrado? | Onde |
|--------|-------------|------|
| Implemented but not wired | Mitigado | T6.1 (barrel) + Brief #4 regen-subpath-exports.ts auto-discovers |
| Correct code in wrong place | **Detected** | Brief inclui `useSetPageTitle` no lib scope; D3 corrige (consumer scope) |
| Project name vs project ID | N/A | UI library |
| ArgoCD-related | N/A | UI library |
| Subpath-aliases-pointing-at-barrel | Mitigado | Brief #4 fix permanente |
| Generic types via barrel `.d.ts` | Documented | D4 — `DataTable<T>` types resolve via barrel (per Brief #4 D5) |
| MDX dynamic() perdendo property access em sub-components | Mitigado | T9.2 aplica Brief #2 lesson (flat aliases) |
| **NEW: Composed colSpan miscalculation** | **Detected** | EC-1 (MUST FIX) |
| `onComplete` firing on mount with controlled value | **Detected** | EC-3 (SHOULD TEST) |
| Spec-not-in-TDD drift (disabled, loading) | **Detected** | EC-4, EC-6 (SHOULD TEST) |

---

## Resumo

| Task | Edges encontrados | MUST FIX | SHOULD TEST | DOCUMENT |
|------|-------------------|----------|-------------|----------|
| T0.1 (baseline)             | 0  | 0 | 0 | 0 |
| T1.1 (DropdownMenu)         | 2  | 0 | 1 (EC-2)               | 1 (EC-16) |
| T2.1 (ActionBar)            | 2  | 0 | 1 (EC-6)               | 1 (EC-17) |
| T3.1 (PinInput)             | 4  | 0 | 3 (EC-3, EC-4, EC-5)   | 1 (EC-18) |
| T4.1 (DataTable)            | 9  | 1 (EC-1) | 5 (EC-7, EC-8, EC-9, EC-10, EC-11) | 3 (EC-19, EC-20, EC-21) |
| T5.1 (PageShell)            | 3  | 0 | 3 (EC-12, EC-13, EC-14) | 0 |
| T6.1-T6.3 (barrel + bump)   | 0  | 0 | 0 | 0 |
| T7.1 (quality:gates)        | 0  | 0 | 0 | 0 |
| T8.1 (npm publish)          | 0  | 0 | 0 | 0 |
| T9.1-T9.4 (opendocs)        | 1  | 0 | 1 (EC-15) | 0 |
| T10.1 (canary)              | 1  | 0 | 0 | 1 (EC-22) |
| T11.1 (dogfood)             | 0  | 0 | 0 | 0 |
| **TOTAL** | **22** | **1** | **14** | **7** |

---

## Veredicto

**PLANO PRECISA DE AJUSTE** — 1 MUST FIX (EC-1, fix em 2 linhas) + 14 SHOULD TEST (entram nos TDD blocks correspondentes) + 7 DOCUMENT (JSDoc + risk register).

### Ajuste mandatório antes da implementação

**EC-1 (T4.1):** Trocar `colSpan={columns.length + 1}` por cálculo dinâmico que conta as colunas extras (chevron + rowActions). Atualizar a Deep Dive da T4.1 e adicionar test ao TDD block:

```ts
const extraCols = (expandable ? 1 : 0) + (rowActions ? 1 : 0);
const expandedColSpan = columns.length + extraCols;
// ...later in JSX
<tr><td colSpan={expandedColSpan}>{expandable(row)}</td></tr>
```

Test:
```
RED: test_expanded_row_colspan_accounts_for_actions_column
     — columns=3, expandable + rowActions enabled, expanded <td> has colSpan="5"
```

### 14 SHOULD TEST entram nos TDD blocks (sem mudar implementação esperada):

| EC | TDD block target |
|----|------------------|
| EC-2 | T1.1 — DropdownMenu SSR |
| EC-3, EC-4 | T3.1 — onComplete-on-mount + disabled |
| EC-6 | T2.1 — primaryAction.loading |
| EC-7, EC-8, EC-9, EC-10, EC-11 | T4.1 — DataTable robustness battery |
| EC-12, EC-13, EC-14 | T5.1 — PageShell aria-busy, callback identity, null children |
| EC-15 | T9.2 — opendocs MDX flat aliases verify |

### 7 DOCUMENT entram no Risk Register existente:

EC-16 (DropdownMenu z-index), EC-17 (ActionBar mobile), EC-18 (PinInput IME), EC-19 (DataTable perf), EC-20 (sticky no overflow), EC-21 (uncontrolled state persistence), EC-22 (canary dependency on consumer bump).

### Análise positiva (o que o plano fez bem):

- **Pre-tasks honestas:** plano corretamente identifica e cria DropdownMenu + ActionBar como pré-reqs explícitos antes de DataTable + PageShell. Brief #5 tinha esses gaps.
- **D3 scope-narrowing:** removeu `useSetPageTitle` do lib scope — decisão importante, layer-correctness.
- **D6 controlled/uncontrolled:** Brief sugere; plano confirma com ADR.
- **Coverage matrix 20/20:** Brief #5 + análise gaps todos cobertos.
- **Bundle-delta evidence (D10 + T10.1):** consistente com Brief #4 methodology.
- **Risk register expansivo:** 9 itens documentados antes do edge-case review; mais 7 adicionados aqui.

Plano está estruturalmente saudável. Após aplicar EC-1 (MUST FIX, 2 linhas) e incorporar os 14 SHOULD TEST nos TDD blocks, plano está pronto para implementação.
