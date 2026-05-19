# Edge-Case Review: `agent-team-audit-fixes-2026-05-16-plan`

> **Methodology**: manual stress-test do plano (skill `edge-case-plan` indisponível nesta sessão). Caça por blind spots, contradições internas, failure modes não-cobertos, claims irrealistas, e gaps entre o que o plano promete e o que pode ser entregue.

**Date:** 2026-05-16
**Reviewer:** Claude (manual edge-case pass)
**Plan version:** 1.0

---

## Severity legend

- **MUST FIX**: bloqueia execução correta do plano OU produz outcome incorreto. Corrigir antes de começar Phase 0.
- **SHOULD FIX**: corrige antes de fechar a fase relevante.
- **NICE TO HAVE**: tracking; pode ficar como TODO inline.

---

## MUST FIX (4)

### MF-1 — Ordem das tasks de Phase 1 publica tarball com claim falso

**Severity:** MUST FIX
**Tasks:** T1.1 (`npm publish`) precede T1.3 (corrigir claims falsos no README/PITCH)
**Evidence:** Plan Phase 1 lista ordem `T1.1 → T1.2 → T1.3`. `npm publish` empacota `README.md` no tarball (verificado por `pnpm pack --dry-run` no DoD de T1.1). README atual contém claim verificavelmente falso (`PITCH.md:239` não é incluído na tarball por default, mas README sim, e README tem outras alegações que T1.3 ainda vai corrigir como pipeline `quality:gates` desatualizado em README:243).

**Impact:** Publicar `0.1.0-next.0` com README desatualizado significa que o primeiro registro público no npm contém docs erradas. Reverter requer `npm unpublish` (janela de 72h) ou novo bump `0.1.0-next.1`. Ambos custam credibilidade.

**Fix:** Reordenar Phase 1 para `T1.3 → T1.1 → T1.2`. Atualizar Dependency Graph correspondente.

---

### MF-2 — T2.5 quebra registry items consumidos via shadcn

**Severity:** MUST FIX
**Tasks:** T2.5 (ThemeProvider `themes` prop required) sem audit em registry/r/
**Evidence:** `grep -rn "ThemeProvider" registry/r/` retorna **5 matches**. Esses items contêm código copy-paste que usa `<ThemeProvider>` sem `themes` prop. Após T2.5, esse código quebra para qualquer consumer que rode `npx shadcn add` desses 5 components.

**Impact:** Breaking change silenciosa para o canal de distribuição copy-paste (Option B do README — a estratégia anunciada como vantagem competitiva contra MUI/Tremor).

**Fix:**
1. Identificar os 5 registry items.
2. Atualizar `content` field para usar `<ThemeProvider themes={defaultThemes}>` ou `<TheoUIProvider>` (depois que T2.1 ship).
3. Adicionar ao DoD de T2.5: "registry items afetados regenerados via `pnpm registry:build`".
4. Adicionar gate em `validate-registry.ts` que falha se algum item usa `<ThemeProvider>` sem `themes` prop ou sem wrap em `<TheoUIProvider>`.

---

### MF-3 — happy-dom v20 pode exigir bump de vitest

**Severity:** MUST FIX
**Tasks:** T3.1 (upgrade happy-dom 16→20)
**Evidence:** `package.json` declara `vitest: ^2.1.8`. happy-dom v20 mudou API de `Window` constructor e `fetch` global. Vitest 2.x foi feito contra happy-dom 14-16 conforme matriz oficial. Não há garantia que vitest@2.1.8 + happy-dom@20 funciona out-of-box.

**Impact:** T3.1 pode falhar com erro de inicialização do ambiente de teste. Tempo de fix indeterminado.

**Fix:**
1. Adicionar sub-task em T3.1: "verificar compat vitest x happy-dom; se vitest precisa bump, adicionar `pnpm add -D vitest@^3` ao escopo".
2. Adicionar ADR D12: "se vitest 3.x quebra mais que 5% dos testes, fallback é jsdom (aceito custo de ~3x runtime); decisão até T3.1 + 4h".
3. Atualizar Deep Dives de T3.1 com pre-flight: `pnpm exec vitest --version && pnpm exec happy-dom --version` antes do bump.

---

### MF-4 — Live regions além de AgentStream/AgentStreaming também podem aninhar

