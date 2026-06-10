# Plan: Brief #2 — 8 Cross-Cutting PaaS Primitives

> **Version 1.1** — incorpora 10 SHOULD TEST do
> `/edge-case-plan` (2026-05-23): EC-1/EC-2/EC-3 em CopyButton,
> EC-4/EC-5 em Table, EC-6 em StatusDot, EC-7/EC-8 em Timestamp,
> EC-9/EC-10 em ConfirmDialog. Zero MUST FIX. Review em
> `.claude/knowledge-base/reviews/edge-cases/dashboard-paas-primitives-2-edge-cases-2026-05-23.md`.
>
> **Version 1.0** — entrega das 8 primitives transversais especificadas em
> `theo/docs/handoff/2026-05-23-theo-ui-cloud-dashboard-gaps-brief-2.md`
> (Table, StatusDot, CopyButton, Timestamp, StatTile, ConfirmDialog,
> CodeBlock, DangerZone). Continuação direta do Brief #1
> (`dashboard-paas-primitives-plan.md` — 4 PaaS-shape primitives já em
> `0.7.0-next.0`). Após esta entrega, `@theokit/ui` cobre tanto as
> superfícies agent-first quanto as ~12 páginas do dashboard TheoCloud
> sem que os consumidores hand-rollem clipboard, status dots, tabelas
> sortáveis, tooltips de timestamp ou confirmações destrutivas.

## Context

- **Versão atual:** `@theokit/ui@0.7.0-next.0`. Brief #1 fechou os
  4 buracos PaaS-shape (`UsageMeter`, `Progress`, `PlanBadge`,
  `AccountMenu`). MDX curado já no ar em `docs.usetheo.dev`.
- **Brief #2** (issued 2026-05-23 pela equipe TheoCloud dashboard) cobre
  os padrões **cross-cutting** que surgiram em revisão sistemática
  das 11 páginas restantes (Projects, Environments, Team, Billing,
  Domains, Settings, Profile, Login, Register, Verification,
  Recovery, DeviceSuccess) + padrões PaaS recorrentes.
- **Critério de seleção do brief:** cada primitive aparece em ≥3
  lugares distintos, não-trivialmente composable (>5 LOC se hand-rolled
  por site), com valor semântico próprio. Itens recusados estão
  documentados em "Out of scope" no brief (AvatarUploader,
  PaymentMethodCard, Pagination, KeyValueList, StepIndicator,
  SettingsSection, DnsRecord, InvoiceRow, SparklineChart, MemberRow,
  RoleSelector, FilterBar, SortControls).
- **Quality bar:** idêntica ao Brief #1 — `forwardRef` + `displayName`,
  `cn()` do `lib/cn.js`, lucide-react para ícones, design tokens
  (`bg-card`, `text-foreground`, `text-muted-foreground`,
  `border-border/40`, `bg-primary/10`, `bg-destructive/[0.02]`),
  typography scale (`text-body-sm`, `text-label-caps`, `font-mono`,
  `font-display`), `.tsx + .test.tsx + .stories.tsx + index.ts` por
  componente, `pnpm quality:gates` 100% verde.
- **Taxonomy gate** (`scripts/validate-quality-gates.ts`): primitive
  importa zero componente interno; composite importa ≥1. Cross-imports
  são hard-fail.
- **Bundle baseline:** `dist/index.js` em 395763 B; +8 componentes
  pequenos devem ficar dentro do orçamento ±5% (mais provável +2% a
  +4%; se romper, rebaseline com justificativa no CHANGELOG).

## Objective

Entregar 8 novas primitives (6 primitives + 2 composites por força do
taxonomy gate) cobrindo casos PaaS cross-cutting, sem alterar
componentes existentes, sem breaking change na API pública, em
`@theokit/ui@0.8.0-next.0` (minor bump aditivo).

Metas mensuráveis:
- 32 arquivos novos em `src/components/{primitives,composites}/` (8 × 4)
- 8 entradas novas em `registry/`
- 8 novas linhas em `src/index.ts`
- 8 novos subpath exports em `package.json`
- 100% dos testes verdes em `pnpm test` (incluindo `vitest-axe`)
- `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm quality:gates` verdes
- Bundle delta documentado em CHANGELOG (rebaseline se >+5%)
- CHANGELOG `[Unreleased]` → `### Added` com 8 entries (uma por componente)
- npm publish `0.8.0-next.0` com `--tag next`
- theo-opendocs: 8 páginas curadas (em `primitives/` ou `composites/` no
  dir apropriado), `meta.json` atualizado, deploy verde

## ADRs

### D1 — Mantemos o spec verbatim do Brief #2

