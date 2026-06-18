# Discovery Plan: Community-Standard Componentization Patterns (shadcn v4 / Radix / ai-elements)

> **Version 1.0** — Investiga como o ecossistema shadcn/ui v4, Radix e ai-elements implementam os 6 padrões modernos ausentes em `@theokit/ui`: (1) preservação da diretiva `"use client"` no bundle distribuído via npm, (2) `data-slot` por componente, (3) `cva` + `*Variants` re-exportados + `asChild`/Slot, (4) `.d.ts` por subpath, (5) função-componente com ref-as-prop (React 19) no lugar de `forwardRef`, (6) Tailwind v4 tokens. Fontes em scope: `shadcn-ui` (repo oficial) e `ai-elements` (lib de agentes da Vercel). Output: blueprint com padrão exato + trade-offs + citações de arquivo para o plano de implementação sem retrocompatibilidade.

**Slug:** `community-standard-componentization`
**Owner:** paulohenriquevn
**Created:** 2026-06-18
**Time budget:** 3h (per-project breakdown in ADR D1)

## Context

A revisão técnica de 2026-06-18 (esta sessão) confirmou, por inspeção direta do repo, 6 gaps contra o padrão moderno da comunidade:

- `data-slot` em **0 de 135** componentes (`grep -rl data-slot src/components` → 0). shadcn v4 emite em 53/57 componentes (`.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/card.tsx`).
- `"use client"` sobrevive em **0** arquivos no `dist/` (esbuild remove); 51 primitivos usam hooks → quebra em Next.js App Router quando consumido via `pnpm add @theokit/ui`. Sem `preserveDirectives` no `tsup.config.ts`.
- `cva` em apenas 11/135 e `asChild`/Slot em 17/135 — variantes e polimorfismo são exceção, não padrão.
- `forwardRef` em 123 componentes; shadcn v4 abandonou `forwardRef` por função-componente com ref-as-prop (`.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/button.tsx`).
- Subpath sem `.d.ts` próprio (`dist/primitives/*` sem types; todo subpath aponta para o barrel).
- devDep `tailwindcss@3.4.17` enquanto o peer exige `^4.0.0`.

Regras do projeto que qualquer padrão importado DEVE respeitar:
- `.claude/rules/architecture.md` — fronteiras de camada e taxonomia primitive/composite (cross-import falha o gate).
- `.claude/rules/testing.md` — pirâmide de testes; todo comportamento novo precisa de teste.
- `.claude/rules/cycle-discover.md` — contrato do cycle que este plano abre.

## Objective

Produzir um blueprint que permita decidir, com padrão de comunidade citado linha-a-linha, COMO corrigir os 6 gaps em `@theokit/ui` sem retrocompatibilidade.

- [ ] Todas as research questions respondidas com citações a `.claude/knowledge-base/references/`
- [ ] Tabela comparativa preenchida para cada padrão (shadcn v4 vs theo-ui atual)
- [ ] Recommendations com ≥ 1 proposta de decisão concreta por research question
- [ ] `/discover-confidence` verdict ≥ SHIPPABLE_WITH_CAVEATS

## In-Scope / Out-of-Scope

### In-Scope (per reference project)

| Project | In-scope subdirectories | Reason |
|---|---|---|
| `.claude/knowledge-base/references/shadcn-ui/` | `apps/v4/registry/new-york-v4/ui/`, `packages/shadcn/src/`, `packages/shadcn/test/utils/` | Padrão canônico de data-slot, cva, ref-as-prop, e transform RSC |
| `.claude/knowledge-base/references/ai-elements/` | `packages/elements/`, `packages/cli/` | Modelo de distribuição de componentes de agente + RSC compat |

### Out-of-Scope (explicit)

| Project / Subdir | Why excluded |
|---|---|
| `.claude/knowledge-base/references/shadcn-ui/apps/www/` | Site de docs, não é fonte de padrão de componente |
| `.claude/knowledge-base/references/*/node_modules/`, `dist/`, `.next/` | Build artifacts |
| `.claude/knowledge-base/references/ai-elements/packages/examples/` | Exemplos de uso, não a lib distribuída |
| Qualquer projeto não clonado em `.claude/knowledge-base/references/` | Cross-Project Rule |

## ADRs

### D1 — Time budget + stop conditions

**Decision:** `shadcn-ui`: 2h (fonte primária do padrão); `ai-elements`: 1h (modelo de distribuição).

**Rationale:** shadcn v4 é o padrão canônico que define data-slot/cva/ref-as-prop; ai-elements informa só o caminho de distribuição RSC. Time-box desbalanceado reflete o peso.

**Alternatives considered:** split igual (rejeitado — ai-elements é informacional); single deep-dive só no shadcn (rejeitado — perde o ângulo de distribuição npm).

**Stop condition — per question (mandatory):** quando a Fase A de uma questão retorna vazio após 3 variações de query, marcar a questão BLOCKED com motivo "Fase A exhausted" e seguir. Nunca preencher com hotspots de outra questão.

**Stop condition — per project (mandatory):** budget esgotado → questões pendentes daquele projeto BLOCKED com motivo "budget exhausted". Se toda questão restante está `done` ou honestamente `blocked`, emitir `<promise>BLUEPRINT_BLOCKED</promise>`, não `BLUEPRINT_COMPLETE`.

**Anti-pattern:** nunca fabricar respostas de Fase B para fechar questão com Fase A exausta (Unbreakable Rule 3).