**Severity:** MUST FIX
**Tasks:** T4.1 (LiveRegionContext) — escopo limitado a 2 componentes
**Evidence:** `grep -rn "aria-live\|role=\"log\"\|role=\"status\"" src/components/` revela **7+ componentes** com live regions:
- `agent-error-card` (assertive)
- `agent-starting-state` (polite via `<output>`)
- `auto-compact-notice` (polite)
- `chat-thread` (log, polite)
- `terminal-panel` (live prop)
- `build-log-stream` (live prop)
- `skeleton` (status, polite — embora T7 já documente container override)

Cenário concreto: `ChatThread` (role=log) renderiza `ChatMessage` que pode conter `AgentStreaming` (status). Mesma double-announcement do bug original, mas em uma combinação diferente.

**Impact:** T4.1 resolve um caso específico mas não a classe de bug. Próxima auditoria reabre o mesmo achado com nome diferente.

**Fix:**
1. Expandir T4.1: aplicar `LiveRegionContext` em TODOS os componentes que declaram `aria-live` ou `role=log/status/alert`.
2. Cada componente lê `useInLiveRegion()`; se `true`, omite seu próprio aria-live.
3. Cada componente que é **container** de live region (ChatThread, AgentStream, BuildLogStream, TerminalPanel) provê `<LiveRegionProvider value={true}>`.
4. Adicionar gate em `validate-quality-gates.ts`: regex `aria-live=` em componente sem `useInLiveRegion` → warn (manualmente whitelist se intencional).
5. Estimativa de escopo: ~7 arquivos extras + 7 tests.

---

## SHOULD FIX (6)

### SF-1 — `PITCH.md` ainda untracked após T0.1

**Severity:** SHOULD FIX
**Tasks:** T0.1 não inclui `PITCH.md` no commit (porque será corrigido em T1.3); T1.3 corrige conteúdo mas não há instrução explícita de `git add PITCH.md`.

**Impact:** Working tree fica com PITCH.md untracked até alguém lembrar de commitar. Quality gate de "no stray files" pode falhar.

**Fix:** Adicionar em T1.3 tasks: "5. `git add PITCH.md`. 6. Commit corrige conteúdo + adiciona arquivo."

---

### SF-2 — DNS de `usetheo.dev` tem owner não-identificado

**Severity:** SHOULD FIX
**Tasks:** T1.2 (deploy `ui.usetheo.dev`) depende de operação DNS fora do repo
**Evidence:** Plan menciona "DNS de usetheo.dev — adicionar CNAME". Não declara quem faz, quais credenciais, ou contingência se DNS está em mãos de outro time.

**Impact:** T1.2 pode bloquear indefinidamente se quem controla DNS está indisponível.

**Fix:**
1. Adicionar pre-flight em T1.2: confirmar quem controla `usetheo.dev` zone (provavelmente o owner do `theo-website` repo).
2. Documentar credencial/access em `docs/operations/registry-deployment.md` (NEW).
3. Adicionar fallback: se sub-domínio bloqueado, deploy temporário em `<usetheodev>.github.io/registry/r/` e atualizar README para usar essa URL até `ui.usetheo.dev` resolver. Trade-off: URL menos brand-friendly mas funcional.

---

### SF-3 — Plano não cobre publicação em 2FA-enabled npm account

**Severity:** SHOULD FIX
**Tasks:** T1.1
**Evidence:** npm exige OTP em accounts com 2FA. `npm publish` falha com `EOTP` sem flag.

**Impact:** Publish manual interativo precisa de OTP — não rodável de CI sem `--otp=XXX` ou automation token.

**Fix:** Adicionar em Deep Dives de T1.1:
- Se 2FA ativo: usar Automation Token (`npm token create --automation`) configurado em CI secret.
- Comando: `npm publish --tag next --otp=$NPM_OTP` se manual; `npm publish --tag next` com `NPM_TOKEN` env var de automation token se CI.

---

### SF-4 — Allowlist regex de cores em T3.2 é incompleta

**Severity:** SHOULD FIX
**Tasks:** T3.2 (CSS sanitization)
**Evidence:** Regex proposta `/^oklch\([^)]+\)/` permite `oklch(0.5 0.1 100; } body { background: red`. `[^)]+` aceita `}`, `;`, espaços. Em CSS string output, isso ainda quebra o context.

