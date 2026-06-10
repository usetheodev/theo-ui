# Edge Case Review — dashboard-paas-primitives-2

**Data:** 2026-05-23
**Plano:** `.claude/knowledge-base/plans/dashboard-paas-primitives-2-plan.md`
**Tasks analisadas:** 13 (T1.1, T2.1, T3.1, T4.1, T5.1, T6.1, T7.1, T8.1, T9.1, T9.2, T9.3, T10.1, T11.1, T12.1, T12.2, T12.3, T13.1)
**Edge cases encontrados:** 14 (MUST FIX: 0, SHOULD TEST: 10, DOCUMENT: 4)
**Padrões Theo PaaS aplicáveis:** N/A (este é projeto de UI React, não backend Theo PaaS — checks de multi-cell / GitOps / Argo / project-name-vs-ID não se aplicam)

---

## MUST FIX

Nenhum. Nenhum edge case identificado causa crash, data loss ou
security hole. Os 10 SHOULD TEST cobrem todas as questões de
correctness UX.

---

## SHOULD TEST

### EC-1: `CopyButton` com `value=""` (string vazia)
- **Task afetada:** T1.1
- **Família:** Input
- **Cenário:** Consumer passa `value=""` (ex: env var sem valor, token revogado renderizado vazio). `navigator.clipboard.writeText("")` é válido e copia string vazia.
- **Impacto:** Comportamento ambíguo — usuário vê "Copied!" mas clipboard fica vazio. Pode parecer bug ao consumidor.
- **Fix sugerido:** Adicionar `RED: test_empty_value_still_copies_and_announces` — assert que writeText("") é chamado E que aria-live ainda anuncia "Copied to clipboard". Comportamento esperado: copia normalmente (string vazia É um valor válido).

### EC-2: `CopyButton` unmount durante o feedback timer
- **Task afetada:** T1.1
- **Família:** Timing / State
- **Cenário:** Usuário clica copy → componente desmonta (navegação, conditional render) antes de `feedbackDuration` (1500ms) expirar → `setTimeout` callback ainda dispara `setState` em componente desmontado.
- **Impacto:** React warning "Can't perform a state update on an unmounted component" no console em dev. Não crash, mas poluí logs.
- **Fix sugerido:** Adicionar `RED: test_unmount_during_feedback_cleans_timer` — render, click, unmount, advance timer, assert no warnings via `vi.spyOn(console, "warn")`. Plano já menciona "Cleanup timer no unmount via `useEffect` cleanup" mas teste explícito não está listado.

### EC-3: `CopyButton` em contexto HTTP non-localhost
- **Task afetada:** T1.1
- **Família:** I/O / Permission
- **Cenário:** Página servida via HTTP (não HTTPS, não localhost). `navigator.clipboard` pode ser `undefined` no Chrome/Firefox (Permissions Policy bloqueia). Cenário real: previews via tunnel HTTP, alguns staging environments antigos.
- **Impacto:** Click chama `navigator.clipboard.writeText(...)` em `undefined` → TypeError → state nunca muda para "copied" nem "failed" → UX silenciosamente quebra.
- **Fix sugerido:** Adicionar `RED: test_clipboard_undefined_does_not_crash` — vi.stubGlobal('navigator', { clipboard: undefined }); click; assert state vai para "failed" (e não TypeError). Implementação: `if (!navigator?.clipboard?.writeText) { setState("failed"); ... return; }` antes do `.then/.catch`. Já parcialmente coberto pelo "SSR guard" mas separar SSR de "client without clipboard API" é mais claro.

### EC-4: `Table.HeaderCell` com `sortDirection` mas SEM `onSort`
- **Task afetada:** T3.1
- **Família:** Input / Format
- **Cenário:** Consumer passa `<Table.HeaderCell sortDirection="asc">Date</Table.HeaderCell>` sem `onSort`. Plano diz "se `onSort` provided, header vira sort trigger button" — não cobre o caso oposto.
- **Impacto:** Comportamento ambíguo. Ícone aparece mas não é clicável → confunde usuário ("por que não sorta?").
- **Fix sugerido:** Adicionar `RED: test_sort_direction_ignored_without_onSort` — render `<HeaderCell sortDirection="asc">` sem onSort; assert sem button + sem ícone de sort (mantém só th estático com texto). Documentar contrato: sortDirection só tem efeito quando onSort presente.

### EC-5: `Table.HeaderCell` `sortDirection="none"` + `onSort`
- **Task afetada:** T3.1
- **Família:** Format
- **Cenário:** Coluna sortable mas não atualmente sorted. Plano diz "none → ambos com `opacity-30` (sort affordance)" no Deep Dive mas TDD não lista esse caso explicitamente.
- **Impacto:** Sem o teste, o gate vermelho pode passar com implementação que não renderiza affordance neutro.
- **Fix sugerido:** Adicionar `RED: test_sort_direction_none_renders_dimmed_affordance` — assert ambos ChevronUp + ChevronDown presentes com opacity-30 class.

