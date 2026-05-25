# Edge Case Review — faang-density-tightening

Data: 2026-05-22
Plano: `.claude/knowledge-base/plans/faang-density-tightening-plan.md`
Tasks analisadas: 18 (T0.1, T1.1-T1.4, T2.1-T2.2, T3.1, T4.1-T4.3, T5.1, T6.1-T6.2, T7.1-T7.3)
Edge cases encontrados: 5 (MUST FIX: 1, SHOULD TEST: 2, DOCUMENT: 2)

---

## MUST FIX

### EC-1: `data-[density=X]:h-Y` em base classes da cva quebra "explicit size wins"

- **Task afetada:** T4.2 (Button/Input/Select cva ganha density variants)
- **Família:** Format / CSS specificity
- **Cenário:** O plano D3/D4 adiciona modifiers Tailwind `data-[density=compact]:h-8` e `data-[density=spacious]:h-11` às **base classes** da cva, ao lado do variant `size: { md: "h-9", lg: "h-11" }`. Tailwind compila `data-[density=compact]:h-8` para o seletor `[data-density="compact"] .h-8` (specificity `0,1,1`). O variant gera apenas `.h-9` (specificity `0,1,0`). Quando o usuário monta uma UI com `<ThemeProvider defaultDensity="compact">` e dentro disso renderiza `<Button size="md">`, ambas as classes são aplicadas — e `h-8` ganha por **specificity**, NÃO porque o consumer pediu. Resultado: a prop `size="md"` é silenciosamente sobrescrita por density.
- **Impacto:** Inconsistência da API. Consumer que explicitamente passou `size="md"` espera 36px independente de density global. Bug real e perceptível em qualquer dashboard com density compact aplicado.
- **Fix sugerido:** Usar **CSS variables** em vez de class modifiers. Em `density.ts`, ThemeProvider seta CSS vars no root quando density muda:
  ```css
  [data-density="compact"]    { --theo-control-h: 2rem;    --theo-control-px: 0.75rem; }
  [data-density="comfortable"]{ --theo-control-h: 2.25rem; --theo-control-px: 0.875rem; }
  [data-density="spacious"]   { --theo-control-h: 2.75rem; --theo-control-px: 1rem; }
  ```
  E o cva `md` lê do var: `md: "h-[var(--theo-control-h)] px-[var(--theo-control-px)] text-body-sm"`. Os variants `sm` e `lg` mantêm hardcoded (`h-8`, `h-11`) — explicit prop sempre vence porque usa **classe diferente**, não a class que lê o var. Vantagem: zero CSS specificity hazard; cva permanece simples.

---

## SHOULD TEST

### EC-2: 14 componentes têm `text-body-md` hardcoded — mudança body-md 15→14px afeta layouts não testados

- **Task afetada:** T2.1 (tailwind-preset body-md 15px → 14px)
- **Cenário:** Levantamento: 14 arquivos em `src/components/*/[a-z]*.tsx` usam `text-body-md` hardcoded (não via prop / não via tokens calculados). Alguns componentes (`AgentEvent`, `TokenUsageChart` legenda, `BuildLogStream` linhas) podem ter cálculos de altura que dependem de `1em × 1.5 line-height = 22.5px` (15px body) vs `1em × 1.43 = 20px` (14px). A diferença pode causar truncation, scrollbar shift ou layout reflow em surfaces de alta densidade de texto.
- **Teste sugerido:** Adicionar à T2.2 um smoke test extra: `test_body_md_change_smoke_listing_components` — render 14 stories (`agent-event`, `token-usage-chart`, `build-log-stream`, `cost-meter`, `audit-log-entry`, `chat-message`, `chat-thread`, `agent-streaming`, `tool-result`, `tool-call`, `permission-matrix`, `diff-viewer`, `lane-board`, `terminal-panel`) e assertar que nenhuma tem `scrollHeight > clientHeight` que não tinha antes (pre/post comparison via beforeEach baseline). Pragmaticamente: visual smoke via browse screenshot dos 4 mais críticos (`agent-event`, `build-log-stream`, `chat-thread`, `permission-matrix`) suficiente.

### EC-3: localStorage `private mode` ou bloqueio third-party — `useDensity` deve usar mesmo `warnStorageFailure` helper já presente no ThemeProvider

- **Task afetada:** T4.1 (density.ts NEW)
- **Cenário:** `ThemeProvider` já lida com falhas de localStorage (Safari private, sandboxed iframes) via helper `warnStorageFailure(scope, err)` (verificado: `src/themes/theme-provider.tsx:140-160`). Plano diz que density "Persists in localStorage with key `${storageKey}:density`" mas não menciona reuso do helper de error handling. Implementação ingênua (`localStorage.setItem` direto) vai crashar em Safari private mode.
- **Teste sugerido:** `test_useDensity_safari_private_mode_no_throw` — mock `localStorage.setItem` para throw, render `<ThemeProvider><Inspector/></ThemeProvider>` e chamar `setDensity('compact')`. Esperar: density state in-memory atualiza, dev-only warn é emitida (via `warnStorageFailure('density', err)`), aplicação não crasha. Adicionar a `density.test.ts` (já no plano T4.1 com 6 testes — vai para 7).

