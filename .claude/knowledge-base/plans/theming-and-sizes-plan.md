# Plan: Theming customizável + padronização de `size` no `@usetheo/ui`

> **Version 1.0** — Esse plano corrige duas lacunas explicitamente identificadas em conversa com o usuário (2026-05-20): (1) só 2 dos 102 componentes (`Button`, `Avatar`) expõem prop `size`, mesmo com toda a escala (typescale + spacing + radii) já tokenizada; (2) consumidores conseguem criar temas próprios, mas o atrito é alto — 29 cor keys obrigatórias por modo, sem helper de partial override, sem documentação dedicada, sem theme builder. O outcome esperado é: (a) prop `size` consistente em 9 primitives adicionais (Input, Badge, Toast, Checkbox, Switch, Card, FormField, Textarea, Select) totalizando 11 componentes com `size` (Button + Avatar + 9 novos), (b) um helper `defineTheme(partial)` que merja com `violetForge`, eliminando o requisito de preencher 58 cor keys (29×2), (c) uma página dedicada `/theoui/theming` em `docs.usetheo.dev` com tutorial passo a passo e color picker live para preview de temas customizados, (d) uma RFC `0005-theming-and-sizes.md` arquivando a decisão.

## Context

**Estado em 2026-05-20 (verificado via grep no source, não é especulação):**

- **Sizes — verificado em `src/components/primitives/*/[a-z]*.tsx`:**
  - 6 componentes usam `cva()`: `button`, `avatar`, `badge`, `sheet`, `toast`. Apenas `button` e `avatar` declaram `size` no objeto `variants`. Os outros 4 só têm `variant` (semântica de cor) — sem size.
  - 96 dos 102 componentes não usam `cva` em absoluto: `input.tsx` literalmente declara `export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}` (nenhuma prop além das do `<input>` HTML).
  - A escala existe e é rica: `src/styles/tailwind-preset.ts` ships 16 typescale tiers (`display-2xl` 64px → `code-sm` 13px); `src/styles/tokens.css` ships `--space-1` (4px) → `--space-32` (128px) + `--radius-sm/md/lg/xl/2xl/full`.
  - Consequência observada: para reduzir um `<Input>`, o consumer precisa fazer `<Input className="h-8 text-body-sm">` — vazando token names que deveriam estar abstraídos atrás de uma prop.

