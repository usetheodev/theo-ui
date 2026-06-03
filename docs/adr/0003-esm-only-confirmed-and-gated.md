---
status: accepted
date: 2026-05-28
deciders: paulo
consulted: claude
informed: theokit-maintainers, theokit-sdk-maintainers
---

# ADR 0003: `@theokit/ui` permanece ESM-only intencional; consumers que precisam de `require()` recebem `ERR_PACKAGE_PATH_NOT_EXPORTED`

## Context and Problem Statement

`@theokit/ui` é um React component library moderno (React 19+, Vite 6+). `package.json` tem:
```jsonc
{
  "type": "module",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } }
}
```

**Sem condição `require`** — by design.

Root cause de EC-S4 (Page não hidrata) descoberto em run dogfood-stranger 2026-05-28: theokit `theoui-detect.ts` e `auto-detect.ts` usavam `createRequire(...).resolve()` em UI. ESM-only retornava `ERR_PACKAGE_PATH_NOT_EXPORTED`. Decisão: **NÃO adicionar `require` condition (workaround)** — confirmar ESM-only intencional + GATE consumers no theokit.

## Decision Drivers

1. **Custo manutenção CJS** — dual emit ~30% mais artifacts + drift risk
2. **CJS é legacy** — Node ESM stable 20+, todos bundlers modernos suportam ESM (Vite, Webpack 5+, esbuild, Bun, Deno)
3. **FAANG-grade (memória `faang-no-workarounds`)** — root cause: theokit estava usando API wrong (require em ESM-only); fix correto: theokit muda, não UI compromise

## Considered Options

### Opção A — Add `require` condition (REJEITADA, Path A do edge case review)
```jsonc
"exports": { ".": { "import": "./dist/index.js", "require": "./dist/index.cjs" } }
```
+ tsup emite dual format
+ tests/contract para require ambos
- 30% mais artifacts no bundle
- Drift CJS/ESM risk
- Não há CJS consumer real demandando

### Opção B — Confirm ESM-only + GATE theokit zero require (ACEITA, Path B + D13)
- `theo-ui/package.json` mantém atual (zero mudança)
- `theokit` substitui `createRequire(...).resolve()` por filesystem walk + `exports[subpath]` reading (T1.2 implementado)
- Gate CI permanente: `theokit/tests/integration/no-require-on-esm-only-deps.test.ts` previne regressão
- 2 UI-touching files refatorados: `theoui-detect.ts`, `auto-detect.ts`

## Decision Outcome

**Opção B aceita.** Confirmado D13 do plano `dogfood-fixes-and-coverage-expansion`.

Implementação:
- `theokit/packages/theo/src/vite-plugin/theoui-detect.ts:resolveExportSubpath` — lê `package.json:exports[subpath]` + filesystem walk
- `theokit/packages/theo/src/vite-plugin/auto-detect.ts:resolvePackageJson + fallbackProbe` — filesystem walk puro
- `theokit/tests/integration/no-require-on-esm-only-deps.test.ts` — gate CI permanente (2 BDD it())
- `theokit/tests/e2e/scaffold-page-hydrates.spec.ts` — Playwright regression gate (4 BDD it())

Pre-publish gate `theo-ui/scripts/validate-exports.mjs` (criado em T4.1, ver ADR 0002) **VALIDA explicitamente** D13 invariant:
- Check 2: type:module consistency
- Check 4: skip `require` runtime check se ESM-only intentional + emite notice

### Consequences

**Positivas:**
- UI bundle 30% menor (sem dual emit)
- Zero drift CJS/ESM
- theokit forçado a usar API correto (filesystem walk + dynamic import)
- Regressão impossível sistematicamente

**Negativas:**
- Qualquer futuro consumer CJS recebe erro claro `ERR_PACKAGE_PATH_NOT_EXPORTED` (não silencioso, mas requer migração)
- Test integration novo no theokit (mantém + manutenção zero quando D13 respected)

## More Information

- **Edge case review (FAANG-grade):** `.claude/knowledge-base/reviews/edge-cases/dogfood-fixes-and-coverage-expansion-edge-cases-2026-05-28.md` EC-1
- **Mirror ADR theokit:** [`../../../theokit/docs/adr/0021-dogfood-stranger-coverage-expansion.md`](../../../theokit/docs/adr/0021-dogfood-stranger-coverage-expansion.md) D13
- **Implementation:** `theokit/packages/theo/src/vite-plugin/{theoui-detect,auto-detect}.ts`
- **Tests:** `theokit/tests/integration/no-require-on-esm-only-deps.test.ts` + `theokit/tests/e2e/scaffold-page-hydrates.spec.ts`
- **Verified empirically:** Chrome DevTools MCP confirmou Page hidratar (hasMain:true, hasTextarea:true, 12 interactive elements) APÓS implementação.