---

## DOCUMENT

### EC-4: Gate update e source update têm que ir no MESMO commit — split causa quality:gates vermelho intermediate

- **Risco aceito:** T2.1 modifica `tailwind-preset.ts` E `scripts/validate-quality-gates.ts` (regra `validateDesignSystemFidelity` que requer literal `"body-md": ["15px"`). Se o committer fizer dois commits (source + gate) a HEAD intermediate tem build vermelho. Adicionar nota explícita na T2.1 → "Tasks" lista: "Edit preset and gate in the SAME commit — broken intermediate state means red CI on bisect."
- **Adicionar à:** T2.1 → "Tasks" final step + commit message guidance.

### EC-5: Phase 7.3 (deploy live) pré-existente risco de token Cloudflare

- **Risco aceito:** O incidente recorrente de token Cloudflare 9109/10000/10502 (rate-limit + IP allowlist + permissions) que afetou todos os deploys recentes deste mês continuará sendo um risco no T7.3. Não é fix de plano — é gerência de credencial. Documentar no T7.3 como "Pre-condition: validate token via `curl -sH 'Authorization: Bearer $CLOUDFLARE_API_TOKEN' https://api.cloudflare.com/client/v4/accounts | jq` retorna `success:true` antes de tentar deploy."

---

## Padrões Sistêmicos Detectados

| Padrão | Encontrado? | Onde |
|---|---|---|
| Implemented but not wired | Não | — |
| Correct code in wrong place | Não | — |
| Project name vs ID | N/A | UI lib, sem PG |
| ArgoCD notifiers | N/A | — |
| Backwards compat na fronteira | **Sim, tratado** | D5 ADR + Migration note (T6.2) |
| Bundle isolation invariant | **Sim, tratado** | Engines não tocados; só primitives barrel |
| CSS specificity hazards | **Sim, EC-1 acima** | T4.2 |

---

## Resumo

| Task | Edges encontrados | MUST FIX | SHOULD TEST | DOCUMENT |
|---|---|---|---|---|
| T0.1 | 0 | 0 | 0 | 0 |
| T1.1 (Button) | 0 | 0 | 0 | 0 |
| T1.2 (Input/Select/Textarea) | 0 | 0 | 0 | 0 |
| T1.3 (Composites smoke) | 0 | 0 | 0 | 0 |
| T1.4 (Sweep) | 0 | 0 | 0 | 0 |
| T2.1 (body-md 14px) | 2 | 0 | 1 (EC-2) | 1 (EC-4) |
| T2.2 (snapshot align) | 0 | 0 | 0 | 0 |
| T3.1 (Card padding) | 0 | 0 | 0 | 0 |
| T4.1 (density.ts) | 1 | 0 | 1 (EC-3) | 0 |
| T4.2 (cva density variants) | 1 | 1 (EC-1) | 0 | 0 |
| T4.3 (playground demo) | 0 | 0 | 0 | 0 |
| T5.1 (style-guide) | 0 | 0 | 0 | 0 |
| T6.1 (RFC 0006) | 0 | 0 | 0 | 0 |
| T6.2 (bump) | 0 | 0 | 0 | 0 |
| T7.1 (gates) | 0 | 0 | 0 | 0 |
| T7.2 (visual diff) | 0 | 0 | 0 | 0 |
| T7.3 (deploy live) | 1 | 0 | 0 | 1 (EC-5) |

**Veredicto:** PLANO PRECISA DE AJUSTE — 1 MUST FIX (EC-1) é arquitetural (approach de density via class modifier quebra contrato API). Fix é direto: CSS vars no root, cva md lê var, sm/lg ficam hardcoded. Outras 4 edges são preventivas (2 SHOULD TEST + 2 DOCUMENT).

---

## Ações concretas para incorporar ao plano

1. **T4.1** — atualizar Deep Dives para descrever a abordagem CSS-var: ThemeProvider seta CSS vars (`--theo-control-h`, `--theo-control-px`) no `:root` via `<style>` injection (mesmo padrão de injectThemeCss). Density values registradas em `density.ts`.
2. **T4.2** — substituir as classes `data-[density=X]:h-Y` por leitura de var: `md: "h-[var(--theo-control-h)] px-[var(--theo-control-px)] text-body-sm"`. `sm` e `lg` continuam hardcoded — garante "explicit size wins".
3. **T2.1** — adicionar à "Tasks" lista: "Step 4: commit source + gate together; verify `pnpm quality:structure` greens within the single commit."
4. **T2.2** — adicionar visual smoke step para os 4 críticos (`agent-event`, `build-log-stream`, `chat-thread`, `permission-matrix`) via browse + before/after screenshot.
5. **T4.1** — adicionar 7º teste à TDD: `test_useDensity_safari_private_mode_no_throw` reutilizando o helper `warnStorageFailure` já existente.
6. **T7.3** — adicionar "Pre-condition" line: `curl -sH "Authorization: Bearer $TOKEN" https://api.cloudflare.com/client/v4/accounts | jq '.success'` deve ser `true` antes do `wrangler pages deploy`.
