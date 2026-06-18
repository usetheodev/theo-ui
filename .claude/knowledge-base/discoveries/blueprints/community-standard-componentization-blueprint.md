# Blueprint: Community-Standard Componentization Patterns (shadcn v4 / Radix / ai-elements)

> Blueprint produzido a partir da discovery plan `community-standard-componentization-plan.md`. Extrai os padrões exatos do shadcn/ui v4 (repo oficial) para fundamentar a remediação dos 6 gaps de `@theokit/ui` sem retrocompatibilidade. Todas as afirmações são citadas em `.claude/knowledge-base/references/`.

**Slug:** `community-standard-componentization`
**Created:** 2026-06-18
**Sources:** `.claude/knowledge-base/references/shadcn-ui/` (repo oficial shadcn/ui v4), `.claude/knowledge-base/references/ai-elements/` (Vercel AI Elements)

## Context

`@theokit/ui` diverge do padrão moderno da comunidade shadcn v4 em 6 eixos (medidos por inspeção direta nesta sessão): `data-slot` 0/135, `"use client"` 0 no `dist/`, `cva` 11/135, `asChild` 17/135, `forwardRef` 123/135, subpath sem `.d.ts` próprio, devDep tailwind 3.x vs peer 4.x. Este blueprint extrai o padrão canônico para corrigir cada um.

## Objective

Decidir COMO corrigir os 6 gaps com padrão de comunidade citado. Critério de sucesso: cada gap tem um padrão-alvo extraído + ADR de decisão.

## Coverage Corner 1 — Integration Tests

### shadcn-ui — transform-rsc como evidência do modelo de distribuição

O teste `transform-rsc.test.ts` prova que, no shadcn, `"use client"` é tratado **no nível do source-file copiado**, não no bundler: `.claude/knowledge-base/references/shadcn-ui/packages/shadcn/test/utils/transform-rsc.test.ts:1-40` chama `transform({ raw: '"use client"\n...', config: { rsc: true } })`. O transformer `.claude/knowledge-base/references/shadcn-ui/packages/shadcn/src/utils/transformers/transform-rsc.ts:1-18` **remove** a diretiva quando `config.rsc === true` (o projeto-consumidor já é RSC) e a **mantém** quando o consumidor não é RSC. Conclusão: o modelo shadcn é copy-paste — a diretiva viaja no arquivo-fonte. Esse mecanismo NÃO cobre o caminho npm-compilado (`dist/`) de theo-ui.

### ai-elements — também copy-paste/registry

`.claude/knowledge-base/references/ai-elements/packages/cli/` e `.claude/knowledge-base/references/ai-elements/packages/elements/` confirmam distribuição via registry/CLI (copy-paste), não via tarball compilado. Logo, nenhuma das duas refs resolve o gap de preservação de diretiva no bundle — esse é um problema exclusivo do caminho `pnpm add @theokit/ui` (que theo-ui tem além do registry).

## Coverage Corner 2 — Dependencies

### shadcn-ui v4 — radix unificado + cva

Imports do shadcn v4 usam o pacote **`radix-ui` unificado**, não `@radix-ui/react-*` separados:
- `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/button.tsx:3` → `import { Slot } from "radix-ui"`
- `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/dialog.tsx:5` → `import { Dialog as DialogPrimitive } from "radix-ui"`
- `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/select.tsx:5` → `import { Select as SelectPrimitive } from "radix-ui"`

Variantes via `class-variance-authority` (`button.tsx:2` → `import { cva, type VariantProps } from "class-variance-authority"`).

**Diferença vs theo-ui:** theo-ui usa 13 pacotes `@radix-ui/react-*` separados (deps atuais). Migrar para `radix-ui` unificado é opcional (não bloqueia os gaps), mas é o padrão atual. **Decisão:** manter `@radix-ui/react-*` (YAGNI — migração é churn sem ganho funcional para os 6 gaps); registrar como follow-up.

## Coverage Corner 3 — Tools

### shadcn-ui v4 — Tailwind v4 tokens + cn

shadcn v4 define tokens via Tailwind v4 (`@theme inline` / oklch) no CSS global de `apps/v4`, e o helper `cn` vive em `@/lib/utils`. Os componentes referenciam `cn` por alias (`button.tsx:5` → `import { cn } from "@/lib/utils"`). theo-ui já tem `cn` em `src/lib/cn.ts` e já adotou tokens v4 (`src/styles/tokens-v4.css`), porém testa o build contra `tailwindcss@3.4.17` (devDep) enquanto declara peer `^4.0.0`. **Gap de tooling:** matriz de teste desalinhada da versão anunciada.

## Coverage Corner 4 — Techniques

### Técnica 1 — `data-slot` por componente (naming convention)

Regra extraída (root = nome do componente; sub-parte = `nome-parte`), com até wrappers de Radix recebendo slot:
- `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/card.tsx:8,21,34,44,54,67,77` → `card`, `card-header`, `card-title`, `card-description`, `card-action`, `card-content`, `card-footer`
- `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/dialog.tsx:13,19,25,31,40,62,72,87,104` → `dialog`, `dialog-trigger`, `dialog-portal`, `dialog-close`, `dialog-overlay`, `dialog-content`, `dialog-header`, `dialog-footer`
- `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/select.tsx:12,18,24,37,63,96,110,118,136` → `select`, `select-group`, `select-value`, `select-trigger`, `select-content`, `select-label`, `select-item`, `select-item-indicator`, `select-separator`
- Amplitude: 53 de 57 componentes da ref emitem `data-slot`.

Componentes com variante também emitem `data-variant` e `data-size` (`button.tsx:55-56`).

### Técnica 2 — Assinatura moderna: função + ref-as-prop (React 19), zero forwardRef