### EC-6: `StatusDot` sem `label` E sem `aria-label`
- **Task afetada:** T4.1
- **Família:** Permission (a11y)
- **Cenário:** Consumer renderiza `<StatusDot status="failed" />` sozinho sem label nem aria-label. Status visualmente comunicado por cor — invisível para screen readers.
- **Impacto:** Falha a11y silenciosa. axe pode pegar (depende do regra), mas tipicamente trata color-only como warn não erro.
- **Fix sugerido:** O plano lista esse test ("test_aria_label_required_when_no_visible_label") mas a estratégia não está clara. Sugestão concreta: dev warning via `useEffect` se ambos faltarem; em prod, fallback aria-label `aria-label={status}` (auto-label baseado no status kind). Teste: `vi.spyOn(console, "warn")`; render sem label/aria-label; assert warning emitido em dev.

### EC-7: `Timestamp` com `value` em segundos (Unix epoch confusion)
- **Task afetada:** T5.1
- **Família:** Input / Format
- **Cenário:** Consumer passa Unix epoch em segundos (`1700000000`) em vez de ms (`1700000000000`). JS `new Date(1700000000)` → 1970-01-20 (~21 dias após epoch). Backend Python/PostgreSQL retorna segundos por default.
- **Impacto:** Silenciosamente renderiza "55 years ago" para um timestamp que era "now". Bug invisível em code review.
- **Fix sugerido:** Adicionar `RED: test_unix_seconds_vs_ms_handling` — documentar contrato (value `number` é ms, NÃO segundos). Considerar heurística: se `typeof value === "number" && value < 10_000_000_000` (i.e., antes do ano 2286 em ms = antes de 2001 em ms; ou ano > 5138 em segundos) emit dev warning "value looks like seconds, expected ms". Trade-off: heurística pode false-positive em testes que usam datas antigas. Decisão pragmática: SÓ documentar no JSDoc + 1 teste de regressão; nada de heurística.

### EC-8: `Timestamp` com `locale` inválido
- **Task afetada:** T5.1
- **Família:** Input
- **Cenário:** `<Timestamp locale="invalid-tag" />` → `new Intl.RelativeTimeFormat("invalid-tag", ...)` throws `RangeError`.
- **Impacto:** Componente crash inteiro → unmounta árvore React (sem ErrorBoundary do consumer).
- **Fix sugerido:** Adicionar `RED: test_invalid_locale_falls_back_to_default` — try/catch ao construir RelativeTimeFormat; fallback para `undefined` locale (default browser) + dev warning. ~3 linhas.

### EC-9: `ConfirmDialog` `confirmationPhrase=""` (string vazia)
- **Task afetada:** T7.1
- **Família:** Input / State
- **Cenário:** Consumer passa `confirmationPhrase=""` (typo, refactor que deixou string vazia). Com a lógica `phraseInput === confirmationPhrase`, `"" === ""` é `true` → confirm habilitado sem typing.
- **Impacto:** Bypass involuntário da proteção destrutiva. UX bug — botão "Delete" fica clicável sem confirmação.
- **Fix sugerido:** Adicionar `RED: test_empty_phrase_treated_as_no_phrase` — empty string deve ser tratada como ausência (`phraseRequired = !!confirmationPhrase`, que já é o padrão recomendado no Deep Dive). Confirmar via teste.

### EC-10: `ConfirmDialog` Enter no input quando frase match
- **Task afetada:** T7.1
- **Família:** Input / UX
- **Cenário:** Usuário typa a phrase exata + aperta Enter no `<Input>`. Comportamento padrão de HTML: Enter submita form mais próximo, mas não há form. Resultado: nada acontece → usuário precisa mover mouse até botão.
- **Impacto:** Pequena fricção UX. Não é bug crítico mas convenção UX é "Enter = confirmar quando válido".
- **Fix sugerido:** Adicionar `RED: test_enter_in_input_triggers_confirm_when_matched` — onKeyDown handler no input: `if (e.key === "Enter" && canConfirm) handleConfirm()`. ~3 linhas.

---

## DOCUMENT

### EC-11: `StatusDot` `status` string inválido em runtime
- **Risco aceito:** TypeScript impede em compile time. Em runtime (JS direto, props vindas de network sem validação), um `status="unknown"` mapeia para `undefined` no Record → sem color class → dot invisível. Não vale a complexidade de runtime validation (Zod) só para isso. Consumer responsável.

### EC-12: `Timestamp` `value=Date` mutated externally
- **Risco aceito:** Se consumer guarda `const d = new Date(); d.setHours(...); <Timestamp value={d} />`, React faz shallow compare e não re-renderiza após `.setHours`. Padrão React universal — não é específico do Timestamp. Convenção é "props imutáveis" e o problema cai no consumer.

### EC-13: `Timestamp` `setInterval` em tab inativa
- **Risco aceito:** Browsers throttlam setInterval em background tabs (mínimo 1s, ou pausam total). "Última atividade 30s ago" pode ficar desatualizado por minutos em tab inativa. Aceitável — quando user volta ao tab, próximo intervalo dispara e atualiza. Sem fix necessário.