- **Decisão:** APIs (props, defaults, sub-components, intent variants,
  feedback durations) são copiadas verbatim do brief, sem
  reinterpretação. Onde o brief tem ambiguidade (ex: Timestamp ser
  classificado como primitive mas dizer "uses existing Tooltip
  primitive"), a ADR específica resolve com a opção que respeita o
  taxonomy gate.
- **Rationale:** o brief é o contrato com o consumer (TheoCloud).
  Reinterpretar APIs força revisão do `cloud/dashboard` migration
  plan, atrasando a entrega. O Brief #1 foi entregue assim sem
  fricção.
- **Consequences:** props ficam fixadas; mudanças requerem follow-up
  brief + minor bump após validação do consumer.

### D2 — Taxonomy resolution: 6 primitives + 2 composites

- **Decisão:** classificação dos 8 componentes:
  - **Primitives** (6): `Table`, `StatusDot`, `CopyButton`,
    `Timestamp`, `StatTile`, `DangerZone` — todos sem imports
    internos de `@theokit/ui`.
  - **Composites** (2): `ConfirmDialog` (depende de `Dialog`, `Input`,
    `Button`), `CodeBlock` (depende de `CopyButton` quando
    `copyable=true`).
- **Rationale:** o brief lista todos como primitives, mas o
  taxonomy gate em `scripts/validate-quality-gates.ts` é hard-fail
  para qualquer componente sob `primitives/` que importe outro
  componente do `@theokit/ui`. `ConfirmDialog` precisa de Dialog
  (Radix wrapper) + Input (typed phrase) + Button — não dá pra
  evitar. `CodeBlock` precisa de `CopyButton` quando `copyable=true`.
  Composite é a classificação semanticamente correta — mesma
  decisão tomada no Brief #1 para `UsageMeter` (usa Progress) e
  `AccountMenu` (usa Avatar + PlanBadge).
- **Consequences:**
  - Pastas `src/components/composites/{confirm-dialog,code-block}/`
    em vez de `primitives/`
  - Barrel export e MDX docs vão para `composites/` no opendocs
  - Sem impacto no consumer (import path é `@theokit/ui`, não
    `@theokit/ui/primitives/...`)

### D3 — Timestamp v1 usa `title` nativo, NÃO o componente Tooltip

- **Decisão:** o tooltip de hora absoluta no Timestamp é renderizado
  via atributo `title="Dec 5, 2026, 14:32:01 GMT-3"` do
  `<time>` HTML nativo, NÃO via componente `<Tooltip>` do
  `@theokit/ui`.
- **Rationale:** o brief diz simultaneamente "Timestamp é primitive"
  e "tooltip uses existing Tooltip primitive" — contradição com o
  taxonomy gate. O atributo `title` HTML nativo:
  - Funciona sem JavaScript
  - É lido por screen readers nativamente (`aria-label` reforça em
    casos sem texto visível)
  - É zero-overhead (sem Portal/positioning/aria-describedby)
  - Mantém Timestamp como primitive sem violar o gate
- **Consequences:** estilo do tooltip é o nativo do navegador (não
  custom). Trade-off documentado na MDX curada como "v1 simplification;
  custom Tooltip wrapper available in v2 if consumers request".

### D4 — `Intl.RelativeTimeFormat` para Timestamp, zero dependência

- **Decisão:** Timestamp implementa formatação relativa usando
  `Intl.RelativeTimeFormat` (Web API standard, presente em
  100% dos browsers modernos + Node 18+). Sem date-fns, dayjs ou
  similar.
- **Rationale:** Brief #2 explicitamente recomenda
  ("Prefer `Intl.RelativeTimeFormat`… ~50 LOC… avoid bundle bloat").
  date-fns/locale = +5-10 KB minified mesmo com tree-shaking.
  `Intl.RelativeTimeFormat` é a opção KISS + "Não Reinvente" (usa
  o motor i18n do runtime).
- **Consequences:**
  - Sem peer-dep nova
  - Locales suportados = locales do runtime (não controla
    explicitamente)
  - Thresholds (just now/minutes/hours/days/months) implementados
    manualmente (~30 LOC de constants + comparison)

### D5 — Sub-component pattern (Sidebar-style) para Table e DangerZone

- **Decisão:** Table e DangerZone usam o padrão sub-components em vez
  de prop-driven API:
  - `Table.Header`, `Table.Body`, `Table.Row`, `Table.Cell`,
    `Table.HeaderCell`
  - `DangerZone.Action`
- **Rationale:** padrão Sidebar (`Sidebar.Header`, `Sidebar.Section`,
  `Sidebar.Item`, `Sidebar.Footer`) já é a convenção do `@theokit/ui`
  para containers compostos. Brief explicitamente pede esse padrão.
  Alternativa (props array `rows={[…]}`) é menos flexível, mais
  pesada para tabelas com cells customizados e quebra em casos como
  EnvVarEditor underneath.
- **Consequences:** import único `import { Table } from "@theokit/ui"`
  expõe `Table` + sub-components como propriedades anexas (Object
  attachment pattern, sem React.Children magic).

### D6 — Bundle: subpath isolation NÃO requerido para os 8

- **Decisão:** todos os 8 componentes entram no barrel principal
  `dist/index.js`, sem subpath isolation (ao contrário de
  `whiteboard`/`slide`/`slide-deck`).
- **Rationale:** RFC 0001/0002/0003 mandataram subpath para engines
  com peer-deps grandes opt-in (roughjs, perfect-freehand, shiki,
  katex, mermaid). Nenhum dos 8 componentes do Brief #2 tem peer-dep
  nova — todos usam só lucide-react (já peer) + Radix (já peer). +2%
  a +4% no bundle baseline é dentro do orçamento.
- **Consequences:**
  - Se a soma dos 8 exceder o tolerance ±5% do bundle baseline,
    `pnpm tsx scripts/validate-bundle-size.ts --update` rebaselineia
    com nota no CHANGELOG explicando o delta esperado por
    componente.

### D7 — Version bump: 0.8.0-next.0 (minor, additive)

- **Decisão:** após implementação completa + gates verdes, bump de
  `0.7.0-next.0` → `0.8.0-next.0`.
- **Rationale:** 8 novos exports = adição de superfície pública = minor
  bump por semver. Sem breaking changes; nenhum componente existente
  muda. Tag npm `next` mantém o canal de pré-release.
- **Consequences:** consumer `cloud/dashboard` instala com
  `npm install @theokit/ui@next`; downgrade fácil se algo quebrar.

### D8 — CopyButton + CodeBlock: ordering blocker

- **Decisão:** CopyButton DEVE ser implementado e mergeado antes de
  CodeBlock (que tem `copyable?: boolean` consumindo CopyButton).
- **Rationale:** dependency real declarada pelo brief; impossível
  testar CodeBlock copy-strip behavior sem CopyButton funcional.
- **Consequences:** sequência de implementação 3 → 7 (CopyButton →
  CodeBlock) é obrigatória; outros 6 componentes são paralelizáveis.

## Dependency Graph

```
Phase 0 (read brief + grep existing primitives)
   │
   ▼
Phase 1: CopyButton                  ◀── blocks Phase 2
   │
   ▼
Phase 2: CodeBlock (composite — depends on CopyButton)
   │
   │  (parallel — phases 3..8 don't block each other)
   ├─▶ Phase 3: Table
   ├─▶ Phase 4: StatusDot
   ├─▶ Phase 5: Timestamp
   ├─▶ Phase 6: StatTile
   ├─▶ Phase 7: ConfirmDialog (composite — depends on Dialog/Input/Button, already in repo)
   └─▶ Phase 8: DangerZone
   │
   ▼
Phase 9: Barrel + exports + sync:exports + sync:readme + 8 registry
         descriptors + CHANGELOG entry + version bump 0.8.0-next.0
   │
   ▼
Phase 10: pnpm quality:gates (full chain) + bundle rebaseline if needed
   │
   ▼
Phase 11: npm publish 0.8.0-next.0 --tag next + smoke install
   │
   ▼
Phase 12: theo-opendocs — 8 curated MDX pages + meta.json + redeploy
   │
   ▼
Phase 13: Dogfood QA (MANDATORY)
```

Phases 1 → 2 são sequenciais. Phases 3, 4, 5, 6, 7, 8 são paralelas
após Phase 2. Phases 9-13 sequenciais.

---

## Phase 1: CopyButton (primitive)

**Objective:** entregar `<CopyButton>` standalone (sem deps internas)
para ser consumido pelo CodeBlock + ~6 sites no cloud/dashboard.

### T1.1 — `CopyButton` primitive

#### Objective
Renderizar um botão que, ao clicar, copia uma string para o clipboard,
faz swap de ícone Copy → Check com feedback transient, dispara
`onCopied(value)` callback e anuncia via `aria-live="polite"`. SSR-safe
(sem `navigator` no server).

#### Evidence
- Brief #2 §"Component 3 — CopyButton" linhas 258-357.
- Padrão recorrente em ≥6 sites do TheoCloud dashboard (env vars,
  domains TXT records, API tokens, project IDs, share URLs, CLI hints).
- Hand-rolled spec: ~25 LOC por site, frequentemente sem aria-live.

#### Files to edit

```
src/components/primitives/copy-button/index.ts            (NEW) — barrel re-export
src/components/primitives/copy-button/copy-button.tsx     (NEW) — implementation
src/components/primitives/copy-button/copy-button.test.tsx (NEW) — 8 tests
src/components/primitives/copy-button/copy-button.stories.tsx (NEW) — 4 stories
registry/copy-button.json                                 (NEW) — shadcn descriptor
```

#### Deep file dependency analysis

- `src/components/primitives/copy-button/copy-button.tsx` — novo arquivo.
  Importa apenas `react`, `lucide-react` (`Copy`, `Check`, `X` icons) e
  `../../../lib/cn.js`. Zero deps internas de `@theokit/ui` → primitive.
- `src/components/primitives/copy-button/copy-button.test.tsx` —
  importa vitest + @testing-library/react + vitest-axe + `./copy-button.js`.
  Mocka `navigator.clipboard.writeText` via `vi.stubGlobal`.
- `copy-button.stories.tsx` — importa só `./copy-button.js`. Inserido
  em Ladle title "Primitives / Inputs / CopyButton".
- `index.ts` — `export { CopyButton, type CopyButtonProps } from "./copy-button.js";`
- `registry/copy-button.json` — descriptor shadcn-style com
  `dependencies: ["lucide-react"]`, `registryDependencies: ["cn"]`.

Downstream impact: nenhum até T1.2 (barrel) e T2.1 (CodeBlock).

#### Deep Dives

**Data shape:**
```ts
type CopyState = "idle" | "copied" | "failed";
```
State machine: `idle` → (click+success) → `copied` → (after feedbackDuration) → `idle`.
                `idle` → (click+failure) → `failed` → (after feedbackDuration) → `idle`.

**SSR safety:**
- `navigator.clipboard` é `undefined` no Node. Guard com
  `typeof navigator === "undefined" || !navigator.clipboard`.
- O componente renderiza normalmente no server (`<button>` + ícone
  Copy); o handler de click só executa client-side, então sem crash.

**aria-live announcement:**
- `<span className="sr-only" aria-live="polite">` dentro do botão.
- Conteúdo: "" (idle), "Copied to clipboard" (copied), "Copy failed" (failed).
- Screen readers anunciam quando o conteúdo muda.

**Debounce de double-click:**
- Se estado é "copied" ou "failed", segundo click é no-op (não
  re-dispara o timer, não chama clipboard.writeText novamente).
- Implementação: early return no handler se `state !== "idle"`.

**Icon swap timing:**
- `transition-opacity duration-200` no ícone para fade suave.
- `feedbackDuration` (default 1500ms) controla quando reverte.
- Cleanup do timer no unmount via `useEffect` cleanup.

#### Tasks

1. Criar `src/components/primitives/copy-button/copy-button.tsx`:
   - `interface CopyButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick" | "children">`
     com props `value`, `label`, `variant` (`"ghost" | "outline"`, default `"ghost"`),
     `size` (`"sm" | "md"`, default `"sm"`), `onCopied`, `feedbackDuration` (default 1500)
   - `forwardRef<HTMLButtonElement, CopyButtonProps>`
   - `useState<CopyState>("idle")` + `useRef<ReturnType<typeof setTimeout> | null>`
   - Handler `handleClick`: early return se `state !== "idle"`; guard SSR;
     `navigator.clipboard.writeText(value)` → `.then(...)` set "copied" + start
     timer + call `onCopied?.(value)`; `.catch(...)` set "failed" + start timer
   - Cleanup timer no unmount (`useEffect` retorno)
   - Render: `<button>` com `cn("inline-flex items-center gap-1.5", variantClasses, sizeClasses)`,
     ícone `Copy`/`Check`/`X` baseado em state, opcional `label`, e
     `<span className="sr-only" aria-live="polite">` para anúncio
   - `displayName = "CopyButton"`
2. Criar `index.ts`: re-export `CopyButton` + `CopyButtonProps`
3. Criar `copy-button.test.tsx` com 8 testes (ver TDD)
4. Criar `copy-button.stories.tsx` com 4 stories (ver Ladle Stories)
5. Criar `registry/copy-button.json` mirrorando `registry/progress.json`

#### TDD

```
RED: test_click_writes_to_clipboard       — vi.stubGlobal navigator.clipboard, expect writeText("hello")
RED: test_icon_swaps_to_check_after_copy  — await findByTestId/role; rerender — pierce act() with waitFor
RED: test_reverts_after_feedback_duration — vi.useFakeTimers + advance 1500ms + assert Copy back
RED: test_onCopied_callback_fires         — vi.fn() spy passed; assert called with("hello")
RED: test_failure_state_when_clipboard_rejects — clipboard.writeText rejeita; assert X icon
RED: test_aria_live_announces_copy        — assert sr-only span has "Copied to clipboard"
RED: test_ssr_safe                        — render server-only via renderToString; no crash
RED: test_empty_value_still_copies_and_announces — (EC-1) value=""; writeText("") still called; aria-live announces
RED: test_unmount_during_feedback_cleans_timer  — (EC-2) click, unmount before 1500ms; vi.spyOn(console,"warn"); assert no warning
RED: test_clipboard_undefined_does_not_crash    — (EC-3) navigator.clipboard=undefined; click; state goes to "failed", no TypeError
RED: test_a11y_axe                        — vitest-axe zero violations
GREEN: implement copy-button.tsx — pre-check `if (!navigator?.clipboard?.writeText) { setState("failed"); ... }` before .then/.catch
REFACTOR: None expected — keep state machine + timer cleanup minimal
VERIFY: pnpm vitest run src/components/primitives/copy-button
```

#### Acceptance Criteria

- [ ] `pnpm vitest run src/components/primitives/copy-button` → 11/11 testes verdes (8 originais + EC-1/EC-2/EC-3)
- [ ] `pnpm typecheck` → zero erros
- [ ] `pnpm lint src/components/primitives/copy-button` → zero warnings
- [ ] `pnpm build` → `dist/index.js` cresce <2 KB
- [ ] Story `failure` no Ladle simula rejection visualmente
- [ ] Componente renderiza no Node SSR (ssr-safe test passa)
- [ ] axe-clean (zero violations)

#### DoD

- [ ] Todas as tasks T1.1 concluídas
- [ ] 8 testes passing + axe-clean
- [ ] `validate-quality-gates.ts` aceita o componente sob `primitives/`
  (zero imports internos de `@theokit/ui`)
- [ ] Registry descriptor válido (`pnpm validate:registry`)

---

## Phase 2: CodeBlock (composite — depends on CopyButton)

**Objective:** entregar `<CodeBlock>` para terminal commands, DNS
records, env files, etc. Consome `<CopyButton>` quando `copyable=true`.

### T2.1 — `CodeBlock` composite

#### Objective
Renderizar `<pre>` estilizado com prefix opcional "$ " por linha
(`terminal=true`), caption opcional acima, e `CopyButton` opcional
posicionado top-2 right-2 que copia o `code` original (sem o prefix "$ ").

#### Evidence
- Brief #2 §"Component 7 — CodeBlock" linhas 670-756.
- ≥6 use cases: Overview EmptyState, Projects EmptyState, Domains DNS,
  API token display, LoginPage CLI hint, future build log snippets.
- Brief explicitamente pareia CodeBlock + CopyButton ("CopyButton is
  the trigger; CodeBlock is the surface — they pair").

#### Files to edit

```
src/components/composites/code-block/index.ts            (NEW)
src/components/composites/code-block/code-block.tsx      (NEW)
src/components/composites/code-block/code-block.test.tsx (NEW) — 7 tests
src/components/composites/code-block/code-block.stories.tsx (NEW) — 4 stories
registry/code-block.json                                 (NEW)
```

#### Deep file dependency analysis

- `src/components/composites/code-block/code-block.tsx` — importa
  `react`, `../../../lib/cn.js`, `../../primitives/copy-button/copy-button.js`.
  **Justifica posição em composites/** (uma dep interna).
- `code-block.test.tsx` — importa vitest + RTL + vitest-axe + `./code-block.js`.
  Para o teste "copy strips terminal prefix", mocka `navigator.clipboard.writeText`
  e verifica que recebe o code SEM "$ ".
- `code-block.stories.tsx` — Ladle title "Composites / Display / CodeBlock".
- `registry/code-block.json` — `registryDependencies: ["cn", "copy-button"]`.

Downstream: nenhum até barrel (T9.1).

#### Deep Dives

**Terminal prefix handling:**
- Quando `terminal=true`, cada linha do `code` recebe prefix
  visual `<span className="text-muted-foreground select-none">$ </span>`.
- O `code` original (sem prefixes) é preservado para o `CopyButton`
  via `<CopyButton value={code} />` — NÃO via DOM scrape.
- Multi-linha: split por `\n`, render cada linha como `<span>`
  contendo o prefix + a linha de código.

**Caption:**
- Renderizada acima do `<pre>` como `<div>` com border-bottom.
- Tipicamente nome de arquivo (`.env.local`, `dns-records.txt`).

**Layout:**
- Outer: `<div className="relative rounded-lg border bg-muted/40 font-mono text-body-sm">`
- Caption (opcional): `<div className="border-b border-border/40 px-3 py-1.5 text-label text-muted-foreground">`
- Pre: `<pre className="p-3 overflow-x-auto">`
- CopyButton (opcional): `<CopyButton className="absolute top-2 right-2" ... />` com `variant="ghost"`

**Roles e a11y:**
- O `<pre>` já é semântico para code. Sem `role` adicional.
- `aria-label` opcional no outer div quando há caption (caption fica
  identificada via `aria-labelledby`).

#### Tasks

1. Criar `code-block.tsx`:
   - `interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, "children">`
     com `code`, `language?` (ignorado v1; forward-compat), `terminal?`,
     `copyable?`, `caption?`
   - `forwardRef<HTMLDivElement, CodeBlockProps>`
   - Split `code` em linhas via `code.split(/\r?\n/)`
   - Render: outer div + caption (se) + `<pre>` com linhas +
     `<CopyButton value={code} />` (se `copyable`)
   - `displayName = "CodeBlock"`
2. Criar `index.ts`: re-export `CodeBlock` + `CodeBlockProps`
3. Criar `code-block.test.tsx` (7 tests, ver TDD)
4. Criar `code-block.stories.tsx` (4 stories)
5. Criar `registry/code-block.json`

#### TDD

```
RED: test_renders_code_in_pre              — pre tag exists, contains the code text
RED: test_terminal_prefix_added_per_line   — terminal=true; assert "$" appears per visible line
RED: test_copy_button_renders_when_copyable — copyable=true; assert role="button" with copy icon
RED: test_copy_strips_terminal_prefix      — mock clipboard; click copy; assert writeText called with raw code (no "$")
RED: test_long_line_horizontal_scroll      — assert pre has overflow-x-auto class
RED: test_caption_renders_above            — caption renders in own div above pre
RED: test_a11y_axe                         — zero violations
GREEN: implement code-block.tsx
REFACTOR: None expected
VERIFY: pnpm vitest run src/components/composites/code-block
```

#### Acceptance Criteria

- [ ] 7/7 testes verdes + axe-clean
- [ ] `pnpm typecheck` zero erros
- [ ] Bundle delta <1 KB (composite simples)
- [ ] Ladle stories renderizam visualmente as 4 variants
- [ ] CopyButton importado de `../../primitives/copy-button/copy-button.js`
      (taxonomy gate aceita composite com deps internas)

#### DoD

- [ ] T2.1 completa
- [ ] `validate-quality-gates.ts` aceita CodeBlock em composites/
- [ ] Registry descriptor válido + `registryDependencies` inclui `copy-button`

---

## Phase 3: Table (primitive)

### T3.1 — `Table` primitive com sub-components

#### Objective
Entregar `<Table>` com sub-componentes `Header`/`Body`/`Row`/`Cell`/`HeaderCell`,
suportando `density`, `align`, `numeric`, e header sortable via `onSort` + `sortDirection`.

#### Evidence
- Brief #2 §"Component 1 — Table" linhas 38-155.
- 4 use cases: BillingPage (invoices), TeamPage (members), AuditLog
  (planejado), EnvVarEditor (potencial refactor).

#### Files to edit

```
src/components/primitives/table/index.ts        (NEW)
src/components/primitives/table/table.tsx       (NEW)
src/components/primitives/table/table.test.tsx  (NEW) — 8 tests
src/components/primitives/table/table.stories.tsx (NEW) — 4 stories
registry/table.json                             (NEW)
```

#### Deep file dependency analysis

- `table.tsx` — importa `react`, `lucide-react` (`ChevronUp`, `ChevronDown`),
  `../../../lib/cn.js`. Zero deps internas → primitive.
- Sub-components atachados via `Table.Header = Header; Table.Body = Body; ...`
  no fim do arquivo, então `import { Table } from "@theokit/ui"` expõe
  todos via property access.

#### Deep Dives

**Object attachment for sub-components:**
```ts
const TableRoot = forwardRef<HTMLTableElement, TableProps>(...);
const Header = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(...);
// ...
export const Table = Object.assign(TableRoot, { Header, Body, Row, Cell, HeaderCell });
```
Esse padrão (já usado em Sidebar e Dialog) preserva forwardRef e displayName.

**Density:**
- `density="default"` → padrão `px-3 py-3` no Cell
- `density="compact"` → `px-3 py-1.5` no Cell
- Density propagated via Context (`TableDensityContext`) para que Cell saiba sem precisar prop drilling

**Numeric alignment:**
- `numeric=true` no Cell adiciona `font-mono tabular-nums` + força `text-right` se `align` não setado

**Sort header:**
- Se `onSort` provided, HeaderCell renderiza `<button>` no lugar de `<th>` apenas internamente; o th continua como wrapper externo
- `sortDirection`: `"asc"` → ChevronUp; `"desc"` → ChevronDown; `"none"` → ambos com `opacity-30` (sort affordance)
- Click no button dispara `onSort`

#### Tasks

1. Criar `table.tsx`:
   - `TableDensityContext` para propagar density
   - `Root` (`forwardRef<HTMLTableElement, TableProps>`) + Provider
   - `Header`, `Body`, `Row` — wrappers simples sobre `<thead>`, `<tbody>`, `<tr>` com classes design-system
   - `HeaderCell` — `<th>` com `align`, opcional sort button
   - `Cell` — `<td>` com `align`, `numeric`; lê density do Context
   - `Object.assign(TableRoot, { Header, Body, Row, Cell, HeaderCell })`
   - `displayName` em todos
2. Criar `index.ts` exportando `Table` + types
3. Criar `table.test.tsx` (8 tests)
4. Criar `table.stories.tsx` (4 stories: default, compact, sortable, numeric-alignment)
5. Criar `registry/table.json`

#### TDD

```
RED: test_renders_header_and_body_rows         — semantic HTML check
RED: test_empty_body_does_not_crash            — <Table.Body /> com 0 rows
RED: test_numeric_cell_has_tabular_nums        — class includes tabular-nums
RED: test_align_right_applies_text_right       — class check
RED: test_density_compact_reduces_padding      — class check via context
RED: test_sort_header_fires_onSort             — fireEvent.click + spy
RED: test_sort_direction_swaps_icon            — render asc/desc; assert SVG name
RED: test_sort_direction_ignored_without_onSort — (EC-4) sortDirection="asc" sem onSort; assert sem button + sem chevron (th estático)
RED: test_sort_direction_none_renders_dimmed_affordance — (EC-5) onSort + sortDirection="none"; assert ChevronUp + ChevronDown ambos com opacity-30
RED: test_a11y_axe                             — zero violations
GREEN: implement table.tsx — sortDirection só tem efeito quando onSort presente
REFACTOR: None expected
VERIFY: pnpm vitest run src/components/primitives/table
```

#### Acceptance Criteria

- [ ] 10/10 tests verdes (8 originais + EC-4/EC-5)
- [ ] axe-clean (table semantic role)
- [ ] `validate-quality-gates.ts` aceita como primitive (zero deps internas)
- [ ] Bundle delta <2 KB

#### DoD

- [ ] T3.1 completa
- [ ] Registry descriptor válido

---

## Phase 4: StatusDot (primitive)

### T4.1 — `StatusDot` primitive

#### Objective
Dot colorido + label opcional + pulse opcional, 5 status kinds + 3 sizes.

#### Evidence
- Brief #2 §"Component 2 — StatusDot" linhas 158-255.
- 7+ sites no dashboard.

#### Files to edit

```
src/components/primitives/status-dot/index.ts             (NEW)
src/components/primitives/status-dot/status-dot.tsx       (NEW)
src/components/primitives/status-dot/status-dot.test.tsx  (NEW) — 7 tests
src/components/primitives/status-dot/status-dot.stories.tsx (NEW) — 3 stories
registry/status-dot.json                                  (NEW)
```

#### Deep file dependency analysis

- `status-dot.tsx` — só `react` + `cn.js`. Zero deps internas → primitive.

#### Deep Dives

**Color mapping:**
```ts
const dotColors: Record<StatusKind, string> = {
  live: "bg-success",
  building: "bg-warning",
  failed: "bg-destructive",
  idle: "bg-muted-foreground/40",
  warning: "bg-warning",
};
const labelColors: Record<StatusKind, string> = {
  live: "text-success",
  building: "text-warning",
  failed: "text-destructive",
  idle: "text-muted-foreground",
  warning: "text-warning",
};
```

**Auto-pulse logic:**
```ts
const shouldPulse = pulse ?? (status === "building");
```
`pulse` explicitamente `false` override; `undefined` deixa auto-detect.

**Sizes:**
- `xs` → `w-1.5 h-1.5` (6px)
- `sm` → `w-2 h-2` (8px, default)
- `md` → `w-2.5 h-2.5` (10px)

**a11y:**
- Sem label visível → REQUIRE `aria-label` (validar via TypeScript:
  `{ label: ReactNode; "aria-label"?: string } | { label?: never; "aria-label": string }`)
- Test garante que ausência de ambos é catch-able (warning em runtime ou TS error)

#### Tasks

1. Criar `status-dot.tsx`
2. `index.ts` exporta `StatusDot`, `StatusDotProps`, `StatusKind`
3. 7 tests
4. 3 stories (kinds, sizes, with-labels)
5. `registry/status-dot.json`

#### TDD

```
RED: test_each_status_renders_distinct_color
RED: test_pulse_true_adds_animation
RED: test_building_auto_pulses
RED: test_explicit_pulse_false_overrides_auto
RED: test_no_label_renders_dot_only
RED: test_dev_warning_when_no_label_no_aria_label    — (EC-6) vi.spyOn(console,"warn"); render sem label nem aria-label; assert dev warning emitido; fallback aria-label=status auto-applied
RED: test_a11y_axe
GREEN: implement — fallback `aria-label={ariaLabel ?? (label ? undefined : status)}` + dev warning via useEffect
REFACTOR: None
VERIFY: pnpm vitest run src/components/primitives/status-dot
```

#### Acceptance Criteria + DoD
Mesmo padrão das phases anteriores.

---

## Phase 5: Timestamp (primitive)

### T5.1 — `Timestamp` primitive

#### Objective
`<time datetime>` renderizando relative/absolute/both, com auto-refresh
opcional + tooltip via `title` HTML nativo. Zero deps externas.

#### Evidence
- Brief #2 §"Component 4 — Timestamp" linhas 359-466.
- Brief recomenda `Intl.RelativeTimeFormat` (D4).

#### Files to edit

```
src/components/primitives/timestamp/index.ts          (NEW)
src/components/primitives/timestamp/timestamp.tsx     (NEW)
src/components/primitives/timestamp/timestamp.test.tsx (NEW) — 13 tests (11 originais + EC-7/EC-8)
src/components/primitives/timestamp/timestamp.stories.tsx (NEW) — 4 stories
registry/timestamp.json                               (NEW)
```

#### Deep file dependency analysis

- `timestamp.tsx` — só `react` + `cn.js`. Sem `Tooltip` (D3).
  Zero deps internas → primitive.

#### Deep Dives

**Date parsing:**
```ts
function toDate(value: string | Date | number): Date | null {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
```

**Relative formatting (thresholds):**
```ts
const UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: "year",   ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: "month",  ms: 30  * 24 * 60 * 60 * 1000 },
  { unit: "day",    ms:       24 * 60 * 60 * 1000 },
  { unit: "hour",   ms:            60 * 60 * 1000 },
  { unit: "minute", ms:                 60 * 1000 },
];
function formatRelative(date: Date, now: Date, locale?: string): string {
  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  if (absMs < 60_000) return "just now";
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const { unit, ms } of UNITS) {
    if (absMs >= ms) {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }
  return "just now";
}
```

**Brief edge cases 5-6 (>7 days, different year):**
```ts
// Override: if absMs > 7d, fall back to absolute short form
if (diffMs < 0 && absMs > 7 * 24 * 60 * 60 * 1000) {
  return date.getFullYear() !== now.getFullYear()
    ? date.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })
    : date.toLocaleDateString(locale, { month: "short", day: "numeric" });
}
```

**Auto-refresh:**
```ts
useEffect(() => {
  if (format !== "relative" || refreshInterval === 0) return;
  const id = setInterval(() => setNow(new Date()), refreshInterval);
  return () => clearInterval(id);
}, [format, refreshInterval]);
```

**SSR hydration:**
- Initial render uses `value` directly (não `new Date()` server-side)
- `now` state inicial usa `new Date(value)` deltakey 0 → "just now"
  no SSR; primeiro useEffect no client recalcula. Aceita o
  hydration warning silencioso (suppressHydrationWarning no `<time>`).

**Invalid date:**
- `toDate` retorna `null` → render `<time></time>` vazio, sem crash.
- Dev warn uma única vez via `useEffect` + `console.warn`.

**`title` attribute:**
- Sempre carrega a absolute ISO + locale string.
- Quando `noTooltip=true`, omite `title`.

#### Tasks

1. Criar `timestamp.tsx` com:
   - Helper functions `toDate`, `formatRelative`, `formatAbsolute`
   - `useState<Date>(() => new Date())` para `now`
   - `useEffect` para autoreload (com cleanup)
   - Render `<time dateTime={iso} title={tooltipText}>...</time>`
   - `aria-label` sempre presente com absolute time
2. `index.ts`
3. 11 tests (incluindo invalid date, refresh=0, aria-label)
4. 4 stories
5. `registry/timestamp.json`

#### TDD

```
RED: test_just_now_for_recent             — value = now - 30s
RED: test_minutes_ago                     — value = now - 5min
RED: test_hours_ago                       — value = now - 2h
RED: test_days_ago                        — value = now - 3d
RED: test_same_year_short_format          — value = 8d ago, same year
RED: test_different_year_includes_year    — value = last year
RED: test_future_dates_prefix_in          — value = now + 5min
RED: test_invalid_date_renders_empty      — value = "not a date"
RED: test_refresh_interval_zero_no_setInterval — vi.spyOn(setInterval); refreshInterval=0; assert not called
RED: test_aria_label_carries_absolute     — assert aria-label includes year
RED: test_unix_seconds_value_documented_as_ms_only — (EC-7) value=1700000000 (segundos); renderiza ~1970 (~55y ago); documenta no JSDoc que number=ms (Brief #2 spec). No runtime detection (KISS).
RED: test_invalid_locale_falls_back_to_default — (EC-8) locale="invalid-tag"; assert sem crash; usa default locale + dev warning
RED: test_a11y_axe
GREEN: implement — try/catch ao construir Intl.RelativeTimeFormat; fallback para undefined locale on RangeError; JSDoc nota sobre ms units
REFACTOR: extract `formatRelative` + thresholds para clarity if needed
VERIFY: pnpm vitest run src/components/primitives/timestamp
```

#### Acceptance Criteria + DoD

- [ ] 13/13 tests verdes + axe-clean (11 originais + EC-7/EC-8)
- [ ] Bundle delta <2 KB (zero new deps)
- [ ] Hydration warning não aparece em dev mode com `suppressHydrationWarning`
- [ ] `validate-quality-gates.ts` aceita como primitive
- [ ] JSDoc no `value` prop documenta "number = milliseconds since epoch (NOT seconds)" (EC-7)

---

## Phase 6: StatTile (primitive)

### T6.1 — `StatTile` primitive

#### Objective
Card big-number + label + delta + icon, dual mode (button/div) baseado em `onClick`.

#### Evidence
- Brief #2 §"Component 5 — StatTile" linhas 469-553.
- 3 use cases imediatos (Overview, Billing, Team).

#### Files to edit

```
src/components/primitives/stat-tile/index.ts        (NEW)
src/components/primitives/stat-tile/stat-tile.tsx   (NEW)
src/components/primitives/stat-tile/stat-tile.test.tsx (NEW) — 7 tests
src/components/primitives/stat-tile/stat-tile.stories.tsx (NEW) — 4 stories
registry/stat-tile.json                             (NEW)
```

#### Deep file dependency analysis

- `stat-tile.tsx` — `react`, `lucide-react` (`ArrowUpRight`, `TrendingUp`, `TrendingDown`, `Minus`), `cn.js`. Zero deps internas → primitive.
- Dual button/div mode — mesmo padrão do AccountMenu (já no repo). Aprende com a lição: `Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">` (não precisa omitir `name` aqui pois StatTile não tem prop `name`).

#### Deep Dives

**Dual mode dispatch:**
```ts
const Component = onClick ? "button" : "div";
const isInteractive = !!onClick;
```
Quando `Component = "button"`:
- `type="button"` (default forçado)
- `cursor-pointer hover:border-primary/30 transition-colors`
- Trailing `ArrowUpRight` no top-right
Quando `Component = "div"`:
- Sem trailing chevron
- Sem hover state

**Delta trend icons + colors:**
```ts
const trendConfig = {
  up:   { icon: TrendingUp,   color: "text-success" },
  down: { icon: TrendingDown, color: "text-destructive" },
  flat: { icon: Minus,        color: "text-muted-foreground" },
};
```

**Long values:**
- `tabular-nums leading-none whitespace-nowrap` no `<div>` do value previne wrap.
- Consumer responsável por truncate se ultrapassar viewport.

#### Tasks

1. `stat-tile.tsx` com forwardRef e dual mode
2. `index.ts`
3. 7 tests
4. 4 stories
5. `registry/stat-tile.json`

#### TDD

```
RED: test_renders_value_and_label
RED: test_icon_renders_when_provided
RED: test_no_chevron_when_not_clickable      — onClick undefined; assert ArrowUpRight ausente
RED: test_chevron_and_button_when_onClick    — onClick fn; assert role="button" + chevron
RED: test_delta_trend_colors                 — up=success / down=destructive / flat=muted
RED: test_long_value_no_wrap                 — value="1,234,567"; assert whitespace-nowrap class
RED: test_a11y_axe                           — button has accessible name from label
GREEN: implement
REFACTOR: None
VERIFY: pnpm vitest run src/components/primitives/stat-tile
```

#### Acceptance Criteria + DoD
Mesmo padrão.

---

## Phase 7: ConfirmDialog (composite)

### T7.1 — `ConfirmDialog` composite

#### Objective
Wrapper sobre `Dialog` com intent destructive opcional, typed-phrase
confirmation, async loading com spinner.

#### Evidence
- Brief #2 §"Component 6 — ConfirmDialog" linhas 556-666.
- 6+ use cases destrutivos no dashboard.

#### Files to edit

```
src/components/composites/confirm-dialog/index.ts            (NEW)
src/components/composites/confirm-dialog/confirm-dialog.tsx  (NEW)
src/components/composites/confirm-dialog/confirm-dialog.test.tsx (NEW) — 13 tests (11 originais + EC-9/EC-10)
src/components/composites/confirm-dialog/confirm-dialog.stories.tsx (NEW) — 4 stories
registry/confirm-dialog.json                                 (NEW)
```

#### Deep file dependency analysis

- `confirm-dialog.tsx` — importa `Dialog` (Radix wrapper), `Button`, `Input`
  do próprio `@theokit/ui` → composite (D2).
- Adicional: `lucide-react` (`Loader2` para spinner).
- `confirm-dialog.test.tsx` — usa `userEvent` para typing no input, +
  await async submission.

#### Deep Dives

**Phrase confirmation state machine:**
```ts
const [phraseInput, setPhraseInput] = useState("");
const phraseRequired = !!confirmationPhrase;
const phraseMatched = phraseRequired ? phraseInput === confirmationPhrase : true;
const canConfirm = phraseMatched && !loading;
```

**Auto-focus cancel button:**
- Dialog.Content tem `onOpenAutoFocus` event que se dispara no abrir.
- Forçar foco no Cancel button via `ref + useEffect` quando `open` muda
  para true.

**Async onConfirm:**
```ts
const [internalLoading, setInternalLoading] = useState(false);
async function handleConfirm() {
  setInternalLoading(true);
  try {
    await onConfirm();
    onOpenChange(false);
  } catch (err) {
    // stay open; consumer handles error via their own state
  } finally {
    setInternalLoading(false);
  }
}
const showLoading = loading || internalLoading;
```

**Reset phrase on close:**
- `useEffect(() => { if (!open) setPhraseInput(""); }, [open])`

**Intent variant styling:**
- `intent="destructive"` → confirm button classes `bg-destructive text-destructive-foreground hover:bg-destructive/90`
- `intent="default"` → primary button styling

#### Tasks

1. `confirm-dialog.tsx` com Dialog wrapper, useState para phrase, async handler
2. `index.ts`
3. 11 tests cobrindo todas edge cases
4. 4 stories (default, destructive, with-phrase, async-loading)
5. `registry/confirm-dialog.json` com `registryDependencies: ["dialog", "button", "input", "cn"]`

#### TDD

```
RED: test_cancel_button_auto_focused            — open=true; assert document.activeElement is Cancel
RED: test_escape_calls_on_open_change_false     — keydown Escape; assert onOpenChange(false)
RED: test_destructive_intent_styles_confirm_button — assert bg-destructive class
RED: test_confirmation_phrase_disables_until_match — input empty; Confirm disabled
RED: test_phrase_case_sensitive                  — input "DELETE" vs phrase "delete"; disabled
RED: test_loading_disables_both_buttons          — loading=true; both disabled
RED: test_async_confirm_resolve_closes           — async onConfirm; await; assert onOpenChange(false)
RED: test_async_confirm_reject_stays_open        — async throws; assert onOpenChange NOT called
RED: test_phrase_reset_on_close                  — type phrase, close, reopen; assert input empty
RED: test_loader_icon_shown_during_loading       — assert Loader2 SVG present
RED: test_empty_phrase_treated_as_no_phrase      — (EC-9) confirmationPhrase=""; phraseRequired=!!confirmationPhrase => false; confirm enabled without typing
RED: test_enter_in_input_triggers_confirm_when_matched — (EC-10) type matching phrase + press Enter; assert onConfirm called (Enter as submit when canConfirm)
RED: test_a11y_axe                               — dialog role + accessible name
GREEN: implement — `phraseRequired = !!confirmationPhrase` (empty treated as no phrase); onKeyDown on input: if (e.key==="Enter" && canConfirm) handleConfirm()
REFACTOR: None
VERIFY: pnpm vitest run src/components/composites/confirm-dialog
```

#### Acceptance Criteria + DoD

- [ ] 13/13 tests verdes + axe-clean (11 originais + EC-9/EC-10)
- [ ] Bundle delta <3 KB (reusa Dialog/Button/Input já bundled)
- [ ] `validate-quality-gates.ts` aceita como composite
- [ ] Async tests usam `{ timeout: 5000 }` em findBy* para robustez (lição do Brief #1)

---

## Phase 8: DangerZone (primitive)

### T8.1 — `DangerZone` primitive com sub-component

#### Objective
Section bordada vermelha com `DangerZone.Action` rows. Consumer fornece o botão destrutivo (Button) no slot `action`.

#### Evidence
- Brief #2 §"Component 8 — DangerZone" linhas 758-848.
- 4+ use cases (Settings, Team, Profile, Billing).

#### Files to edit

```
src/components/primitives/danger-zone/index.ts        (NEW)
src/components/primitives/danger-zone/danger-zone.tsx (NEW)
src/components/primitives/danger-zone/danger-zone.test.tsx (NEW) — 6 tests
src/components/primitives/danger-zone/danger-zone.stories.tsx (NEW) — 3 stories
registry/danger-zone.json                             (NEW)
```

#### Deep file dependency analysis

- `danger-zone.tsx` — só `react` + `cn.js`. O slot `action` é
  `ReactNode` — consumer passa o `<Button>` mas DangerZone não importa
  Button. Zero deps internas → primitive.

#### Deep Dives

**Sub-component pattern (D5):**
```ts
const Root = forwardRef<HTMLDivElement, DangerZoneProps>(({ title = "Danger Zone", children, ... }, ref) => (
  <div ref={ref} className={cn("rounded-xl border border-destructive/30 bg-destructive/[0.02]", className)} {...props}>
    <div className="border-b border-destructive/20 px-5 py-3 text-label-caps text-destructive uppercase tracking-wider">
      {title}
    </div>
    {children}
  </div>
));
const Action = forwardRef<HTMLDivElement, DangerZoneActionProps>(...);
export const DangerZone = Object.assign(Root, { Action });
```

**Last action border-bottom suppression:**
- Usar `last:border-b-0` no className do Action — Tailwind variant
  já cobre.

#### Tasks

1. `danger-zone.tsx` com Root + Action
2. `index.ts`
3. 6 tests
4. 3 stories
5. `registry/danger-zone.json`

#### TDD

```
RED: test_default_title_is_danger_zone
RED: test_custom_title_overrides
RED: test_multiple_actions_render_with_dividers
RED: test_last_action_has_no_bottom_border       — render 3 actions; assert :last-child has border-b-0
RED: test_empty_renders_title_only               — <DangerZone /> sem children; sem crash
RED: test_a11y_axe                               — heading hierarchy (section role implicit)
GREEN: implement
REFACTOR: None
VERIFY: pnpm vitest run src/components/primitives/danger-zone
```

#### Acceptance Criteria + DoD
Mesmo padrão.

---

## Phase 9: Barrel + Exports + Registry + CHANGELOG + Version Bump

### T9.1 — Barrel + sync-exports

#### Objective
Expor os 8 novos componentes no `src/index.ts`, regenerar
`package.json#exports` via `pnpm sync:exports`, regenerar README/arch
catalog/Ladle stats via `pnpm sync:readme`.

#### Files to edit

```
src/index.ts             (MODIFY) — adicionar 8 export blocks
package.json             (REGEN via sync:exports) — 8 novos subpath exports
README.md                (REGEN via sync:readme) — catálogo atualizado
docs/architecture.md     (REGEN via sync:readme) — counts atualizados
```

#### Deep file dependency analysis

- `src/index.ts` é a barrel única do package. Cada export é
  `export { ComponentName, type Props } from "./components/.../component-name.js"`.
- `sync:exports` (`scripts/sync-exports.ts`) walks `src/components/`
  e gera mecanicamente os subpath exports map em `package.json`.
- `sync:readme` (`scripts/sync-readme.ts`) atualiza counts (102 → 110),
  listas de primitives/composites, Ladle stats.

#### Tasks

1. Append no `src/index.ts`:
   ```ts
   export { Table, type TableProps, type TableCellProps, type TableHeaderCellProps } from "./components/primitives/table/index.js";
   export { StatusDot, type StatusDotProps, type StatusKind } from "./components/primitives/status-dot/index.js";
   export { CopyButton, type CopyButtonProps } from "./components/primitives/copy-button/index.js";
   export { Timestamp, type TimestampProps } from "./components/primitives/timestamp/index.js";
   export { StatTile, type StatTileProps } from "./components/primitives/stat-tile/index.js";
   export { DangerZone, type DangerZoneProps, type DangerZoneActionProps } from "./components/primitives/danger-zone/index.js";
   export { ConfirmDialog, type ConfirmDialogProps } from "./components/composites/confirm-dialog/index.js";
   export { CodeBlock, type CodeBlockProps } from "./components/composites/code-block/index.js";
   ```
2. Run `pnpm sync:exports` → verifica diff em `package.json`
3. Run `pnpm sync:readme` → verifica diff em README + docs

#### TDD
Tests existentes para barrel surface (se houver) devem continuar passando. Não há TDD específico desta task — é wiring + regen.

#### Acceptance Criteria

- [ ] `src/index.ts` tem 8 novos exports
- [ ] `package.json#exports` tem 8 novos subpaths (`./table`, `./status-dot`, etc.)
- [ ] README count atualizado (102 → 110)
- [ ] `pnpm typecheck` verde após barrel additions

### T9.2 — Registry descriptors

#### Objective
Criar 8 descriptors `registry/{slug}.json` para o shadcn CLI workflow.

#### Files to edit

```
registry/table.json           (NEW)
registry/status-dot.json      (NEW)
registry/copy-button.json     (NEW)
registry/timestamp.json       (NEW)
registry/stat-tile.json       (NEW)
registry/danger-zone.json     (NEW)
registry/confirm-dialog.json  (NEW)
registry/code-block.json      (NEW)
```

#### Deep file dependency analysis

- Cada descriptor mirrora o formato de `registry/progress.json` /
  `registry/account-menu.json`:
  ```json
  {
    "$schema": "https://ui.shadcn.com/schema/registry-item.json",
    "name": "<slug>",
    "type": "registry:ui",
    "title": "<PascalCase>",
    "description": "<one-line>",
    "dependencies": ["lucide-react"],
    "registryDependencies": ["cn", ...],
    "files": [...]
  }
  ```
- Build step `pnpm build:registry` consome esses descriptors e gera
  `registry/r/*.json` (variant served via GitHub Pages).

#### Tasks

1. Criar os 8 arquivos JSON com descriptions tiradas do brief
2. Validar via `pnpm validate:registry` (gate já no quality:gates)
3. `pnpm build:registry` regenera `r/*.json`

#### Acceptance Criteria

- [ ] 8 registry JSONs válidos no schema
- [ ] `pnpm validate:registry` verde
- [ ] `registry/r/*.json` regenerado com 8 novos entries

### T9.3 — CHANGELOG + version bump

#### Objective
Documentar a entrega em CHANGELOG.md e bumpar para `0.8.0-next.0`.

#### Files to edit

```
CHANGELOG.md              (MODIFY) — adicionar entry em [Unreleased] e marcar [0.8.0-next.0]
package.json              (MODIFY) — version 0.7.0-next.0 → 0.8.0-next.0
```

#### Tasks

1. CHANGELOG.md:
   - Mover entry de `[Unreleased]` para `## [0.8.0-next.0] - 2026-05-23`
   - Conteúdo: 8 bullets em `### Added`, um por componente, com:
     - Nome em mono + (NEW)
     - Resumo curto
     - Contagem de tests + stories
     - Crédito ao consumer ("Brief #2 consumer: TheoCloud dashboard")
   - Nota sobre bundle delta (medir após build)
2. `package.json` version → `0.8.0-next.0`

#### Acceptance Criteria

- [ ] CHANGELOG entry formatada conforme Keep a Changelog
- [ ] package.json version = 0.8.0-next.0
- [ ] `pnpm changelog:check` (se gate existir) verde

### DoD para Phase 9

- [ ] T9.1, T9.2, T9.3 completas
- [ ] `pnpm quality:gates` 100% verde
- [ ] `git diff` revisado para sanity check antes do publish

---

## Phase 10: Quality gates + bundle rebaseline

### T10.1 — `pnpm quality:gates` full chain

#### Objective
Rodar a cadeia completa de gates (format → lint → typecheck → test →
build → registry → structure → bundle → a11y → ladle) e fixar
qualquer regressão.

#### Tasks

1. `pnpm format:check`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test` (vitest + vitest-axe)
5. `pnpm build` (Vite + tsc -p tsconfig.build.json)
6. `pnpm validate:registry`
7. `pnpm validate:structure` (taxonomy gate)
8. `pnpm validate:bundle` — se exceder ±5%, rebaseline:
   - `pnpm tsx scripts/validate-bundle-size.ts --update`
   - Commit do baseline diff com mensagem `chore(bundle): rebaseline +8 components from Brief #2`
9. `pnpm validate:a11y`
10. `pnpm validate:ladle`

#### Acceptance Criteria

- [ ] Todos os 10 sub-gates verdes
- [ ] Se bundle rebaselined, delta documentado no CHANGELOG

---

## Phase 11: npm publish + smoke

### T11.1 — Publish 0.8.0-next.0

#### Objective
Publicar `@theokit/ui@0.8.0-next.0` no npm com tag `next`, verificando
token antes.

#### Tasks

1. Pre-check: `grep -E '_authToken' ~/.npmrc | head -1` (token presente?)
2. Pre-check: `curl -s https://registry.npmjs.org/-/whoami -H "Authorization: Bearer $NPM_TOKEN"` → `usetheodev`
3. `pnpm build` (sanity)
4. `pnpm publish --access public --tag next --no-git-checks`
5. Verificar disponibilidade: `npm view @theokit/ui@0.8.0-next.0 version`
6. Smoke install num diretório temp:
   - `mkdir /tmp/theo-ui-smoke && cd /tmp/theo-ui-smoke && pnpm init -y`
   - `pnpm add @theokit/ui@next react react-dom`
   - `node -e "console.log(Object.keys(require('@theokit/ui')))" | grep -E "Table|StatusDot|CopyButton|Timestamp|StatTile|ConfirmDialog|CodeBlock|DangerZone"` → 8 matches

#### Acceptance Criteria

- [ ] `npm view @theokit/ui versions` mostra `0.8.0-next.0`
- [ ] Smoke install resolve 8 exports

---

## Phase 12: theo-opendocs MDX pages

### T12.1 — Bump @theokit/ui dependency no opendocs

#### Objective
Atualizar `theo-opendocs` para consumir `@theokit/ui@0.8.0-next.0`.

#### Files to edit
```
/home/paulo/Projetos/usetheo/theo-opendocs/package.json (MODIFY) — dep @theokit/ui
```

#### Tasks

1. `cd /home/paulo/Projetos/usetheo/theo-opendocs`
2. `pnpm add @theokit/ui@0.8.0-next.0`
3. Verificar build: `pnpm build`

### T12.2 — 8 curated MDX pages

#### Objective
Criar 8 páginas MDX curadas (uma por componente) seguindo o padrão
estabelecido no Brief #1 (curated em `primitives/` / `composites/`,
não em `/components/` autogen).

#### Files to edit

```
content/theoui/primitives/table.mdx           (NEW)
content/theoui/primitives/status-dot.mdx      (NEW)
content/theoui/primitives/copy-button.mdx     (NEW)
content/theoui/primitives/timestamp.mdx       (NEW)
content/theoui/primitives/stat-tile.mdx       (NEW)
content/theoui/primitives/danger-zone.mdx     (NEW)
content/theoui/composites/confirm-dialog.mdx  (NEW)
content/theoui/composites/code-block.mdx      (NEW)
content/theoui/primitives/meta.json           (MODIFY) — add 6 page slugs
content/theoui/composites/meta.json           (MODIFY) — add 2 page slugs
src/lib/theoui-mdx.tsx                        (MODIFY) — import & wire 8 components
src/lib/preview-defaults.tsx                  (MODIFY) — add 8 preview stubs
```

#### Tasks

1. Para cada componente:
   - Criar `.mdx` com frontmatter (title + description) + `{/* curated */}` marker
   - 1-3 `<ComponentPreview>` blocks com fallback SSR + interactive code snippet
   - Sections: "Install" (npm + shadcn CLI)
2. Atualizar `meta.json` adicionando as 6 + 2 slugs em ordem alfabética
3. Atualizar `theoui-mdx.tsx`: importar e mapear os 8 novos componentes
4. Atualizar `preview-defaults.tsx`: stub defaults se aplicável

#### Acceptance Criteria

- [ ] 8 MDX pages renderizam em `pnpm dev`
- [ ] Links na sidebar aparecem em ordem alfabética
- [ ] `pnpm build` verde
- [ ] Cada page tem ≥1 preview funcional + code snippet

### T12.3 — Deploy opendocs

#### Objective
Deploy do site atualizado no Cloudflare Pages.

#### Tasks

1. Pre-check Cloudflare token: `curl -sH "Authorization: Bearer $CF_TOKEN" https://api.cloudflare.com/client/v4/accounts | jq '.success'` → `true`
   - Se `9109` (IP allowlist): STOP, pedir ao usuário pra atualizar.
2. `corepack pnpm install --no-frozen-lockfile`
3. `pnpm pages:build`
4. `npx wrangler pages deploy .vercel/output/static --project-name theo-opendocs --branch=main --commit-dirty=true`
5. Verificar live: `curl -sI https://docs.usetheo.dev/theoui/primitives/copy-button | head -3` → `HTTP/2 200`

#### Acceptance Criteria

- [ ] Deploy verde
- [ ] `https://docs.usetheo.dev/theoui/primitives/table` retorna 200
- [ ] 7 outras pages também retornam 200

---

## Phase 13: Dogfood QA (MANDATORY)

> Esta phase roda APÓS todas as 12 phases anteriores. Plan NÃO está completo até dogfood passar.

### T13.1 — `/dogfood full`

#### Objective
Validar que as mudanças funcionam como um usuário real experimentaria,
não apenas como testes unitários afirmam.

#### Execution

```
/dogfood full
```

Always full. No shortcuts.

#### Acceptance Criteria

- [ ] Health score >= 70/100
- [ ] Zero CRITICAL issues introduced by this plan's changes
- [ ] Zero HIGH issues in commands/features modified by this plan
- [ ] Any pre-existing issues documented (not caused by this plan)

#### If Dogfood Fails

1. Identify which issues are caused by this plan's changes vs pre-existing
2. Fix all plan-caused CRITICAL and HIGH issues before declaring complete
3. Re-run `/dogfood full` to confirm fixes
4. Pre-existing issues are logged but do NOT block plan completion

---

## Coverage Matrix

| # | Gap / Requirement (Brief #2)                                              | Task(s)        | Resolution |
|---|--------------------------------------------------------------------------|----------------|------------|
| 1 | Table primitive with sub-components, density, align, numeric, onSort     | T3.1           | Sub-component pattern, Context for density, header sort button |
| 2 | StatusDot with 5 kinds, 3 sizes, auto-pulse for building                 | T4.1           | Config maps, `pulse ?? (status === "building")` logic |
| 3 | CopyButton with clipboard, icon swap, aria-live, SSR-safe                | T1.1           | State machine + setTimeout + SSR guard |
| 4 | Timestamp with relative/absolute/both, auto-refresh, Intl.RelativeTimeFormat | T5.1        | `Intl.RelativeTimeFormat` (D4) + native `title` (D3) |
| 5 | StatTile with dual button/div mode, delta, icon                          | T6.1           | Same dual-mode pattern as AccountMenu |
| 6 | ConfirmDialog with phrase confirmation, async loading, cancel auto-focus | T7.1           | Composite over Dialog (D2); useState for phrase; async handler with try/finally |
| 7 | CodeBlock with terminal prefix, copyable, caption                        | T2.1           | Composite over CopyButton (D8); split lines for prefix; raw code passed to CopyButton.value |
| 8 | DangerZone with sub-components, default title, divider on actions        | T8.1           | Sub-component pattern (D5); `last:border-b-0` Tailwind variant |
| 9 | Barrel exports for 8 components + types                                  | T9.1           | 8 export lines + sync:exports + sync:readme |
| 10 | Registry descriptors for shadcn CLI                                     | T9.2           | 8 JSON files following progress.json template |
| 11 | CHANGELOG entry crediting "Brief #2 consumer: TheoCloud dashboard"       | T9.3           | 8 bullets in [0.8.0-next.0] Added section |
| 12 | Bundle size delta within ±5% (rebaseline if exceeds with justification)  | T10.1          | `validate-bundle-size.ts` with optional `--update` |
| 13 | Zero breaking change to existing components                              | T10.1 (typecheck + tests) | Verified by full quality:gates passing |
| 14 | Zero new peer-deps (use only existing lucide-react + Radix)              | T1.1, T2.1, …  | All implementations stick to existing deps |
| 15 | Sequencing CopyButton → CodeBlock (dep order)                            | Phase 1 → 2    | Phase ordering in dep graph |
| 16 | Curated MDX docs in opendocs (not auto-gen)                              | T12.2          | 8 hand-written MDX pages in primitives/ + composites/ |
| 17 | npm publish 0.8.0-next.0 tag next                                        | T11.1          | Standard publish flow with smoke verification |
| 18 | Cloudflare Pages redeploy with new docs                                  | T12.3          | wrangler pages deploy after pages:build |

**Coverage: 18/18 (100%)**

---

## Global Definition of Done

- [ ] Todas as 13 phases completas
- [ ] Todos os testes verdes (`pnpm test`)
- [ ] Zero erros de typecheck/lint
- [ ] Zero warnings de a11y (vitest-axe)
- [ ] `pnpm quality:gates` 100% verde
- [ ] Backward compatibility preserved (zero changes to existing components)
- [ ] CHANGELOG.md entry de `[0.8.0-next.0] - 2026-05-23`
- [ ] `package.json` version = `0.8.0-next.0`
- [ ] npm publish verde com `--tag next`
- [ ] Smoke install do consumer-side resolve 8 exports
- [ ] theo-opendocs redeploy verde; 8 pages em https://docs.usetheo.dev/theoui/{primitives,composites}/...
- [ ] **Dogfood QA PASS** — `/dogfood full` health score ≥ 70, zero CRITICAL
- [ ] **Runtime-metric proof** — bundle delta medido empiricamente (não estimado), commited no baseline ou documentado no CHANGELOG se exceder

## Final Phase: Dogfood QA (MANDATORY)

(Coberto em Phase 13 acima.)