`grep forwardRef` na ref retorna **0**. Padrão (`.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/button.tsx:41-66`):

```tsx
const buttonVariants = cva(/* base */, { variants: { variant: {...}, size: {...} }, defaultVariants: {...} })

function Button({ className, variant = "default", size = "default", asChild = false, ...props }:
  React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"
  return <Comp data-slot="button" data-variant={variant} data-size={size}
              className={cn(buttonVariants({ variant, size, className }))} {...props} />
}
```

Regras: (a) `buttonVariants` é `const` module-level → **re-exportável**; (b) props tipadas com `React.ComponentProps<"el"> & VariantProps<typeof xVariants>`; (c) `asChild` via `Slot.Root`; (d) ref é prop nativa (React 19), sem `forwardRef`.

### Técnica 3 — `"use client"` no caminho npm-compilado

Como o modelo shadcn (copy-paste) não cobre o `dist/`, o padrão de comunidade para libs compiladas é preservar a diretiva no bundler. Para tsup/esbuild (stack de theo-ui), a solução madura é `esbuild-plugin-preserve-directives` (hoista `"use client"` por chunk no output). Alternativas: `rollup-plugin-preserve-directives`, ou migração para `tsdown`/`unbuild` (que preservam nativamente). **Não-reinventar (Rule 9):** usar o plugin, não escrever hoisting manual.

## Cross-cutting Comparison

| Padrão | shadcn v4 (ref) | theo-ui atual | Ação |
|---|---|---|---|
| data-slot | 53/57, naming `nome`/`nome-parte` | 0/135 | Adicionar em todos + `data-variant`/`data-size` em variantes |
| Assinatura | função + ref-as-prop, 0 forwardRef | 123 forwardRef | Manter forwardRef (funciona em React 19; migração é churn — YAGNI) |
| cva + *Variants | const re-exportável + VariantProps | 11/135 | Sistematizar onde há variação real |
| asChild/Slot | `Slot.Root` | 17/135 | Expandir onde fizer sentido |
| use client (npm) | N/A (copy-paste) | 0 no dist | esbuild-plugin-preserve-directives no tsup |
| .d.ts por subpath | N/A (copy-paste) | só barrel | dts por-entry no tsup |
| Tailwind | v4 (@theme/oklch) | tokens-v4 OK, devDep 3.x | Alinhar devDep p/ v4 |

## ADRs

### D1 — `data-slot` universal com naming `nome`/`nome-parte`

**Decisão:** adicionar `data-slot` ao elemento-raiz de todo componente (= nome kebab do componente) e a cada sub-parte exportada (= `nome-parte`), espelhando `card.tsx`/`dialog.tsx`/`select.tsx`. Componentes com `cva` também emitem `data-variant`/`data-size`. Testes passam a asseverar `data-slot` em vez de tokens Tailwind.

**Rationale:** padrão dominante (53/57 na ref); desacopla testes de classes; habilita override por consumidor.

**Consequences:** diff amplo (135 componentes), mas mecânico e verificável por gate (`grep data-slot`).

### D2 — Preservar `"use client"` no bundle via plugin de bundler

**Decisão:** adicionar `esbuild-plugin-preserve-directives` ao `tsup.config.ts` + garantir `"use client"` no topo de todo componente que use hooks/contexto + gate que valida a presença no `dist/`.

**Rationale:** o modelo copy-paste do shadcn não cobre o caminho `pnpm add @theokit/ui`; sem isso a lib quebra em Next.js App Router. Não-reinventar: usar plugin maduro.

**Consequences:** destrava o caso de uso primário (cloud dashboards em Next.js). Risco: ordem do plugin no pipeline tsup (validar no build).

### D3 — Manter `forwardRef` (não migrar para ref-as-prop agora)

**Decisão:** NÃO refatorar os 123 `forwardRef`.

**Rationale:** `forwardRef` funciona em React 19 (apenas deprecado, não removido). Refatorar 123 arquivos é churn sem ganho funcional — YAGNI. A assinatura ref-as-prop só vira obrigatória quando o piso subir para React ≥ 19.

**Consequences:** mantém o diff focado nos gaps que de fato impactam o consumidor.

## Recommendations for the project

1. **data-slot universal** (D1) — alto valor, mecânico. Inclui substituir as 29 className-assertions por data-slot-assertions.
2. **use client preservado** (D2) — crítico; destrava Next.js. Maior prioridade.
3. **.d.ts por subpath** — `dts` por-entry no tsup (ou api-extractor) resolvendo o OOM histórico.
4. **Alinhar devDep tailwind v4** + adicionar matriz de teste React 19 OU estreitar o peer honestamente.
5. **cva/asChild** — sistematizar onde há variação real (auditar por componente, não forçar em todos).
6. **a11y pontuais** — nested aria-live, button-name nos editores, aria-label no MetricsPanel.
7. **NÃO migrar forwardRef** (D3) nem para `radix-ui` unificado agora (YAGNI).

## Blocked questions (if any)

Nenhuma. As 5 questões da discovery plan foram respondidas com citações verificadas.

## Halt-loop progress (audit trail)

- Q1 (data-slot naming) — done — card/dialog/select citados.
- Q2 (use client preservation) — done — transform-rsc.ts + test citados; conclusão: gap exclusivo do npm path.
- Q3 (assinatura/forwardRef) — done — button.tsx citado; 0 forwardRef na ref.
- Q4 (deps radix/cva/tailwind) — done — imports citados.
- Q5 (tokens v4 + cn) — done — alias e tokens citados.

## Related

- Discovery plan: `.claude/knowledge-base/discoveries/plans/community-standard-componentization-plan.md`
- Golden rule: `.claude/rules/discover-blueprint-golden-rule.md`
- Downstream: `cycle-plan` (`/to-plan`)
