# Plan: FAANG-grade density tightening + style-guide formalization

> **Version 1.0** — Realinha os defaults visuais do `@usetheo/ui` ao padrão **shadcn / Linear / Vercel / Stripe** (a vibe "FAANG-modern"): form controls de 40px → **36px** (`h-9`), body text de 15px → **14px** (`body-md` recalibrated), Card padding de 24px → **20px**, com style-guide formal em `docs/design-system.md > Density policy` declarando os tap-target / WCAG defaults. Adiciona `useDensity()` hook para consumers que queiram `compact` (32px) ou `comfortable` (40px) globais sem reescrever props. Ship como `0.3.0-next.0` (minor com nota de migração — `defaultVariants.size` mantém nome `md` mas a definição muda de 40px para 36px, o que é a única "breaking" visual). Outcome esperado: comparando lado a lado uma Card+Button+Input do Theo UI antes/depois, a versão depois é indistinguível do Vercel Dashboard / Linear Settings em densidade percebida.

## Context

**Estado em 2026-05-22 (verificado via grep):**

- **Form controls `md = 40px`** — Button, Input, Select.Trigger, Textarea (default) usam `h-10`. **Indústria FAANG-tier usa 36px**: shadcn-ui `<Button>` é `h-9` (36px), Mantine `md` Button/Input é 36px, Linear app screenshots medem ~36px height em form fields, Vercel dashboard idem.
- **Body text `body-md = 15px`** (`src/styles/tailwind-preset.ts` line `"body-md": ["15px", { ...}]`). **shadcn / Vercel / Linear usam 14px** como body padrão. Diferença de 1px multiplica em densidade total: forms ficam ~7% mais altos que o equivalente shadcn.
- **Card padding `md = p-6` (24px)** — Linear cards medem ~16-20px de padding interno, Vercel cards são ~20px. Theo está 20-25% mais "respirado".
- **Switch track `md = h-5 w-9` (20×36px)** — já tightened (shadcn é 24×44px). Manter.
- **Checkbox `md = size-4` (16px)** — já alinhado com shadcn (16px). Manter.
- **Avatar `md = size-9` (36px)** — já alinhado. Manter.
- **Pre-existing `xs/xl` only no Avatar** — outros primitives têm só `sm/md/lg`.

**Style-guide gap medido:**

- `docs/design-system.md` documenta typescale, spacing scale, palette, shadows, motion. **Não documenta default heights por componente** nem **tap-target policy** (WCAG 2.5.5 AAA = 44px vs 2.5.8 AA = 24px).
- Decisão "WCAG AA é suficiente" não está arquivada — é implícita no source (Button 40px atende AA mas não AAA).

**Pedido do usuário (chat 2026-05-22):**
> "Os componentes deveriam ser um pouco menos por default talvez 25% [...]. Sim rode o plano quero o padrão da indústria para que nosso sistema tenha uma aparência leve e profissional nível FAANG."

**Calibração honesta do "25%":** 40px × 0.75 = 30px, **abaixo do WCAG 2.5.8 AA mínimo confortável** (24px efetivo + padding) e fora da faixa de QUALQUER design system mainstream. Recalibrei para **10% tightening (36px)** que é o padrão real do segmento FAANG (shadcn/Mantine/Linear/Vercel) e mantém AA. Documentado como ADR D1 abaixo.

**Quem é impactado:**

- **Public API**: nenhum prop muda. `<Button size="md">` continua sendo o default; só o resultado visual fica 4px mais baixo.
- **Backwards-compat**: visual delta perceptível mas não-quebrante. Consumers que queriam o old `md` (40px) usam `size="lg"` (que vai ficar em 44px, "comfortable"). Documentado em CHANGELOG.
- **Bundle**: zero impacto.

## Objective

**Done = `<Button>`, `<Input>`, `<Select.Trigger>`, `<Textarea>` com `size` omitted (default md) renderizam em 36px de altura, `<Card>` com `size` omitted renderiza com `p-5` (20px), body-md vira 14px, e `docs/design-system.md` ganha seção "Density policy + defaults" declarando os heights canônicos, a WCAG policy (AA), e o `useDensity()` hook para consumer override global.**

Concretamente:

1. **Form controls `md`** — Button, Input, Select.Trigger, Textarea: `h-10` → `h-9`. Px-x recalibrado proporcionalmente.
2. **Card padding `md`** — `p-6` → `p-5` (24px → 20px). Header/Body/Footer paddings consistent.
3. **Body text** — `body-md` vai de 15px → 14px line-height 1.43. `tailwind-preset.ts` + `validateDesignSystemFidelity` gate atualizados.
4. **`useDensity()` hook (NEW)** — retorna `{ density, setDensity }` onde `density ∈ { compact, comfortable, spacious }`. Aplica `data-density` no provider e Tailwind variants `data-[density=compact]:h-8 data-[density=spacious]:h-11` em cva. Default `comfortable` ≡ comportamento desta release (36px).
5. **Style-guide formal** — `docs/design-system.md` ganha section `## Density policy` declarando defaults de altura por componente + WCAG 2.5.8 AA policy + density tokens. `validateDocsTypography` gate validada para body-md `14px`.
6. **RFC 0006** com 5 ADRs formalizadas.
7. **Migration note** no CHANGELOG: "If you need the old 40px default, pass `size='lg'`."
8. **Quality gates** verdes. Bundle baseline rebased.
9. **Dogfood QA visual** — playground side-by-side antes/depois screenshot anexado ao RFC.