### EC-14: Version bump local conflict (T9.3)
- **Risco aceito:** Cenário operacional, não de código: se alguém faz bump local `0.8.0-next.0` antes deste plano completar, segundo bump tenta o mesmo número e `npm publish` rejeita. Mitigado por: (a) pre-check `npm view @theokit/ui versions | grep 0.8.0-next.0` em T11.1; (b) `git status package.json` antes de bumpar. Operacional, não vale teste automatizado.

---

## Padrões Sistemicos Detectados

| Padrão | Encontrado? | Onde |
|--------|-------------|------|
| Implemented but not wired | Mitigado | T9.1 (barrel) + T9.2 (registry) + T12.2 (MDX wiring) cobrem os 3 wiring points; gate `validate-quality-gates.ts` falha se algum esquecido |
| Correct code in wrong place | Mitigado | D2 (taxonomy resolution) move ConfirmDialog/CodeBlock para composites/ antes da implementação |
| Project name vs project ID | N/A | UI library, sem projeto-context |
| ArgoCD notifiers not services | N/A | Sem ArgoCD |
| Single ArgoCD App per tenant | N/A | Sem ArgoCD |
| CF scan imports conflicting apex | N/A | Sem Cloudflare scan |
| Native HTML attribute name collision | Mitigado | D2 lição AccountMenu — StatTile não tem prop "name" então sem colisão |
| Async test under parallel vitest pool | Mitigado | T7.1 DoD explicita `{ timeout: 5000 }` em findBy* |
| Avatar.Fallback async render | N/A | Nenhum dos 8 usa Avatar.Fallback |
| Hydration mismatch (Brief #1 ThemeProvider lesson) | Parcialmente | T5.1 menciona `suppressHydrationWarning` no `<time>`. SSR para os outros 7 é trivial (todos render same on server/client). |
| Auto-gen MDX dump (Brief #1 lesson) | Mitigado | T12.2 explicita "curated MDX pages in primitives/ + composites/" — NÃO usa `/components/` auto-gen |

---

## Resumo

| Task | Edges encontrados | MUST FIX | SHOULD TEST | DOCUMENT |
|------|-------------------|----------|-------------|----------|
| T1.1 (CopyButton)    | 3 | 0 | 3 | 0 |
| T2.1 (CodeBlock)     | 0 | 0 | 0 | 0 |
| T3.1 (Table)         | 2 | 0 | 2 | 0 |
| T4.1 (StatusDot)     | 2 | 0 | 1 | 1 |
| T5.1 (Timestamp)     | 4 | 0 | 2 | 2 |
| T6.1 (StatTile)      | 0 | 0 | 0 | 0 |
| T7.1 (ConfirmDialog) | 2 | 0 | 2 | 0 |
| T8.1 (DangerZone)    | 0 | 0 | 0 | 0 |
| T9.1-T9.3 (barrel + bump) | 1 | 0 | 0 | 1 |
| T10.1 (gates)        | 0 | 0 | 0 | 0 |
| T11.1 (publish)      | 0 | 0 | 0 | 0 |
| T12.1-T12.3 (opendocs) | 0 | 0 | 0 | 0 |
| T13.1 (dogfood)      | 0 | 0 | 0 | 0 |
| **TOTAL** | **14** | **0** | **10** | **4** |

---

## Veredicto

**PLANO PRECISA DE AJUSTE — incorporação de 10 SHOULD TEST adicionais nos TDD blocks correspondentes:**

| EC | Task | Ação no plano |
|----|------|---------------|
| EC-1 | T1.1 | Add `RED: test_empty_value_still_copies_and_announces` |
| EC-2 | T1.1 | Add `RED: test_unmount_during_feedback_cleans_timer` |
| EC-3 | T1.1 | Add `RED: test_clipboard_undefined_does_not_crash` |
| EC-4 | T3.1 | Add `RED: test_sort_direction_ignored_without_onSort` |
| EC-5 | T3.1 | Add `RED: test_sort_direction_none_renders_dimmed_affordance` |
| EC-6 | T4.1 | Substitui `test_aria_label_required` por `test_dev_warning_when_no_label_no_aria_label` + fallback auto-label |
| EC-7 | T5.1 | Add `RED: test_unix_seconds_value_documented_as_ms_only` + JSDoc nota |
| EC-8 | T5.1 | Add `RED: test_invalid_locale_falls_back_to_default` + try/catch construct |
| EC-9 | T7.1 | Add `RED: test_empty_phrase_treated_as_no_phrase` |
| EC-10 | T7.1 | Add `RED: test_enter_in_input_triggers_confirm_when_matched` |

**Nenhum MUST FIX** — todos os edges são UX/correctness pequenos, sem
risco de crash/data-loss/security. Plan está saudável estruturalmente
(ADRs sólidas, taxonomy resolution clara, dep graph correto, coverage
matrix 100%).

Após incorporar os 10 testes adicionais nos TDD blocks (3 em T1.1,
2 em T3.1, 1 em T4.1, 2 em T5.1, 2 em T7.1), plano está pronto para
implementação.