**Consequences:** o halt-loop para por projeto ao esgotar budget; questões bloqueadas viram seed da próxima discovery.

### D2 — Investigation depth

**Decision:** Read end-to-end nos componentes-alvo do shadcn (button, card, dialog, select, sidebar); Grep/ast-grep para mapear amplitude (quantos componentes seguem o padrão) antes do deep-read.

**Rationale:** o padrão é repetitivo entre componentes; ler 5 representativos + medir amplitude por grep cobre sem ler os 57.

**Consequences:** trade-off explícito — não lemos todos os 57 componentes da ref; assumimos que os 5 representativos definem a convenção (validado pela contagem 53/57 com data-slot).

## Research Questions

| # | Question | Corner | Reference project(s) | Fase A (broad — ast-grep/grep map) | Fase B (deep — Read at each hotspot) | Expected answer shape |
|---|---|---|---|---|---|---|
| Q1 | Como shadcn v4 nomeia `data-slot` na raiz vs sub-partes de um componente composto? | techniques | `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/` | `grep -rn 'data-slot' .claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/card.tsx .../dialog.tsx .../select.tsx` para mapear todos os slots | Read card.tsx, dialog.tsx, select.tsx; capturar a regra de naming (root = nome do componente; sub = `nome-parte`) | Tabela: componente → slots emitidos → regra de naming, com `path:line` por linha |
| Q2 | Como uma lib do ecossistema preserva `"use client"` no artefato distribuído? shadcn (copy-paste) vs lib compilada via npm | techniques | `.claude/knowledge-base/references/shadcn-ui/packages/shadcn/test/utils/`, `.claude/knowledge-base/references/ai-elements/packages/cli/` | `grep -rln 'use client\|rsc\|transform-rsc\|preserveDirective' .claude/knowledge-base/references/shadcn-ui/packages/shadcn/ .claude/knowledge-base/references/ai-elements/packages/` | Read transform-rsc test + cli registry resolver; determinar se o modelo é copy-paste (diretiva no source copiado) ou bundler-preserved | Descrição do mecanismo por modelo de distribuição + decisão para o caminho npm-compilado de theo-ui + citações |
| Q3 | Qual a assinatura moderna de um componente shadcn v4: `forwardRef` ou função com ref-as-prop? Como tipa props + variants + asChild? | techniques | `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/` | `grep -rln 'forwardRef' .claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/` (esperado: 0) + Read button.tsx | Read button.tsx + sidebar.tsx; capturar `React.ComponentProps<...> & VariantProps<typeof xVariants>`, `Slot.Root` para asChild, re-export de `buttonVariants` | Assinatura-template + regra de tipagem + política de re-export de `*Variants` + citações |
| Q4 | Que dependências e tooling de build shadcn v4 usa? (radix-ui unificado vs `@radix-ui/react-*`, cva, tailwind v4) | deps | `.claude/knowledge-base/references/shadcn-ui/apps/v4/` | Grep `import` em button/dialog/select para mapear de onde vem `Slot`, `cva`; Read `apps/v4/package.json` para tailwind/radix versions (text-shape — Fase A leve) | Read package.json + imports; capturar `radix-ui` unified package, cva range, tailwind v4 | Lista de deps + versões + diferença vs as 21 deps atuais de theo-ui + citações |
| Q5 | Como o `cn` e os tokens de tema são definidos em shadcn v4 (Tailwind v4 `@theme`/oklch) vs o `@/lib/utils` alias? | tools | `.claude/knowledge-base/references/shadcn-ui/apps/v4/` | Glob por `globals.css`/`index.css`/`lib/utils.ts` em `apps/v4/`; Grep `@theme\|oklch\|--color` | Read o CSS de tokens + lib/utils; capturar a estrutura `@theme inline` e oklch | Estrutura de tokens v4 + posição do `cn` + citações |

## Coverage Matrix

| Corner | Questions mapped | Status |
|---|---|---|
| Integration tests | Q2 (transform-rsc test como evidência de mecanismo) | Covered |
| Dependencies | Q4 | Covered |
| Tools | Q5 | Covered |
| Techniques | Q1, Q2, Q3 | Covered |

**Coverage: 4/4 corners covered (100%)**

## Halt-loop Checkpoints

| Checkpoint | Assertion | Action if fails |
|---|---|---|
| Before answering Qx | path declarado na Fase A existe | Marcar Qx BLOCKED "path not found", continuar |
| Per-question Fase A budget | Fase A retornou ≥ 1 hotspot OU 3 retries | Após 3 retries vazios, BLOCKED "Fase A exhausted" |
| After answering Qx | seção do blueprint sob Qx tem ≥ 1 citação | Re-iterar Qx (1 retry) |
| Per-project time budget | budget não esgotado | Esgotado → restantes BLOCKED "budget exhausted" |
| Before promising complete | 4 corners com seção populada | Recusar promise, continuar |

## Acceptance Criteria

- [ ] Todas as 5 questões respondidas OU explicitamente BLOCKED com motivo
- [ ] Cada citação aponta para path real em `.claude/knowledge-base/references/`
- [ ] 4 corners do blueprint populados
- [ ] ≥ 1 ADR no blueprint
- [ ] `/discover-confidence` ≥ SHIPPABLE_WITH_CAVEATS

## Global Definition of Done

Ver `.claude/rules/discover-blueprint-golden-rule.md` (hard caps: 4 corners populados + zero citação fabricada) e thresholds de `/discover-confidence`.