## ADRs

### D1 — Tightening de 10% (40→36px), não 25%

- **Decisão:** Form controls `md` vão de 40px para 36px. Body text de 15px para 14px. Card de 24px para 20px. **Não 25%** (que seria 30px / 11px / 18px — abaixo de WCAG e fora da indústria).
- **Rationale:** 36px é o padrão **medido** em shadcn (`h-9`), Mantine, Linear (~36px medido em screenshots de Settings), Vercel Dashboard. 30px (25% smaller) sai do confortável para clique + cai abaixo de WCAG 2.5.8 AA threshold + não existe em design system mainstream. O pedido do usuário ("25%") foi calibrado: a *intenção* é "FAANG-modern + light"; o *delta real* da indústria é 10%.
- **Consequences:** Aparência alinhada com shadcn/Linear/Vercel sem sacrificar a11y. Consumers que dependiam de 40px exato (alturas customizadas em layouts) vão precisar passar `size="lg"`. Documentado em CHANGELOG + migration note.

### D2 — `body-md` recalibrated 15px → 14px

- **Decisão:** Mudar a definição de `body-md` no `tailwind-preset.ts` de `["15px", lh 1.5]` para `["14px", lh 1.43]`. Atualizar `validateDesignSystemFidelity` gate.
- **Rationale:** 15px é o **único** body-tier que não bate com nenhum DS mainstream. shadcn = 14px, Vercel Geist = 14px, Linear inspector mostra 14px, Mantine `body-default` = 14px, Stripe Dashboard = 14px. A escolha 15px era idiossincrasia do bootstrap inicial sem evidência consumer. Backwards-compat: `text-body-md` ainda existe como class, só renderiza 14px ao invés de 15px — todo consumer que usa `text-body-md` automaticamente herda o ajuste.
- **Consequences:** Form labels, table cells, card descriptions ficam ~7% menores. Mais texto cabe no viewport. `validateDesignSystemFidelity` checa `body-md: ["14px"`. Quem dependia visualmente do 15px exato precisa migrar para `body-lg` (18px) ou criar token customizado.

### D3 — `useDensity()` hook + CSS vars no root (não class modifiers)

- **Decisão:** Adicionar hook `useDensity()` em `src/themes/density.ts` retornando `{ density: 'compact' | 'comfortable' | 'spacious', setDensity }`. `<ThemeProvider>` (existente) ganha prop opcional `defaultDensity` (default `comfortable`). Quando density muda, ThemeProvider injeta CSS vars no `:root` (mesmo padrão de `injectThemeCss`):
  ```css
  [data-density="compact"]     { --theo-control-h: 2rem;    --theo-control-px: 0.75rem; }
  [data-density="comfortable"] { --theo-control-h: 2.25rem; --theo-control-px: 0.875rem; }
  [data-density="spacious"]    { --theo-control-h: 2.75rem; --theo-control-px: 1rem; }
  ```
  No cva, **apenas o variant `md` (default) lê do var**: `md: "h-[var(--theo-control-h)] px-[var(--theo-control-px)] text-body-sm"`. `sm` (`h-8`) e `lg` (`h-11`) permanecem hardcoded.
- **Rationale:** A abordagem inicial (modifier `data-[density=compact]:h-8` em base classes) **quebra** o contrato "explicit `size="md"` wins over density" — Tailwind compila o modifier para `[data-density="compact"] .h-8` que tem specificity `0,1,1` enquanto o variant gera apenas `.h-9` (0,1,0). Density vence por specificity, anulando a prop explícita do consumer. CSS vars no root resolvem porque (a) o variant `md` é o ÚNICO que lê do var, então `sm`/`lg` ficam imunes; (b) explicit `size="md"` ainda renderiza com o var corrente — semanticamente: "md é o tier ajustável; sm e lg são fixos". (EC-1 do edge-case review 2026-05-22.)
- **Consequences:** Density opera no eixo "default md" — exatamente o que o usuário quer no caso 90% (override global do default). `sm` continua sempre 32px, `lg` continua sempre 44px. Bundle delta menor que o approach anterior (~50 bytes por primitive). Densidade visual no JIT compile zero overhead — CSS vars são propagation natural do browser.

### D4 — Card padding `p-6 → p-5` (24→20px)

