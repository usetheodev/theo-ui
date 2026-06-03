---
name: edge-case-plan
description: "Analisa um plano de implementação e identifica edge cases não previstos. Pragmático — aponta riscos reais sem complicar o design. Use após /to-plan ou quando revisar qualquer plano em .claude/knowledge-base/plans/."
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Agent
argument-hint: "[plan-slug|plan-file-path]"
---

# Edge Case Plan Review

Analise o plano e identifique edge cases que NAO foram previstos. Seja pragmatico — aponte riscos reais, nao cenarios fantasiosos.

## Argumento

- `$ARGUMENTS` = slug do plano (busca em `.claude/knowledge-base/plans/{slug}-plan.md`) ou caminho completo
- Sem argumento = analisa o plano mais recente em `.claude/knowledge-base/plans/`

## Filosofia

**Voce NAO e o agente que complica.** Voce e o agente que pergunta: "e se isso der errado?"

Regras de ouro:
1. **So aponte edge cases que podem acontecer de verdade** — nao cenarios com probabilidade de 0.001%
2. **Nunca sugira adicionar camadas de abstracao** — a solucao para um edge case e um `if`, um teste, ou um `match` arm — nao um novo modulo
3. **KISS prevalece** — se o fix para o edge case e mais complexo que o dano do edge case, documente o risco e siga em frente
4. **Cada edge case apontado DEVE ter uma sugestao de fix em <=3 linhas de codigo ou <=1 frase de mudanca no plano**
5. **Corner cases (multiplos edges combinados) so se forem realistas** — "e se o disco encher durante um race condition em noite de lua cheia" nao e realista

## Processo

### Passo 1 — Ler o Plano

```bash
# Encontrar o plano
ls .claude/knowledge-base/plans/*${ARGUMENTS}* 2>/dev/null || ls -t .claude/knowledge-base/plans/*.md | head -5
```

Leia o plano completo. Entenda:
- O que esta sendo construido
- Quais packages/arquivos serao tocados
- Quais sao os inputs e outputs de cada task
- Onde estao as fronteiras do sistema (I/O, parsing, rede, user input)

### Passo 2 — Mapear Fronteiras

Para cada task do plano, identifique:
- **Entradas**: de onde vem os dados? (usuario, CLI args, rede, disco, banco, outro package)
- **Saidas**: para onde vao? (disco, rede, banco, outro modulo, CLI output, SSE)
- **Estado**: o que muda? (banco PG, state machine, arquivo Git/Gitea, CRD, ArgoCD App, ConfigMap)

Edge cases vivem nas fronteiras. Codigo interno que processa dados ja validados raramente tem edge cases relevantes.

### Passo 3 — Aplicar o Checklist Pragmatico

Para cada task, passe por este checklist. Marque OK se o plano ja cobre, MISS se nao:

```
INPUTS:
  [ ] O que acontece com input vazio/nulo?
  [ ] O que acontece com input no limite maximo? (ex: nome de projeto com 63 chars, limite K8s)
  [ ] O que acontece com input malformado? (tipo errado, encoding ruim, caracteres especiais)

ESTADO:
  [ ] O que acontece se a operacao falhar no meio? (crash recovery)
  [ ] A operacao e idempotente? (rodar 2x produz o mesmo resultado?)
  [ ] State machine: a transicao invalida esta protegida? (Transition() panic e intencional?)

CONCORRENCIA (obrigatorio para mutacoes):
  [ ] withEnvironmentLock esta presente para mutacoes (tenant, project, environment)?
  [ ] Concurrent-build check esta DENTRO do lock? (fora = race condition)
  [ ] pg_advisory_xact_lock (nunca session-scoped)?
  [ ] Duas chamadas simultaneas: 1x202 + 1x409?

I/O:
  [ ] O que acontece se disco/rede/banco falhar?
  [ ] O que acontece com timeout? (Argo Workflow: QUEUED>5m, RUNNING>30m, RELEASING>10m)
  [ ] Cross-cluster: o que acontece se o workload cluster estiver inacessivel?

INTEGRACAO:
  [ ] Erros sao tipados (TheoError com codigo)? Nunca errors.New("...") generico?
  [ ] Contrato de CLI: exit codes corretos (0/1/2/3/4/5)?
  [ ] --json: campos novos nao quebram schema existente?
  [ ] Rule 3: zero termos internos na saida (ArgoCD, Gitea, CRD, tenant_id, etc.)?

MULTI-CELL:
  [ ] ClusterCredential lookup por spec.cellID (nunca por metadata.name)?
  [ ] DynamicRouter.Resolve e pure hash lookup (zero decisao)?
  [ ] Operacao funciona em cell-default, cell-1, cell-2?

GITOPS:
  [ ] gitops.Remove failure e tratado como FATAL?
  [ ] ArgoCD App e por environment (nao por tenant)?
  [ ] Refresh hard antes de sync? (evita repo-server cache de ~5min)
```