**Impact:** Allowlist passa mas valor ainda permite injection via parênteses contendo char hostil.

**Fix:**
1. Restringir conteúdo dentro de paren: `/^oklch\(\s*[\d.\s%/-]+\s*\)$/` (apenas dígitos, espaços, sinais, %, /).
2. Adicionar testes adversariais explícitos: `oklch(0.5 } body { )`, `var(--x; background: red)`.
3. Considerar usar lib madura (e.g., `csstype` valida CSS values) em vez de regex caseira — mas adiciona dep. Trade-off: ficar com regex restrita.

---

### SF-5 — `<TheoUIProvider>` em Next.js App Router sem `"use client"`

**Severity:** SHOULD FIX
**Tasks:** T2.1
**Evidence:** Next 14/15 App Router renderiza componentes como server por default. `<ThemeProvider>` usa hooks (`useState`, `useEffect`). Wrapper precisa de `"use client"` directive ou ser exportado de um arquivo client-marked.

**Impact:** Consumer Next 14+ que importa `<TheoUIProvider>` em RSC recebe erro "useState only works in Client Component". README Quickstart fica quebrado para audience Next.

**Fix:**
1. T2.1: adicionar primeira linha em `theo-ui-provider.tsx`: `"use client"`.
2. Adicionar em Deep Dives: "directive obrigatória para Next App Router; consumer pode wrappar em seu próprio layout client component".
3. Adicionar story Ladle que documenta padrão Next.js (`app/layout.tsx` wrapper).

---

### SF-6 — `decidedRef` em T4.4 não reset entre opens

**Severity:** SHOULD FIX
**Tasks:** T4.4 (PermissionModal Esc-vs-Cancel)
**Evidence:** Pseudo-code proposto:
```tsx
function handleOpenChange(open: boolean) {
  if (!open && !decidedRef.current) onDecide("denied");
  decidedRef.current = false;  // ← reset aqui
  onOpenChange?.(open);
}
```

Cenário: modal abre (decidedRef=false), user clica Allow (handleDecide → decidedRef=true), modal fecha (handleOpenChange com open=false → decidedRef reset para false). Próximo open → tudo OK. **Mas se reabre rapidamente antes do reset rodar**: handleOpenChange chamado com open=true (no `!open` check então não reseta). decidedRef permanece true do open anterior. Próxima Esc → não dispara denied (achou que já decidiu).

**Impact:** Edge case raro mas reproduzível (rapid toggle).

**Fix:** Resetar decidedRef no useEffect que detecta open transition false→true, OU sempre resetar em handleOpenChange independente de direção:
```tsx
function handleOpenChange(open: boolean) {
  const wasDecided = decidedRef.current;
  decidedRef.current = false;
  if (!open && !wasDecided) onDecide("denied");
  onOpenChange?.(open);
}
```

Adicionar teste explícito de rapid toggle.

---

## NICE TO HAVE (5)

### NTH-1 — Timing estimates ausentes

Plan não declara estimativa por phase. 30+ tasks com TDD = 4-8 semanas realistas. Útil adicionar tabela:
- Phase 0: 1-2h
- Phase 1: 1-2 dias (operacional + DNS)
- Phase 2: 1 sprint (5 tasks, refactor significativo)
- ...

### NTH-2 — Re-audit em Phase 8 é não-determinístico

T8.1 diz "nota agregada ≥ 4.0/5". Agentes LLM podem variar 0.2-0.3 entre runs. Adicionar tolerance:
- Nota ≥ 3.8 em qualquer dimensão individual
- Agregada ≥ 4.0 com margem de erro ± 0.2 (executar 2x e tomar média se borderline)

### NTH-3 — `<TheoUIProvider>` Tooltip provider

Plan diz Tooltip mantém per-instance provider (Radix recomenda). Mas Radix também aceita global Tooltip.Provider com prop `delayDuration` global. Decisão arquitetural: per-instance OK, mas seria nice ter docs explicando trade-off de latência (~0.1ms por instance) para audience perfomance-sensitive.

### NTH-4 — Backup plan para `npm publish` falha

Se publish falha por org/account, plan não tem contingência. Adicionar:
- Plan B: publicar em `@usetheodev/ui` (com username em vez de org) se `@usetheo` indisponível.
- Plan C: publicar em GitHub Packages como bridge.