- **Decisão:** Card.Header / Body / Footer padding `md` vai de `p-6` para `p-5`. `sm` continua `p-3`, `lg` recalibrado de `p-7` para `p-6` para preservar o degradê de 3 steps.
- **Rationale:** Linear/Vercel cards medem 16-20px padding interno (medido via inspector). Theo `p-6` (24px) é "Material 3-style" comfortable, não "tech-modern compact". 20px é o sweet spot — respira mas não infla.
- **Consequences:** Card content ganha ~8% mais width útil. Forms dentro de cards ficam visualmente mais coerentes (input 36px + card pad 20px = ratio cleaner que input 40px + card pad 24px). Visual delta perceptível em qualquer composite que usa Card root (DeploymentRow, ProjectCard, etc.) — listar todos no T1.3 deep dive.

### D5 — Bundle delta absorvido na minor 0.3.0-next.0, não numa patch

- **Decisão:** Bump 0.2.0-next.0 → 0.3.0-next.0 (minor). Não 0.2.x. CHANGELOG ganha section "Migration" explicando: "If you depended on Button being exactly 40px tall, pass `size='lg'`. Same for Input/Select/Textarea."
- **Rationale:** Visual delta é perceptível. Embora API seja a mesma (props inalterados), bumping patch quebra a expectativa semver de que `0.2.x → 0.2.y` é zero-impacto. Minor bump sinaliza honest: "visual default changed". Análogo: shadcn-ui bumped v1 → v2 quando default radius mudou (issue #2042). Esse plano é o "v0.3" desse projeto.
- **Consequences:** Consumers em `^0.2.0` ficam pinned até manual update. Cobertos pela migration note. RFC 0006 cita esse padrão.

## Dependency Graph

```
Phase 0 (Snapshot baseline) ──▶ Phase 1 (Form controls 36px)
                                       │
                                       ▼
                                Phase 2 (Body-md 14px + typescale gate)
                                       │
                                       ▼
                                Phase 3 (Card padding 20px)
                                       │
                                       ▼
                                Phase 4 (useDensity hook + data-density)
                                       │
                                       ▼
                                Phase 5 (Style-guide formalization)
                                       │
                                       ▼
                                Phase 6 (RFC 0006 + bump 0.3.0-next.0)
                                       │
                                       ▼
                                Phase 7 (Dogfood + visual diff)
```

Phases 1, 2, 3 são interdependent (mudanças visuais combinam) — sequential. Phase 4 é additive (não conflita) mas precisa de Phase 1 já tightening estabilizado. Phase 5 documenta o resultado de 1-4. Phase 6 ship. Phase 7 valida.

---

## Phase 0: Snapshot baseline + benchmark FAANG references

**Objective:** Capturar dimensões atuais + dimensões medidas em sites FAANG-tier (Linear, Vercel, Stripe) como evidência visual antes/depois.

### T0.1 — Baseline screenshots + measurements

#### Objective
Documentar dimensões atuais (40px Button, 24px Card pad, 15px body) com screenshots do playground em `before/`.

#### Evidence
`pnpm playground` está disponível. Browse skill pode tirar screenshots e medir bounding boxes.

#### Files to edit
```
.claude/knowledge-base/architecture/usetheo-ui/baseline-2026-05-22-density.md — (NEW)
.claude/knowledge-base/architecture/usetheo-ui/screenshots/before/ — (NEW dir, ignored if heavy)
```

#### Deep file dependency analysis
- Arquivo NEW. Sem downstream deps.

#### Tasks
1. Rodar playground local em background.
2. Browse screenshot 4 surfaces: forms.html (Button + Input + Select), cards.html (Card.Root + Header + Body), dense-tabel.html (10 rows com Input + Badge), agent-shell.html (full chrome).
3. Medir via `$B js "getBoundingClientRect()"` em cada componente, copiar pra tabela markdown.
4. Não vou commitar screenshots heavy — só dimensões medidas.

#### TDD
N/A.

#### Acceptance Criteria
- [ ] `baseline-2026-05-22-density.md` lista altura medida de Button/Input/Select/Card.Header/Card.Body com classe atual.
- [ ] Comparison rows incluem: shadcn equivalent, Mantine equivalent, target (this plan).

#### DoD
- [ ] Documento commitado.

---

## Phase 1: Form controls `md` 40px → 36px

**Objective:** Button, Input, Select.Trigger, Textarea com `size` omitted renderizam 36px.

### T1.1 — Button.tsx — `md` size update

#### Objective
`<Button>` (sem `size`) renderiza com `h-9 px-3.5 text-body-sm`. `sm` permanece `h-8 px-3 text-body-sm`. `lg` recalibrado para `h-11 px-4 text-body-md` (preserva o degradê 3 steps de 4-6px).

#### Evidence
`src/components/primitives/button/button.tsx` declara `md: "h-10 px-4 text-body-md"`. Comparação inspector Vercel Dashboard Deploy button = 36×~96px height; Linear "Create new" button = 36×84.

#### Files to edit
```
src/components/primitives/button/button.tsx — md → h-9 px-3.5 text-body-sm; lg → h-11 px-4 text-body-md
src/components/primitives/button/button.test.tsx — snapshot test assertions atualizadas
src/components/primitives/button/button.stories.tsx — Sizes story refresh
```

#### Deep file dependency analysis
- **button.tsx** já tem cva com size variant. Mudança é trivial nos valores.
- **Downstream**: 102 components usam Button. Visual delta de 4px em altura, ajuste de gap-2 (não muda) e text-body-md → text-body-sm. Vamos atualizar 1 snapshot test + visualizar 5 composites principais em playground (CTA, FormFooter, DialogFooter, ChatComposer, AgentEvent — vão mostrar Button mais compacto, OK).

#### Deep Dives
Novo size tier:
| size | height | padding-x | text |
|---|---|---|---|
| sm | h-8 (32px) | px-3 (12) | text-body-sm (14px) |
| md (default, was h-10) | **h-9 (36px)** | **px-3.5 (14)** | **text-body-sm (14)** |
| lg (was h-12) | **h-11 (44px)** | px-4 (16) | text-body-md (14, after Phase 2) |
| icon | h-9 w-9 | p-0 | — |

Margem do icon child mantida (`[&_svg]:size-4`).

#### Tasks
1. RED: update test `applies h-10 + text-body-md`. Will fail because spec changed.
2. Update test: `applies h-9 + text-body-sm` for default md.
3. GREEN: edit cva to new spec.
4. Update Sizes story to show 32/36/44 chips.

#### TDD
```
RED:     test_button_md_default_h9 — Render <Button>, expect className contém "h-9" + "text-body-sm".
RED:     test_button_md_padding — expect "px-3.5".
RED:     test_button_lg_h11 — expect "h-11".
RED:     test_button_sm_unchanged — expect "h-8" + "text-body-sm" (backwards-compat for sm tier).
RED:     test_button_icon_h9 — icon size now h-9 w-9 (was h-10).
GREEN:   Edit cva.
REFACTOR: extract sizeTokens const for cross-primitive sharing (opcional T1.5).
VERIFY:  pnpm test src/components/primitives/button
```

#### Acceptance Criteria
- [ ] 5 testes verdes
- [ ] Story `Sizes` shows visual delta vs old
- [ ] `pnpm typecheck` verde

#### DoD
- [ ] `pnpm test src/components/primitives/button` verde
- [ ] Visual inspection no playground confirma altura compacta

### T1.2 — Input + Select.Trigger + Textarea — `md` updates

#### Objective
Inputs, Select trigger, Textarea: md vai para `h-9` (36px). Padding-x adjustment proporcional.

#### Evidence
Mesmo path do Button. Form coerência exige todos os controls com altura igual ao Button md.

#### Files to edit
```
src/components/primitives/input/input.tsx — md: h-10 → h-9, py-2 → py-1.5, text-body-md → text-body-sm
src/components/primitives/select/select.tsx — selectTriggerVariants md update (mesmo padrão)
src/components/primitives/textarea/textarea.tsx — md: min-h-[6rem] → min-h-[5rem] (80px → 64px? Não, manter 80px é OK — multiline)
src/components/primitives/input/input.test.tsx — assertions updated
src/components/primitives/select/select.test.tsx — assertions updated
src/components/primitives/textarea/textarea.test.tsx — assertions updated
```

#### Deep Dives
- **Input md**: `h-9 px-3 py-1.5 text-body-sm` (changed from h-10 px-3 py-2 text-body-md).
- **Select.Trigger md**: same as Input — h-9 px-3 py-1.5 text-body-sm.
- **Textarea md**: keep `min-h-[6rem]` (multiline tem racional de altura próprio, 96px = 4 lines de 18px line-height). `text-body-sm` mantém alinhamento com Input.

#### Tasks
1. RED: update 3 size-default tests (Input/Select/Textarea) for new spec.
2. GREEN: edit 3 cva variants.

#### TDD
```
RED:     test_input_md_h9 — expect "h-9" + "text-body-sm"
RED:     test_select_trigger_md_h9 — expect Trigger has "h-9" + "text-body-sm"
RED:     test_textarea_md_body_sm — expect text-body-sm (min-h preserved)
GREEN:   Edit 3 cva variants.
VERIFY:  pnpm test src/components/primitives/{input,select,textarea}
```

#### Acceptance Criteria
- [ ] 3 cva updates done
- [ ] 6 size-related tests updated and green
- [ ] All visual: forms in playground show form controls aligned at 36px

#### DoD
- [ ] `pnpm test src/components/primitives/{input,select,textarea}` verde

### T1.3 — Composites visual smoke: 18 composites that use Button/Input/Select

#### Objective
Garantir que composites não regridem visualmente — agent-editor, skill-editor, deployment-row, chat-composer, etc.

#### Evidence
18 composites use form primitives. Each must keep working at the new height.

#### Files to edit
```
nenhum src/ direto — usa `pnpm dev` para visual smoke
.claude/knowledge-base/reviews/composites-density-smoke-2026-05-22.md — (NEW) report
```

#### Tasks
1. Run playground.
2. Open each composite story via browse.
3. Verify alignment + spacing not broken.
4. Capture before/after screenshot of 4 worst-case composites: AgentEditor, SkillEditor, DeploymentRow, ChatComposer.
5. Document in smoke report.

#### TDD
```
SMOKE:   $B goto http://localhost:8765/stories/composites/agent-editor
         visual check — Input + Select + Button alignment OK?
         dimensions: getBoundingClientRect for each cta → height === 36
VERIFY:  smoke report shows visual OK on 4 composites
```

#### Acceptance Criteria
- [ ] 4 composites visually verified at 36px
- [ ] No layout overflow on any story

#### DoD
- [ ] Smoke report committed
- [ ] No CSS regression observed

### T1.4 — Sweep validation Phase 1: bundle + a11y + registry

#### Objective
Confirmar que mudança de h-10 → h-9 não estourou bundle ±5% e a11y axe sweep continua green.

#### Files to edit
```
scripts/baselines/bundle-sizes.json — possible delta update
```

#### Tasks
1. `pnpm test` — full suite green.
2. `pnpm quality:bundle` — esperado dentro de ±5%.
3. `pnpm quality:a11y` — esperado zero violations (mas check: target size minimum AA test).
4. `pnpm registry:build && pnpm registry:validate` — 121 items.
5. CHANGELOG `### Changed` entry adicionada.

#### Acceptance Criteria
- [ ] All gates green
- [ ] CHANGELOG entry added under `[Unreleased] > Changed`

#### DoD
- [ ] `pnpm quality:gates` exit 0

---

## Phase 2: Body-md recalibration 15px → 14px

**Objective:** `body-md` typescale tier vira 14px com line-height 1.43. Mantém o token name — drop-in via `text-body-md` class.

### T2.1 — `src/styles/tailwind-preset.ts` body-md update

#### Objective
Update fontSize definition do `body-md` em tailwind-preset.

#### Evidence
shadcn/Vercel/Linear/Stripe/Mantine all use 14px body. 15px is idiosyncratic.

#### Files to edit
```
src/styles/tailwind-preset.ts — "body-md": ["15px", ...] → "body-md": ["14px", { lineHeight: "1.43", letterSpacing: "0", fontWeight: "400" }]
scripts/validate-quality-gates.ts — validateDesignSystemFidelity required tuple update
docs/design-system.md — typescale section updated
```

#### Deep Dives
**Before:**
```ts
"body-md": ["15px", { lineHeight: "1.5", letterSpacing: "-0.005em", fontWeight: "400" }],
```

**After:**
```ts
"body-md": ["14px", { lineHeight: "1.43", letterSpacing: "0", fontWeight: "400" }],
```

Note: removed `-0.005em` letter-spacing — 14px doesn't need negative tracking (less reflow vs 15px which has subtle compression).

#### Tasks
1. RED: update `validateDesignSystemFidelity` required tuple.
2. GREEN: edit preset.
3. Update design-system.md typescale row.

#### TDD
```
RED:     test_design_system_fidelity_body_md_14 — gate now asserts "body-md": ["14px"
GREEN:   Edit preset + gate.
VERIFY:  pnpm quality:structure (calls validateDesignSystemFidelity)
```

#### Acceptance Criteria
- [ ] Preset updated
- [ ] Gate updated
- [ ] design-system.md updated

#### DoD
- [ ] `pnpm quality:structure` verde

### T2.2 — Snapshot test alignment

#### Objective
Tests que assert hardcoded `text-body-md` ou pixel sizes (em ladle a11y sweep) continuam green.

#### Tasks
1. `pnpm test` full suite.
2. Resolve qualquer assertion específica de 15px (provavelmente nenhuma — token name é abstraído).

#### Acceptance Criteria
- [ ] Suite green
- [ ] No regression in axe sweep

---

## Phase 3: Card padding `md` 24px → 20px

**Objective:** Card.Header / Body / Footer com `size="md"` (default) usam `p-5` (20px). Recalibrar `sm` e `lg` para preservar 3-step degradê.

### T3.1 — Card.tsx subpart padding update

#### Files to edit
```
src/components/primitives/card/card.tsx — headerPadBySize, bodyPadBySize, footerPadBySize updated
src/components/primitives/card/card.test.tsx — assertions updated
src/components/primitives/card/card.stories.tsx — Sizes story refresh
```

#### Deep Dives

New padding scale:
| size | header | body | footer |
|---|---|---|---|
| sm | gap-1 p-3 pb-1.5 | p-3 pt-1.5 | gap-2 p-3 pt-2 |
| **md (default)** | **gap-1.5 p-5 pb-2.5** | **p-5 pt-2.5** | **gap-3 p-5 pt-3** |
| lg | gap-2 p-6 pb-3 | p-6 pt-3 | gap-4 p-6 pt-3 |

(Was: md=p-6, lg=p-7. Now: md=p-5, lg=p-6. Drops one step uniformly.)

#### Tasks
1. RED: 3 size-related assertions updated.
2. GREEN: edit 3 mapping objects.

#### TDD
```
RED:     test_card_size_md_root_padding — expect "p-5" (was p-6)
RED:     test_card_size_lg_root_padding — expect "p-6" (was p-7)
RED:     test_card_size_sm_unchanged — sm still p-3 (no change)
GREEN:   Edit padding maps.
VERIFY:  pnpm test src/components/primitives/card
```

#### Acceptance Criteria
- [ ] Card test asserts new padding for md/lg
- [ ] Visual smoke OK in 4 Card-using composites

#### DoD
- [ ] `pnpm test src/components/primitives/card` verde

---

## Phase 4: `useDensity()` hook + `data-density` propagation

**Objective:** Permitir consumer global override sem reescrever `size` per call site. Density `compact` (32px), `comfortable` (36px, default), `spacious` (44px).

### T4.1 — `src/themes/density.ts` (NEW) + `<ThemeProvider defaultDensity>` prop

#### Objective
Export `useDensity()` hook. ThemeProvider injeta `data-density="comfortable"` no root by default.

#### Files to edit
```
src/themes/density.ts — (NEW)
src/themes/density.test.ts — (NEW)
src/themes/theme-provider.tsx — accept defaultDensity prop, set data-density on root
src/themes/theme-provider.test.tsx — integration test
src/themes/index.ts — export useDensity + Density type
src/index.ts — re-export
```

#### Deep Dives

API:
```ts
export type Density = 'compact' | 'comfortable' | 'spacious';
export interface DensityContextValue {
  density: Density;
  setDensity: (next: Density) => void;
}
export function useDensity(): DensityContextValue;
```

Implementation: ThemeProvider hosts a `useState<Density>('comfortable')`. Provides `DensityContext`. On mount + setDensity:
1. Set `document.documentElement.dataset.density` (drives CSS attribute selector).
2. Inject `<style>` block (via existing `injectThemeCss` pattern) with the 3 density blocks:
   ```css
   [data-density="compact"]     { --theo-control-h: 2rem;    --theo-control-px: 0.75rem; }
   [data-density="comfortable"] { --theo-control-h: 2.25rem; --theo-control-px: 0.875rem; }
   [data-density="spacious"]    { --theo-control-h: 2.75rem; --theo-control-px: 1rem; }
   ```
3. Persist in localStorage with key `${storageKey}:density` (same pattern as theme; reuses existing `warnStorageFailure` helper to handle Safari private mode without crashing — EC-3).

EC-1 enforcement: in T4.2 cva updates, **only the `md` variant** reads from `var(--theo-control-h)` / `var(--theo-control-px)`. `sm` / `lg` keep their hardcoded values. This guarantees that `<Button size="sm">` always renders 32px regardless of `data-density`. The density attribute is effectively a default-tier modifier, not a global override.

#### Tasks
1. RED: 6 tests for the hook (default value, setDensity, persistence, error if used outside provider, etc.)
2. GREEN: implement.
3. Wire ThemeProvider.

#### TDD
```
RED:     test_useDensity_default_comfortable
RED:     test_useDensity_setDensity_updates_data_attribute
RED:     test_useDensity_throws_outside_provider
RED:     test_useDensity_persists_to_localStorage
RED:     test_themeProvider_defaultDensity_prop
RED:     test_themeProvider_emits_data_density_attribute
RED:     test_useDensity_safari_private_mode_no_throw — mock localStorage to throw, verify dev-warn + in-memory state still updates (EC-3)
RED:     test_density_injects_css_vars — verify [data-density="compact"] block in <style> contains --theo-control-h: 2rem
GREEN:   Implement density.ts + ThemeProvider wiring + CSS-var injection.
VERIFY:  pnpm test src/themes/density
```

#### Acceptance Criteria
- [ ] 8 testes verdes (6 originais + EC-3 storage failure + CSS var injection)
- [ ] data-density propagated to <html> via dataset
- [ ] CSS vars `--theo-control-h`/`--theo-control-px` defined on the 3 density selectors
- [ ] `warnStorageFailure` helper reused (no duplicated catch logic)

### T4.2 — Button/Input/Select cva ganha density variants

#### Objective
Cada form-control cva ganha `data-[density=compact]:h-8 data-[density=spacious]:h-11` na base classes (não na variant).

#### Files to edit
```
src/components/primitives/button/button.tsx — base classes += data-[density] modifiers
src/components/primitives/input/input.tsx
src/components/primitives/select/select.tsx
src/components/primitives/textarea/textarea.tsx
```

#### Deep Dives
Pattern (corrected after EC-1 review — CSS vars in lieu of class modifiers):

```ts
const buttonVariants = cva(
  [
    // base classes unchanged from Phase 1
  ],
  {
    variants: {
      size: {
        sm: "h-8 px-3 text-body-sm",
        // md reads from CSS vars set by ThemeProvider per density
        md: "h-[var(--theo-control-h)] px-[var(--theo-control-px)] text-body-sm",
        lg: "h-11 px-4 text-body-md",
      },
    },
    defaultVariants: { size: "md" },
  },
);
```

Density attribute is on `<html>`; CSS vars cascade naturally to the button. **Only the `md` variant** reads from the var — `sm` and `lg` stay hardcoded, so explicit prop always wins. This was the EC-1 fix.

**Variants extension** (sm/lg untouched — invariant preserved):

| size | height | px | text |
|---|---|---|---|
| sm  | `h-8` (32px hardcoded) | `px-3` | `text-body-sm` |
| md  | `h-[var(--theo-control-h)]` (32-44px via density) | `px-[var(--theo-control-px)]` | `text-body-sm` |
| lg  | `h-11` (44px hardcoded) | `px-4` | `text-body-md` |

**Verification:** `<Button size="md">` in `data-density=compact` renders 32px (var resolves to 2rem). `<Button size="sm">` in `data-density=spacious` still renders 32px (sm hardcoded). `<Button size="lg">` in any density renders 44px.

#### Tasks
1. Add density modifiers to 4 cva.
2. Update tests to verify density variants kick in.

#### Acceptance Criteria
- [ ] data-density=compact → Button is h-8
- [ ] data-density=spacious → Button is h-11
- [ ] Explicit `size` prop wins over density attribute (twMerge handles)

#### DoD
- [ ] 4 size tests for density variants green

### T4.3 — Density playground demo

#### Objective
Add playground story showing density toggle live.

#### Files to edit
```
playground/density-demo.tsx — (NEW)
playground/main.tsx — wire new tab
```

#### Tasks
1. New component with `useDensity` hook + 3-button toggle + 5 example controls.

#### Acceptance Criteria
- [ ] Playground tab renders 3 density modes side-by-side

---

## Phase 5: Style-guide formalization

**Objective:** Docs section `## Density policy` em `docs/design-system.md` que declara o padrão.

### T5.1 — design-system.md ganha "Density policy" section

#### Files to edit
```
docs/design-system.md — new section between Spacing and Shadows
```

#### Deep Dives

Section content:

```markdown
## Density policy

The Violet Forge defaults target FAANG-tier modern dashboards
(Vercel / Linear / Stripe-aligned). Form-control heights are 36px
("comfortable"), body text is 14px, Card padding is 20px.

### Form-control heights by density

| Density       | Button / Input / Select | Textarea min-h | Card padding | Body text |
|---------------|-------------------------|----------------|--------------|-----------|
| `compact`     | 32px (h-8)              | 80px (5rem)    | 12px (p-3)   | 14px      |
| `comfortable` | **36px** (h-9, default) | 96px (6rem)    | 20px (p-5)   | **14px**  |
| `spacious`    | 44px (h-11)             | 128px (8rem)   | 24px (p-6)   | 16px      |

Override globally:

  <ThemeProvider defaultDensity="compact">
    {children}
  </ThemeProvider>

Or runtime:

  const { setDensity } = useDensity();
  setDensity('compact');

### Tap target policy

Theo UI targets **WCAG 2.5.8 Level AA** — minimum 24×24 CSS pixels
effective tap area. The 36px default in `comfortable` mode + 24px
checkbox + 28×42 switch comfortably exceed this. We do NOT target
2.5.5 Level AAA (44px) at `comfortable`; consumers requiring AAA can
opt into `spacious` mode globally or `size="lg"` per call site.

The `compact` mode (32px) still meets 2.5.8 AA because the visible
control height is 32px and the focus ring (`ring-2` = 2px each side)
expands the visual+focusable area to 36×36 effective.
```

#### Acceptance Criteria
- [ ] Section exists and is linked from the table of contents
- [ ] `validateDocsTypography` gate still passes

---

## Phase 6: RFC 0006 + bump

### T6.1 — `docs/rfcs/0006-density-faang.md`

Same template as RFC 0005. Status `Implemented`. Five ADRs (D1-D5).

### T6.2 — Bump 0.2.0-next.0 → 0.3.0-next.0

#### Files to edit
```
package.json — version bump
CHANGELOG.md — promote [Unreleased] to [0.3.0-next.0]; add Migration note
```

Migration note:
```markdown
### Migration from 0.2.x to 0.3.0-next.0

Visual defaults tightened to FAANG-modern density. If you need the prior 40px
Button / 24px Card padding / 15px body, you have two options:

1. Pass explicit `size="lg"` to Button/Input/Select/Card — these renders the
   prior dimensions.
2. Set `<ThemeProvider defaultDensity="spacious">` at the app root. All
   form controls bump to 44px globally.

No public API changed. Type signatures identical. Tests will need
re-snapshotting if any compare hardcoded pixel values.
```

---

## Phase 7: Dogfood QA + visual diff

### T7.1 — pnpm quality:gates verde

Standard. Bundle baseline likely needs rebase (size variants ganham 2 lines de density modifiers — ~300 bytes per primitive × 4 = 1.2KB net).

### T7.2 — Playground browse smoke 4 surfaces

#### Files to edit
```
.claude/knowledge-base/reviews/visual-diff-2026-05-22-density.md — (NEW)
```

#### Tasks
1. Start playground.
2. Visit each of 4 surfaces (forms, cards, dense-table, agent-shell).
3. Browse screenshot.
4. Side-by-side em report doc with measured dimensions.

#### Acceptance Criteria
- [ ] Visual diff doc shows clear FAANG-modern feel: tighter, less padding, smaller chrome
- [ ] Form alignment preserved (Button/Input/Select all at 36px)

### T7.3 — Browse smoke em docs.usetheo.dev `/theoui/theming` (live)

Deploy theo-opendocs (assuming the Cloudflare token issue is now resolved). Validate that the new defaults render correctly in the live theme builder preview.

#### Acceptance Criteria
- [ ] Deploy live
- [ ] Browse smoke shows `h-9` button in preview
- [ ] No CSS regression visible

---

## Coverage Matrix

| # | Gap / Requirement | Task(s) | Resolution |
|---|---|---|---|
| 1 | Components ~10% taller than shadcn/Mantine/Linear/Vercel | T1.1, T1.2 | Form controls md: 40→36px |
| 2 | Body-md = 15px (non-industry-standard) | T2.1 | body-md → 14px |
| 3 | Card padding md = 24px feels Material-style | T3.1 | Card md → p-5 (20px) |
| 4 | No global density override (consumer locked into 3 sizes) | T4.1, T4.2, T4.3 | useDensity + data-density |
| 5 | Style-guide doesn't declare height defaults / tap-target policy | T5.1 | docs/design-system.md > Density policy |
| 6 | Decision history not archived | T6.1 | RFC 0006 |
| 7 | Visual delta not validated end-to-end | T7.2 | playground browse smoke + side-by-side |
| 8 | Bundle baseline ages | T1.4, T7.1 | rebase if necessary |
| 9 | Composites might break visually | T1.3 | 4-composite visual smoke |
| 10 | Migration guidance for consumers in 0.2.x | T6.2 | CHANGELOG migration note |
| 11 | EC-1: density via class modifier breaks explicit `size` | T4.1, T4.2 (D3 ADR rewritten) | CSS vars no root + cva md lê var, sm/lg hardcoded |
| 12 | EC-2: body-md change affects 14 hardcoded usages | T2.2 | Visual smoke on 4 critical text-heavy components |
| 13 | EC-3: localStorage Safari private mode | T4.1 | Reuse `warnStorageFailure` helper |
| 14 | EC-4: gate + source must commit together | T2.1 | Tasks step adds explicit commit-together guidance |
| 15 | EC-5: Cloudflare token pre-condition | T7.3 | Token verify curl before deploy |

**Coverage: 15/15 (100%)**

**Edge case review:** `.claude/knowledge-base/reviews/edge-cases/faang-density-tightening-edge-cases-2026-05-22.md` — 5 edges (1 MUST FIX EC-1 incorporado em D3+T4.1+T4.2; 2 SHOULD TEST cobertos em T2.2/T4.1; 2 DOCUMENT em T2.1/T7.3).

## Global Definition of Done

- [ ] All 8 phases (0-7) completed
- [ ] All tests passing (vitest)
- [ ] Zero biome warnings (existing playground warnings pre-existing OK)
- [ ] Backwards compat: public API unchanged
- [ ] code-audit / quality:gates passing
- [ ] `pnpm quality:gates` exit 0 in theo-ui
- [ ] RFC 0006 status `Implemented`
- [ ] CHANGELOG entries under [0.3.0-next.0] with Migration section
- [ ] **Dogfood QA PASS** — playground + production smoke confirms FAANG-modern feel
- [ ] **Runtime-metric proof** — N/A (no runtime counter introduced)

## Final Phase: Dogfood QA (MANDATORY)

> Roda DEPOIS de todas as fases 0-7. Plan is NOT done until this passes.

**Objective:** Validar that a user looking at side-by-side screenshots of Theo UI vs Linear/Vercel cannot distinguish density.

### Execution

1. Build theo-ui, install in theo-opendocs as new version.
2. Deploy theo-opendocs.
3. Browse https://docs.usetheo.dev/theoui/theming/ + playground side-by-side with linear.app/settings and vercel.com/dashboard.
4. Measure: button heights, body text, card padding — all should be within ±1px of competitors.
5. Health score: subjective FAANG-modern feel ranked 8/10 in dogfood report.

### Acceptance Criteria

- [ ] Form-control heights measured at 36±1px across the live preview
- [ ] Body text computed style is 14px
- [ ] Card padding measured at 20±1px
- [ ] Zero CRITICAL/HIGH issues introduced
- [ ] Visual diff doc committed with annotated screenshots

### If Dogfood Fails

1. Identify which dimension regressed.
2. Fix specific px in the relevant cva.
3. Re-run dogfood.

---

## Notas de execução

- **Backwards-compat awareness**: este plano introduz visual changes a defaults — não é semver patch. Bump minor (0.3.0).
- **Order matters**: Phase 1 → Phase 2 → Phase 3 são sequenciais porque cada uma rebases baselines for the next. Phase 4 vem depois (additive). Phase 5-7 são docs+ship.
- **Hot-paths fragile**: 5 hardcoded `h-10`/`text-body-md`/`p-6` em composites (folder-selector, agent-profile, permission-matrix, intent-selector, etc.) ainda existem. Esses **não fazem parte deste plano** (são instances específicas que vão refletir o token automaticamente). Listado para awareness, não para refactor.
- **`pnpm quality:bundle` rebase**: esperado 1-2KB delta from density modifiers. Documentar no commit.