- **Theming — verificado em `src/themes/`:**
  - `Theme` interface (`src/themes/types.ts`) exige `ColorScale` com **29 cor keys** (`background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `primary`, `primary-deep`, `primary-glow`, `primary-foreground`, `secondary`, `secondary-foreground`, `accent`, `accent-deep`, `accent-foreground`, `muted`, `muted-foreground`, `border`, `input`, `ring`, `success`, `success-foreground`, `warning`, `warning-foreground`, `destructive`, `destructive-foreground`, `info`, `info-foreground` — conferido com `grep ":\s*string" src/themes/types.ts`). Modo `light` + `dark` separados ⇒ **58 valores por tema custom**, todos obrigatórios via TypeScript.
  - Cores em formato HSL string-tuple (ex.: `"262 83% 58%"`). Sem helper hex→HSL. Conversor manual.
  - API runtime existe e é completa: `<ThemeProvider themes={[...]}>`, `useTheme()` retorna `{ themes, theme, setTheme, mode, setMode, toggleMode, registerTheme }` (verificado em `src/themes/theme-provider.tsx:7-22`).
  - Documentação atual = **um parágrafo** em `docs/design-system.md` linha 167 ("Custom themes: define an object satisfying the `Theme` type and pass it via `themes={[violetForge, myCustomTheme]}` to `<ThemeProvider>`").
  - Sem theme builder UI. Sem live preview. Sem exemplos passo a passo em `docs.usetheo.dev`.

- **Quality gates:** `validateDesignSystemFidelity` em `scripts/validate-quality-gates.ts` valida que `tokens.css` + `violet-forge.ts` + `tailwind-preset.ts` ficam em sync. Não há gate para "cada primitive tem size variant onde faz sentido". Não há gate para validar custom theme shape em runtime.

**Evidência da dor do usuário (2026-05-20 chat):**
- Pergunta literal: "É fácil para o usuário fazer customizações de temas?"
- Resposta atual (medida): "Médio. Tipado e funcional, mas não tem UI builder. 29 cor keys obrigatórias por modo. Sem fallback parcial — todo o objeto. Cores em HSL string-tuple. Sem documentação dedicada."
- Pergunta: "Como estão as configurações de size dos nosso projetos, é configurável?"
- Resposta atual (medida): "Inconsistente. Só 2 dos 102 componentes têm prop size exposta."
- Decisão do usuário: "Precisamos corrigir esse problemas e o usuário deve conseguir fazer o customizar e aplicar seus próprios temas."

**Sem RFC arquivado ainda** — esse plano produz a RFC `0005-theming-and-sizes.md` como artefato. Plans anteriores que tocaram theme (`ui-deep-review-fixes-plan.md`, `theo-ui-deep-review-blockers-plan.md`) focaram em fidelity gates e Tailwind preset; não cobriram theming customizável nem padronização de size.

## Objective

**Done = consumidores conseguem (a) usar `size={'sm'|'md'|'lg'}` em pelo menos 11 primitives mainstream com semântica consistente e (b) criar um tema custom em <10 linhas de código a partir de `defineTheme({ name, primary: '#FF5722' })` — verificado por testes + smoke em playground + página de docs dedicada com live preview e tutorial.**

Concretamente:

1. **Sizes** — 11 primitives expõem prop `size` opcional, default `md`, com escala `sm | md | lg`. Cobertura mínima da lista: `Button`, `Avatar` (já existem, validar), `Input`, `Badge`, `Toast`, `Checkbox`, `Switch`, `Card`, `FormField`, `Textarea`, `Select`. Cada um tem teste de regressão que valida que `size='sm'` aplica height/padding/text-size diferentes de `size='md'` e `size='lg'`.
2. **Theme builder API** — `defineTheme(partial)` exportado de `@usetheo/ui`. Recebe `Partial<Theme>` + nome obrigatório, retorna `Theme` completo merged com `violetForge`. Tipos TypeScript permitem omitir qualquer key.
3. **Hex/RGB helpers** — `hex('#7C3AED')` e `rgb(124, 58, 237)` retornam HSL string-tuple compatível com `ColorScale`. Documentado. Testado para 6+ inputs incluindo edge cases (`#000`, `#fff`, alpha hex).
4. **Página de theming** — `docs.usetheo.dev/theoui/theming` com (a) tutorial passo a passo, (b) live preview color picker (3 cores principais: primary, accent, background), (c) snippet copy-paste do tema gerado, (d) link de download `.ts` do tema final.
5. **RFC arquivada** — `docs/rfcs/0005-theming-and-sizes.md` status `Implemented`, com as 4 ADRs deste plano formalizadas.
6. **Quality gates verdes** — `pnpm quality:gates` passa em `theo-ui`. Sem regressão de bundle (size variants adicionam <2 KB ao barrel; `quality:bundle` baseline tolerado se update for documentado).
7. **Backwards compat** — Existing `Button` e `Avatar` continuam funcionando sem mudança no public API (size já existe). Existing `ThemeProvider` continua aceitando `themes={Theme[]}` clássico — `defineTheme` é adição, não substituição.

## ADRs

### D1 — `size` como prop opcional CVA com escala `sm | md | lg`, default `md`

- **Decisão:** Padronizar prop `size?: 'sm' | 'md' | 'lg'` em primitives "interativos com surface visível" (Input, Badge, Toast, Checkbox, Switch, Card, FormField, Textarea, Select). Componentes "atômicos" como `Label`, `Skeleton`, `Switch` indicators que herdam tamanho do contexto NÃO recebem size — controlam tamanho via `className` do parent. Default sempre `md` para preservar comportamento atual.
- **Rationale:**
  - **3 sizes é o consenso de DS modernos** (shadcn/ui, Mantine, Chakra v2, Tremor). 4+ sizes (`xs`/`xl`) adicionam complexidade sem caso concreto na lista de consumers atuais.
  - **CVA já é o padrão do projeto** — `Button`, `Avatar`, `Badge`, `Toast`, `Sheet` usam. Padronizar reduz divergência em vez de aumentar.
  - **Default `md`** preserva 100% do comportamento atual de quem não passa `size`. Zero migração necessária.
  - **`Label`/`Skeleton` ficam de fora** porque eles SEMPRE herdam contexto. Adicionar size lá geraria a ilusão de controle independente.
- **Consequences:** Habilita controle de tamanho consistente em 11 primitives sem `className` mágico. Constrange: cada size variant precisa de teste de regressão (custo: ~10min por componente × 9 = 90min de TDD). Bundle do barrel cresce ~1-2 KB total (verificado: `Button` size adiciona ~50 bytes; 9 componentes × 50-200 bytes = 450 bytes - 1.8 KB).

### D2 — `defineTheme(partial)` faz merge com `violetForge`, não com o tema ativo

- **Decisão:** O helper `defineTheme(opts)` aceita `{ name: string, label?: string, light?: Partial<ColorScale>, dark?: Partial<ColorScale>, fonts?: Partial<ThemeFonts> }` e retorna `Theme` completo. O merge sempre usa `violetForge` como base (não o tema ativo no momento da chamada).
- **Rationale:**
  - **Pure function previsível.** Se o merge dependesse do tema ativo, o tema custom mudaria de comportamento dependendo de quando foi criado. Inaceitável.
  - **`violetForge` é o canônico** — todos os outros temas (`classic-paper`, `aurora-terminal`) também derivam dele conceitualmente.
  - **Override granular** — o consumer só precisa especificar as keys que quer mudar. Se omitir `dark`, o `dark` de `violetForge` é usado (que é completo).
- **Consequences:** Habilita custom themes em <10 linhas. Constrange: se algum dia `violetForge` mudar uma key default, themes criados com `defineTheme` herdam a mudança automaticamente (semântica desejada — mudança de DS deve propagar). Documentar isso.

### D3 — Helpers `hex()` / `rgb()` retornam HSL string-tuple, não objeto

- **Decisão:** `hex('#7C3AED')` retorna `'262 83% 58%'` (string compatível direto com `ColorScale` values). `rgb(124, 58, 237)` idem. Sem objeto `{h, s, l}` intermediário.
- **Rationale:**
  - **`ColorScale` já é HSL string-tuple** (formato shadcn-compatível com `hsl(var(--primary))`). Retornar objeto exigiria o consumer chamar `.toString()` ou similar.
  - **Drop-in replacement**: `light: { primary: hex('#7C3AED') }` lê limpo, sem ginástica.
  - **Sem dependência externa** — algoritmo hex→HSL é ~30 linhas. Não vamos adicionar `color`/`chroma-js` (que combinados pesam ~50KB).
- **Consequences:** Habilita ergonomia. Constrange: edge cases precisam ser testados (alpha hex `#7C3AEDFF`, RGB out of range, NaN). Validação em runtime + types via TypeScript.

### D4 — Página de theming usa `<Slide>` para live preview ao invés de iframe

- **Decisão:** A página `/theoui/theming` em `theo-opendocs` renderiza um preview ao vivo usando componentes reais do `@usetheo/ui` (Button, Card, Input, Badge, etc.) dentro de um `<ThemeProvider themes={[generatedTheme]}>` local — não em iframe. Cores do tema generado vêm de 3 color pickers controlados (primary, accent, background).
- **Rationale:**
  - **Iframe complica**: comunicação via postMessage, hot reload do tema sem reload da página, scroll lock — todos solúveis mas custosos.
  - **In-page funciona**: `<ThemeProvider>` aceita re-renderização do prop `themes` (verificado em `theme-provider.tsx:267`). Trocar `themes` re-injeta CSS vars no `<style>` interno. Não há vazamento de tema para o resto da página porque cada ThemeProvider escopa por `data-theme`.
  - **Snippet copy-paste fica trivial** — basta serializar o objeto JS do tema.
- **Consequences:** Habilita preview live em <50 linhas de React. Constrange: o `<ThemeProvider>` aninhado precisa lidar com `data-theme` colidindo com o do app (mitigação: scope via container `data-theme-scope="preview"` se necessário; testar no prototype antes de commitar).

## Dependency Graph

```
Phase 0 (Snapshot) ──▶ Phase 1 (size CVA refactor — 9 primitives)
                              │
                              ▼
                       Phase 2 (defineTheme + hex/rgb helpers)
                              │
                              ▼
                       Phase 3 (RFC 0005 + theo-ui CHANGELOG)
                              │
                              ▼
                       Phase 4 (theo-opendocs: /theoui/theming page)
                              │
                              ▼
                       Phase 5 (Dogfood QA + cross-validation)
```

Phase 1 e Phase 2 são logicamente independentes mas Phase 2 depende de não conflitar com mudanças de Phase 1 (ambas mexem em arquivos diferentes — Phase 1 em primitives, Phase 2 em themes/). **Em prática rodam sequenciais para evitar merge conflicts** em `CHANGELOG.md`. Phase 3 só pode rodar depois das duas. Phase 4 depende de @usetheo/ui ter o novo `defineTheme` exportado e versão bumped. Phase 5 é gate final.

---

## Phase 0: Snapshot da baseline

**Objective:** Capturar o estado atual antes de qualquer mudança para que cross-validation final tenha base de comparação.

### T0.1 — Snapshot dos primitives sem `size`

#### Objective
Listar com precisão quais componentes recebem prop `size` nesta sessão para que o coverage matrix possa ser auditado depois.

#### Evidence
Source grep ao iniciar este plano: `grep -lE 'size: "(sm|md|lg)' src/components/primitives/*/[a-z]*.tsx | grep -v ".test\|.stories"` retorna 2 hits (button.tsx, avatar.tsx).

#### Files to edit
```
.claude/knowledge-base/architecture/usetheo-ui/baseline-2026-05-20-sizes.md — (NEW) snapshot do estado de size variants em primitives
```

#### Deep file dependency analysis
- Arquivo NEW — sem dependências downstream.
- Lista por componente: tem `cva`? tem `size` variant? quais sizes? default size?

#### Deep Dives
Comando para gerar:
```bash
for f in src/components/primitives/*/[a-z]*.tsx; do
  base=$(basename "$f" .tsx)
  has_cva=$(grep -c "cva(" "$f")
  has_size=$(grep -c 'size: \?{' "$f")
  echo "$base|$has_cva|$has_size"
done | sort -t'|' -k2,2nr
```

#### Tasks
1. Rodar o script + escrever a tabela markdown em `baseline-2026-05-20-sizes.md`.
2. Adicionar linha de classificação: "candidatos a size" (Input, Badge, Toast, Checkbox, Switch, Card, FormField, Textarea, Select) vs "não-candidatos" (Label, Skeleton, indicators internos).
3. Commit: `docs(architecture): snapshot baseline of size variants before T1`.

#### TDD
N/A — esse é um doc de snapshot, sem código testável.

#### Acceptance Criteria
- [ ] `baseline-2026-05-20-sizes.md` existe e lista 102 primitives + composites com colunas `name | uses_cva | has_size | classification`.
- [ ] Coluna `classification` ∈ `{size_candidate, has_size, non_candidate}`.

#### DoD
- [ ] Documento commitado.

---

## Phase 1: Padronizar `size` em 9 primitives adicionais

**Objective:** Expor `size?: 'sm' | 'md' | 'lg'` em Input, Badge, Toast, Checkbox, Switch, Card, FormField, Textarea, Select.

### T1.1 — Input.tsx ganha `size`

#### Objective
`<Input size="sm">` aplica `h-8 px-2.5 text-body-sm`; `size="md"` aplica `h-10 px-3 text-body-md`; `size="lg"` aplica `h-12 px-4 text-body-lg`. Default `md`.

#### Evidence
`src/components/primitives/input/input.tsx` declara `export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}` — zero size control. Consumers atualmente fazem `<Input className="h-8 text-body-sm">` (vazando token names).

#### Files to edit
```
src/components/primitives/input/input.tsx — adicionar inputVariants via cva, prop size
src/components/primitives/input/input.test.tsx — teste de size + a11y por size
src/components/primitives/input/input.stories.tsx — 3 stories: SmallInput, MediumInput, LargeInput
```

#### Deep file dependency analysis
- **input.tsx hoje**: forwardRef que devolve `<input className={cn("flex h-10 w-full ...", className)} ref={ref} {...props} />`. **Sem cva, sem variants.**
- **Mudança**: introduzir `const inputVariants = cva([...base...], { variants: { size: { sm, md, lg } }, defaultVariants: { size: "md" } })`. Tipo `InputProps` ganha `VariantProps<typeof inputVariants>`.
- **Downstream**: 14 composites importam `Input` via barrel (verificar com `grep -rE "from.*Input|<Input\b" src/components/composites/`). Nenhum passa size hoje. Backwards compat ✓.
- **Registry**: `registry/r/input.json` é re-built por `pnpm registry:build` que lê `input.tsx` raw. Conteúdo embarcado vai automaticamente carregar o novo cva. Nenhuma mudança manual em `registry/input.json` necessária.

#### Deep Dives
**Tokens escolhidos por size:**
| Size | Height | Padding-x | Font tier | Rationale |
|---|---|---|---|---|
| `sm` | `h-8` (32px) | `px-2.5` (10px) | `text-body-sm` (14px) | Compact form, table cell |
| `md` | `h-10` (40px) | `px-3` (12px) | `text-body-md` (15px) | **Default** — current behavior preserved |
| `lg` | `h-12` (48px) | `px-4` (16px) | `text-body-lg` (18px) | Hero forms, accessibility |

**Backwards compat invariant:** Quando consumer NÃO passa `size`, classes geradas DEVEM ser idênticas às hoje (`h-10 px-3 text-body-md`). Verificado por snapshot test.

**Type conflict resolution (EC-1, edge-case review 2026-05-20):** `InputHTMLAttributes<HTMLInputElement>` já declara `size?: number | undefined` nativo (atributo HTML que controla largura em caracteres). Adicionar `size: 'sm' | 'md' | 'lg'` via VariantProps diretamente quebraria o type. Solução: `Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>` no extends:
```ts
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}
```
Backwards compat: o atributo HTML `size={20}` para text-cols não era padrão usado nos consumers internos (`grep -rE 'Input.*size=\{' src/ playground/ tests/` retorna 0 hits). Quem precisar do attr nativo passa via `<Input {...{ size: 20 } as any}>` — caso extremamente raro, documentado no JSDoc.

#### Tasks
1. RED: Escrever `it("aplica h-8 px-2.5 text-body-sm quando size='sm'")`. Falha porque size não existe.
2. RED: Escrever `it("aplica h-10 px-3 text-body-md quando size omitido")` — snapshot backwards compat.
3. RED: Escrever `it("aceita size='lg' sem erro de type")`.
4. RED: Escrever `it("forwarda ref e mantém className extra")`.
5. RED: Escrever `it("type-rejects HTML size={20}")` — verifica via `@ts-expect-error` que `<Input size={20}>` não compila mais (EC-1).
6. GREEN: Refatorar `input.tsx` para usar `cva` com a tabela acima.
7. GREEN: Atualizar `InputProps` para `Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & VariantProps<typeof inputVariants>` (EC-1).
7. Stories: 3 entries (`SmallInput`, `MediumInput`, `LargeInput`) — `pnpm dev` valida visualmente.
8. REFACTOR: extrair `inputVariants` para export caso composites futuros precisem `cva` extends — só se necessário.

#### TDD
```
RED:     test_input_size_sm_classes — Render <Input size="sm" />, expect className contém "h-8" + "text-body-sm".
RED:     test_input_size_md_default — Render <Input />, expect className contém "h-10" + "text-body-md" (backwards compat).
RED:     test_input_size_lg_classes — Render <Input size="lg" />, expect className contém "h-12" + "text-body-lg".
RED:     test_input_ref_forwarding — Confirmar que ref ainda chega no <input> nativo.
GREEN:   Implementar cva inputVariants + prop size + defaultVariants.
REFACTOR: Avaliar se outros primitives podem reutilizar tokens (provavelmente não — cada um tem ergonomia própria).
VERIFY:  pnpm test src/components/primitives/input
```

#### Acceptance Criteria
- [ ] 4 testes verdes em `input.test.tsx`.
- [ ] 3 stories verdes em `input.stories.tsx` (`pnpm ladle:build`).
- [ ] Backwards compat: render existente sem `size` produz classes idênticas à versão anterior.
- [ ] `pnpm typecheck` sem warnings.
- [ ] Pass: `pnpm registry:build && pnpm registry:validate` (`input.json` é re-built).
- [ ] Pass: `pnpm quality:structure` (regra `validateRegistryStoriesAndTests` continua satisfeita).

#### DoD
- [ ] `pnpm test src/components/primitives/input` verde
- [ ] `pnpm typecheck` verde
- [ ] `pnpm registry:build && pnpm registry:validate` verde

### T1.2 — Badge.tsx ganha `size`

#### Objective
`<Badge size="sm">` mantém height pequeno (`text-label-caps`, `px-2`); `size="md"` é o atual (`text-label`, `px-2.5`); `size="lg"` aumenta (`text-body-md`, `px-3`).

#### Evidence
`badge.tsx` já tem `cva` com `variant` (default/primary/accent/success/...) — basta adicionar dimensão `size` ao mesmo objeto.

#### Files to edit
```
src/components/primitives/badge/badge.tsx — adicionar variants.size
src/components/primitives/badge/badge.test.tsx — testes de size
src/components/primitives/badge/badge.stories.tsx — story Sizes
```

#### Deep file dependency analysis
- **badge.tsx hoje**: cva com 7 variants de cor. defaultVariants `{ variant: "default" }`.
- **Mudança**: adicionar `size: { sm, md, lg }` ao objeto variants. defaultVariants ganha `size: "md"`. Tipo já é `VariantProps<typeof badgeVariants>` — pega o size automaticamente.
- **Downstream**: 18 composites importam Badge. Nenhum passa size. Backwards compat ✓.

#### Deep Dives
| Size | Padding | Font tier |
|---|---|---|
| `sm` | `px-2 py-0.5` | `text-label-caps` (12px uppercase) |
| `md` | `px-2.5 py-0.5` | `text-label` (14px) |
| `lg` | `px-3 py-1` | `text-body-md` (15px) |

#### Tasks
1. RED: 3 testes de size + 1 backwards-compat (default `md`).
2. GREEN: Adicionar `size` ao cva.
3. Story `Sizes` combinando size + variant em grid.

#### TDD
```
RED:     test_badge_size_sm — expect "px-2" + "text-label-caps"
RED:     test_badge_size_md_default — expect "px-2.5" + "text-label"
RED:     test_badge_size_lg — expect "px-3" + "text-body-md"
RED:     test_badge_variant_preserved — Badge variant="success" size="sm" ainda tem border-success
GREEN:   Adicionar size ao variants object.
REFACTOR: None expected.
VERIFY:  pnpm test src/components/primitives/badge
```

#### Acceptance Criteria
- [ ] 4 testes verdes
- [ ] Story `Sizes` válida no Ladle
- [ ] Backwards compat: `<Badge variant="success">` produz classes idênticas

#### DoD
- [ ] `pnpm test src/components/primitives/badge` verde
- [ ] `pnpm typecheck` verde

### T1.3 — Toast.tsx ganha `size`

(Mesmo shape de T1.2 — adicionar `size` ao cva existente. Sizes: `sm` = compact alert, `md` = default, `lg` = banner-style.)

#### Files to edit
```
src/components/primitives/toast/toast.tsx — adicionar variants.size ao toastVariants
src/components/primitives/toast/toast.test.tsx — 4 testes (sm/md/lg + variant preserved)
src/components/primitives/toast/toast.stories.tsx — story Sizes
```

#### TDD
```
RED:     test_toast_size_sm — expect "p-3 text-body-sm"
RED:     test_toast_size_md_default — expect "p-4 text-body-md" (current)
RED:     test_toast_size_lg — expect "p-5 text-body-lg"
RED:     test_toast_variant_preserved — variant="destructive" + size="sm" mantém border-destructive
GREEN:   Adicionar size ao toastVariants.
VERIFY:  pnpm test src/components/primitives/toast
```

#### Acceptance Criteria
- [ ] 4 testes verdes
- [ ] Backwards compat preservada
- [ ] Story `Sizes` rendering correto

### T1.4 — Checkbox.tsx ganha `size`

#### Files to edit
```
src/components/primitives/checkbox/checkbox.tsx — introduzir cva (não existe hoje) + size
src/components/primitives/checkbox/checkbox.test.tsx — testes size + a11y preservada
src/components/primitives/checkbox/checkbox.stories.tsx — story Sizes
```

#### Deep Dives
| Size | Box dimensions | Checked icon size |
|---|---|---|
| `sm` | `h-3.5 w-3.5` (14px) | `size-2.5` |
| `md` | `h-4 w-4` (16px) | `size-3` |
| `lg` | `h-5 w-5` (20px) | `size-3.5` |

A11y: a tap target deve seguir WCAG (>=24px). Para size `sm`, adicionar `before:absolute before:inset-[-5px]` (área invisível 24px efetiva). Já é prática shadcn.

#### TDD
```
RED:     test_checkbox_size_sm — Render checkbox + assert "h-3.5 w-3.5"
RED:     test_checkbox_size_sm_tap_target — querySelector "::before" com inset negativo (a11y)
RED:     test_checkbox_size_md_default — backwards compat
RED:     test_checkbox_size_lg
RED:     test_checkbox_axe — vitest-axe passa em todos os 3 sizes
GREEN:   Introduzir cva checkboxVariants com size.
REFACTOR: extrair classes base em const se ficar longo.
VERIFY:  pnpm test src/components/primitives/checkbox
```

#### Acceptance Criteria
- [ ] 5 testes verdes
- [ ] Axe sweep passa em todos os sizes
- [ ] Backwards compat
- [ ] Tap target >=24px efetivo em `sm`

### T1.5 — Switch.tsx ganha `size`

#### Files to edit
```
src/components/primitives/switch/switch.tsx — introduzir cva + size para track + thumb
src/components/primitives/switch/switch.test.tsx
src/components/primitives/switch/switch.stories.tsx
```

#### Deep Dives
| Size | Track | Thumb |
|---|---|---|
| `sm` | `h-4 w-7` | `size-3 data-[state=checked]:translate-x-3` |
| `md` | `h-5 w-9` | `size-4 data-[state=checked]:translate-x-4` |
| `lg` | `h-6 w-11` | `size-5 data-[state=checked]:translate-x-5` |

#### TDD
```
RED:     test_switch_size_sm_track — expect "h-4 w-7"
RED:     test_switch_size_sm_thumb_translate — verify data-[state=checked] translate apropriado
RED:     test_switch_size_md_default
RED:     test_switch_size_lg
RED:     test_switch_axe
GREEN:   Introduzir switchVariants + thumbVariants ou um único variants com sub-class via [`&_span`].
VERIFY:  pnpm test src/components/primitives/switch
```

#### Acceptance Criteria
- [ ] 5 testes verdes
- [ ] Animation de toggle válida em todos sizes (visual no Ladle)
- [ ] Axe sweep verde

### T1.6 — Card.tsx ganha `size`

#### Files to edit
```
src/components/primitives/card/card.tsx — Card + Card.Header + Card.Content + Card.Footer compartilham `size`
src/components/primitives/card/card.test.tsx
src/components/primitives/card/card.stories.tsx
```

#### Deep Dives
Card é compound (`Card.Header`, `Card.Title`, `Card.Description`, `Card.Content`, `Card.Footer`). Decisão: prop `size` no `Card` root **propaga via React Context** para subparts, evitando passar size em cada subpart.

**Subparts não aceitam `size` próprio (EC-8, edge-case review 2026-05-20):** API enxuta — `<Card size="lg"><Card.Header size="sm">` não é suportado. Consumer que quer mix usa `className`. Documentar em JSDoc de cada subpart: "Inherits `size` from parent `<Card>` via Context. Use `className` for granular tweaks."

**Context default value safe:** `createContext<{ size: 'sm' | 'md' | 'lg' }>({ size: 'md' })` — com default object, não com `null`. Garante que `Card.Title` usado isolado (sem `<Card>` root, padrão raro mas válido) NÃO crashe.

| Size | Card padding | Title font tier | Header gap |
|---|---|---|---|
| `sm` | `p-3` | `text-title-md` | `gap-1` |
| `md` | `p-5` | `text-title-lg` | `gap-1.5` |
| `lg` | `p-7` | `text-headline` | `gap-2` |

#### Tasks
1. Introduzir `CardContext` (`createContext<{ size: 'sm' | 'md' | 'lg' }>`).
2. `<Card>` cria provider.
3. `Card.Header / Title / Content / Footer` consomem via `useContext`.
4. Backwards compat: sem size = `md`. Subparts sem provider (consumer compõe sem `<Card>` root) = `md`.

#### TDD
```
RED:     test_card_size_sm_root_padding — expect Card root tem "p-3"
RED:     test_card_size_propagates_to_title — Card size="sm" + Card.Title tem "text-title-md"
RED:     test_card_subpart_without_provider — Card.Title isolado renderiza com size md (sem crash)
RED:     test_card_size_md_default
RED:     test_card_size_lg_root_padding
GREEN:   CardContext + provider em Card + consumer em subparts.
REFACTOR: extrair tokens-by-size para const sharing.
VERIFY:  pnpm test src/components/primitives/card
```

#### Acceptance Criteria
- [ ] 5 testes verdes
- [ ] Composite tests continuam verdes (Card é usado por DeploymentRow, AgentEditor, etc.)
- [ ] Backwards compat preservada

### T1.7 — FormField.tsx ganha `size`

(Compound similar a Card. Size propaga para Label, Control wrapper, Description, Error.)

#### Files to edit
```
src/components/primitives/form-field/form-field.tsx
src/components/primitives/form-field/form-field.test.tsx
src/components/primitives/form-field/form-field.stories.tsx
```

**Subparts não aceitam `size` próprio (EC-8):** mesma decisão de T1.6 — size só no `<FormField>` root; subparts herdam via Context. `<FormField size="lg"><FormField.Label size="sm">` não tem efeito. Documentar em JSDoc.

**Context já existe** em `form-field.tsx:48` (`FormFieldContext` com value `null` default). Decisão: **adicionar `size` ao FormFieldContextValue existente** (não criar contexto separado), atualizando o default `null` para `{ ...currentDefaults, size: 'md' }` ou tratar `null` no consumer com fallback `?? 'md'`.

#### TDD
```
RED:     test_formfield_size_sm — Label "text-label-caps", spacing "space-y-1"
RED:     test_formfield_size_md_default — "text-label" + "space-y-1.5"
RED:     test_formfield_size_lg — "text-body-md" + "space-y-2"
RED:     test_formfield_size_propagates_to_label
RED:     test_formfield_axe
GREEN:   Context + variants.
VERIFY:  pnpm test src/components/primitives/form-field
```

#### Acceptance Criteria
- [ ] 5 testes verdes
- [ ] Axe sweep verde

### T1.8 — Textarea.tsx ganha `size`

(Mesmo shape de Input — single primitive, sem subparts.)

#### Files to edit
```
src/components/primitives/textarea/textarea.tsx — adicionar cva + size
src/components/primitives/textarea/textarea.test.tsx
src/components/primitives/textarea/textarea.stories.tsx
```

#### Deep Dives
| Size | Min-height | Padding | Font tier |
|---|---|---|---|
| `sm` | `min-h-[60px]` | `px-2.5 py-1.5` | `text-body-sm` |
| `md` | `min-h-[80px]` | `px-3 py-2` | `text-body-md` |
| `lg` | `min-h-[120px]` | `px-4 py-3` | `text-body-lg` |

#### TDD
```
RED:     test_textarea_size_sm — "min-h-[60px]" + "text-body-sm"
RED:     test_textarea_size_md_default
RED:     test_textarea_size_lg
RED:     test_textarea_ref_forwarding
GREEN:   Adicionar cva textareaVariants.
VERIFY:  pnpm test src/components/primitives/textarea
```

### T1.9 — Select.tsx ganha `size`

(Trigger ganha size; menu/items herdam tamanho via Tailwind classes do trigger ou via context se necessário.)

#### Files to edit
```
src/components/primitives/select/select.tsx — Select.Trigger ganha size
src/components/primitives/select/select.test.tsx
src/components/primitives/select/select.stories.tsx
```

#### Deep Dives
| Size | Trigger height | Padding | Font tier |
|---|---|---|---|
| `sm` | `h-8` | `px-2.5` | `text-body-sm` |
| `md` | `h-10` | `px-3` | `text-body-md` |
| `lg` | `h-12` | `px-4` | `text-body-lg` |

Decisão: items do dropdown NÃO mudam por size (sempre `md`-equivalente). Menu é flutuante, isolado do contexto do trigger. Documentar em JSDoc.

**Type conflict guard (EC-2, edge-case review 2026-05-20):** ANTES de implementar, rodar `grep -nE 'SelectHTMLAttributes|HTMLSelectElement' src/components/primitives/select/select.tsx`. Se houver match (componente expõe `<select>` nativo), aplicar `Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>` no extends (mesmo padrão de EC-1 em T1.1). Se Radix-only (apenas `<button>` no trigger), nenhuma ação necessária. Resultado do grep documentado no commit message.

#### TDD
```
RED:     test_select_trigger_size_sm — Trigger element tem "h-8 px-2.5 text-body-sm"
RED:     test_select_trigger_size_md_default
RED:     test_select_trigger_size_lg
RED:     test_select_items_unaffected — items sempre em "h-9 text-body-md"
RED:     test_select_axe
GREEN:   Adicionar size só ao Select.Trigger via cva.
VERIFY:  pnpm test src/components/primitives/select
```

#### Acceptance Criteria
- [ ] 5 testes verdes
- [ ] Items size invariant documentado

### T1.10 — Sweep validation: ladle-axe + bundle delta + registry

#### Objective
Confirmar que adicionar `size` em 9 primitives não regredeu acessibilidade, bundle size ou registry.

#### Files to edit
```
scripts/baselines/bundle-sizes.json — update bundle baseline (esperado +1.5-2 KB no barrel)
CHANGELOG.md — entry sob [Unreleased]
```

#### Tasks
1. Rodar `pnpm quality:a11y` — vitest-axe sweep deve continuar com zero violations.
2. Rodar `pnpm quality:bundle` — esperado fail por size delta. Inspecionar diff em `dist/index.js`, confirmar que delta vem dos 9 cva extras. Rodar `pnpm quality:bundle:update`.
3. Rodar `pnpm registry:build && pnpm registry:validate` — 121 items reconstruídos. Inspecionar 9 JSONs em `registry/r/` para confirmar embedded source tem o cva novo.
4. Adicionar entry no CHANGELOG sob `[Unreleased]`:
   ```
   ### Added
   - 9 new primitives expose `size` prop (`sm` | `md` | `lg`) — Input, Badge, Toast, Checkbox, Switch, Card, FormField, Textarea, Select. Default stays `md` so existing markup is unchanged. (#TBD)
   ```

#### Acceptance Criteria
- [ ] `pnpm quality:a11y` zero violations
- [ ] `pnpm quality:bundle` verde após `--update` (delta documentado no commit message)
- [ ] `pnpm registry:validate` verde
- [ ] CHANGELOG entry adicionada

#### DoD
- [ ] Commit único: `feat(primitives): expose size prop on 9 mainstream primitives`
- [ ] Backwards compat verificada por testes (defaults preservam comportamento atual)

---

## Phase 2: `defineTheme` + helpers `hex()` / `rgb()`

**Objective:** Reduzir o atrito de criar custom theme de "58 keys obrigatórias" para "1 partial e o resto vem de violetForge".

### T2.1 — `src/themes/define.ts` (NEW) — `defineTheme()` helper

#### Objective
`defineTheme({ name: 'corp', light: { primary: '210 100% 50%' } })` retorna `Theme` completo com `dark`, `label`, `fonts`, e todas as outras 28 cor keys herdadas de `violetForge`.

#### Evidence
Conversa com user 2026-05-20: "29 cor keys obrigatórias por modo (`light` + `dark`), em HSL string format. Não tem fallback parcial — todo o objeto." É o atrito principal documentado.

#### Files to edit
```
src/themes/define.ts — (NEW) helper defineTheme
src/themes/define.test.ts — (NEW) testes RED-GREEN
src/themes/index.ts — exportar defineTheme
src/index.ts — exportar defineTheme do barrel principal
```

#### Deep file dependency analysis
- **define.ts (NEW)**: importa `Theme`, `ColorScale`, `ThemeFonts` de `./types.js`. Importa `violetForge` de `./violet-forge.js`. Sem dependências circulares — `violetForge` não importa de `define`.
- **types.ts**: precisa exportar tipo `PartialTheme` ou usar `Partial<...>` inline em `defineTheme`. Decisão: definir tipo nominal `DefineThemeInput` em `define.ts` (não vaza ruído em types.ts).
- **index.ts barrel**: `src/themes/index.ts` já re-exporta `violetForge`, `classicPaper`, `auroraTerminal`, `builtinThemes`. Adicionar `defineTheme`. Cascateia para `src/index.ts`.
- **Downstream**: `<ThemeProvider>` aceita Theme[] — `defineTheme()` retorna Theme, drop-in.

#### Deep Dives
**Signature exata:**
```ts
export interface DefineThemeInput {
  /** Required: stable id used in data-theme. */
  name: string;
  /** Optional: human-readable label for switchers. Defaults to capitalized name. */
  label?: string;
  description?: string;
  /** Override light-mode colors. Omit any to inherit from violetForge.light. */
  light?: Partial<ColorScale>;
  /** Override dark-mode colors. Omit any to inherit from violetForge.dark. */
  dark?: Partial<ColorScale>;
  /** Override fonts. Omit any to inherit from violetForge.fonts. */
  fonts?: Partial<ThemeFonts>;
  /** Extra remote font URLs to inject. */
  fontUrls?: string[];
}

export function defineTheme(input: DefineThemeInput): Theme;
```

**Merge semantics:**
- Shallow merge sobre `light`, `dark`, `fonts` separadamente.
- `name`/`description` pass-through.
- `label` defaults to `input.name.charAt(0).toUpperCase() + input.name.slice(1)` se omitido.
- `fontUrls` defaults to `violetForge.fontUrls`. Se `input.fontUrls` provided, **substitui** (não merja arrays — concat geraria duplicação silenciosa).

**Edge cases:**
- Nome vazio → throw `Error("defineTheme: name is required and cannot be empty")`.
- Nome com caracteres inválidos (espaços, símbolos especiais) → throw com mensagem clara (CSS attribute selectors precisam de identifier válido).
- `light` ou `dark` `null` (não undefined) → tratar como `{}` para evitar quebra.

#### Tasks
1. RED: 8 testes (ver TDD abaixo).
2. GREEN: Implementar `defineTheme` com Object.assign / spread.
3. Re-exportar de `src/themes/index.ts` + `src/index.ts`.
4. REFACTOR: extrair validador de nome se ficar longo.

#### TDD
```
RED:     test_defineTheme_minimal — defineTheme({ name: 'corp' }) retorna Theme com label="Corp", light/dark herdados de violetForge.
RED:     test_defineTheme_override_primary — defineTheme({ name: 'red', light: { primary: '0 100% 50%' } }) — light.primary é '0 100% 50%', light.foreground continua vindo de violetForge.
RED:     test_defineTheme_override_dark_only — só dark, light herda completamente.
RED:     test_defineTheme_fonts_partial — fonts: { mono: 'monospace' } — mono substituído, display/body herdados.
RED:     test_defineTheme_throws_on_empty_name — defineTheme({ name: '' }) throws.
RED:     test_defineTheme_throws_on_invalid_name_chars — defineTheme({ name: 'my theme' }) throws (espaço).
RED:     test_defineTheme_label_default — defineTheme({ name: 'foo' }).label === 'Foo'.
RED:     test_defineTheme_label_explicit — defineTheme({ name: 'foo', label: 'My Foo' }).label === 'My Foo'.
RED:     test_defineTheme_overrides_builtin_when_same_name — defineTheme({ name: 'violet-forge', light: { primary: '0 0% 0%' } }) usado junto com violetForge em <ThemeProvider>; CSS var --primary reflete '0 0% 0%' (last-writer-wins, EC-3 documentado).
GREEN:   Implementar defineTheme + validação de nome com regex /^[a-z][a-z0-9-]*$/i.
REFACTOR: extrair regex pattern em constante NAME_PATTERN se reutilizada em validação de runtime.
VERIFY:  pnpm test src/themes/define
```

#### Acceptance Criteria
- [ ] 9 testes verdes (8 originais + EC-3 last-writer-wins)
- [ ] `defineTheme` exportado de `@usetheo/ui` (via barrel)
- [ ] TypeScript: `Partial<ColorScale>` permite omitir qualquer key sem erro de compilação
- [ ] Validação de nome: aceita `corp-dark`, rejeita `corp dark` ou `corp/dark`
- [ ] JSDoc completa em `define.ts` com exemplo end-to-end **e** nota sobre EC-7 (override só light/dark gera inconsistência visual entre modos — intencional)

#### DoD
- [ ] `pnpm test src/themes/define` verde
- [ ] `pnpm typecheck` verde
- [ ] `pnpm build` produz `dist/index.js` com `defineTheme` exportado (verificar via `grep "defineTheme" dist/index.js`)

### T2.2 — `src/themes/color.ts` (NEW) — `hex()` / `rgb()` helpers

#### Objective
`hex('#7C3AED')` retorna `'262 83% 58%'` (HSL string-tuple). `rgb(124, 58, 237)` idem. Validados, com error explícito em input inválido.

#### Evidence
Conversa 2026-05-20: "Cores em HSL string-tuple (sem hex/RGB helper). Conversor manual." — atrito de DX que pode ser eliminado com ~30 linhas.

#### Files to edit
```
src/themes/color.ts — (NEW) hex + rgb + rgbaToHsl utility (private)
src/themes/color.test.ts — (NEW) RED testes
src/themes/index.ts — exportar hex + rgb
src/index.ts — exportar hex + rgb do barrel
```

#### Deep file dependency analysis
- **color.ts (NEW)**: pure functions, zero imports além de tipos. Funções TS estritamente puras (sem `Math.random` ou dependência de Date).
- **Downstream**: `defineTheme` examples vão usar `hex()` no JSDoc. theming page no docs-site vai usar.

#### Deep Dives
**Algoritmo hex → HSL (referência: https://www.w3.org/TR/css-color-3/#hsl-color):**
1. Parse hex em RGB (suportar 3-char `#abc`, 6-char `#aabbcc`, 4-char + alpha `#abcd`, 8-char + alpha `#aabbccdd`).
2. Normalizar para R/G/B em [0, 1].
3. max = Math.max(R, G, B), min = Math.min(R, G, B).
4. L = (max + min) / 2.
5. Se max === min: H = 0, S = 0 (achromatic).
6. Senão: delta = max - min; S = L > 0.5 ? delta/(2-max-min) : delta/(max+min).
7. Cálculo de H baseado em qual canal é max (red/green/blue branch).
8. Retornar string `"${Math.round(H*360)} ${Math.round(S*100)}% ${Math.round(L*100)}%"`.

**Edge cases:**
- `#000` → `'0 0% 0%'`
- `#fff` → `'0 0% 100%'`
- `#7C3AED` (Theo violet) → `'262 83% 58%'` (esperado — assertion exata em teste).
- `#abc` (short hex) → `#aabbcc`.
- `#7C3AEDFF` (alpha 100%) → ignorar alpha, retornar HSL puro.
- `#7C3AED80` (alpha 50%) → ignorar alpha (HSL string-tuple não suporta alpha; consumer usa `hsl(var(--primary) / 0.5)` em CSS).
- `'7C3AED'` (sem `#`) → throw com mensagem `"hex(): expected '#'-prefixed input, got '7C3AED'"`.
- `'#GGG'` (chars inválidos) → throw `"hex(): invalid hex character 'G'"`.

**rgb() signature:**
```ts
export function rgb(r: number, g: number, b: number): string;
```
Aceita números em [0, 255]. Out of range → throw. Decimais aceitos (rounding interno).

#### Tasks
1. RED: 10 testes (4 hex success, 3 hex throws, 2 rgb success, 1 rgb throws).
2. GREEN: implementar `hex` + `rgb` + helper interno `rgbToHsl(r, g, b)`.
3. REFACTOR: extrair `parseHex` se ficar reutilizável.

#### TDD
```
RED:     test_hex_theo_violet — hex('#7C3AED') === '262 83% 58%'
RED:     test_hex_white — hex('#FFFFFF') === '0 0% 100%'
RED:     test_hex_black — hex('#000000') === '0 0% 0%'
RED:     test_hex_short_form — hex('#abc') === hex('#aabbcc')
RED:     test_hex_with_alpha_ignored — hex('#7C3AED80') === '262 83% 58%' (alpha discarded)
RED:     test_hex_throws_without_hash — hex('7C3AED') throws.
RED:     test_hex_throws_invalid_char — hex('#GGG') throws.
RED:     test_hex_throws_invalid_length — hex('#7C3') throws (3 → expand é OK, mas '#7C3A' invalid).
RED:     test_hex_case_insensitive — hex('#7c3aed') === hex('#7C3AED') === '262 83% 58%' (EC-4)
RED:     test_hex_4char_with_alpha — hex('#abc4') === hex('#abc') (alpha descartado, expand 3→6, EC-5)
RED:     test_rgb_basic — rgb(124, 58, 237) === '262 83% 58%'
RED:     test_rgb_throws_out_of_range — rgb(300, 0, 0) throws.
GREEN:   Implementar parseHex + rgbToHsl + hex + rgb.
REFACTOR: extrair parseHex se ficar reutilizável (provavelmente sim — color.ts cresce ~50 linhas).
VERIFY:  pnpm test src/themes/color
```

#### Acceptance Criteria
- [ ] 12 testes verdes (10 originais + EC-4 case-insensitive + EC-5 4-char alpha)
- [ ] `hex` + `rgb` exportados de `@usetheo/ui`
- [ ] JSDoc com exemplos: `hex('#7C3AED')` → `'262 83% 58%'`
- [ ] Error messages claras (input + razão da falha)

#### DoD
- [ ] `pnpm test src/themes/color` verde
- [ ] `pnpm typecheck` verde

### T2.3 — Atualizar `theme-provider.tsx` para aceitar shape de `defineTheme` graciosamente

#### Objective
Não introduzir regressões em `<ThemeProvider>` quando o consumer passar themes criados via `defineTheme` (em vez de objeto literal).

#### Evidence
`defineTheme` retorna `Theme` completo — mesmo shape que objects literais. Em teoria, drop-in. Mas vale ter teste de integração.

#### Files to edit
```
src/themes/theme-provider.test.tsx — adicionar teste de integração
```

#### Tasks
1. RED: `test_theme_provider_accepts_defineTheme_output` — render `<ThemeProvider themes={[defineTheme({ name: 'corp' })]} defaultTheme="corp">` + assert que `data-theme="corp"` é aplicado, CSS var `--primary` corresponde ao valor herdado de `violetForge`.

#### TDD
```
RED:     test_theme_provider_accepts_defineTheme_output — verifica integração end-to-end.
GREEN:   Esperado: nenhuma mudança em theme-provider.tsx (drop-in). Se quebrar, investigar e corrigir.
VERIFY:  pnpm test src/themes/theme-provider
```

#### Acceptance Criteria
- [ ] Teste verde sem alterar source de `theme-provider.tsx`

### T2.4 — CHANGELOG + barrel snapshot

#### Files to edit
```
CHANGELOG.md — entry [Unreleased]
src/index.ts — verificar exports
scripts/baselines/bundle-sizes.json — atualizar se necessário
```

#### Tasks
1. Adicionar CHANGELOG entry:
   ```
   - **`defineTheme(partial)` + `hex()` / `rgb()` helpers (2026-05-20)** — Reduce custom-theme friction. `defineTheme({ name, light: { primary: hex('#FF5722') } })` merges partial overrides into `violetForge` and produces a full `Theme`. `hex()` and `rgb()` convert CSS-friendly inputs to the HSL string-tuple `ColorScale` expects (drop-in compatible with `shadcn`-style tokens). Previously the user had to author 58 color keys by hand. (#TBD)
   ```
2. `pnpm quality:bundle` — verificar delta (esperado ~1-2 KB).
3. Update baseline se necessário.

#### Acceptance Criteria
- [ ] CHANGELOG atualizado
- [ ] `pnpm quality:gates` verde

---

## Phase 3: RFC 0005 + bump de versão

**Objective:** Formalizar as decisões e preparar release.

### T3.1 — Escrever `docs/rfcs/0005-theming-and-sizes.md`

#### Objective
RFC com status `Implemented`, espelhando D1-D4 deste plano, mais consumer documentado (placeholder a confirmar).

#### Files to edit
```
docs/rfcs/0005-theming-and-sizes.md — (NEW)
docs/rfcs/README.md — adicionar linha
```

#### Tasks
1. Template do `0001-whiteboard.md` (estrutura comprovada).
2. Sections: Summary, Motivation, Detailed design, Drawbacks, Alternatives, Unresolved.
3. Linkar para `theming-and-sizes-plan.md` (este plano) como prior art.
4. Adicionar linha em `docs/rfcs/README.md`.

#### Acceptance Criteria
- [ ] RFC existe + status `Implemented`
- [ ] Linkagem cruzada com plano e CHANGELOG

### T3.2 — Bump de versão para `0.2.0-next.0`

#### Objective
Marcar release minor (não patch — adiciona public API: `defineTheme`, `hex`, `rgb`, e prop `size` em 9 primitives).

#### Files to edit
```
package.json — version: 0.2.0-next.0
CHANGELOG.md — promover [Unreleased] para [0.2.0-next.0]
```

#### Tasks
1. Editar version.
2. Mover entries de `[Unreleased]` para `[0.2.0-next.0] - 2026-MM-DD`.

#### Acceptance Criteria
- [ ] `package.json` atualizado
- [ ] CHANGELOG promovido

---

## Phase 4: theo-opendocs — `/theoui/theming` page

**Objective:** Documentação dedicada + theme builder live em `docs.usetheo.dev/theoui/theming`.

### T4.1 — Bump `@usetheo/ui` em `theo-opendocs` para `0.2.0-next.0`

#### Files to edit
```
../theo-opendocs/package.json — version bump
../theo-opendocs/pnpm-lock.yaml — refresh
```

#### Tasks
1. `cd ../theo-opendocs && pnpm add @usetheo/ui@next` (após publish via npm pelo user).
2. Verificar que `defineTheme` é importável: `node -e "console.log(typeof (await import('@usetheo/ui')).defineTheme)"`.

#### Acceptance Criteria
- [ ] `@usetheo/ui@0.2.0-next.0` instalado
- [ ] `defineTheme` resolvível via import

### T4.2 — Página `/theoui/theming` com tutorial + live preview

#### Files to edit
```
../theo-opendocs/content/theoui/theming.mdx — (NEW) tutorial passo a passo
../theo-opendocs/content/theoui/meta.json — adicionar 'theming' à nav
../theo-opendocs/components/theme-builder.tsx — (NEW) live preview component
../theo-opendocs/components/theoui-mdx.tsx — registrar <ThemeBuilder>
```

#### Deep file dependency analysis
- **theming.mdx (NEW)**: estrutura paralela a `engines/whiteboard.mdx`. Sections: Quickstart, defineTheme API, hex/rgb helpers, ThemeBuilder live, ThemeProvider usage, Per-instance customization.
- **theme-builder.tsx (NEW)**: client component com 3 color pickers (primary, accent, background) + 1 input para `name` + preview de Button, Card, Input, Badge em `<ThemeProvider themes={[generatedTheme]}>` local. Snippet TS gerado abaixo (textarea readonly).
- **theoui-mdx.tsx**: adicionar `export const ThemeBuilder = dynamic(() => import('./theme-builder').then(m => m.ThemeBuilder), { ssr: false })`.
- **meta.json**: adicionar `'theming'` antes de `'engines'` ou ao lado.

#### Deep Dives
**ThemeBuilder shape:**
```tsx
'use client';
import { useState } from 'react';
import { ThemeProvider, defineTheme, hex, Button, Card, Input, Badge } from '@usetheo/ui';

export function ThemeBuilder() {
  const [primary, setPrimary] = useState('#7C3AED');
  const [accent, setAccent] = useState('#C96442');
  const [bg, setBg] = useState('#FFFFFF');

  const theme = defineTheme({
    name: 'custom',
    light: { primary: hex(primary), accent: hex(accent), background: hex(bg) },
  });

  const snippet = `import { defineTheme, hex } from '@usetheo/ui';

export const myTheme = defineTheme({
  name: 'custom',
  light: {
    primary: hex('${primary}'),
    accent: hex('${accent}'),
    background: hex('${bg}'),
  },
});`;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <label>Primary <input type="color" value={primary} onChange={e => setPrimary(e.target.value)} /></label>
        <label>Accent <input type="color" value={accent} onChange={e => setAccent(e.target.value)} /></label>
        <label>Background <input type="color" value={bg} onChange={e => setBg(e.target.value)} /></label>
        <pre className="text-xs"><code>{snippet}</code></pre>
      </div>
      <ThemeProvider themes={[theme]} defaultTheme="custom">
        <div className="space-y-3">
          <Button>Deploy</Button>
          <Card>
            <Card.Header><Card.Title>Custom theme preview</Card.Title></Card.Header>
            <Card.Content><Input placeholder="Type something" /></Card.Content>
          </Card>
          <Badge variant="primary">Active</Badge>
        </div>
      </ThemeProvider>
    </div>
  );
}
```

**Edge cases:**
- Color input retorna `#rrggbb` válido (browser garante). Skip validation.
- ThemeProvider nested — verificar que CSS vars do tema custom não vazam para o resto da página (D4 do plano).

#### Tasks
1. Criar `theme-builder.tsx`.
2. Registrar em `theoui-mdx.tsx`.
3. Escrever `theming.mdx` com 7 sections (Quickstart, defineTheme, hex/rgb, ThemeBuilder live, ThemeProvider, registerTheme runtime, Troubleshooting).
4. Adicionar a `meta.json`.
5. Build + deploy.

#### TDD
N/A para MDX, mas:
```
RED (component):  test_theme_builder_updates_preview_on_color_change — não vou implementar; integração visual é o teste real (smoke em browse).
SMOKE:            $B goto https://docs.usetheo.dev/theoui/theming
                  $B fill 'input[type=color][name=primary]' '#ff5722'
                  $B js "document.querySelector('[data-theme-scope]').style.getPropertyValue('--primary')" → '12 89% 56%' (HSL de #ff5722)
SMOKE (EC-6):     $B js "(() => { const outer = document.documentElement.getAttribute('data-theme'); const inner = document.querySelector('[data-theme-scope=\"preview\"]')?.getAttribute('data-theme'); return JSON.stringify({outer, inner}); })()"
                  Expected: outer === 'violet-forge', inner === 'custom' — verifica que o ThemeProvider aninhado não vaza para o layout.
```

#### Acceptance Criteria
- [ ] `theming.mdx` existe + live na produção
- [ ] ThemeBuilder color picker funciona (smoke via browse)
- [ ] Snippet copy-paste é serializável + válido (TypeScript)
- [ ] Layout grid 2-col funciona em mobile (responsive)

#### DoD
- [ ] `pnpm pages:build` verde
- [ ] Deploy Cloudflare Pages + smoke browse verde

---

## Phase 5: Dogfood QA + Cross-validation

### T5.1 — Cross-validation

#### Objective
Validar mecanicamente que cada ADR/task deste plano foi implementada conforme spec.

#### Tasks
1. Rodar manual ou via `/cross-validation theming-and-sizes`.
2. Classificar divergências por severity.
3. Fix BLOCKERs + CRITICALs antes de avançar para dogfood.

### T5.2 — Dogfood QA

#### Objective
Validar que o usuário real consegue (a) usar `size` em primitives e (b) criar um tema custom em <10 minutos.

#### Tasks
1. **Smoke test sizes**: abrir `playground/main.tsx`, adicionar `<Input size="sm" />`, `<Badge size="lg">Hello</Badge>`, etc. Validar visual.
2. **Smoke test theming**: criar `myTheme.ts` na app local com `defineTheme({ name: 'corp', light: { primary: hex('#0ea5e9') } })`. Aplicar via `<ThemeProvider themes={[corpTheme]} defaultTheme="corp">`. Esperar tudo recolorido.
3. **Smoke test docs page**: acessar `docs.usetheo.dev/theoui/theming/` + browse com color picker em produção real.
4. Health score >=70/100. Zero CRITICAL issues novos.

#### Acceptance Criteria
- [ ] Playground renderiza 3 sizes de cada primitive sem erro de console
- [ ] Tema custom aplicado com 5 linhas de código (`defineTheme` + `hex` + `<ThemeProvider>`)
- [ ] Página `/theoui/theming` ranks "polished" — sem CSS quebrado, ThemeBuilder responsivo
- [ ] `pnpm quality:gates` verde em `theo-ui`
- [ ] `pnpm types:check` verde em `theo-opendocs`

---

## Coverage Matrix

| # | Gap / Requirement | Task(s) | Resolution |
|---|---|---|---|
| 1 | Só 2 dos 102 components têm `size` | T1.1–T1.9 | 9 primitives adicionais ganham `size` (Input, Badge, Toast, Checkbox, Switch, Card, FormField, Textarea, Select) |
| 2 | Sem validação backwards-compat dos sizes existentes (Button, Avatar) | T1.10 (sweep) | Sweep valida que defaults inalterados via snapshot test |
| 3 | 29 cor keys obrigatórias por modo (58 total) | T2.1 | `defineTheme(partial)` merge com violetForge — qualquer key omitida herda |
| 4 | Sem helper hex/rgb (consumer faz conversão manual) | T2.2 | `hex('#7C3AED')` + `rgb(124, 58, 237)` exportados |
| 5 | Sem teste de integração para defineTheme+ThemeProvider | T2.3 | Teste end-to-end em theme-provider.test.tsx |
| 6 | Sem documentação dedicada de theming | T4.2 | Página `/theoui/theming` em docs.usetheo.dev |
| 7 | Sem theme builder UI (live preview) | T4.2 | `<ThemeBuilder>` em theming.mdx com 3 color pickers |
| 8 | Decisões não arquivadas | T3.1 | RFC `0005-theming-and-sizes.md` com status `Implemented` |
| 9 | Bundle baseline pode estourar | T1.10 + T2.4 | Update controlado de `scripts/baselines/bundle-sizes.json` |
| 10 | EC-1: Input `size` HTML attribute conflict | T1.1 | `Omit<InputHTMLAttributes, 'size'>` no extends + RED test |
| 11 | EC-2: Select potencial conflict se usar SelectHTMLAttributes | T1.9 | Grep guard antes de implementar, Omit se necessário |
| 12 | EC-3: defineTheme nome conflitando com built-in | T2.1 | Teste `test_defineTheme_overrides_builtin_when_same_name` (last-writer-wins) |
| 13 | EC-4: hex() case-insensitive | T2.2 | Teste `test_hex_case_insensitive` |
| 14 | EC-5: hex() 4-char com alpha | T2.2 | Teste `test_hex_4char_with_alpha` |
| 15 | EC-6: ThemeBuilder aninhado dentro de TheoUIProviderIsland | T4.2 | Smoke browse verifica `data-theme` não vaza |
| 16 | EC-7: defineTheme override só light (visual inconsistente) | T2.1 | JSDoc nota explícita |
| 17 | EC-8: Card/FormField subparts não aceitam size próprio | T1.6, T1.7 | Decisão documentada em JSDoc |

**Coverage: 17/17 gaps cobertos (100%)**

**Edge case review:** `.claude/knowledge-base/reviews/edge-cases/theming-and-sizes-edge-cases-2026-05-20.md` — 8 edge cases (2 MUST FIX, 4 SHOULD TEST, 2 DOCUMENT) incorporados nas tasks acima.

## Global Definition of Done

- [ ] Todas as 5 fases completas
- [ ] Todos os testes passing (Vitest no `theo-ui`; types:check no `theo-opendocs`)
- [ ] Zero clippy/lint warnings (Biome)
- [ ] Backwards compat preservada (testes de snapshot em T1.10)
- [ ] `pnpm quality:gates` verde em `theo-ui`
- [ ] `pnpm types:check` verde em `theo-opendocs`
- [ ] RFC `0005-theming-and-sizes.md` status `Implemented`
- [ ] CHANGELOG entries em `theo-ui` (sob versão `0.2.0-next.0`)
- [ ] CHANGELOG entry em `theo-opendocs` (caso exista; senão, commit message detalhado)
- [ ] **Dogfood QA PASS** — playground + docs.usetheo.dev/theoui/theming smoke verde
- [ ] **Runtime-metric proof** — Não há contador novo neste plano. N/A para este plano específico (não há feature ligada a métrica de runtime — todas são API additions + documentation).

## Final Phase: Dogfood QA (MANDATORY)

> Esta fase roda DEPOIS de todas as fases de implementação. O plano NÃO está done até dogfood passar.

**Objective:** Validar que o usuário real consegue customizar tema e usar sizes — não só que os testes unitários passam.

### Execution

1. Implementar todas as 9 primitives com size + playground manual.
2. Implementar `defineTheme` + helpers + criar tema custom de exemplo no playground.
3. Deploy `theming.mdx` em produção + smoke browse.
4. Validar live em `docs.usetheo.dev/theoui/theming` com color picker.

### Acceptance Criteria

- [ ] Health score >= 70/100
- [ ] Zero CRITICAL issues introduzidos
- [ ] Zero HIGH issues em features modificadas
- [ ] Pre-existing issues documentados (não bloqueiam plan completion)

### If Dogfood Fails

1. Identificar quais issues são causados por este plano.
2. Fix CRITICAL/HIGH causados pelo plano.
3. Re-run dogfood.
4. Pre-existing issues vão para backlog.

---

## Notas de execução (para o agente)

- **Ordem recomendada**: Phase 0 → Phase 1 task por task (T1.1 → T1.10) → Phase 2 (T2.1 → T2.4) → Phase 3 → Phase 4 → Phase 5.
- **Paralelização aceitável**: dentro de Phase 1, T1.1-T1.9 são independentes (cada primitive é isolado). Pode rodar em paralelo se ambiente permitir, mas T1.10 (sweep) precisa esperar todos.
- **Commits granulares**: 1 commit por task. Mensagens no formato `feat(primitives/input): expose size prop` / `feat(themes): defineTheme() helper`. Evita um mega-commit no fim.
- **Não bypassar quality gates** mesmo que pareça óbvio que vai passar.