### NTH-5 — Coverage Matrix 75% — 10 itens em backlog

Lista de itens em backlog é longa (polymorphic cast, DiffViewer key, foundations exports, etc). Útil ter plano de follow-up indicando quando esses serão endereçados (v0.2.0? v1.0? sprint dedicado?).

---

## Contradições internas detectadas (3)

### CI-1 — T2.1 "sem context próprio" vs T4.1 "novo LiveRegionContext"

T2.1 ADR D3: `<TheoUIProvider>` não introduz context novo. T4.1 introduz `LiveRegionContext` em `src/lib/`. Não é contradição literal (são contextos diferentes) mas vale clarificar:
- `<TheoUIProvider>` API estável **sem novo consumer context**.
- `LiveRegionContext` é detalhe interno entre componentes específicos.

**Fix:** Adicionar nota em ADR D3 explicando exceção.

### CI-2 — Coverage Matrix lista 40 gaps mas plano de phases cobre 30

Coverage Matrix marca 10 como "backlog" mas plan não tem phase de backlog explícita. Phase 8 não inclui ação para esses 10. Sem ação explícita, viram dívida invisível.

**Fix:** Adicionar pequena Phase 9 (ou seção do Phase 8) "Backlog handoff" — cria 10 issues no GitHub linkando para os itens postponed, com label `tech-debt` + assignee.

### CI-3 — D11 nota agregada ≥ 4.0 + Coverage 75%

D11 exige nota ≥ 4.0. Mas se 25% dos gaps ficam abertos (incluindo 4 LOW de tests, polymorphic cast LOW de código, foundations LOW de arquitetura), as dimensões podem não chegar lá. Verificar matemática:

Nota original por dimensão:
- Arch: 3.0 (gaps abertos pós-plan: composite-to-composite gate, foundations) → ~3.5-4.0
- Completeness: 2.0 → ~4.0+ (CRITICAL fechados + HIGHs)
- Code: 3.5 (polymorphic cast LOW aberto) → ~4.0
- Tests: 3.5 (ref forwarding, className tests, 18 composites axe abertos) → ~3.7-4.0
- Deps: 4.0 → ~4.5
- Sec: 4.0 → ~4.5

Agregado projetado: ~4.0 atinge. Tight. Se test-auditor vier mais rigoroso da segunda vez, pode dar 3.8.

**Fix:** Reconhecer no plano que nota agregada ≥ 4.0 é meta tight; se ficar em 3.8 ou 3.9, decidir se vale rodar mini-sprint para fechar 2-3 LOWs adicionais OU aceitar como "good enough" para release.

---

## Recomendações de incorporação

**Antes de Phase 0:** atualizar plano principal incorporando os **4 MUST FIX**:

1. **MF-1**: reordenar Phase 1 para `T1.3 → T1.1 → T1.2`.
2. **MF-2**: adicionar sub-tasks em T2.5 para regenerar 5 registry items afetados + gate `validate-registry.ts`.
3. **MF-3**: adicionar ADR D12 sobre vitest version compat; pre-flight em T3.1.
4. **MF-4**: expandir escopo de T4.1 de "2 componentes" para "todos os 7+ live regions" + gate de regression.

**Durante execução:** endereçar os **6 SHOULD FIX** no início da phase relevante.

**Após Phase 8:** processar os 5 NICE TO HAVE como backlog formal.

---

## Resumo executivo

- **Total de issues encontrados:** 18 (4 MUST FIX, 6 SHOULD FIX, 5 NICE TO HAVE, 3 contradições)
- **Plano executável?** Sim, **após corrigir os 4 MUST FIX**.
- **Risco principal:** MF-1 e MF-4 são bug-prone: publicar com claim falso (irrecuperável a curto prazo) e fix parcial de classe de bug (reabre na próxima auditoria).
- **Pontos fortes do plano:** ADRs claros, Coverage Matrix transparente sobre backlog (não esconde gaps), TDD em todas as tasks, gate de re-audit obrigatório.
- **Pontos fracos:** escopo de T4.1 estreito demais, ordem de Phase 1 incorreta, dependências externas (DNS, npm 2FA, GitHub org access) sem owner explícito.

**Recomendação:** incorporar MUST FIX no plano antes de Phase 0. Os 6 SHOULD FIX podem ser atendidos no início de cada phase. Plano fica robusto após essas mudanças.
