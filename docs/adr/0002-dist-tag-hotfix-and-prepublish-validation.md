---
status: accepted
date: 2026-05-28
deciders: paulo
consulted: claude
informed: release-engineer, theokit-maintainers
---

# ADR 0002: `npm dist-tag` hotfix + prepublish validation gate

## Context and Problem Statement

`@theokit/ui` ships com `npm dist-tag latest = 0.1.0-next.0` enquanto workspace está em `0.12.0-next.0`. Stranger `npm install @theokit/ui` pega versão 11 minors atrás. Causa raiz: dist-tag não foi atualizado em release anterior.

Pre-publish gate ausente — nenhum check previne quebra de `exports['.']` antes de `npm publish`.

## Decision Drivers

1. **Honestidade** — published latest é o contrato com stranger; está VIOLADO
2. **FAANG-grade** — gate de pre-publish + CI guard pós-publish (não confiar em humano)
3. **Reversibilidade** — `dist-tag` é trivial OP, gate de regressão é estrutural

## Considered Options

### D1 — Hotfix `npm dist-tag add @theokit/ui@0.12.0-next.0 latest` (operacional URGENTE)
- 1 comando, reversível
- Reset stranger experience imediato

### D9 — Pre-publish hook valida `exports['.']` + 6 runtime checks
- Adiciona `scripts/validate-exports.mjs` (criado em T4.1)
- `prepublishOnly` encadeia `pnpm build && pnpm test:contract && node scripts/validate-exports.mjs`
- 6 runtime checks: declared + type:module consistency + import works + require conditional + ESM-only notice + subpath exports

### D12 — `npm dist-tag` operations exigem 2-eyes review
- NUNCA automated
- Release engineer + 2FA mandatory

## Decision Outcome

**D1, D9, D12 aceitas.**

Mudanças (implementadas):
- `scripts/validate-exports.mjs` novo (~80 LOC, 6 runtime checks)
- `package.json:prepublishOnly` estendido com validate-exports
- `package.json:validate:exports` script standalone
- **Pendente:** release engineer executa `npm dist-tag add @theokit/ui@0.12.0-next.0 latest` (D12 — 2-eyes)

CI regression guard:
- Script `validate-ui-latest-tag.mjs` no meta-repo (`theokit-tools/scripts/`)
- Workflow `theokit/.github/workflows/dogfood-stranger.yml` chama o gate em `validate-ui-tag` job

### Consequences

**Positivas:**
- Próximo stranger `npm install @theokit/ui` pega versão correta
- Publish quebrado impossível (6 runtime checks bloqueiam)
- Regressão dist-tag detectada por CI antes de afetar consumers

**Negativas:**
- 2FA dependency em release engineer
- prepublishOnly adiciona ~10s ao publish time

## More Information

- **Plano:** T1.1 + T4.1 + T4.3
- **Mirror ADR theokit:** [`../../../theokit/docs/adr/0021-dogfood-stranger-coverage-expansion.md`](../../../theokit/docs/adr/0021-dogfood-stranger-coverage-expansion.md)
- **Mirror ADR theo-ui ESM-only:** [`0003-esm-only-confirmed-and-gated.md`](0003-esm-only-confirmed-and-gated.md)
- **Script:** `scripts/validate-exports.mjs`
- **Test:** prepublishOnly hook + standalone via `pnpm validate:exports`