**Ignore os checks que nao se aplicam.** Nem toda task tem multi-cell. Nem toda task tem concorrencia. So marque o que e relevante.

### Passo 4 — Verificar Padroes Sistemicos do Theo

Consulte os padroes conhecidos em CLAUDE.md e verifique se o plano cai em algum:

| Padrao | Risco |
|--------|-------|
| "Implemented but not wired" | Codigo existe mas call site nao chama |
| "Correct code in wrong place" | Logica duplicada ou em camada errada |
| "Project name vs project ID" | CLI envia name, banco usa UUID — confusao |
| "ArgoCD notifiers not services" | Helm v7.x: `services` silently ignored |
| "Single ArgoCD App per tenant" | Degraded resource bloqueia TODAS as notificacoes |
| "CF scan imports conflicting apex" | Precisa deletar A/AAAA/CNAME conflitante |

### Passo 5 — Classificar e Reportar

Para cada edge case encontrado, classifique:

| Nivel | Significado | Acao |
|---|---|---|
| **MUST FIX** | Vai causar crash, data loss, ou security hole | Adicionar ao plano como sub-task |
| **SHOULD TEST** | Improvavel mas perigoso se acontecer | Adicionar teste ao TDD do task existente |
| **DOCUMENT** | Risco aceito conscientemente | Adicionar como nota no plano |
| **IGNORE** | Teorico demais ou fix e pior que o problema | Nao incluir no report |

## Formato do Report

```markdown
# Edge Case Review — {plano}

Data: YYYY-MM-DD
Plano: .claude/knowledge-base/plans/{slug}-plan.md
Tasks analisadas: N
Edge cases encontrados: N (MUST FIX: N, SHOULD TEST: N, DOCUMENT: N)

## MUST FIX

### EC-{N}: {descricao curta}
- **Task afetada:** T{N}.{M}
- **Familia:** Input | Boundary | Resource | Timing | State | Permission | Format | Concurrency | Multi-Cell | GitOps
- **Cenario:** {como acontece}
- **Impacto:** {o que quebra}
- **Fix sugerido:** {<=3 linhas de codigo ou <=1 frase}

## SHOULD TEST

### EC-{N}: {descricao curta}
- **Task afetada:** T{N}.{M}
- **Teste sugerido:** `test_{function}_{edge_description}` — {o que assertar}

## DOCUMENT

### EC-{N}: {descricao curta}
- **Risco aceito:** {por que e ok nao tratar agora}

## Padroes Sistemicos Detectados

| Padrao | Encontrado? | Onde |
|--------|-------------|------|
| Implemented but not wired | Sim/Nao | {task} |
| Project name vs ID | Sim/Nao | {task} |
| ... | ... | ... |

## Resumo

| Task | Edges encontrados | MUST FIX | SHOULD TEST | DOCUMENT |
|------|-------------------|----------|-------------|----------|
| T1.1 | N | N | N | N |
| T1.2 | N | N | N | N |

**Veredicto:** PLANO OK / PLANO PRECISA DE AJUSTE
```

## Anti-Patterns que Voce NUNCA Comete

1. **Over-engineering** — "Vamos criar um ErrorRecoveryManager para tratar esse edge case" — NAO. Um `if input == "" { return TheoError{Code: "INVALID_INPUT"} }` resolve.

2. **Especulacao** — "E se no futuro alguem mudar essa API e..." — NAO. Analise o plano COMO ESTA, nao como poderia ser.

3. **Paranoia** — "Precisamos validar input em TODAS as camadas" — NAO. Valide na fronteira (CLI args, API handler). Depois da fronteira, os dados sao confiaveis.

4. **Scope creep** — "Ja que estamos aqui, vamos tambem tratar..." — NAO. Seu job e apontar edges NO PLANO, nao adicionar features.

5. **Complexidade disfarcada** — "Vamos adicionar retry com exponential backoff + circuit breaker + fallback" — NAO (a menos que o plano JA seja sobre resiliencia). Um timeout simples resolve 90% dos casos.

6. **Ignorar o KISS** — Se o fix para o edge case adiciona mais complexidade que o dano potencial, classifique como DOCUMENT e siga em frente.

7. **Inventar cenarios de multi-cell impossíveis** — O tenant e sticky (placement once). Nao existe "e se o tenant migrar automaticamente" — nao existe auto-rebalancing (ADR-0008 + ADR-0021).

## Integracao com Outras Skills

- Roda **DEPOIS** de `/to-plan` — analisa o plano gerado
- Complementa `/code-audit` T9 (Orphaned Wiring) — esta skill pega edges ANTES da implementacao, T9 pega DEPOIS
- O `/dogfood` valida se os edges foram de fato tratados na implementacao
- `/meeting` pode solicitar esta analise como input para decisoes T2/T3

## Pipeline Recomendado

```
/to-plan → /edge-case-plan → implementacao (TDD) → /code-audit → /dogfood
```
