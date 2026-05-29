---
status: accepted
date: 2026-05-28
deciders: paulo
consulted: claude
informed: theokit-maintainers
---

# ADR 0001: Contrato dos subpath exports `/vite-plugin` e `/preset` é compromisso público versionado

## Context and Problem Statement

`@usetheo/ui` exporta hoje (`package.json:exports`):

```jsonc
{
  "./vite-plugin": { "types": "./dist/vite-plugin.d.ts", "import": "./dist/vite-plugin.js" },
  "./preset": "./dist/preset.css",
  "./styles.css": "./dist/styles.css",
  "./fonts.css": "./dist/fonts.css",
  "./fonts-cdn.css": "./dist/fonts-cdn.css"
}
```

`theokit/packages/theo/src/vite-plugin/integrate-ui.ts` consome esses subpaths via filesystem walk + dynamic import. Hoje sem contract test do lado producer — UI pode quebrar consumer e descobrir só quando alguém roda `pnpm install` e dá erro em prod.

`theokit` opera com contract test e peer-dep (ver [ADR 0018 do theokit](../../../theokit/docs/adr/0018-usetheo-ui-vite-plugin-contract-versionado.md)). Este ADR é o espelho do lado UI.

## Decision Drivers

1. **Honestidade** — UI deve saber se quebrou consumer ANTES do publish, não depois.
2. **Não reinvente** — `prepublishOnly` hook + Vitest integration test é pattern padrão npm.
3. **DRY** — shape do plugin definido UMA vez, validado nos dois lados via testes idênticos em essência.

## Considered Options

### Opção A — Apenas confiar no theokit-side test (REJEITADA)
UI publica → quebra theokit consumer → contract test do theokit captura → roll back forçado. **Por quê não:** custa publish + investigação. Detectar pre-publish é estritamente melhor.

### Opção B — Contract test no UI executado pelo `prepublishOnly` (ACEITA)
`theo-ui/tests/contract/theokit-consumer.test.ts` com 5 `it()` espelho dos checks do theokit. `prepublishOnly` no `package.json` exige test:contract verde antes de qualquer publish.

## Decision Outcome

**Contract test:**

- Arquivo: `theo-ui/tests/contract/theokit-consumer.test.ts`
- Path resolution: `PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')` — caminho absoluto da raiz do package (EC-1 fix: `require_.resolve('./dist/...')` resolveria relativo ao test file, errado).
- 5 `it()`:
  1. Default export de `dist/vite-plugin.js` é função.
  2. Factory com no-args retorna shape válido (Plugin OR Plugin[] com `name: string`).
  3. Factory com `{ tailwind: false }` não throw.
  4. `dist/preset.css` existe e é `.css`.
  5. `dist/styles.css` + `dist/fonts.css` existem.

**Hooks:**
- `package.json`: script `"test:contract": "vitest run tests/contract"`.
- `"prepublishOnly": "pnpm build && pnpm test:contract"` — bloqueia publish em failure.

**Subpath exports contract (público, versionado):**
| Subpath | Shape | Quebra = breaking change? |
|---|---|---|
| `./vite-plugin` | `default: (opts?: { tailwind?: boolean }) => Plugin \| Plugin[]` com `name: string` | **SIM — minor bump exige PR cross-repo no theokit** |
| `./preset` | CSS file | SIM |
| `./styles.css` | CSS file | SIM |
| `./fonts.css` | CSS file | SIM |
| `./fonts-cdn.css` | CSS file | SIM |

### Consequences

**Positivas:**
- Publish quebrado é impossível (hook bloqueia).
- Contract test = documentação executável do shape público.

**Negativas:**
- `prepublishOnly` requer `dist/` buildado — adiciona ~1 minuto ao tempo de publish (aceitável).

## Pros and Cons of the Options

| Opção | Prós | Contras |
|---|---|---|
| A (só consumer) | Nada novo no UI | Detecção pós-publish |
| **B (mirror test + hook)** | **Detecção pre-publish, simétrico** | **+1 test file, +1 hook** |

## More Information

- **Mirror ADR no theokit:** [`../../../theokit/docs/adr/0018-usetheo-ui-vite-plugin-contract-versionado.md`](../../../theokit/docs/adr/0018-usetheo-ui-vite-plugin-contract-versionado.md).
- **Spike original:** [`../../../theokit/docs/spikes/usetheo-ui-vite-plugin-shape.md`](../../../theokit/docs/spikes/usetheo-ui-vite-plugin-shape.md) (status: ACCEPTED).
- **Plano:** [`../../../.claude/knowledge-base/plans/cross-repo-integration-coesao-plan.md`](../../../.claude/knowledge-base/plans/cross-repo-integration-coesao-plan.md) (T1.3).
- **EC-1 fix:** path absoluto via `PKG_ROOT` em vez de `require_.resolve('./dist/...')`.
